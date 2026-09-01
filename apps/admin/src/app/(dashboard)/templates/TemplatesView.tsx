"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Pencil, Trash2 } from "lucide-react";
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
  const [templates, setTemplates] = useState(initialTemplates);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [applying, setApplying] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

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

  function startEditing(template: WorkoutPlan) {
    setApplyingTemplateId(null);
    setEditingTemplateId(template.id);
    setEditName(template.name);
  }

  async function saveRename(templateId: string) {
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("workout_plans").update({ name }).eq("id", templateId);
    setSaving(false);
    if (!error) {
      setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, name } : t)));
      setEditingTemplateId(null);
    }
  }

  async function deleteTemplate(template: WorkoutPlan) {
    if (!confirm(`Eliminar o template "${template.name}"? Esta ação não pode ser desfeita.`)) return;
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("workout_plans").delete().eq("id", template.id);
    if (!error) {
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
    }
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
            {editingTemplateId === template.id ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  className="rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => saveRename(template.id)}
                    disabled={saving || !editName.trim()}
                    className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? "A guardar…" : "Guardar"}
                  </button>
                  <button
                    onClick={() => setEditingTemplateId(null)}
                    className="rounded-xl border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <a href={`/workouts/builder/${template.id}`} className="font-medium text-foreground hover:text-accent">
                {template.name}
              </a>
            )}

            {editingTemplateId !== template.id &&
              (applyingTemplateId === template.id ? (
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
                  <button
                    onClick={() => setApplyingTemplateId(null)}
                    className="text-sm text-muted hover:text-foreground"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                  <button
                    onClick={() => setApplyingTemplateId(template.id)}
                    className="flex items-center gap-1 hover:text-accent"
                  >
                    <Copy size={14} /> Duplicar para cliente
                  </button>
                  <button onClick={() => startEditing(template)} className="flex items-center gap-1 hover:text-foreground">
                    <Pencil size={14} /> Editar
                  </button>
                  <button onClick={() => deleteTemplate(template)} className="flex items-center gap-1 hover:text-danger">
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              ))}
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
