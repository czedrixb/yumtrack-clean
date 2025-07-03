import { foodAnalyses, type FoodAnalysis, type InsertFoodAnalysis } from "@shared/schema";

export interface IStorage {
  // Food analysis methods
  createFoodAnalysis(analysis: InsertFoodAnalysis): Promise<FoodAnalysis>;
  getFoodAnalysis(id: number): Promise<FoodAnalysis | undefined>;
  getAllFoodAnalyses(): Promise<FoodAnalysis[]>;
  getRecentFoodAnalyses(limit: number): Promise<FoodAnalysis[]>;
  deleteFoodAnalysis(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private foodAnalyses: Map<number, FoodAnalysis>;
  private currentAnalysisId: number;

  constructor() {
    this.foodAnalyses = new Map();
    this.currentAnalysisId = 1;
  }

  async createFoodAnalysis(insertAnalysis: InsertFoodAnalysis): Promise<FoodAnalysis> {
    const id = this.currentAnalysisId++;
    const analysis: FoodAnalysis = {
      id,
      foodName: insertAnalysis.foodName,
      imageUrl: insertAnalysis.imageUrl,
      calories: insertAnalysis.calories,
      servingSize: insertAnalysis.servingSize,
      confidence: insertAnalysis.confidence,
      protein: insertAnalysis.protein,
      carbohydrates: insertAnalysis.carbohydrates,
      fat: insertAnalysis.fat,
      fiber: insertAnalysis.fiber ?? null,
      sugar: insertAnalysis.sugar ?? null,
      sodium: insertAnalysis.sodium ?? null,
      vitamins: insertAnalysis.vitamins ?? null,
      minerals: insertAnalysis.minerals ?? null,
      healthInsights: insertAnalysis.healthInsights ?? null,
      createdAt: new Date(),
    };
    this.foodAnalyses.set(id, analysis);
    return analysis;
  }

  async getFoodAnalysis(id: number): Promise<FoodAnalysis | undefined> {
    return this.foodAnalyses.get(id);
  }

  async getAllFoodAnalyses(): Promise<FoodAnalysis[]> {
    return Array.from(this.foodAnalyses.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getRecentFoodAnalyses(limit: number): Promise<FoodAnalysis[]> {
    const all = await this.getAllFoodAnalyses();
    return all.slice(0, limit);
  }

  async deleteFoodAnalysis(id: number): Promise<boolean> {
    return this.foodAnalyses.delete(id);
  }
}

export const storage = new MemStorage();
