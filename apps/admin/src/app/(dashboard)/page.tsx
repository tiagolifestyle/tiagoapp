import { Users, UserCheck, UserX, ClipboardList, MessageCircle } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/StatCard";

export default async function OverviewPage() {
  const supabase = await createServerSupabaseClient();

  const [total, active, inactive, pendingCheckins, unreadMessages] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "inactive"),
    supabase.from("checkins").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("messages").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);

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
          value={unreadMessages.count ?? 0}
          icon={MessageCircle}
          tone={(unreadMessages.count ?? 0) > 0 ? "warning" : "default"}
        />
      </div>
    </div>
  );
}
