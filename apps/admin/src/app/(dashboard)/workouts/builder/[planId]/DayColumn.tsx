"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Trash2 } from "lucide-react";
import { ExerciseCard } from "./ExerciseCard";
import type { BuilderDay, BuilderExercise } from "./types";

export const DAY_SLOT_DROPPABLE_ID = "day-slot";

interface DayColumnProps {
  day: BuilderDay | undefined;
  weekdayLabel: string;
  onRename: (name: string) => void;
  onDeleteDay: () => void;
  onExerciseChange: (exerciseEntryId: string, patch: Partial<BuilderExercise>) => void;
  onDuplicateExercise: (exerciseEntryId: string) => void;
  onDeleteExercise: (exerciseEntryId: string) => void;
}

export function DayColumn({
  day,
  weekdayLabel,
  onRename,
  onDeleteDay,
  onExerciseChange,
  onDuplicateExercise,
  onDeleteExercise,
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: DAY_SLOT_DROPPABLE_ID });

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <input
          value={day?.name ?? weekdayLabel}
          onChange={(e) => onRename(e.target.value)}
          className="flex-1 bg-transparent text-base font-semibold text-foreground outline-none"
        />
        {day && (
          <button onClick={onDeleteDay} className="text-muted hover:text-danger" title="Limpar este dia">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <SortableContext items={day?.exercises.map((e) => e.id) ?? []} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex min-h-[200px] flex-col gap-3 rounded-xl p-1 transition ${
            isOver ? "bg-surface-elevated ring-2 ring-accent/50" : ""
          }`}
        >
          {day?.exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              item={exercise}
              index={index}
              onChange={(patch) => onExerciseChange(exercise.id, patch)}
              onDuplicate={() => onDuplicateExercise(exercise.id)}
              onDelete={() => onDeleteExercise(exercise.id)}
            />
          ))}
          {(!day || day.exercises.length === 0) && (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted">
              Arrasta exercícios da biblioteca para aqui para montares o treino de {weekdayLabel.toLowerCase()}
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
