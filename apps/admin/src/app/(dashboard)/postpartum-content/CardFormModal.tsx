"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { PostpartumContentCard, PostpartumContentCategory } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface CardFormModalProps {
  card: PostpartumContentCard | null;
  category: PostpartumContentCategory;
  nextOrderIndex: number;
  onClose: () => void;
  onSaved: (card: PostpartumContentCard) => void;
}

export function CardFormModal({ card, category, nextOrderIndex, onClose, onSaved }: CardFormModalProps) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [body, setBody] = useState(card?.body ?? "");
  const [imageUrl, setImageUrl] = useState(card?.image_url ?? "");
  const [videoUrl, setVideoUrl] = useState(card?.video_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleUploadImage(file: File) {
    setUploading(true);
    const supabase = createBrowserSupabaseClient();
    const path = `postpartum/${Date.now()}-${file.name}`;
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
      category,
      title,
      body: body || null,
      image_url: imageUrl || null,
      video_url: videoUrl || null,
      order_index: card?.order_index ?? nextOrderIndex,
    };

    const query = card
      ? supabase.from("postpartum_content_cards").update(payload).eq("id", card.id).select().single()
      : supabase.from("postpartum_content_cards").insert(payload).select().single();

    const { data, error } = await query;
    setSaving(false);
    if (!error && data) onSaved(data as PostpartumContentCard);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{card ? "Editar cartão" : "Novo cartão"}</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Título">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </Field>

          <Field label="Texto">
            <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} className={inputClass} />
          </Field>

          <Field label="Imagem (opcional)">
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

          <Field label="URL do vídeo (opcional)">
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputClass} />
          </Field>

          <button
            onClick={handleSave}
            disabled={saving || !title}
            className="mt-2 rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "A guardar…" : "Guardar cartão"}
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
