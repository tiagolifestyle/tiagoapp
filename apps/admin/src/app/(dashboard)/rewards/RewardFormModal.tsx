"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Reward } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface RewardFormModalProps {
  reward: Reward | null;
  onClose: () => void;
  onSaved: (reward: Reward) => void;
}

export function RewardFormModal({ reward, onClose, onSaved }: RewardFormModalProps) {
  const [titlePt, setTitlePt] = useState(reward?.title_pt ?? "");
  const [titleEs, setTitleEs] = useState(reward?.title_es ?? "");
  const [titleEn, setTitleEn] = useState(reward?.title_en ?? "");
  const [descriptionPt, setDescriptionPt] = useState(reward?.description_pt ?? "");
  const [descriptionEs, setDescriptionEs] = useState(reward?.description_es ?? "");
  const [descriptionEn, setDescriptionEn] = useState(reward?.description_en ?? "");
  const [points, setPoints] = useState(reward?.points_required?.toString() ?? "");
  const [unlocksDishes, setUnlocksDishes] = useState(reward?.unlocks_special_dishes ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pointsValue = Number(points);
  const isValid = titlePt && titleEs && titleEn && points !== "" && Number.isInteger(pointsValue) && pointsValue >= 0;

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();

    const payload = {
      title_pt: titlePt,
      title_es: titleEs,
      title_en: titleEn,
      description_pt: descriptionPt || null,
      description_es: descriptionEs || null,
      description_en: descriptionEn || null,
      points_required: pointsValue,
      unlocks_special_dishes: unlocksDishes,
    };

    const query = reward
      ? supabase.from("rewards").update(payload).eq("id", reward.id).select().single()
      : supabase.from("rewards").insert(payload).select().single();

    const { data, error: saveError } = await query;
    setSaving(false);
    if (saveError) setError(saveError.message);
    else if (data) onSaved(data as Reward);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{reward ? "Editar promoção" : "Nova promoção"}</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Pontos necessários (1 ponto = 1 dia de treino concluído)">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className={inputClass}
            />
          </Field>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
            <input
              type="checkbox"
              checked={unlocksDishes}
              onChange={(e) => setUnlocksDishes(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#C9A227]"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Esta promoção desbloqueia os Pratos especiais</span>
              <span className="text-xs text-muted">
                Os Pratos especiais ficam com cadeado até o cliente resgatar esta promoção. O resgate fica logo marcado como
                entregue.
              </span>
            </span>
          </label>

          <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Português</p>
            <Field label="Título">
              <input value={titlePt} onChange={(e) => setTitlePt(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Descrição (opcional)">
              <textarea rows={3} value={descriptionPt} onChange={(e) => setDescriptionPt(e.target.value)} className={inputClass} />
            </Field>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Español</p>
            <Field label="Título">
              <input value={titleEs} onChange={(e) => setTitleEs(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Descripción (opcional)">
              <textarea rows={3} value={descriptionEs} onChange={(e) => setDescriptionEs(e.target.value)} className={inputClass} />
            </Field>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">English</p>
            <Field label="Title">
              <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Description (optional)">
              <textarea rows={3} value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className={inputClass} />
            </Field>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || !isValid}
            className="mt-2 rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "A guardar…" : "Guardar promoção"}
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
