"use client";

import { useEffect, useState } from "react";
import type { Message } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function MessagesTab({ clientId }: { clientId: string }) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  async function load() {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCoachId(user?.id ?? null);

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
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as Message[]);

      const unreadIds = (data ?? [])
        .filter((message) => message.sender_id !== user?.id && !message.read_at)
        .map((message) => message.id);
      if (unreadIds.length > 0) {
        await supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
      }
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function send() {
    if (!conversationId || !coachId || !draft.trim()) return;
    const supabase = createBrowserSupabaseClient();
    const text = draft;
    setDraft("");
    await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: coachId, body: text.trim() });
    await load();
  }

  return (
    <div className="flex h-[60vh] max-w-2xl flex-col rounded-2xl border border-border bg-surface">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((message) => {
          const isMine = message.sender_id === coachId;
          return (
            <div
              key={message.id}
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                isMine ? "ml-auto bg-accent text-background" : "bg-surface-elevated text-foreground"
              }`}
            >
              {message.body}
            </div>
          );
        })}
        {messages.length === 0 && <p className="text-sm text-muted">Ainda não há mensagens nesta conversa.</p>}
      </div>
      <div className="flex items-center gap-2 border-t border-border p-4">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && send()}
          placeholder="Escreve uma mensagem…"
          className="flex-1 rounded-2xl border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent"
        />
        <button onClick={send} className="rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90">
          Enviar
        </button>
      </div>
    </div>
  );
}
