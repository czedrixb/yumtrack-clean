import { z } from "zod";

// Firebase-compatible schemas (no Drizzle ORM)
export const foodAnalysisSchema = z.object({
  id: z.string().optional(), // Firebase uses string IDs, optional for new documents
  foodName: z.string().min(1, "Food name is required"),
  imageUrl: z.string().url("Invalid image URL"),
  calories: z.number().int().positive("Calories must be positive"),
  servingSize: z.string().min(1, "Serving size is required"),
  confidence: z.number().min(0).max(1, "Confidence must be between 0 and 1"),
  protein: z.number().min(0, "Protein cannot be negative"),
  carbohydrates: z.number().min(0, "Carbohydrates cannot be negative"),
  fat: z.number().min(0, "Fat cannot be negative"),
  fiber: z.number().min(0, "Fiber cannot be negative").nullable().default(null),
  sugar: z.number().min(0, "Sugar cannot be negative").nullable().default(null),
  sodium: z.number().min(0, "Sodium cannot be negative").nullable().default(null),
  vitamins: z.string().nullable().default(null), // JSON string
  minerals: z.string().nullable().default(null), // JSON string
  healthInsights: z.string().nullable().default(null), // JSON string
  createdAt: z.date().default(() => new Date()),
  userId: z.string().optional(), // Firebase user ID
});

export const insertFoodAnalysisSchema = foodAnalysisSchema.omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const userSchema = z.object({
  id: z.string().optional(), // Firebase UID
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(1, "Display name is required"),
  createdAt: z.date().default(() => new Date()),
});

export const insertUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type FoodAnalysis = z.infer<typeof foodAnalysisSchema>;
export type InsertFoodAnalysis = z.infer<typeof insertFoodAnalysisSchema>;
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Legacy types for backward compatibility (you can remove these gradually)
export type FoodAnalysisLegacy = FoodAnalysis & { id: number }; // For components expecting numeric ID
export type InsertFoodAnalysisLegacy = InsertFoodAnalysis;