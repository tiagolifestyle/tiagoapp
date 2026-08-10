import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WorkoutBuilder } from "./WorkoutBuilder";

export default async function WorkoutBuilderPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: plan } = await supabase.from("workout_plans").select("*").eq("id", planId).single();
  if (!plan) notFound();

  const { data: days } = await supabase
    .from("workout_days")
    .select("*, exercises:workout_exercises(*, exercise:exercises(*))")
    .eq("plan_id", planId)
    .order("day_order", { ascending: true });

  const { data: library } = await supabase.from("exercises").select("*").order("name", { ascending: true });

  let clientName: string | null = null;
  if (plan.client_id) {
    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", plan.client_id)
      .single();
    clientName = clientProfile?.full_name ?? null;
  }

  const normalizedDays = (days ?? []).map((day) => ({
    ...day,
    exercises: [...(day.exercises ?? [])].sort((a, b) => a.order_index - b.order_index),
  }));

  return (
    <WorkoutBuilder
      plan={plan}
      initialDays={normalizedDays}
      library={library ?? []}
      clientName={clientName}
    />
  );
}
