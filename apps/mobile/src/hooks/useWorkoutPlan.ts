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
    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { plan, isLoading, refresh: load };
}
