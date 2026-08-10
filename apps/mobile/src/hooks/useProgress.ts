import { useCallback, useEffect, useState } from "react";
import type { ProgressMetric } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";

export function useProgress(clientId: string | undefined) {
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);
    const { data } = await supabase
      .from("progress_metrics")
      .select("*")
      .eq("client_id", clientId)
      .order("recorded_at", { ascending: true })
      .limit(30);
    setMetrics((data ?? []) as ProgressMetric[]);
    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function logWeight(weightKg: number) {
    if (!clientId) return;
    await supabase.from("progress_metrics").insert({
      client_id: clientId,
      recorded_at: new Date().toISOString().slice(0, 10),
      weight_kg: weightKg,
    });
    await load();
  }

  return { metrics, isLoading, refresh: load, logWeight };
}
