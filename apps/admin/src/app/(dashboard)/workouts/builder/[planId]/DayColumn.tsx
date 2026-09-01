"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Copy, Trash2 } from "lucide-react";
import { ExerciseCard } from "./ExerciseCard";
import type { BuilderDay, BuilderExercise } from "./types";

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface DayColumnProps {
  day: BuilderDay;
  onRename: (name: string) => void;
  onWeekdayChange: (weekday: number | null) => void;
  onDuplicateDay: () => void;
  onDeleteDay: () => void;
  onExerciseChange: (exerciseEntryId: string, patch: Partial<BuilderExercise>) => void;
  onDuplicateExercise: (exerciseEntryId: string) => void;
  onDeleteExercise: (exerciseEntryId: string) => void;
}

export function DayColumn({
  day,
  onRename,
  onWeekdayChange,
  onDuplicateDay,
  onDeleteDay,
  onExerciseChange,
  onDuplicateExercise,
  onDeleteExercise,
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day.id}` });

  return (
    <div className="flex w-[340px] shrink-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <input
          value={day.name}
          onChange={(e) => onRename(e.target.value)}
          className="flex-1 bg-transparent text-base font-semibold text-foreground outline-none"
        />
        <button onClick={onDuplicateDay} className="text-muted hover:text-foreground" title="Duplicar treino">
          <Copy size={16} />
        </button>
        <button onClick={onDeleteDay} className="text-muted hover:text-danger" title="Eliminar treino">
          <Trash2 size={16} />
        </button>
      </div>

      <select
        value={day.weekday ?? ""}
        onChange={(e) => onWeekdayChange(e.target.value === "" ? null : Number(e.target.value))}
        className="rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none"
      >
        <option value="">Sem dia da semana</option>
        {WEEKDAY_LABELS.map((label, weekday) => (
          <option key={weekday} value={weekday}>
            {label}
          </option>
        ))}
      </select>

      <SortableContext items={day.exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-[120px] flex-col gap-3 rounded-xl p-1 transition ${
            isOver ? "bg-surface-elevated ring-2 ring-accent/50" : ""
          }`}
        >
          {day.exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              item={exercise}
              index={index}
              onChange={(patch) => onExerciseChange(exercise.id, patch)}
              onDuplicate={() => onDuplicateExercise(exercise.id)}
              onDelete={() => onDeleteExercise(exercise.id)}
            />
          ))}
          {day.exercises.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted">
              Arrasta exercícios da biblioteca para aqui
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
