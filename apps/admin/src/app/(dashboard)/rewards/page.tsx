import type { Reward, RewardRedemption } from "@tiagolifestyle/shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RewardsView } from "./RewardsView";

export default async function RewardsPage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: rewards }, { data: redemptions }] = await Promise.all([
    supabase.from("rewards").select("*").order("points_required", { ascending: true }),
    supabase.from("reward_redemptions").select("*").order("redeemed_at", { ascending: false }),
  ]);

  const clientIds = [...new Set((redemptions ?? []).map((r) => r.client_id as string))];
  const { data: profiles } = clientIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", clientIds)
    : { data: [] };

  const clientNames = Object.fromEntries((profiles ?? []).map((p) => [p.id as string, p.full_name as string]));

  return (
    <RewardsView
      initialRewards={(rewards ?? []) as Reward[]}
      initialRedemptions={(redemptions ?? []) as RewardRedemption[]}
      clientNames={clientNames}
    />
  );
}
