"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { ArrowLeft, Dumbbell } from "lucide-react";
import type { Exercise, WorkoutPlan } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { DayColumn, DAY_SLOT_DROPPABLE_ID } from "./DayColumn";
import { LibraryPanel } from "./LibraryPanel";
import { WeekdayTabs, WEEKDAY_ORDER, WEEKDAY_LABELS } from "./WeekdayTabs";
import type { BuilderDay, BuilderExercise } from "./types";

function reindex(list: BuilderExercise[]): BuilderExercise[] {
  return list.map((item, index) => ({ ...item, order_index: index }));
}

function isTempId(id: string) {
  return id.startsWith("tmp-");
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
  const [selectedWeekday, setSelectedWeekday] = useState(
    () => WEEKDAY_ORDER.find((w) => initialDays.some((d) => d.weekday === w)) ?? 1
  );
  const [activeDrag, setActiveDrag] = useState<{ label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const selectedDay = days.find((d) => d.weekday === selectedWeekday);

  function ensureSelectedDay(prev: BuilderDay[]): { next: BuilderDay[]; index: number } {
    const index = prev.findIndex((d) => d.weekday === selectedWeekday);
    if (index >= 0) return { next: prev, index };

    const newDay: BuilderDay = {
      id: `tmp-${crypto.randomUUID()}`,
      plan_id: plan.id,
      name: WEEKDAY_LABELS[selectedWeekday],
      day_order: prev.length,
      weekday: selectedWeekday,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      exercises: [],
    };
    const next = [...prev, newDay];
    return { next, index: next.length - 1 };
  }

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current;
    if (data?.type === "library") {
      setActiveDrag({ label: (data.exercise as Exercise).name });
    } else {
      const exercise = selectedDay?.exercises.find((e) => e.id === event.active.id);
      if (exercise) setActiveDrag({ label: exercise.exercise.name });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;

    if (activeData?.type === "library") {
      const exercise = activeData.exercise as Exercise;

      setDays((prev) => {
        const { next, index } = ensureSelectedDay(prev.map((d) => ({ ...d, exercises: [...d.exercises] })));
        const newEntry: BuilderExercise = {
          id: `tmp-${crypto.randomUUID()}`,
          day_id: next[index].id,
          exercise_id: exercise.id,
          exercise,
          order_index: next[index].exercises.length,
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
        next[index].exercises = reindex([...next[index].exercises, newEntry]);
        return next;
      });
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    if (overId === DAY_SLOT_DROPPABLE_ID || activeId === overId) return;

    setDays((prev) => {
      const dayIndex = prev.findIndex((d) => d.weekday === selectedWeekday);
      if (dayIndex < 0) return prev;
      const day = prev[dayIndex];
      const oldIndex = day.exercises.findIndex((e) => e.id === activeId);
      const newIndex = day.exercises.findIndex((e) => e.id === overId);
      if (oldIndex < 0 || newIndex < 0) return prev;

      const next = [...prev];
      next[dayIndex] = { ...day, exercises: reindex(arrayMove(day.exercises, oldIndex, newIndex)) };
      return next;
    });
  }

  function renameDay(name: string) {
    setDays((prev) => {
      const index = prev.findIndex((d) => d.weekday === selectedWeekday);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], name };
        return next;
      }
      const { next } = ensureSelectedDay(prev);
      next[next.length - 1] = { ...next[next.length - 1], name };
      return next;
    });
  }

  function deleteDay() {
    if (!selectedDay) return;
    if (!confirm(`Limpar o treino de ${WEEKDAY_LABELS[selectedWeekday]}? Esta ação não pode ser desfeita.`)) return;
    setDays((prev) => prev.filter((d) => d.weekday !== selectedWeekday));
  }

  function updateExercise(entryId: string, patch: Partial<BuilderExercise>) {
    setDays((prev) => {
      const dayIndex = prev.findIndex((d) => d.weekday === selectedWeekday);
      if (dayIndex < 0) return prev;
      const next = [...prev];
      next[dayIndex] = {
        ...next[dayIndex],
        exercises: next[dayIndex].exercises.map((e) => (e.id === entryId ? { ...e, ...patch } : e)),
      };
      return next;
    });
  }

  function duplicateExercise(entryId: string) {
    setDays((prev) => {
      const dayIndex = prev.findIndex((d) => d.weekday === selectedWeekday);
      if (dayIndex < 0) return prev;
      const exercises = [...prev[dayIndex].exercises];
      const index = exercises.findIndex((e) => e.id === entryId);
      if (index < 0) return prev;
      exercises.splice(index + 1, 0, { ...exercises[index], id: `tmp-${crypto.randomUUID()}` });
      const next = [...prev];
      next[dayIndex] = { ...next[dayIndex], exercises: reindex(exercises) };
      return next;
    });
  }

  function deleteExercise(entryId: string) {
    setDays((prev) => {
      const dayIndex = prev.findIndex((d) => d.weekday === selectedWeekday);
      if (dayIndex < 0) return prev;
      const exercises = reindex(prev[dayIndex].exercises.filter((e) => e.id !== entryId));
      const next = [...prev];
      next[dayIndex] = { ...next[dayIndex], exercises };
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

        <WeekdayTabs
          selected={selectedWeekday}
          onSelect={setSelectedWeekday}
          countFor={(weekday) => days.find((d) => d.weekday === weekday)?.exercises.length ?? 0}
        />

        <div className="flex gap-4 overflow-x-auto pb-4">
          <LibraryPanel library={library} />

          <DayColumn
            day={selectedDay}
            weekdayLabel={WEEKDAY_LABELS[selectedWeekday]}
            onRename={renameDay}
            onDeleteDay={deleteDay}
            onExerciseChange={updateExercise}
            onDuplicateExercise={duplicateExercise}
            onDeleteExercise={deleteExercise}
          />
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
