/**
 * Tipos da base de dados espelhando supabase/migrations/0001_init_schema.sql.
 *
 * Em produção, regenerar com:
 *   supabase gen types typescript --project-id <id> > src/database.types.ts
 * (mantido manual aqui porque ainda não existe projeto Supabase ligado).
 */

export type UserRole = "admin" | "coach" | "client";
export type AppLocale = "pt" | "es" | "en";
export type ClientStatus = "active" | "inactive" | "paused";
export type SubscriptionTier = "free" | "premium" | "vip";
export type PlanStatus = "draft" | "active" | "completed" | "archived";
export type CheckinStatus = "pending" | "reviewed";
export type PhotoAngle = "front" | "side" | "back";
export type ExerciseDifficulty = "iniciante" | "intermedio" | "avancado";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  locale: AppLocale;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  coach_id: string | null;
  goal: string | null;
  birth_date: string | null;
  height_cm: number | null;
  starting_weight_kg: number | null;
  status: ClientStatus;
  subscription_tier: SubscriptionTier;
  notes_private: string | null;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: string | null;
  muscle_group: string | null;
  equipment: string | null;
  difficulty: ExerciseDifficulty | null;
  image_url: string | null;
  video_url: string | null;
  instructions: string | null;
  common_mistakes: string | null;
  tips: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlan {
  id: string;
  client_id: string;
  template_id: string | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: PlanStatus;
  version: number;
  parent_plan_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutDay {
  id: string;
  plan_id: string;
  name: string;
  day_order: number;
  weekday: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  day_id: string;
  exercise_id: string;
  order_index: number;
  sets: number | null;
  reps: string | null;
  load: string | null;
  rest_seconds: number | null;
  rir: number | null;
  rpe: number | null;
  tempo: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseLog {
  id: string;
  client_id: string;
  workout_exercise_id: string | null;
  performed_at: string;
  sets_completed: Array<{ reps: number; load: string; rir?: number }>;
  notes: string | null;
  created_at: string;
}

export interface NutritionPlan {
  id: string;
  client_id: string;
  name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  water_ml: number | null;
  version: number;
  parent_plan_id: string | null;
  status: PlanStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  nutrition_plan_id: string;
  name: string;
  time: string | null;
  order_index: number;
  notes: string | null;
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_name: string;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
}

export interface ProgressMetric {
  id: string;
  client_id: string;
  recorded_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  measurements: Record<string, number>;
  energy_level: number | null;
  sleep_hours: number | null;
  perceived_effort: number | null;
  notes: string | null;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  client_id: string;
  angle: PhotoAngle;
  storage_path: string;
  taken_at: string;
  created_at: string;
}

export interface Checkin {
  id: string;
  client_id: string;
  week_start: string;
  answers: {
    feeling?: string;
    workouts_completed?: number;
    nutrition_rating?: number;
    sleep_rating?: number;
    energy_level?: number;
    difficulties?: string;
    observations?: string;
  };
  coach_response: string | null;
  status: CheckinStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  coach_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type:
    | "new_workout"
    | "plan_updated"
    | "new_nutrition_plan"
    | "checkin_pending"
    | "message"
    | "achievement";
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface ClientBadge {
  id: string;
  client_id: string;
  badge_id: string;
  earned_at: string;
  meta: Record<string, unknown>;
}
