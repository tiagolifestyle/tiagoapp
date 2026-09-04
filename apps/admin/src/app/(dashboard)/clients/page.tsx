import Link from "next/link";
import { Plus } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ClientsTableView, type ClientRow } from "./ClientsTableView";

export default async function ClientsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, goal, status, subscription_tier, updated_at, profiles!clients_id_fkey(full_name, avatar_url)")
    .order("updated_at", { ascending: false });

  const rows: ClientRow[] = (clients ?? []).map((client) => {
    const profile = Array.isArray(client.profiles) ? client.profiles[0] : client.profiles;
    return {
      id: client.id,
      goal: client.goal,
      status: client.status,
      subscription_tier: client.subscription_tier,
      name: profile?.full_name ?? "—",
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
          <p className="mt-1 text-sm text-muted">{rows.length} clientes</p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
        >
          <Plus size={16} />
          Novo cliente
        </Link>
      </div>

      <ClientsTableView clients={rows} />
    </div>
  );
}
