import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ClientProfileView } from "./ClientProfileView";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*, profiles(full_name, avatar_url, locale)")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const profile = Array.isArray(client.profiles) ? client.profiles[0] : client.profiles;

  return <ClientProfileView clientId={id} initialClient={client} initialProfileName={profile?.full_name ?? ""} />;
}
