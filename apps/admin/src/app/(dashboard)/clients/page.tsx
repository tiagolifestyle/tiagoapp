import Link from "next/link";
import { Plus } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";

export default async function ClientsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, goal, status, subscription_tier, updated_at, profiles!clients_id_fkey(full_name, avatar_url)")
    .order("updated_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
          <p className="mt-1 text-sm text-muted">{clients?.length ?? 0} clientes</p>
        </div>
        <Link
          href="/clients/new"
          className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
        >
          <Plus size={16} />
          Novo cliente
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">Objetivo</th>
              <th className="px-5 py-3 font-medium">Plano</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface/40">
            {clients?.map((client) => {
              const profile = Array.isArray(client.profiles) ? client.profiles[0] : client.profiles;
              return (
                <tr key={client.id} className="transition hover:bg-surface-elevated">
                  <td className="px-5 py-4">
                    <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated text-sm font-medium text-foreground">
                        {profile?.full_name?.slice(0, 2).toUpperCase() ?? "—"}
                      </div>
                      <span className="font-medium text-foreground">{profile?.full_name ?? "—"}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-muted">{client.goal ?? "—"}</td>
                  <td className="px-5 py-4 text-muted capitalize">{client.subscription_tier}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={client.status} />
                  </td>
                </tr>
              );
            })}
            {!clients?.length && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted">
                  Ainda não tens clientes. Cria o primeiro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
