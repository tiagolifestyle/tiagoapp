"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Search, Dumbbell } from "lucide-react";
import type { Exercise } from "@tiagolifestyle/shared";

function LibraryItem({ exercise }: { exercise: Exercise }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${exercise.id}`,
    data: { type: "library", exercise },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex cursor-grab touch-none items-center gap-3 rounded-xl border border-border bg-surface-elevated p-3 active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      {exercise.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={exercise.image_url} alt="" className="h-9 w-9 rounded-lg object-cover" />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface">
          <Dumbbell size={16} className="text-muted" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-foreground">{exercise.name}</p>
        <p className="text-xs text-muted">{exercise.muscle_group ?? "—"}</p>
      </div>
    </div>
  );
}

export function LibraryPanel({ library }: { library: Exercise[] }) {
  const [search, setSearch] = useState("");
  const filtered = library.filter((exercise) => exercise.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex w-[300px] shrink-0 flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold text-foreground">Biblioteca de exercícios</p>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2">
        <Search size={14} className="text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar…"
          className="w-full bg-transparent text-sm text-foreground outline-none"
        />
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 260px)" }}>
        {filtered.map((exercise) => (
          <LibraryItem key={exercise.id} exercise={exercise} />
        ))}
      </div>
    </div>
  );
}
