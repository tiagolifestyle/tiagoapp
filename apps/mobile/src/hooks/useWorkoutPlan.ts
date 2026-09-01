import { useCallback, useEffect, useState } from "react";
import type { Exercise, WorkoutDay, WorkoutExercise, WorkoutPlan } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";

export interface PlanExercise extends WorkoutExercise {
  exercise: Exercise;
}

export interface PlanDay extends WorkoutDay {
  exercises: PlanExercise[];
}

export interface ActivePlan extends WorkoutPlan {
  days: PlanDay[];
}

export function useWorkoutPlan(clientId: string | undefined) {
  const [plan, setPlan] = useState<ActivePlan | null>(null);
  const [loads, setLoads] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);

    const { data: planRow } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("client_id", clientId)
      .eq("status", "active")
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

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

      const nextLoads: Record<string, string> = {};
      for (const log of logs ?? []) {
        const exerciseId = log.workout_exercise_id as string | null;
        if (!exerciseId || nextLoads[exerciseId] !== undefined) continue;
        const entry = Array.isArray(log.sets_completed) ? log.sets_completed[0] : null;
        if (entry?.load) nextLoads[exerciseId] = String(entry.load);
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

  async function saveLoad(workoutExerciseId: string, value: string) {
    if (!clientId) return;
    setLoads((prev) => ({ ...prev, [workoutExerciseId]: value }));
    await supabase.from("exercise_logs").insert({
      client_id: clientId,
      workout_exercise_id: workoutExerciseId,
      sets_completed: [{ load: value }],
    });
  }

  return { plan, loads, saveLoad, isLoading, refresh: load };
}
