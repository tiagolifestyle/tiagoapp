import { useCallback, useEffect, useState } from "react";
import type { Meal, MealItem, NutritionPlan } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";

export interface PlanMeal extends Meal {
  items: MealItem[];
}

export interface ActiveNutritionPlan extends NutritionPlan {
  meals: PlanMeal[];
}

export function useNutritionPlan(clientId: string | undefined) {
  const [plan, setPlan] = useState<ActiveNutritionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);

    const { data: planRow } = await supabase
      .from("nutrition_plans")
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

    const { data: meals } = await supabase
      .from("meals")
      .select("*, items:meal_items(*)")
      .eq("nutrition_plan_id", planRow.id)
      .order("order_index", { ascending: true });

    setPlan({ ...(planRow as NutritionPlan), meals: (meals ?? []) as PlanMeal[] });
    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { plan, isLoading, refresh: load };
}
