"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Exercise, ExerciseDifficulty } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface ExerciseFormModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  onSaved: (exercise: Exercise) => void;
}

export function ExerciseFormModal({ exercise, onClose, onSaved }: ExerciseFormModalProps) {
  const [name, setName] = useState(exercise?.name ?? "");
  const [category, setCategory] = useState(exercise?.category ?? "");
  const [muscleGroup, setMuscleGroup] = useState(exercise?.muscle_group ?? "");
  const [equipment, setEquipment] = useState(exercise?.equipment ?? "");
  const [difficulty, setDifficulty] = useState<ExerciseDifficulty | "">(exercise?.difficulty ?? "");
  const [imageUrl, setImageUrl] = useState(exercise?.image_url ?? "");
  const [videoUrl, setVideoUrl] = useState(exercise?.video_url ?? "");
  const [instructions, setInstructions] = useState(exercise?.instructions ?? "");
  const [commonMistakes, setCommonMistakes] = useState(exercise?.common_mistakes ?? "");
  const [tips, setTips] = useState(exercise?.tips ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleUploadImage(file: File) {
    setUploading(true);
    const supabase = createBrowserSupabaseClient();
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("exercise-media").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("exercise-media").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createBrowserSupabaseClient();

    const payload = {
      name,
      category: category || null,
      muscle_group: muscleGroup || null,
      equipment: equipment || null,
      difficulty: difficulty || null,
      image_url: imageUrl || null,
      video_url: videoUrl || null,
      instructions: instructions || null,
      common_mistakes: commonMistakes || null,
      tips: tips || null,
    };

    const query = exercise
      ? supabase.from("exercises").update(payload).eq("id", exercise.id).select().single()
      : supabase.from("exercises").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);
    if (!error && data) onSaved(data as Exercise);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{exercise ? "Editar exercício" : "Novo exercício"}</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Nome"><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoria"><input value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} /></Field>
            <Field label="Grupo muscular"><input value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} className={inputClass} /></Field>
            <Field label="Equipamento"><input value={equipment} onChange={(e) => setEquipment(e.target.value)} className={inputClass} /></Field>
            <Field label="Dificuldade">
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as ExerciseDifficulty)} className={inputClass}>
                <option value="">—</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermedio">Intermédio</option>
                <option value="avancado">Avançado</option>
              </select>
            </Field>
          </div>

          <Field label="Imagem/GIF">
            <div className="flex items-center gap-3">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0])}
                className="text-sm text-muted"
              />
              {uploading && <span className="text-xs text-muted">A carregar…</span>}
            </div>
          </Field>

          <Field label="URL do vídeo (opcional)"><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputClass} /></Field>
          <Field label="Instruções"><textarea rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} className={inputClass} /></Field>
          <Field label="Erros comuns"><textarea rows={2} value={commonMistakes} onChange={(e) => setCommonMistakes(e.target.value)} className={inputClass} /></Field>
          <Field label="Dicas"><textarea rows={2} value={tips} onChange={(e) => setTips(e.target.value)} className={inputClass} /></Field>

          <button
            onClick={handleSave}
            disabled={saving || !name}
            className="mt-2 rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "A guardar…" : "Guardar exercício"}
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
