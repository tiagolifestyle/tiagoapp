"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Copy, Trash2, Dumbbell } from "lucide-react";
import type { Exercise } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { ExerciseFormModal } from "./ExerciseFormModal";

export function ExerciseLibraryView({ initialExercises }: { initialExercises: Exercise[] }) {
  const [exercises, setExercises] = useState(initialExercises);
  const [search, setSearch] = useState("");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingExercise, setEditingExercise] = useState<Exercise | null | undefined>(undefined);

  const muscleGroups = useMemo(
    () => Array.from(new Set(exercises.map((e) => e.muscle_group).filter(Boolean))) as string[],
    [exercises]
  );

  const categories = useMemo(
    () => Array.from(new Set(exercises.map((e) => e.category).filter(Boolean))) as string[],
    [exercises]
  );

  const filtered = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = !muscleGroupFilter || exercise.muscle_group === muscleGroupFilter;
    const matchesDifficulty = !difficultyFilter || exercise.difficulty === difficultyFilter;
    const matchesCategory = !categoryFilter || exercise.category === categoryFilter;
    return matchesSearch && matchesMuscle && matchesDifficulty && matchesCategory;
  });

  function handleSaved(exercise: Exercise) {
    setExercises((prev) => {
      const exists = prev.some((e) => e.id === exercise.id);
      return exists ? prev.map((e) => (e.id === exercise.id ? exercise : e)) : [exercise, ...prev];
    });
    setEditingExercise(undefined);
  }

  async function handleDuplicate(exercise: Exercise) {
    const supabase = createBrowserSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, updated_at, ...rest } = exercise;
    const { data } = await supabase
      .from("exercises")
      .insert({ ...rest, name: `${exercise.name} (cópia)` })
      .select()
      .single();
    if (data) setExercises((prev) => [data as Exercise, ...prev]);
  }

  async function handleDelete(exercise: Exercise) {
    if (!confirm(`Eliminar "${exercise.name}"?`)) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.from("exercises").delete().eq("id", exercise.id);
    setExercises((prev) => prev.filter((e) => e.id !== exercise.id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Biblioteca de exercícios</h1>
          <p className="mt-1 text-sm text-muted">{exercises.length} exercícios</p>
        </div>
        <button
          onClick={() => setEditingExercise(null)}
          className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
        >
          <Plus size={16} />
          Novo exercício
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-2xl border border-border bg-surface-elevated px-4 py-2.5">
          <Search size={16} className="text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar exercício…"
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </div>
        <select
          value={muscleGroupFilter}
          onChange={(e) => setMuscleGroupFilter(e.target.value)}
          className="rounded-2xl border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground outline-none"
        >
          <option value="">Todos os grupos musculares</option>
          {muscleGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="rounded-2xl border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground outline-none"
        >
          <option value="">Todas as dificuldades</option>
          <option value="iniciante">Iniciante</option>
          <option value="intermedio">Intermédio</option>
          <option value="avancado">Avançado</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-2xl border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground outline-none"
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((exercise) => (
          <div key={exercise.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {exercise.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={exercise.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated">
                    <Dumbbell size={20} className="text-muted" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{exercise.name}</p>
                  <p className="text-xs text-muted">{exercise.muscle_group ?? "—"} · {exercise.equipment ?? "—"}</p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex items-center gap-4 pt-2 text-xs text-muted">
              <button onClick={() => setEditingExercise(exercise)} className="flex items-center gap-1 hover:text-foreground">
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => handleDuplicate(exercise)} className="flex items-center gap-1 hover:text-foreground">
                <Copy size={14} /> Duplicar
              </button>
              <button onClick={() => handleDelete(exercise)} className="flex items-center gap-1 hover:text-danger">
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingExercise !== undefined && (
        <ExerciseFormModal exercise={editingExercise} onClose={() => setEditingExercise(undefined)} onSaved={handleSaved} />
      )}
    </div>
  );
}
