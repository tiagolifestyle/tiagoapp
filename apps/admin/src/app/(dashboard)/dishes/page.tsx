import type { SpecialDish } from "@tiagolifestyle/shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DishesView } from "./DishesView";

export default async function DishesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: dishes } = await supabase.from("special_dishes").select("*").order("created_at", { ascending: false });

  return <DishesView initialDishes={(dishes ?? []) as SpecialDish[]} />;
}
