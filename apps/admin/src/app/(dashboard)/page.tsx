import Link from "next/link";
import { Users, UserCheck, UserX, ClipboardList, MessageCircle } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/Card";

export default async function OverviewPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [total, active, inactive, pendingCheckins, unreadRows] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "inactive"),
    supabase.from("checkins").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("messages").select("conversation_id").is("read_at", null).neq("sender_id", user?.id ?? ""),
  ]);

  const unreadByConversation = new Map<string, number>();
  for (const row of unreadRows.data ?? []) {
    unreadByConversation.set(row.conversation_id, (unreadByConversation.get(row.conversation_id) ?? 0) + 1);
  }

  let unreadByClient: { clientId: string; name: string; count: number }[] = [];
  if (unreadByConversation.size > 0) {
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, client_id")
      .in("id", [...unreadByConversation.keys()]);

    const clientIds = [...new Set((conversations ?? []).map((c) => c.client_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", clientIds);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    unreadByClient = (conversations ?? [])
      .map((conversation) => ({
        clientId: conversation.client_id,
        name: nameById.get(conversation.client_id) ?? "—",
        count: unreadByConversation.get(conversation.id) ?? 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  const unreadTotal = unreadByClient.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Visão geral</h1>
        <p className="mt-1 text-sm text-muted">O estado dos teus clientes, num relance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total de clientes" value={total.count ?? 0} icon={Users} />
        <StatCard label="Clientes ativos" value={active.count ?? 0} icon={UserCheck} />
        <StatCard label="Clientes inativos" value={inactive.count ?? 0} icon={UserX} tone="warning" />
        <StatCard
          label="Check-ins pendentes"
          value={pendingCheckins.count ?? 0}
          icon={ClipboardList}
          tone={(pendingCheckins.count ?? 0) > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Mensagens por ler"
          value={unreadTotal}
          icon={MessageCircle}
          tone={unreadTotal > 0 ? "warning" : "default"}
        />
      </div>

      {unreadByClient.length > 0 && (
        <Card className="gap-3">
          <p className="text-sm font-medium text-foreground">Mensagens por ler, por cliente</p>
          <div className="flex flex-col gap-2">
            {unreadByClient.map((row) => (
              <Link
                key={row.clientId}
                href={`/clients/${row.clientId}?tab=messages`}
                className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 hover:bg-surface-elevated"
              >
                <span className="text-sm text-foreground">{row.name}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-background">{row.count}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
