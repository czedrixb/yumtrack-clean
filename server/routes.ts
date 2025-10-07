import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { createFirebaseStorage } from "./lib/firebase-storage.js";
import { analyzeFoodImage } from "./services/openai";
import multer from "multer";
import { auth } from "./lib/firebase.js";

// Define authenticated request interface
interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string | null;
    [key: string]: any;
  };
}

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Firebase authentication middleware
const authenticateFirebaseUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔐 Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found');
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.substring(7);
    console.log('🔑 Token length:', token.length);
    
    console.log('🔄 Verifying token...');
    const decodedToken = await auth.verifyIdToken(token);
    console.log('✅ Token verified for user:', decodedToken.uid);
    
    req.user = decodedToken;
    next();
  } catch (error: any) {
    console.error('❌ Authentication failed:', error.message);
    console.error('Error code:', error.code);
    res.status(401).json({ error: "Invalid authentication token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Analyze food image (protected route)
  app.post("/api/analyze-food", authenticateFirebaseUser, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      console.log('📸 Processing image for user:', req.user!.uid);
      
      // Convert image to base64
      const base64Image = req.file.buffer.toString('base64');
      
      // Analyze with OpenAI
      console.log('🤖 Analyzing food with OpenAI...');
      const analysis = await analyzeFoodImage(base64Image);
      console.log('✅ Analysis complete:', analysis.foodName);
      
      // Create storage instance with user's UID
      const userStorage = createFirebaseStorage(req.user!.uid);

      // Validate and prepare data for Firebase
      const analysisData = {
        foodName: analysis.foodName,
        imageUrl: `data:${req.file.mimetype};base64,${base64Image}`,
        calories: analysis.calories,
        servingSize: analysis.servingSize,
        confidence: analysis.confidence,
        protein: analysis.macronutrients.protein,
        carbohydrates: analysis.macronutrients.carbohydrates,
        fat: analysis.macronutrients.fat,
        fiber: analysis.macronutrients.fiber || null,
        sugar: analysis.macronutrients.sugar || null,
        sodium: analysis.macronutrients.sodium || null,
        vitamins: JSON.stringify(analysis.vitamins),
        minerals: JSON.stringify(analysis.minerals),
        healthInsights: JSON.stringify(analysis.healthInsights),
      };

      // Save to Firebase storage
      console.log('💾 Saving analysis to Firebase...');
      const savedAnalysis = await userStorage.createFoodAnalysis(analysisData);
      console.log('✅ Analysis saved with ID:', savedAnalysis.id);

      res.json(savedAnalysis);
    } catch (error) {
      console.error("❌ Error analyzing food:", error);
      res.status(500).json({ 
        error: "Failed to analyze food image", 
        details: (error as Error).message 
      });
    }
  });

  // Get all food analyses (protected route)
  app.get("/api/food-analyses", authenticateFirebaseUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('📋 Fetching all analyses for user:', req.user!.uid);
      const userStorage = createFirebaseStorage(req.user!.uid);
      const analyses = await userStorage.getAllFoodAnalyses();
      console.log('✅ Found', analyses.length, 'analyses');
      res.json(analyses);
    } catch (error) {
      console.error("❌ Error fetching food analyses:", error);
      res.status(500).json({ error: "Failed to fetch food analyses" });
    }
  });

  // Get recent food analyses (protected route)
  app.get("/api/food-analyses/recent", authenticateFirebaseUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      console.log('📋 Fetching recent analyses for user:', req.user!.uid, 'limit:', limit);
      const userStorage = createFirebaseStorage(req.user!.uid);
      const analyses = await userStorage.getRecentFoodAnalyses(limit);
      console.log('✅ Found', analyses.length, 'recent analyses');
      res.json(analyses);
    } catch (error) {
      console.error("❌ Error fetching recent food analyses:", error);
      res.status(500).json({ error: "Failed to fetch recent food analyses" });
    }
  });

  // Get specific food analysis (protected route)
  app.get("/api/food-analyses/:id", authenticateFirebaseUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      console.log('📋 Fetching analysis:', id, 'for user:', req.user!.uid);
      const userStorage = createFirebaseStorage(req.user!.uid);
      const analysis = await userStorage.getFoodAnalysis(id);
      
      if (!analysis) {
        console.log('❌ Analysis not found:', id);
        return res.status(404).json({ error: "Food analysis not found" });
      }
      
      console.log('✅ Analysis found:', analysis.foodName);
      res.json(analysis);
    } catch (error) {
      console.error("❌ Error fetching food analysis:", error);
      res.status(500).json({ error: "Failed to fetch food analysis" });
    }
  });

  // Delete food analysis (protected route)
  app.delete("/api/food-analyses/:id", authenticateFirebaseUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id;
      console.log('🗑️ Deleting analysis:', id, 'for user:', req.user!.uid);
      const userStorage = createFirebaseStorage(req.user!.uid);
      const deleted = await userStorage.deleteFoodAnalysis(id);
      
      if (!deleted) {
        console.log('❌ Analysis not found for deletion:', id);
        return res.status(404).json({ error: "Food analysis not found" });
      }
      
      console.log('✅ Analysis deleted:', id);
      res.json({ success: true });
    } catch (error) {
      console.error("❌ Error deleting food analysis:", error);
      res.status(500).json({ error: "Failed to delete food analysis" });
    }
  });

  // Clear all food analyses (protected route)
  app.delete("/api/food-analyses", authenticateFirebaseUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('🗑️ Clearing all analyses for user:', req.user!.uid);
      const userStorage = createFirebaseStorage(req.user!.uid);
      await userStorage.clearAllAnalyses();
      console.log('✅ All analyses cleared for user:', req.user!.uid);
      res.json({ success: true });
    } catch (error) {
      console.error("❌ Error clearing all food analyses:", error);
      res.status(500).json({ error: "Failed to clear all food analyses" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}