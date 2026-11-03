"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { Habit } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { HabitFormModal } from "./HabitFormModal";
import { habitIconComponent } from "./habitIcons";

export function MentorView({ initialHabits }: { initialHabits: Habit[] }) {
  const [habits, setHabits] = useState(initialHabits);
  const [editingHabit, setEditingHabit] = useState<Habit | null | undefined>(undefined);

  const nextOrderIndex = habits.reduce((max, h) => Math.max(max, h.order_index), -1) + 1;

  function handleSaved(habit: Habit) {
    setHabits((prev) => {
      const exists = prev.some((h) => h.id === habit.id);
      return exists ? prev.map((h) => (h.id === habit.id ? habit : h)) : [...prev, habit];
    });
    setEditingHabit(undefined);
  }

  async function handleDelete(habit: Habit) {
    if (!confirm(`Eliminar "${habit.title_pt}"?`)) return;
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("habits").delete().eq("id", habit.id);
    if (!error) setHabits((prev) => prev.filter((h) => h.id !== habit.id));
  }

  // Troca o hábito com o vizinho e grava a nova ordem (0, 1, 2, …) dos que mudaram.
  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= habits.length) return;
    const reordered = [...habits];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const renumbered = reordered.map((h, i) => ({ ...h, order_index: i }));
    const changed = renumbered.filter((h, i) => h.order_index !== reordered[i].order_index);
    setHabits(renumbered);

    const supabase = createBrowserSupabaseClient();
    await Promise.all(
      changed.map((h) => supabase.from("habits").update({ order_index: h.order_index }).eq("id", h.id))
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Mentor LifeStyle</h1>
          <p className="mt-1 text-sm text-muted">
            Hábitos diários, iguais para todos os clientes. O cliente marca os que já fez; tudo recomeça à meia-noite e
            nada fica guardado.
          </p>
        </div>
        <button
          onClick={() => setEditingHabit(null)}
          className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
        >
          <Plus size={16} />
          Novo hábito
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {habits.length === 0 && (
          <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
            Ainda não criaste nenhum hábito.
          </p>
        )}
        {habits.map((habit, index) => {
          const Icon = habitIconComponent(habit.icon);
          return (
            <div key={habit.id} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-col">
                <button
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  className="text-muted hover:text-foreground disabled:opacity-30"
                  title="Subir"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => handleMove(index, 1)}
                  disabled={index === habits.length - 1}
                  className="text-muted hover:text-foreground disabled:opacity-30"
                  title="Descer"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-elevated">
                <Icon size={18} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{habit.title_pt}</p>
                <p className="mt-0.5 text-xs text-muted">
                  ES: {habit.title_es} · EN: {habit.title_en}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted">
                <button onClick={() => setEditingHabit(habit)} className="flex items-center gap-1 hover:text-foreground">
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => handleDelete(habit)} className="flex items-center gap-1 hover:text-danger">
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editingHabit !== undefined && (
        <HabitFormModal
          habit={editingHabit}
          nextOrderIndex={nextOrderIndex}
          onClose={() => setEditingHabit(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
