"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { WorkoutPlan } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";

export function WorkoutTab({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase
      .from("workout_plans")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPlans((data ?? []) as WorkoutPlan[]);
        setIsLoading(false);
      });
  }, [clientId]);

  async function handleCreatePlan() {
    setCreating(true);
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: plan, error } = await supabase
      .from("workout_plans")
      .insert({
        client_id: clientId,
        name: "Novo plano",
        status: "draft",
        created_by: user?.id,
      })
      .select()
      .single();

    setCreating(false);
    if (!error && plan) router.push(`/workouts/builder/${plan.id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleCreatePlan}
        disabled={creating}
        className="flex w-fit items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
      >
        <Plus size={16} />
        {creating ? "A criar…" : "Criar novo plano"}
      </button>

      {!isLoading && plans.length === 0 && (
        <Card>
          <p className="text-sm text-muted">Este cliente ainda não tem nenhum plano de treino.</p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {plans.map((plan) => (
          <a
            key={plan.id}
            href={`/workouts/builder/${plan.id}`}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5 transition hover:bg-surface-elevated"
          >
            <div>
              <p className="font-medium text-foreground">{plan.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                v{plan.version} · criado em {new Date(plan.created_at).toLocaleDateString("pt-PT")}
              </p>
            </div>
            <StatusBadge status={plan.status} />
          </a>
        ))}
      </div>
    </div>
  );
}
