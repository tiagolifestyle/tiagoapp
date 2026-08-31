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
    .select("id, profiles!clients_id_fkey(full_name)")
    .eq("status", "active");

  type ClientRow = { id: string; profiles: { full_name: string } | { full_name: string }[] | null };

  const clientOptions = ((clients ?? []) as unknown as ClientRow[]).map((client) => {
    const profile = Array.isArray(client.profiles) ? client.profiles[0] : client.profiles;
    return { id: client.id, name: profile?.full_name ?? "—" };
  });

  return <TemplatesView initialTemplates={templates ?? []} clientOptions={clientOptions} />;
}
