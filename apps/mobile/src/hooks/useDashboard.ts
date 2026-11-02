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
  planWeek: PlanWeek | null;
  completedToday: boolean;
}

// Semana em que o cliente está no plano de treino; total é null quando o plano não tem data de fim.
export interface PlanWeek {
  week: number;
  total: number | null;
}

const emptyDashboard: DashboardData = {
  todayDay: null,
  nutritionPlan: null,
  latestMetric: null,
  unreadMessagesCount: 0,
  pendingCheckin: false,
  streakDays: 0,
  planWeek: null,
  completedToday: false,
};

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

// As versões semanais (v1, v2, …) contam como um só plano: do início da primeira ao fim da última.
async function computePlanWeek(planId: string): Promise<PlanWeek | null> {
  const { data: plan } = await supabase
    .from("workout_plans")
    .select("id, parent_plan_id")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) return null;

  const rootId = (plan.parent_plan_id as string | null) ?? (plan.id as string);
  const { data: family } = await supabase
    .from("workout_plans")
    .select("start_date, end_date")
    .or(`id.eq.${rootId},parent_plan_id.eq.${rootId}`)
    .neq("status", "archived");

  const starts = (family ?? []).map((p) => p.start_date as string | null).filter((d): d is string => !!d);
  const ends = (family ?? []).map((p) => p.end_date as string | null).filter((d): d is string => !!d);
  if (starts.length === 0) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = parseLocalDate(starts.sort()[0]);
  const elapsed = daysBetween(start, today);
  if (elapsed < 0) return null;

  const week = Math.floor(elapsed / 7) + 1;
  if (ends.length === 0) return { week, total: null };

  const end = parseLocalDate(ends.sort()[ends.length - 1]);
  if (daysBetween(today, end) < 0) return null;
  return { week, total: Math.ceil((daysBetween(start, end) + 1) / 7) };
}

async function fetchCompletedToday(clientId: string): Promise<boolean> {
  const { data } = await supabase
    .from("workout_completions")
    .select("id")
    .eq("client_id", clientId)
    .eq("completed_at", todayDate())
    .maybeSingle();
  return !!data;
}

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

    const [currentPlanId, nutritionResult, metricResult, checkinResult, conversationResult, streak, completedToday] =
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
        fetchCompletedToday(clientId),
      ]);

    let todayDay: DashboardData["todayDay"] = null;
    const planWeek = currentPlanId ? await computePlanWeek(currentPlanId) : null;

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
      planWeek,
      completedToday,
    });
    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  // Ao voltar ao Início depois de marcar o treino, o botão passa a "Treino concluído" sem recarregar tudo.
  const refreshCompletedToday = useCallback(async () => {
    if (!clientId) return;
    const completedToday = await fetchCompletedToday(clientId);
    setData((prev) => (prev.completedToday === completedToday ? prev : { ...prev, completedToday }));
  }, [clientId]);

  return { data, isLoading, refresh: load, refreshCompletedToday };
}
