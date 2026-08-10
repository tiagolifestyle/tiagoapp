import { z } from "zod";

export const exerciseSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  muscleGroup: z.string().optional(),
  equipment: z.string().optional(),
  difficulty: z.enum(["iniciante", "intermedio", "avancado"]).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  instructions: z.string().optional(),
  commonMistakes: z.string().optional(),
  tips: z.string().optional(),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;

export const workoutExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  orderIndex: z.number().int().min(0),
  sets: z.number().int().min(1).max(20).optional(),
  reps: z.string().max(20).optional(),
  load: z.string().max(40).optional(),
  restSeconds: z.number().int().min(0).max(900).optional(),
  rir: z.number().min(0).max(10).optional(),
  rpe: z.number().min(0).max(10).optional(),
  tempo: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

export type WorkoutExerciseInput = z.infer<typeof workoutExerciseSchema>;

export const workoutDaySchema = z.object({
  name: z.string().min(2),
  dayOrder: z.number().int().min(0),
  weekday: z.number().int().min(0).max(6).optional(),
  exercises: z.array(workoutExerciseSchema),
});

export type WorkoutDayInput = z.infer<typeof workoutDaySchema>;

export const workoutPlanSchema = z
  .object({
    clientId: z.string().uuid().optional(),
    isTemplate: z.boolean().default(false),
    name: z.string().min(2),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(["draft", "active", "completed", "archived"]).default("draft"),
    days: z.array(workoutDaySchema).min(1),
  })
  .refine((data) => data.isTemplate || Boolean(data.clientId), {
    message: "Um plano não-template tem de ter um cliente associado",
    path: ["clientId"],
  });

export type WorkoutPlanInput = z.infer<typeof workoutPlanSchema>;
