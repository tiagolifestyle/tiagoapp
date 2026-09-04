"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { PhotoAngle, ProgressMetric, ProgressPhoto } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card } from "@/components/Card";

const SUB_TABS = [
  { key: "weight", label: "Peso" },
  { key: "photo", label: "Fotos" },
  { key: "measurements", label: "Medições" },
] as const;

type SubTabKey = (typeof SUB_TABS)[number]["key"];

const ANGLE_LABELS: Record<PhotoAngle, string> = {
  front: "Frente",
  side: "Lado",
  back: "Costas",
};

const MEASUREMENT_FIELDS: { key: string; label: string }[] = [
  { key: "waist", label: "Cintura" },
  { key: "abdomen", label: "Zona abdominal" },
  { key: "arm", label: "Braço" },
  { key: "legs", label: "Pernas" },
  { key: "diastasis", label: "Diastasis" },
];

interface ProgressPhotoWithUrl extends ProgressPhoto {
  signedUrl: string | null;
}

export function ProgressTab({ clientId }: { clientId: string }) {
  const [subTab, setSubTab] = useState<SubTabKey>("weight");
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
  const [photos, setPhotos] = useState<ProgressPhotoWithUrl[]>([]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase
      .from("progress_metrics")
      .select("*")
      .eq("client_id", clientId)
      .order("recorded_at", { ascending: true })
      .then(({ data }) => setMetrics((data ?? []) as ProgressMetric[]));

    supabase
      .from("progress_photos")
      .select("*")
      .eq("client_id", clientId)
      .order("taken_at", { ascending: false })
      .then(async ({ data }) => {
        const rows = (data ?? []) as ProgressPhoto[];
        const withUrls = await Promise.all(
          rows.map(async (photo) => {
            const { data: signed } = await supabase.storage
              .from("progress-photos")
              .createSignedUrl(photo.storage_path, 3600);
            return { ...photo, signedUrl: signed?.signedUrl ?? null };
          })
        );
        setPhotos(withUrls);
      });
  }, [clientId]);

  const chartData = metrics
    .filter((metric) => metric.weight_kg != null)
    .map((metric) => ({ date: metric.recorded_at.slice(5), peso: metric.weight_kg }));

  const measured = [...metrics].reverse().filter((metric) => Object.keys(metric.measurements ?? {}).length > 0);

  const photosByDate: { date: string; items: ProgressPhotoWithUrl[] }[] = [];
  for (const photo of photos) {
    const group = photosByDate.find((g) => g.date === photo.taken_at);
    if (group) group.items.push(photo);
    else photosByDate.push({ date: photo.taken_at, items: [photo] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              subTab === tab.key ? "border-accent text-accent" : "border-border text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === "weight" && (
        <>
          <Card>
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#2A2A35" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#9A9AA5" fontSize={12} />
                  <YAxis stroke="#9A9AA5" fontSize={12} domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip contentStyle={{ background: "#1E1E27", border: "1px solid #2A2A35", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="peso" stroke="#C9A227" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted">Ainda não há dados de progresso suficientes.</p>
            )}
          </Card>

          <Card className="divide-y divide-border p-0">
            {[...metrics]
              .filter((metric) => metric.weight_kg != null)
              .reverse()
              .map((metric) => (
                <div key={metric.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <span className="text-muted">{metric.recorded_at}</span>
                  <span className="font-medium text-foreground">{metric.weight_kg} kg</span>
                </div>
              ))}
            {metrics.filter((metric) => metric.weight_kg != null).length === 0 && (
              <p className="px-6 py-6 text-sm text-muted">Sem registos ainda.</p>
            )}
          </Card>
        </>
      )}

      {subTab === "photo" && (
        <Card className="flex flex-col gap-6">
          {photosByDate.length === 0 && <p className="py-6 text-center text-sm text-muted">Sem fotos ainda.</p>}
          {photosByDate.map((group) => (
            <div key={group.date} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted">{group.date}</p>
              <div className="flex flex-wrap gap-3">
                {group.items.map((photo) =>
                  photo.signedUrl ? (
                    <a key={photo.id} href={photo.signedUrl} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.signedUrl}
                        alt={ANGLE_LABELS[photo.angle]}
                        className="h-28 w-28 rounded-xl border border-border object-cover"
                      />
                    </a>
                  ) : (
                    <div key={photo.id} className="h-28 w-28 rounded-xl border border-border bg-surface-elevated" />
                  )
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      {subTab === "measurements" && (
        <Card className="divide-y divide-border p-0">
          {measured.length === 0 && <p className="px-6 py-6 text-sm text-muted">Sem medições ainda.</p>}
          {measured.map((metric) => (
            <div key={metric.id} className="flex flex-col gap-1 px-6 py-3 text-sm">
              <span className="text-muted">{metric.recorded_at}</span>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                {MEASUREMENT_FIELDS.filter((field) => metric.measurements[field.key] != null).map((field) => (
                  <span key={field.key} className="text-foreground">
                    {field.label}: <span className="font-medium">{metric.measurements[field.key]} cm</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
