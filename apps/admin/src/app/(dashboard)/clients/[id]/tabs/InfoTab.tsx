"use client";

import { useState } from "react";
import type { Client, ClientStatus, SubscriptionTier } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card } from "@/components/Card";

export function InfoTab({ clientId, initialClient }: { clientId: string; initialClient: Client }) {
  const [goal, setGoal] = useState(initialClient.goal ?? "");
  const [status, setStatus] = useState<ClientStatus>(initialClient.status);
  const [tier, setTier] = useState<SubscriptionTier>(initialClient.subscription_tier);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const supabase = createBrowserSupabaseClient();
    await supabase
      .from("clients")
      .update({ goal, status, subscription_tier: tier })
      .eq("id", clientId);
    setSaving(false);
    setSaved(true);
  }

  return (
    <Card className="flex max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-muted">Objetivo</label>
        <input
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-sm font-medium text-muted">Estado</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ClientStatus)}
            className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="active">Ativo</option>
            <option value="paused">Em pausa</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <label className="text-sm font-medium text-muted">Plano de subscrição</label>
          <select
            value={tier}
            onChange={(event) => setTier(event.target.value as SubscriptionTier)}
            className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl bg-accent px-6 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "A guardar…" : "Guardar"}
        </button>
        {saved && <span className="text-sm text-success">Guardado</span>}
      </div>
    </Card>
  );
}
