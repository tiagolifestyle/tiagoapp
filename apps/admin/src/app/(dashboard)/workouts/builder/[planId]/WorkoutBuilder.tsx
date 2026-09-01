"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { ArrowLeft, Plus, Dumbbell } from "lucide-react";
import type { Exercise, WorkoutPlan } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { DayColumn } from "./DayColumn";
import { LibraryPanel } from "./LibraryPanel";
import type { BuilderDay, BuilderExercise } from "./types";

function reindex(list: BuilderExercise[]): BuilderExercise[] {
  return list.map((item, index) => ({ ...item, order_index: index }));
}

function isTempId(id: string) {
  return id.startsWith("tmp-");
}

function dayLetter(index: number) {
  return String.fromCharCode(65 + index);
}

interface WorkoutBuilderProps {
  plan: WorkoutPlan;
  initialDays: BuilderDay[];
  library: Exercise[];
  clientName: string | null;
}

export function WorkoutBuilder({ plan, initialDays, library, clientName }: WorkoutBuilderProps) {
  const router = useRouter();
  const [planName, setPlanName] = useState(plan.name);
  const [planStatus, setPlanStatus] = useState(plan.status);
  const [days, setDays] = useState<BuilderDay[]>(initialDays);
  const [activeDrag, setActiveDrag] = useState<{ label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function locate(id: string) {
    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const exerciseIndex = days[dayIndex].exercises.findIndex((e) => e.id === id);
      if (exerciseIndex >= 0) return { dayIndex, exerciseIndex };
    }
    return null;
  }

  function resolveTarget(overId: string) {
    if (overId.startsWith("day-")) {
      const dayId = overId.slice(4);
      const dayIndex = days.findIndex((d) => d.id === dayId);
      if (dayIndex < 0) return null;
      return { dayIndex, index: days[dayIndex].exercises.length };
    }
    const found = locate(overId);
    if (!found) return null;
    return { dayIndex: found.dayIndex, index: found.exerciseIndex };
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === "library") {
      setActiveDrag({ label: (data.exercise as Exercise).name });
    } else {
      const found = locate(event.active.id as string);
      if (found) setActiveDrag({ label: days[found.dayIndex].exercises[found.exerciseIndex].exercise.name });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;

    if (activeData?.type === "library") {
      const exercise = activeData.exercise as Exercise;
      const target = resolveTarget(over.id as string);
      if (!target) return;

      const newEntry: BuilderExercise = {
        id: `tmp-${crypto.randomUUID()}`,
        day_id: days[target.dayIndex].id,
        exercise_id: exercise.id,
        exercise,
        order_index: target.index,
        sets: 3,
        reps: "10",
        load: null,
        rest_seconds: 60,
        rir: null,
        rpe: null,
        tempo: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setDays((prev) => {
        const next = prev.map((d) => ({ ...d, exercises: [...d.exercises] }));
        next[target.dayIndex].exercises.splice(target.index, 0, newEntry);
        next[target.dayIndex].exercises = reindex(next[target.dayIndex].exercises);
        return next;
      });
      return;
    }

    const activeId = active.id as string;
    const source = locate(activeId);
    if (!source) return;
    const target = resolveTarget(over.id as string);
    if (!target) return;
    if (source.dayIndex === target.dayIndex && source.exerciseIndex === target.index) return;

    setDays((prev) => {
      const next = prev.map((d) => ({ ...d, exercises: [...d.exercises] }));
      const [moved] = next[source.dayIndex].exercises.splice(source.exerciseIndex, 1);
      let targetIndex = target.index;
      if (source.dayIndex === target.dayIndex && target.index > source.exerciseIndex) targetIndex -= 1;
      next[target.dayIndex].exercises.splice(targetIndex, 0, { ...moved, day_id: next[target.dayIndex].id });
      next[source.dayIndex].exercises = reindex(next[source.dayIndex].exercises);
      next[target.dayIndex].exercises = reindex(next[target.dayIndex].exercises);
      return next;
    });
  }

  function addDay() {
    setDays((prev) => [
      ...prev,
      {
        id: `tmp-${crypto.randomUUID()}`,
        plan_id: plan.id,
        name: `Treino ${dayLetter(prev.length)}`,
        day_order: prev.length,
        weekday: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        exercises: [],
      },
    ]);
  }

  function renameDay(dayId: string, name: string) {
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, name } : d)));
  }

  function changeDayWeekday(dayId: string, weekday: number | null) {
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, weekday } : d)));
  }

  function duplicateDay(dayId: string) {
    setDays((prev) => {
      const index = prev.findIndex((d) => d.id === dayId);
      if (index < 0) return prev;
      const original = prev[index];
      const clone: BuilderDay = {
        ...original,
        id: `tmp-${crypto.randomUUID()}`,
        name: `${original.name} (cópia)`,
        exercises: original.exercises.map((exercise) => ({ ...exercise, id: `tmp-${crypto.randomUUID()}` })),
      };
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next.map((d, i) => ({ ...d, day_order: i }));
    });
  }

  function deleteDay(dayId: string) {
    if (!confirm("Eliminar este treino do plano?")) return;
    setDays((prev) => prev.filter((d) => d.id !== dayId).map((d, i) => ({ ...d, day_order: i })));
  }

  function updateExercise(entryId: string, patch: Partial<BuilderExercise>) {
    setDays((prev) =>
      prev.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => (exercise.id === entryId ? { ...exercise, ...patch } : exercise)),
      }))
    );
  }

  function duplicateExercise(entryId: string) {
    setDays((prev) => {
      const found = locate(entryId);
      if (!found) return prev;
      const next = prev.map((d) => ({ ...d, exercises: [...d.exercises] }));
      const original = next[found.dayIndex].exercises[found.exerciseIndex];
      next[found.dayIndex].exercises.splice(found.exerciseIndex + 1, 0, { ...original, id: `tmp-${crypto.randomUUID()}` });
      next[found.dayIndex].exercises = reindex(next[found.dayIndex].exercises);
      return next;
    });
  }

  function deleteExercise(entryId: string) {
    setDays((prev) => {
      const found = locate(entryId);
      if (!found) return prev;
      const next = prev.map((d) => ({ ...d, exercises: [...d.exercises] }));
      next[found.dayIndex].exercises.splice(found.exerciseIndex, 1);
      next[found.dayIndex].exercises = reindex(next[found.dayIndex].exercises);
      return next;
    });
  }

  async function persist(nextStatus?: WorkoutPlan["status"]) {
    setSaving(true);
    setSaved(false);
    const supabase = createBrowserSupabaseClient();
    const statusToSave = nextStatus ?? planStatus;

    await supabase.from("workout_plans").update({ name: planName, status: statusToSave }).eq("id", plan.id);

    const originalDayIds = new Set(initialDays.map((d) => d.id));
    const currentDayIds = new Set(days.map((d) => d.id).filter((id) => !isTempId(id)));

    for (const removedId of originalDayIds) {
      if (!currentDayIds.has(removedId)) {
        await supabase.from("workout_days").delete().eq("id", removedId);
      }
    }

    for (const day of days) {
      let realDayId = day.id;

      if (isTempId(day.id)) {
        const { data: inserted } = await supabase
          .from("workout_days")
          .insert({ plan_id: plan.id, name: day.name, day_order: day.day_order, weekday: day.weekday })
          .select()
          .single();
        realDayId = inserted?.id ?? day.id;
      } else {
        await supabase
          .from("workout_days")
          .update({ name: day.name, day_order: day.day_order, weekday: day.weekday })
          .eq("id", day.id);
      }

      const originalDay = initialDays.find((d) => d.id === day.id);
      const originalExerciseIds = new Set((originalDay?.exercises ?? []).map((e) => e.id));
      const currentExerciseIds = new Set(day.exercises.map((e) => e.id).filter((id) => !isTempId(id)));

      for (const removedId of originalExerciseIds) {
        if (!currentExerciseIds.has(removedId)) {
          await supabase.from("workout_exercises").delete().eq("id", removedId);
        }
      }

      for (const exercise of day.exercises) {
        const payload = {
          day_id: realDayId,
          exercise_id: exercise.exercise_id,
          order_index: exercise.order_index,
          sets: exercise.sets,
          reps: exercise.reps,
          load: exercise.load,
          rest_seconds: exercise.rest_seconds,
          rir: exercise.rir,
          rpe: exercise.rpe,
          tempo: exercise.tempo,
          notes: exercise.notes,
        };

        if (isTempId(exercise.id)) {
          await supabase.from("workout_exercises").insert(payload);
        } else {
          await supabase.from("workout_exercises").update(payload).eq("id", exercise.id);
        }
      }
    }

    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  async function duplicateAsNewVersion() {
    setSaving(true);
    const supabase = createBrowserSupabaseClient();
    const rootId = plan.parent_plan_id ?? plan.id;

    const { data: versions } = await supabase
      .from("workout_plans")
      .select("version")
      .or(`id.eq.${rootId},parent_plan_id.eq.${rootId}`)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version ?? plan.version) + 1;

    const { data: newPlan } = await supabase
      .from("workout_plans")
      .insert({
        client_id: plan.client_id,
        is_template: plan.is_template,
        name: planName,
        status: "draft",
        version: nextVersion,
        parent_plan_id: rootId,
        created_by: plan.created_by,
      })
      .select()
      .single();

    if (newPlan) {
      for (const day of days) {
        const { data: newDay } = await supabase
          .from("workout_days")
          .insert({ plan_id: newPlan.id, name: day.name, day_order: day.day_order, weekday: day.weekday })
          .select()
          .single();

        if (newDay) {
          for (const exercise of day.exercises) {
            await supabase.from("workout_exercises").insert({
              day_id: newDay.id,
              exercise_id: exercise.exercise_id,
              order_index: exercise.order_index,
              sets: exercise.sets,
              reps: exercise.reps,
              load: exercise.load,
              rest_seconds: exercise.rest_seconds,
              rir: exercise.rir,
              rpe: exercise.rpe,
              tempo: exercise.tempo,
              notes: exercise.notes,
            });
          }
        }
      }

      router.push(`/workouts/builder/${newPlan.id}`);
    }
    setSaving(false);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href={plan.client_id ? `/clients/${plan.client_id}` : "/templates"} className="mb-3 flex items-center gap-2 text-sm text-muted hover:text-foreground">
              <ArrowLeft size={16} />
              Voltar
            </Link>
            <input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full max-w-md bg-transparent text-2xl font-semibold text-foreground outline-none"
            />
            <p className="mt-1 text-sm text-muted">
              {clientName ? `Cliente: ${clientName}` : "Template"} · v{plan.version}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={planStatus}
              onChange={(e) => setPlanStatus(e.target.value as WorkoutPlan["status"])}
              className="rounded-2xl border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground outline-none"
            >
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
              <option value="completed">Concluído</option>
              <option value="archived">Arquivado</option>
            </select>
            <button
              onClick={duplicateAsNewVersion}
              disabled={saving}
              className="rounded-2xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated disabled:opacity-50"
            >
              Nova versão
            </button>
            <button
              onClick={() => persist()}
              disabled={saving}
              className="rounded-2xl bg-accent px-6 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "A guardar…" : "Guardar"}
            </button>
            {saved && <span className="text-sm text-success">Guardado</span>}
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          <LibraryPanel library={library} />

          {days.map((day) => (
            <DayColumn
              key={day.id}
              day={day}
              onRename={(name) => renameDay(day.id, name)}
              onWeekdayChange={(weekday) => changeDayWeekday(day.id, weekday)}
              onDuplicateDay={() => duplicateDay(day.id)}
              onDeleteDay={() => deleteDay(day.id)}
              onExerciseChange={updateExercise}
              onDuplicateExercise={duplicateExercise}
              onDeleteExercise={deleteExercise}
            />
          ))}

          <button
            onClick={addDay}
            className="flex h-fit w-[220px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-8 text-muted hover:border-accent hover:text-accent"
          >
            <Plus size={20} />
            <span className="text-sm font-medium">Adicionar treino</span>
          </button>
        </div>
      </div>

      <DragOverlay>
        {activeDrag && (
          <div className="flex items-center gap-2 rounded-xl border border-accent bg-surface-elevated px-4 py-2.5 shadow-xl">
            <Dumbbell size={16} className="text-accent" />
            <span className="text-sm font-medium text-foreground">{activeDrag.label}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
