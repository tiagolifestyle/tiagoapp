import { useCallback, useEffect, useState } from "react";
import type { SpecialDish } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";

export function useSpecialDishes() {
  const [dishes, setDishes] = useState<SpecialDish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.from("special_dishes").select("*").order("created_at", { ascending: false });
    setDishes((data ?? []) as SpecialDish[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { dishes, isLoading, refresh: load };
}

// Os Pratos especiais ficam bloqueados enquanto o cliente não resgatar uma promoção que os desbloqueia.
export function useDishesAccess(clientId: string | undefined) {
  const [locked, setLocked] = useState(false);
  const [pointsRequired, setPointsRequired] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!clientId) return;
    const { data: unlockRewards } = await supabase
      .from("rewards")
      .select("id, points_required")
      .eq("unlocks_special_dishes", true);

    const rewards = unlockRewards ?? [];
    if (rewards.length === 0) {
      setLocked(false);
      setPointsRequired(null);
      return;
    }

    const { count } = await supabase
      .from("reward_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .in(
        "reward_id",
        rewards.map((r) => r.id)
      );

    setLocked((count ?? 0) === 0);
    setPointsRequired(Math.min(...rewards.map((r) => r.points_required as number)));
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return { locked, pointsRequired, refresh: load };
}

// Envia ao coach, pelo chat, o pedido para incluir um prato no plano.
export async function requestDish(clientId: string, body: string): Promise<boolean> {
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();
  if (!conversation?.id) return false;

  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversation.id, sender_id: clientId, body });
  return !error;
}
