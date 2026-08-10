import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TemplatesView } from "./TemplatesView";

export default async function TemplatesPage() {
  const supabase = await createServerSupabaseClient();

  const { data: templates } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("is_template", true)
    .order("created_at", { ascending: false });

  const { data: clients } = await supabase
    .from("clients")
    .select("id, profiles(full_name)")
    .eq("status", "active");

  const clientOptions = (clients ?? []).map((client) => ({
    id: client.id,
    name: (Array.isArray(client.profiles) ? client.profiles[0]?.full_name : client.profiles?.full_name) ?? "—",
  }));

  return <TemplatesView initialTemplates={templates ?? []} clientOptions={clientOptions} />;
}
