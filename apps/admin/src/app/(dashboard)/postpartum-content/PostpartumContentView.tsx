"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, FileText } from "lucide-react";
import type { PostpartumContentCard, PostpartumContentCategory } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { CardFormModal } from "./CardFormModal";

const CATEGORIES: { key: PostpartumContentCategory; label: string }[] = [
  { key: "info", label: "Informação" },
  { key: "hypopressive", label: "Hipopresivos" },
];

export function PostpartumContentView({ initialCards }: { initialCards: PostpartumContentCard[] }) {
  const [cards, setCards] = useState(initialCards);
  const [activeCategory, setActiveCategory] = useState<PostpartumContentCategory>("info");
  const [editingCard, setEditingCard] = useState<PostpartumContentCard | null | undefined>(undefined);

  const visibleCards = cards
    .filter((card) => card.category === activeCategory)
    .sort((a, b) => a.order_index - b.order_index);

  function handleSaved(card: PostpartumContentCard) {
    setCards((prev) => {
      const exists = prev.some((c) => c.id === card.id);
      return exists ? prev.map((c) => (c.id === card.id ? card : c)) : [...prev, card];
    });
    setEditingCard(undefined);
  }

  async function handleDelete(card: PostpartumContentCard) {
    if (!confirm(`Eliminar "${card.title}"?`)) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.from("postpartum_content_cards").delete().eq("id", card.id);
    setCards((prev) => prev.filter((c) => c.id !== card.id));
  }

  async function handleMove(card: PostpartumContentCard, direction: "up" | "down") {
    const index = visibleCards.findIndex((c) => c.id === card.id);
    const swapWith = direction === "up" ? visibleCards[index - 1] : visibleCards[index + 1];
    if (!swapWith) return;

    const supabase = createBrowserSupabaseClient();
    await Promise.all([
      supabase.from("postpartum_content_cards").update({ order_index: swapWith.order_index }).eq("id", card.id),
      supabase.from("postpartum_content_cards").update({ order_index: card.order_index }).eq("id", swapWith.id),
    ]);

    setCards((prev) =>
      prev.map((c) => {
        if (c.id === card.id) return { ...c, order_index: swapWith.order_index };
        if (c.id === swapWith.id) return { ...c, order_index: card.order_index };
        return c;
      })
    );
  }

  const nextOrderIndex = visibleCards.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Conteúdo Pós-parto</h1>
          <p className="mt-1 text-sm text-muted">Conteúdo educativo mostrado a todos os clientes na área de Pós-parto.</p>
        </div>
        <button
          onClick={() => setEditingCard(null)}
          className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
        >
          <Plus size={16} />
          Novo cartão
        </button>
      </div>

      <div className="flex gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              activeCategory === cat.key ? "border-accent text-accent" : "border-border text-muted hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {visibleCards.length === 0 && (
          <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
            Ainda não tens cartões nesta categoria.
          </p>
        )}
        {visibleCards.map((card, index) => (
          <div key={card.id} className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5">
            {card.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-elevated">
                <FileText size={22} className="text-muted" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-foreground">{card.title}</p>
              {card.body && <p className="mt-1 line-clamp-2 text-sm text-muted">{card.body}</p>}
              {card.video_url && <p className="mt-1 text-xs text-accent">Tem vídeo</p>}
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => handleMove(card, "up")}
                disabled={index === 0}
                className="text-muted hover:text-foreground disabled:opacity-30"
              >
                <ArrowUp size={16} />
              </button>
              <button
                onClick={() => handleMove(card, "down")}
                disabled={index === visibleCards.length - 1}
                className="text-muted hover:text-foreground disabled:opacity-30"
              >
                <ArrowDown size={16} />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <button onClick={() => setEditingCard(card)} className="flex items-center gap-1 hover:text-foreground">
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => handleDelete(card)} className="flex items-center gap-1 hover:text-danger">
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingCard !== undefined && (
        <CardFormModal
          card={editingCard}
          category={activeCategory}
          nextOrderIndex={nextOrderIndex}
          onClose={() => setEditingCard(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
