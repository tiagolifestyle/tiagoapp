"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy } from "lucide-react";
import type { WorkoutPlan } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card } from "@/components/Card";

interface ClientOption {
  id: string;
  name: string;
}

export function TemplatesView({
  initialTemplates,
  clientOptions,
}: {
  initialTemplates: WorkoutPlan[];
  clientOptions: ClientOption[];
}) {
  const router = useRouter();
  const [templates] = useState(initialTemplates);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [applying, setApplying] = useState(false);

  async function createTemplate() {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: plan } = await supabase
      .from("workout_plans")
      .insert({ is_template: true, client_id: null, name: "Novo template", status: "draft", created_by: user?.id })
      .select()
      .single();

    if (plan) router.push(`/workouts/builder/${plan.id}`);
  }

  async function applyToClient(templateId: string) {
    if (!selectedClientId) return;
    setApplying(true);
    const supabase = createBrowserSupabaseClient();

    const template = templates.find((t) => t.id === templateId);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: newPlan } = await supabase
      .from("workout_plans")
      .insert({
        client_id: selectedClientId,
        is_template: false,
        name: template?.name ?? "Plano",
        status: "draft",
        created_by: user?.id,
      })
      .select()
      .single();

    if (newPlan) {
      const { data: days } = await supabase
        .from("workout_days")
        .select("*, exercises:workout_exercises(*)")
        .eq("plan_id", templateId)
        .order("day_order", { ascending: true });

      for (const day of days ?? []) {
        const { data: newDay } = await supabase
          .from("workout_days")
          .insert({ plan_id: newPlan.id, name: day.name, day_order: day.day_order, weekday: day.weekday })
          .select()
          .single();

        if (newDay) {
          for (const exercise of day.exercises ?? []) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, created_at, updated_at, day_id, ...rest } = exercise;
            await supabase.from("workout_exercises").insert({ ...rest, day_id: newDay.id });
          }
        }
      }

      router.push(`/workouts/builder/${newPlan.id}`);
    }

    setApplying(false);
    setApplyingTemplateId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Templates</h1>
          <p className="mt-1 text-sm text-muted">Estruturas reutilizáveis — duplica para qualquer cliente.</p>
        </div>
        <button
          onClick={createTemplate}
          className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
        >
          <Plus size={16} />
          Novo template
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="flex flex-col gap-4">
            <a href={`/workouts/builder/${template.id}`} className="font-medium text-foreground hover:text-accent">
              {template.name}
            </a>

            {applyingTemplateId === template.id ? (
              <div className="flex flex-col gap-2">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none"
                >
                  <option value="">Escolhe um cliente…</option>
                  {clientOptions.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => applyToClient(template.id)}
                  disabled={applying || !selectedClientId}
                  className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
                >
                  {applying ? "A duplicar…" : "Confirmar"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setApplyingTemplateId(template.id)}
                className="flex w-fit items-center gap-2 text-sm text-accent"
              >
                <Copy size={14} />
                Duplicar para cliente
              </button>
            )}
          </Card>
        ))}

        {templates.length === 0 && (
          <Card>
            <p className="text-sm text-muted">Ainda não tens templates. Cria o primeiro.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
