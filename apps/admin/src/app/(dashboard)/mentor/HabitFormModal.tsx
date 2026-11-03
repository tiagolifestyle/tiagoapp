"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { HABIT_ICONS, type Habit, type HabitIcon } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { HABIT_ICON_COMPONENTS } from "./habitIcons";

interface HabitFormModalProps {
  habit: Habit | null;
  nextOrderIndex: number;
  onClose: () => void;
  onSaved: (habit: Habit) => void;
}

export function HabitFormModal({ habit, nextOrderIndex, onClose, onSaved }: HabitFormModalProps) {
  const [titlePt, setTitlePt] = useState(habit?.title_pt ?? "");
  const [titleEs, setTitleEs] = useState(habit?.title_es ?? "");
  const [titleEn, setTitleEn] = useState(habit?.title_en ?? "");
  const [icon, setIcon] = useState<string>(habit?.icon ?? "sparkles");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = titlePt.trim() && titleEs.trim() && titleEn.trim();

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();

    const payload = {
      title_pt: titlePt.trim(),
      title_es: titleEs.trim(),
      title_en: titleEn.trim(),
      icon,
    };

    const query = habit
      ? supabase.from("habits").update(payload).eq("id", habit.id).select().single()
      : supabase
          .from("habits")
          .insert({ ...payload, order_index: nextOrderIndex })
          .select()
          .single();

    const { data, error: saveError } = await query;
    setSaving(false);
    if (saveError) setError(saveError.message);
    else if (data) onSaved(data as Habit);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{habit ? "Editar hábito" : "Novo hábito"}</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Ícone">
            <div className="grid grid-cols-10 gap-2">
              {HABIT_ICONS.map((key: HabitIcon) => {
                const Icon = HABIT_ICON_COMPONENTS[key];
                const isSelected = icon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                      isSelected ? "border-accent bg-surface-elevated text-accent" : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Português">
            <input
              value={titlePt}
              onChange={(e) => setTitlePt(e.target.value)}
              placeholder="Ex: Acordar cedo"
              className={inputClass}
            />
          </Field>
          <Field label="Español">
            <input
              value={titleEs}
              onChange={(e) => setTitleEs(e.target.value)}
              placeholder="Ej: Despertarse temprano"
              className={inputClass}
            />
          </Field>
          <Field label="English">
            <input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="E.g. Wake up early"
              className={inputClass}
            />
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || !isValid}
            className="mt-2 rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "A guardar…" : "Guardar hábito"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}
