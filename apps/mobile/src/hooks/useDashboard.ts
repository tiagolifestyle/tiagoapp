import { useCallback, useEffect, useState } from "react";
import type { Exercise, NutritionPlan, ProgressMetric, WorkoutDay, WorkoutExercise } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";
import { fetchCurrentWorkoutPlanId } from "@/lib/currentWorkoutPlan";

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

function currentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

async function computeStreak(clientId: string): Promise<number> {
  const { count } = await supabase
    .from("workout_completions")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  return count ?? 0;
}

export function useDashboard(clientId: string | undefined) {
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);

    const todayWeekday = new Date().getDay();

    const [currentPlanId, nutritionResult, metricResult, checkinResult, conversationResult, streak] =
      await Promise.all([
        fetchCurrentWorkoutPlanId(clientId),
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
          .eq("week_start", currentWeekStart())
          .maybeSingle(),
        supabase.from("conversations").select("id").eq("client_id", clientId).maybeSingle(),
        computeStreak(clientId),
      ]);

    let todayDay: DashboardData["todayDay"] = null;

    if (currentPlanId) {
      const { data: day } = await supabase
        .from("workout_days")
        .select("*")
        .eq("plan_id", currentPlanId)
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
      pendingCheckin: !checkinResult.data,
      streakDays: streak,
    });
    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, refresh: load };
}
