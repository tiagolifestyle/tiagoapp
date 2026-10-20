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
