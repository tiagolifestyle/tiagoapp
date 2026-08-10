"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { ProgressMetric } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card } from "@/components/Card";

export function ProgressTab({ clientId }: { clientId: string }) {
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase
      .from("progress_metrics")
      .select("*")
      .eq("client_id", clientId)
      .order("recorded_at", { ascending: true })
      .then(({ data }) => setMetrics((data ?? []) as ProgressMetric[]));
  }, [clientId]);

  const chartData = metrics
    .filter((metric) => metric.weight_kg != null)
    .map((metric) => ({ date: metric.recorded_at.slice(5), peso: metric.weight_kg }));

  return (
    <div className="flex flex-col gap-4">
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
        {[...metrics].reverse().map((metric) => (
          <div key={metric.id} className="flex items-center justify-between px-6 py-3 text-sm">
            <span className="text-muted">{metric.recorded_at}</span>
            <span className="font-medium text-foreground">{metric.weight_kg ? `${metric.weight_kg} kg` : "—"}</span>
          </div>
        ))}
        {metrics.length === 0 && <p className="px-6 py-6 text-sm text-muted">Sem registos ainda.</p>}
      </Card>
    </div>
  );
}
