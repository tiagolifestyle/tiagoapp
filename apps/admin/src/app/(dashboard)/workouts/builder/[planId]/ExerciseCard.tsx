"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Copy, Trash2, Dumbbell } from "lucide-react";
import type { BuilderExercise } from "./types";

interface ExerciseCardProps {
  item: BuilderExercise;
  index: number;
  onChange: (patch: Partial<BuilderExercise>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function ExerciseCard({ item, index, onChange, onDuplicate, onDelete }: ExerciseCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-elevated p-4"
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab touch-none text-muted hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </button>

        {item.exercise.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.exercise.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
            <Dumbbell size={16} className="text-muted" />
          </div>
        )}

        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {index + 1}. {item.exercise.name}
          </p>
        </div>

        <button onClick={onDuplicate} className="text-muted hover:text-foreground" title="Duplicar">
          <Copy size={16} />
        </button>
        <button onClick={onDelete} className="text-muted hover:text-danger" title="Eliminar">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        <MiniField label="séries">
          <input
            type="number"
            value={item.sets ?? ""}
            onChange={(e) => onChange({ sets: Number(e.target.value) || null })}
            className={miniInputClass}
          />
        </MiniField>
        <MiniField label="reps">
          <input value={item.reps ?? ""} onChange={(e) => onChange({ reps: e.target.value })} className={miniInputClass} />
        </MiniField>
        <MiniField label="carga">
          <input value={item.load ?? ""} onChange={(e) => onChange({ load: e.target.value })} className={miniInputClass} />
        </MiniField>
        <MiniField label="descanso (s)">
          <input
            type="number"
            value={item.rest_seconds ?? ""}
            onChange={(e) => onChange({ rest_seconds: Number(e.target.value) || null })}
            className={miniInputClass}
          />
        </MiniField>
        <MiniField label="RIR">
          <input
            type="number"
            value={item.rir ?? ""}
            onChange={(e) => onChange({ rir: Number(e.target.value) || null })}
            className={miniInputClass}
          />
        </MiniField>
        <MiniField label="tempo">
          <input value={item.tempo ?? ""} onChange={(e) => onChange({ tempo: e.target.value })} className={miniInputClass} />
        </MiniField>
      </div>

      <input
        value={item.notes ?? ""}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder="Nota para o cliente (ex: controla a descida durante 3 segundos)"
        className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
      />
    </div>
  );
}

const miniInputClass =
  "w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none focus:border-accent";

function MiniField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-muted">{label}</span>
      {children}
    </div>
  );
}
