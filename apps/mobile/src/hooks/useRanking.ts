import { useCallback, useEffect, useState } from "react";
import type { RankingRow } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";

export type RankingPeriod = "month" | "all";

// Top 10 do período e, se estiver mais abaixo, a linha do próprio cliente.
export function useRanking(period: RankingPeriod) {
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.rpc("get_ranking", { period });
    setRows((data ?? []) as RankingRow[]);
    setIsLoading(false);
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, isLoading, refresh: load };
}
