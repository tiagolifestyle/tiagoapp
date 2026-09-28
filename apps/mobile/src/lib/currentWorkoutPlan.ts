import { supabase } from "@/lib/supabase";

function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// Uma versão com datas que incluem hoje tem prioridade; sem datas, usa o plano marcado como ativo.
export async function fetchCurrentWorkoutPlanId(clientId: string): Promise<string | null> {
  const today = localToday();

  const { data: dated } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("client_id", clientId)
    .neq("status", "archived")
    .lte("start_date", today)
    .gte("end_date", today)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dated) return dated.id as string;

  const { data: active } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("client_id", clientId)
    .eq("status", "active")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (active?.id as string | undefined) ?? null;
}
