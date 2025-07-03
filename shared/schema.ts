import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const foodAnalyses = pgTable("food_analyses", {
  id: serial("id").primaryKey(),
  foodName: text("food_name").notNull(),
  imageUrl: text("image_url").notNull(),
  calories: integer("calories").notNull(),
  servingSize: text("serving_size").notNull(),
  confidence: real("confidence").notNull(),
  protein: real("protein").notNull(),
  carbohydrates: real("carbohydrates").notNull(),
  fat: real("fat").notNull(),
  fiber: real("fiber"),
  sugar: real("sugar"),
  sodium: real("sodium"),
  vitamins: text("vitamins"), // JSON string
  minerals: text("minerals"), // JSON string
  healthInsights: text("health_insights"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFoodAnalysisSchema = createInsertSchema(foodAnalyses).omit({
  id: true,
  createdAt: true,
});

export type InsertFoodAnalysis = z.infer<typeof insertFoodAnalysisSchema>;
export type FoodAnalysis = typeof foodAnalyses.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
