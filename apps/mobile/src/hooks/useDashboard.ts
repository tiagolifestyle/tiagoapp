import { useCallback, useEffect, useState } from "react";
import type { Exercise, NutritionPlan, ProgressMetric, WorkoutDay, WorkoutExercise } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";

export interface TodayWorkoutExercise extends WorkoutExercise {
  exercise: Pick<Exercise, "id" | "name" | "image_url" | "video_url">;
}

export interface DashboardData {
  todayDay: (WorkoutDay & { exercises: TodayWorkoutExercise[] }) | null;
  nutritionPlan: NutritionPlan | null;
  latestMetric: ProgressMetric | null;
  unreadMessagesCount: number;
  pendingCheckin: boolean;
  streakDays: number;
}

const emptyDashboard: DashboardData = {
  todayDay: null,
  nutritionPlan: null,
  latestMetric: null,
  unreadMessagesCount: 0,
  pendingCheckin: false,
  streakDays: 0,
};

async function computeStreak(clientId: string): Promise<number> {
  const { data } = await supabase
    .from("exercise_logs")
    .select("performed_at")
    .eq("client_id", clientId)
    .order("performed_at", { ascending: false })
    .limit(60);

  if (!data || data.length === 0) return 0;

  const days = new Set(data.map((row) => new Date(row.performed_at).toDateString()));
  let streak = 0;
  const cursor = new Date();

  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function useDashboard(clientId: string | undefined) {
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);

    const todayWeekday = new Date().getDay();

    const [planResult, nutritionResult, metricResult, checkinResult, conversationResult, streak] =
      await Promise.all([
        supabase
          .from("workout_plans")
          .select("id")
          .eq("client_id", clientId)
          .eq("status", "active")
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("nutrition_plans")
          .select("*")
          .eq("client_id", clientId)
          .eq("status", "active")
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("progress_metrics")
          .select("*")
          .eq("client_id", clientId)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("checkins")
          .select("id")
          .eq("client_id", clientId)
          .eq("status", "pending")
          .limit(1)
          .maybeSingle(),
        supabase.from("conversations").select("id").eq("client_id", clientId).maybeSingle(),
        computeStreak(clientId),
      ]);

    let todayDay: DashboardData["todayDay"] = null;

    if (planResult.data?.id) {
      const { data: day } = await supabase
        .from("workout_days")
        .select("*")
        .eq("plan_id", planResult.data.id)
        .eq("weekday", todayWeekday)
        .maybeSingle();

      if (day) {
        const { data: exercises } = await supabase
          .from("workout_exercises")
          .select("*, exercise:exercises(id, name, image_url, video_url)")
          .eq("day_id", day.id)
          .order("order_index", { ascending: true });

        todayDay = { ...day, exercises: (exercises ?? []) as TodayWorkoutExercise[] };
      }
    }

    let unreadMessagesCount = 0;
    if (conversationResult.data?.id) {
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conversationResult.data.id)
        .neq("sender_id", clientId)
        .is("read_at", null);
      unreadMessagesCount = count ?? 0;
    }

    setData({
      todayDay,
      nutritionPlan: (nutritionResult.data as NutritionPlan | null) ?? null,
      latestMetric: (metricResult.data as ProgressMetric | null) ?? null,
      unreadMessagesCount,
      pendingCheckin: Boolean(checkinResult.data),
      streakDays: streak,
    });
    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, refresh: load };
}
