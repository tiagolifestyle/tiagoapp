import { useCallback, useEffect, useState } from "react";
import type { Reward, RewardRedemption } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";

export function useRewards(clientId: string | undefined) {
  const [points, setPoints] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);

    const [pointsResult, rewardsResult, redemptionsResult] = await Promise.all([
      supabase.from("workout_completions").select("id", { count: "exact", head: true }).eq("client_id", clientId),
      supabase.from("rewards").select("*").order("points_required", { ascending: true }),
      supabase.from("reward_redemptions").select("*").eq("client_id", clientId),
    ]);

    setPoints(pointsResult.count ?? 0);
    setRewards((rewardsResult.data ?? []) as Reward[]);
    setRedemptions((redemptionsResult.data ?? []) as RewardRedemption[]);
    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function redeem(rewardId: string) {
    if (!clientId) return false;
    const { error } = await supabase.from("reward_redemptions").insert({ reward_id: rewardId, client_id: clientId });
    await load();
    return !error;
  }

  return { points, rewards, redemptions, isLoading, refresh: load, redeem };
}
