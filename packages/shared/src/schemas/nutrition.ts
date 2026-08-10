import { z } from "zod";

export const mealItemSchema = z.object({
  foodName: z.string().min(1),
  quantity: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
  notes: z.string().max(200).optional(),
});

export type MealItemInput = z.infer<typeof mealItemSchema>;

export const mealSchema = z.object({
  name: z.string().min(1),
  time: z.string().optional(),
  orderIndex: z.number().int().min(0),
  notes: z.string().optional(),
  items: z.array(mealItemSchema),
});

export type MealInput = z.infer<typeof mealSchema>;

export const nutritionPlanSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(2),
  calories: z.number().int().positive().optional(),
  proteinG: z.number().int().min(0).optional(),
  carbsG: z.number().int().min(0).optional(),
  fatG: z.number().int().min(0).optional(),
  waterMl: z.number().int().min(0).optional(),
  status: z.enum(["draft", "active", "completed", "archived"]).default("draft"),
  meals: z.array(mealSchema),
});

export type NutritionPlanInput = z.infer<typeof nutritionPlanSchema>;
