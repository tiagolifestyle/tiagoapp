"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, UtensilsCrossed, AlertTriangle } from "lucide-react";
import type { SpecialDish, SpecialDishCategory } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { DishFormModal, DISH_CATEGORY_LABELS } from "./DishFormModal";

const CATEGORY_FILTERS: { key: SpecialDishCategory | null; label: string }[] = [
  { key: null, label: "Todos" },
  { key: "breakfast", label: DISH_CATEGORY_LABELS.breakfast },
  { key: "lunch_dinner", label: DISH_CATEGORY_LABELS.lunch_dinner },
  { key: "snack", label: DISH_CATEGORY_LABELS.snack },
  { key: "dessert", label: DISH_CATEGORY_LABELS.dessert },
];

export function DishesView({ initialDishes }: { initialDishes: SpecialDish[] }) {
  const [dishes, setDishes] = useState(initialDishes);
  const [category, setCategory] = useState<SpecialDishCategory | null>(null);
  const [editingDish, setEditingDish] = useState<SpecialDish | null | undefined>(undefined);

  const visible = category ? dishes.filter((dish) => dish.category === category) : dishes;

  function handleSaved(dish: SpecialDish) {
    setDishes((prev) => {
      const exists = prev.some((d) => d.id === dish.id);
      return exists ? prev.map((d) => (d.id === dish.id ? dish : d)) : [dish, ...prev];
    });
    setEditingDish(undefined);
  }

  async function handleDelete(dish: SpecialDish) {
    if (!confirm(`Eliminar "${dish.name_pt}"?`)) return;
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("special_dishes").delete().eq("id", dish.id);
    if (!error) setDishes((prev) => prev.filter((d) => d.id !== dish.id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Pratos especiais</h1>
          <p className="mt-1 text-sm text-muted">Ideias de refeições mostradas a todos os clientes no plano alimentar.</p>
        </div>
        <button
          onClick={() => setEditingDish(null)}
          className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
        >
          <Plus size={16} />
          Novo prato
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.key ?? "all"}
            onClick={() => setCategory(filter.key)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              category === filter.key ? "border-accent text-accent" : "border-border text-muted hover:text-foreground"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {visible.length === 0 && (
          <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
            Ainda não tens pratos nesta categoria.
          </p>
        )}
        {visible.map((dish) => (
          <div key={dish.id} className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5">
            {dish.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dish.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-elevated">
                <UtensilsCrossed size={22} className="text-muted" />
              </div>
            )}
            <div className="flex-1">
              <p className="flex items-center gap-2 font-medium text-foreground">
                {dish.name_pt}
                {dish.notes_pt && <AlertTriangle size={14} className="text-warning" />}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {DISH_CATEGORY_LABELS[dish.category]} · {dish.calories ?? "—"} kcal · P {dish.protein_g ?? "—"}g · HC{" "}
                {dish.carbs_g ?? "—"}g · G {dish.fat_g ?? "—"}g
              </p>
              {dish.notes_pt && <p className="mt-1 line-clamp-1 text-xs text-warning">{dish.notes_pt}</p>}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <button onClick={() => setEditingDish(dish)} className="flex items-center gap-1 hover:text-foreground">
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => handleDelete(dish)} className="flex items-center gap-1 hover:text-danger">
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingDish !== undefined && (
        <DishFormModal dish={editingDish} onClose={() => setEditingDish(undefined)} onSaved={handleSaved} />
      )}
    </div>
  );
}
