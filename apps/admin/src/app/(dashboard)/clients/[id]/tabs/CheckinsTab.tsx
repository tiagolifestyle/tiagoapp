"use client";

import { useEffect, useState } from "react";
import type { Checkin } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";

export function CheckinsTab({ clientId }: { clientId: string }) {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function load() {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase
      .from("checkins")
      .select("*")
      .eq("client_id", clientId)
      .order("week_start", { ascending: false });
    setCheckins((data ?? []) as Checkin[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function respond(checkinId: string) {
    const supabase = createBrowserSupabaseClient();
    await supabase
      .from("checkins")
      .update({ coach_response: drafts[checkinId], status: "reviewed", reviewed_at: new Date().toISOString() })
      .eq("id", checkinId);
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      {checkins.length === 0 && (
        <Card>
          <p className="text-sm text-muted">Sem check-ins ainda.</p>
        </Card>
      )}

      {checkins.map((checkin) => (
        <Card key={checkin.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-medium text-foreground">Semana de {checkin.week_start}</p>
            <StatusBadge status={checkin.status} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm text-muted sm:grid-cols-3">
            <p>Como se sentiu: {checkin.answers.feeling ?? "—"}</p>
            <p>Treinos: {checkin.answers.workouts_completed ?? "—"}</p>
            <p>Nutrição: {checkin.answers.nutrition_rating ?? "—"}/5</p>
            <p>Sono: {checkin.answers.sleep_rating ?? "—"}/5</p>
            <p>Energia: {checkin.answers.energy_level ?? "—"}/5</p>
          </div>
          {checkin.answers.difficulties && <p className="text-sm text-muted">Dificuldades: {checkin.answers.difficulties}</p>}
          {checkin.answers.observations && <p className="text-sm text-muted">Observações: {checkin.answers.observations}</p>}

          {checkin.status === "pending" ? (
            <div className="flex flex-col gap-2">
              <textarea
                placeholder="Escreve a tua resposta…"
                value={drafts[checkin.id] ?? ""}
                onChange={(event) => setDrafts((prev) => ({ ...prev, [checkin.id]: event.target.value }))}
                rows={3}
                className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
              />
              <button
                onClick={() => respond(checkin.id)}
                className="w-fit rounded-2xl bg-accent px-5 py-2 text-sm font-semibold text-background hover:opacity-90"
              >
                Responder
              </button>
            </div>
          ) : (
            checkin.coach_response && <p className="rounded-2xl bg-surface-elevated p-4 text-sm text-foreground">{checkin.coach_response}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
