import { z } from "zod";

export const progressMetricSchema = z.object({
  recordedAt: z.string(),
  weightKg: z.number().positive().max(400).optional(),
  bodyFatPct: z.number().min(0).max(80).optional(),
  measurements: z.record(z.string(), z.number()).optional(),
  energyLevel: z.number().int().min(1).max(5).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  perceivedEffort: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(500).optional(),
});

export type ProgressMetricInput = z.infer<typeof progressMetricSchema>;

export const checkinAnswersSchema = z.object({
  feeling: z.string().max(500).optional(),
  workoutsCompleted: z.number().int().min(0).max(14).optional(),
  nutritionRating: z.number().int().min(1).max(5).optional(),
  sleepRating: z.number().int().min(1).max(5).optional(),
  energyLevel: z.number().int().min(1).max(5).optional(),
  difficulties: z.string().max(1000).optional(),
  observations: z.string().max(1000).optional(),
});

export type CheckinAnswersInput = z.infer<typeof checkinAnswersSchema>;
