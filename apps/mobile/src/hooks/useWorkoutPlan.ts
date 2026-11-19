import { useCallback, useEffect, useState } from "react";
import type { Exercise, WorkoutDay, WorkoutExercise, WorkoutPlan } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";
import { fetchCurrentWorkoutPlanId } from "@/lib/currentWorkoutPlan";

export interface PlanExercise extends WorkoutExercise {
  exercise: Exercise;
}

export interface PlanDay extends WorkoutDay {
  exercises: PlanExercise[];
}

export interface ActivePlan extends WorkoutPlan {
  days: PlanDay[];
}

// Chave para reconhecer "o mesmo exercício" noutra semana do plano: dia da semana + exercício
// (+ ocorrência, se o mesmo exercício aparecer mais de uma vez nesse dia).
function exerciseKeys(days: { weekday: number | null; exercises: { id: string; exercise_id: string; order_index: number }[] }[]) {
  const keys = new Map<string, string>();
  for (const day of days) {
    const seen = new Map<string, number>();
    const sorted = [...day.exercises].sort((a, b) => a.order_index - b.order_index);
    for (const item of sorted) {
      const occurrence = seen.get(item.exercise_id) ?? 0;
      seen.set(item.exercise_id, occurrence + 1);
      keys.set(item.id, `${day.weekday}|${item.exercise_id}|${occurrence}`);
    }
  }
  return keys;
}

// Últimos pesos usados nas outras semanas (versões) do mesmo plano, por chave de exercício.
// Assim, quando o plano passa para a semana seguinte, os campos aparecem com o último peso.
async function fetchPreviousWeekLoads(clientId: string, plan: WorkoutPlan): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  const rootId = plan.parent_plan_id ?? plan.id;
  const { data: family } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("client_id", clientId)
    .or(`id.eq.${rootId},parent_plan_id.eq.${rootId}`)
    .neq("id", plan.id);
  const planIds = (family ?? []).map((row) => row.id as string);
  if (planIds.length === 0) return result;

  const { data: days } = await supabase
    .from("workout_days")
    .select("weekday, exercises:workout_exercises(id, exercise_id, order_index)")
    .in("plan_id", planIds);
  const keys = exerciseKeys(
    (days ?? []) as { weekday: number | null; exercises: { id: string; exercise_id: string; order_index: number }[] }[]
  );
  if (keys.size === 0) return result;

  const { data: logs } = await supabase
    .from("exercise_logs")
    .select("workout_exercise_id, sets_completed, performed_at")
    .eq("client_id", clientId)
    .in("workout_exercise_id", [...keys.keys()])
    .order("performed_at", { ascending: false });

  for (const log of logs ?? []) {
    const key = keys.get(log.workout_exercise_id as string);
    if (!key || result.has(key)) continue;
    const entries = Array.isArray(log.sets_completed) ? log.sets_completed : [];
    const values = entries.map((entry) => (entry?.load != null ? String(entry.load) : ""));
    if (values.some((value) => value !== "")) result.set(key, values);
  }
  return result;
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useWorkoutPlan(clientId: string | undefined) {
  const [plan, setPlan] = useState<ActivePlan | null>(null);
  const [loads, setLoads] = useState<Record<string, string[]>>({});
  const [completedToday, setCompletedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);

    const { data: completion } = await supabase
      .from("workout_completions")
      .select("id")
      .eq("client_id", clientId)
      .eq("completed_at", todayDate())
      .maybeSingle();
    setCompletedToday(!!completion);

    const planId = await fetchCurrentWorkoutPlanId(clientId);
    const { data: planRow } = planId
      ? await supabase.from("workout_plans").select("*").eq("id", planId).maybeSingle()
      : { data: null };

    if (!planRow) {
      setPlan(null);
      setLoads({});
      setIsLoading(false);
      return;
    }

    const { data: days } = await supabase
      .from("workout_days")
      .select("*, exercises:workout_exercises(*, exercise:exercises(*))")
      .eq("plan_id", planRow.id)
      .order("day_order", { ascending: true });

    const orderedDays = (days ?? []).map((day) => ({
      ...day,
      exercises: [...(day.exercises ?? [])].sort((a, b) => a.order_index - b.order_index),
    })) as PlanDay[];

    setPlan({ ...(planRow as WorkoutPlan), days: orderedDays });

    const exerciseIds = orderedDays.flatMap((day) => day.exercises.map((exercise) => exercise.id));
    if (exerciseIds.length > 0) {
      const { data: logs } = await supabase
        .from("exercise_logs")
        .select("workout_exercise_id, sets_completed, performed_at")
        .eq("client_id", clientId)
        .in("workout_exercise_id", exerciseIds)
        .order("performed_at", { ascending: false });

      const nextLoads: Record<string, string[]> = {};
      for (const log of logs ?? []) {
        const exerciseId = log.workout_exercise_id as string | null;
        if (!exerciseId || nextLoads[exerciseId] !== undefined) continue;
        const entries = Array.isArray(log.sets_completed) ? log.sets_completed : [];
        nextLoads[exerciseId] = entries.map((entry) => (entry?.load != null ? String(entry.load) : ""));
      }

      // Exercícios ainda sem peso nesta semana: mostra o último peso usado nas semanas anteriores.
      if (exerciseIds.some((id) => nextLoads[id] === undefined)) {
        const previous = await fetchPreviousWeekLoads(clientId, planRow as WorkoutPlan);
        const currentKeys = exerciseKeys(orderedDays);
        for (const id of exerciseIds) {
          if (nextLoads[id] !== undefined) continue;
          const key = currentKeys.get(id);
          const values = key ? previous.get(key) : undefined;
          if (values) nextLoads[id] = values;
        }
      }
      setLoads(nextLoads);
    } else {
      setLoads({});
    }

    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveLoad(workoutExerciseId: string, setIndex: number, value: string) {
    if (!clientId) return;
    const previous = loads[workoutExerciseId] ?? [];
    const nextSets = Array.from({ length: Math.max(previous.length, setIndex + 1) }, (_, i) =>
      i === setIndex ? value : (previous[i] ?? "")
    );
    setLoads((prev) => ({ ...prev, [workoutExerciseId]: nextSets }));
    await supabase.from("exercise_logs").insert({
      client_id: clientId,
      workout_exercise_id: workoutExerciseId,
      sets_completed: nextSets.map((load) => ({ load })),
    });
  }

  async function markComplete() {
    if (!clientId || completedToday) return;
    setCompletedToday(true);
    await supabase.from("workout_completions").insert({ client_id: clientId, completed_at: todayDate() });
  }

  return { plan, loads, saveLoad, completedToday, markComplete, isLoading, refresh: load };
}
