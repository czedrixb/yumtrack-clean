import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeFoodImage } from "./services/openai";
import { insertFoodAnalysisSchema } from "@shared/schema";
import multer from "multer";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Analyze food image
  app.post("/api/analyze-food", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Convert image to base64
      const base64Image = req.file.buffer.toString('base64');
      
      // Analyze with OpenAI
      const analysis = await analyzeFoodImage(base64Image);
      
      // Save to storage
      const savedAnalysis = await storage.createFoodAnalysis({
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
      });

      res.json(savedAnalysis);
    } catch (error) {
      console.error("Error analyzing food:", error);
      res.status(500).json({ 
        error: "Failed to analyze food image", 
        details: (error as Error).message 
      });
    }
  });

  // Get all food analyses
  app.get("/api/food-analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllFoodAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching food analyses:", error);
      res.status(500).json({ error: "Failed to fetch food analyses" });
    }
  });

  // Get recent food analyses
  app.get("/api/food-analyses/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const analyses = await storage.getRecentFoodAnalyses(limit);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching recent food analyses:", error);
      res.status(500).json({ error: "Failed to fetch recent food analyses" });
    }
  });

  // Get specific food analysis
  app.get("/api/food-analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getFoodAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ error: "Food analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching food analysis:", error);
      res.status(500).json({ error: "Failed to fetch food analysis" });
    }
  });

  // Delete food analysis
  app.delete("/api/food-analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFoodAnalysis(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Food analysis not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting food analysis:", error);
      res.status(500).json({ error: "Failed to delete food analysis" });
    }
  });

  // Clear all food analyses
  app.delete("/api/food-analyses", async (req, res) => {
    try {
      await storage.clearAllAnalyses();
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing all food analyses:", error);
      res.status(500).json({ error: "Failed to clear all food analyses" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
