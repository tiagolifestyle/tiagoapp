import { useCallback, useEffect, useState } from "react";
import type { Message } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";

export function useConversation(clientId: string | undefined) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("client_id", clientId)
      .maybeSingle();

    if (conversation?.id) {
      setConversationId(conversation.id);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })
        .limit(100);
      setMessages((data ?? []) as Message[]);

      const unreadIds = (data ?? [])
        .filter((message) => message.sender_id !== clientId && !message.read_at)
        .map((message) => message.id);
      if (unreadIds.length > 0) {
        await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
      }
    }

    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendMessage(body: string) {
    if (!conversationId || !clientId || !body.trim()) return;
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: clientId,
      body: body.trim(),
    });
    await load();
  }

  return { messages, isLoading, refresh: load, sendMessage };
}
