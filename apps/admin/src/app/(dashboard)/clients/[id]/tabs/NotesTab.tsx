"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card } from "@/components/Card";

export function NotesTab({ clientId, initialNotes }: { clientId: string; initialNotes: string | null }) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const supabase = createBrowserSupabaseClient();
    await supabase.from("clients").update({ notes_private: notes }).eq("id", clientId);
    setSaving(false);
    setSaved(true);
  }

  return (
    <Card className="flex max-w-xl flex-col gap-4">
      <p className="text-sm text-muted">
        Visível apenas para ti — nunca é mostrado ao cliente.
      </p>
      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={8}
        className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start rounded-2xl bg-accent px-6 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "A guardar…" : "Guardar"}
        </button>
        {saved && <span className="text-sm text-success">Guardado</span>}
      </div>
    </Card>
  );
}
