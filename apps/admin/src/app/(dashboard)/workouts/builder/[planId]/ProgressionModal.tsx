"use client";

import { useState } from "react";
import { TrendingUp, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface ProgressionCell {
  id: string;
  sets: number | null;
  reps: string | null;
  rir: number | null;
  restSeconds: number | null;
}

interface ProgressionRow {
  orderIndex: number;
  name: string;
  cellsByVersion: Record<number, ProgressionCell | undefined>;
}

interface EditRow {
  id: string;
  version: number;
  sets: string;
  reps: string;
  rir: string;
  rest: string;
}

interface Editing {
  exerciseName: string;
  rows: EditRow[];
}

interface ProgressionModalProps {
  clientId: string;
  planId: string;
  parentPlanId: string | null;
  weekday: number;
  dayName: string;
  hasUnsavedChanges: boolean;
  onSaved: () => void;
}

function rirColor(rir: number | null) {
  if (rir === null) return "#9A9AA5";
  if (rir <= 1) return "#E97A6C";
  if (rir === 2) return "#E3A93B";
  if (rir === 3) return "#5FC57F";
  return "#4FBBAE";
}

function toEditRow(version: number, cell: ProgressionCell): EditRow {
  return {
    id: cell.id,
    version,
    sets: cell.sets?.toString() ?? "",
    reps: cell.reps ?? "",
    rir: cell.rir?.toString() ?? "",
    rest: cell.restSeconds?.toString() ?? "",
  };
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function ProgressionModal({
  clientId,
  planId,
  parentPlanId,
  weekday,
  dayName,
  hasUnsavedChanges,
  onSaved,
}: ProgressionModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [versions, setVersions] = useState<number[]>([]);
  const [rows, setRows] = useState<ProgressionRow[]>([]);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function loadProgression() {
    setIsLoading(true);
    const supabase = createBrowserSupabaseClient();
    const rootId = parentPlanId ?? planId;

    const { data: family } = await supabase
      .from("workout_plans")
      .select("id, version")
      .eq("client_id", clientId)
      .or(`id.eq.${rootId},parent_plan_id.eq.${rootId}`)
      .order("version", { ascending: true });

    const familyPlans = family ?? [];
    const versionByPlanId = new Map(familyPlans.map((p) => [p.id, p.version as number]));
    const planIds = familyPlans.map((p) => p.id);

    if (planIds.length === 0) {
      setVersions([]);
      setRows([]);
      setIsLoading(false);
      return;
    }

    const { data: days } = await supabase
      .from("workout_days")
      .select("id, plan_id")
      .in("plan_id", planIds)
      .eq("weekday", weekday);

    const dayList = days ?? [];
    const versionByDayId = new Map(dayList.map((d) => [d.id, versionByPlanId.get(d.plan_id)!]));
    const dayIds = dayList.map((d) => d.id);

    if (dayIds.length === 0) {
      setVersions([]);
      setRows([]);
      setIsLoading(false);
      return;
    }

    const { data: exs } = await supabase
      .from("workout_exercises")
      .select("id, day_id, order_index, sets, reps, rir, rest_seconds, exercise:exercises(name)")
      .in("day_id", dayIds)
      .order("order_index", { ascending: true });

    const rowsByOrder = new Map<number, ProgressionRow>();
    for (const ex of exs ?? []) {
      const version = versionByDayId.get(ex.day_id);
      if (version === undefined) continue;
      let row = rowsByOrder.get(ex.order_index);
      if (!row) {
        const exerciseName = Array.isArray(ex.exercise) ? ex.exercise[0]?.name : (ex.exercise as { name: string } | null)?.name;
        row = { orderIndex: ex.order_index, name: exerciseName ?? "", cellsByVersion: {} };
        rowsByOrder.set(ex.order_index, row);
      }
      row.cellsByVersion[version] = {
        id: ex.id,
        sets: ex.sets,
        reps: ex.reps,
        rir: ex.rir === null ? null : Number(ex.rir),
        restSeconds: ex.rest_seconds,
      };
    }

    const sortedVersions = [...new Set(familyPlans.map((p) => p.version as number))].sort((a, b) => a - b);
    const sortedRows = [...rowsByOrder.values()].sort((a, b) => a.orderIndex - b.orderIndex);

    setVersions(sortedVersions);
    setRows(sortedRows);
    setIsLoading(false);
  }

  function handleOpen() {
    if (
      hasUnsavedChanges &&
      !confirm(
        "Tens alterações por guardar neste plano. Se editares na Progressão, o construtor atualiza e perdes essas alterações. Guarda primeiro no construtor. Abrir mesmo assim?"
      )
    ) {
      return;
    }
    setOpen(true);
    setEditing(null);
    loadProgression();
  }

  function editCell(row: ProgressionRow, version: number) {
    const cell = row.cellsByVersion[version];
    if (!cell) return;
    setSaveError(null);
    setEditing({ exerciseName: row.name, rows: [toEditRow(version, cell)] });
  }

  function editExercise(row: ProgressionRow) {
    const editRows = versions.flatMap((version) => {
      const cell = row.cellsByVersion[version];
      return cell ? [toEditRow(version, cell)] : [];
    });
    if (editRows.length === 0) return;
    setSaveError(null);
    setEditing({ exerciseName: row.name, rows: editRows });
  }

  function updateEditRow(id: string, patch: Partial<EditRow>) {
    setEditing((prev) => (prev ? { ...prev, rows: prev.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) } : prev));
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    setSaveError(null);
    const supabase = createBrowserSupabaseClient();

    for (const row of editing.rows) {
      const { error } = await supabase
        .from("workout_exercises")
        .update({
          sets: parseOptionalNumber(row.sets),
          reps: row.reps.trim() || null,
          rir: parseOptionalNumber(row.rir),
          rest_seconds: parseOptionalNumber(row.rest),
        })
        .eq("id", row.id);
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setEditing(null);
    await loadProgression();
    onSaved();
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface-elevated px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent";

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-2xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated"
      >
        <TrendingUp size={16} />
        Progressão
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-surface p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {editing ? `Editar · ${editing.exerciseName}` : "Progressão"}
                </h2>
                <p className="mt-0.5 text-sm text-muted">{dayName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            {editing ? (
              <div className="flex min-h-0 flex-col gap-4">
                <div className="overflow-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 pr-2 text-left text-xs font-semibold uppercase text-muted">Semana</th>
                        <th className="px-1 py-2 text-left text-xs font-semibold uppercase text-muted">Séries</th>
                        <th className="px-1 py-2 text-left text-xs font-semibold uppercase text-muted">Reps</th>
                        <th className="px-1 py-2 text-left text-xs font-semibold uppercase text-muted">RIR</th>
                        <th className="px-1 py-2 text-left text-xs font-semibold uppercase text-muted">Descanso (s)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editing.rows.map((row) => (
                        <tr key={row.id} className="border-b border-border">
                          <td className="py-2 pr-2 text-sm font-medium text-foreground">Semana {row.version}</td>
                          <td className="px-1 py-2">
                            <input
                              type="number"
                              inputMode="numeric"
                              value={row.sets}
                              onChange={(e) => updateEditRow(row.id, { sets: e.target.value })}
                              className={inputClass}
                            />
                          </td>
                          <td className="px-1 py-2">
                            <input
                              value={row.reps}
                              onChange={(e) => updateEditRow(row.id, { reps: e.target.value })}
                              className={inputClass}
                            />
                          </td>
                          <td className="px-1 py-2">
                            <input
                              type="number"
                              inputMode="decimal"
                              value={row.rir}
                              onChange={(e) => updateEditRow(row.id, { rir: e.target.value })}
                              className={inputClass}
                            />
                          </td>
                          <td className="px-1 py-2">
                            <input
                              type="number"
                              inputMode="numeric"
                              value={row.rest}
                              onChange={(e) => updateEditRow(row.id, { rest: e.target.value })}
                              className={inputClass}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {saveError && <p className="text-sm text-danger">{saveError}</p>}

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setEditing(null)}
                    disabled={saving}
                    className="rounded-2xl border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface-elevated disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="rounded-2xl bg-accent px-6 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? "A guardar…" : "Guardar"}
                  </button>
                </div>
              </div>
            ) : isLoading ? (
              <p className="text-sm text-muted">A carregar…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted">Sem dados de progressão para este dia.</p>
            ) : (
              <div className="min-h-0 overflow-auto">
                <p className="mb-3 text-xs text-muted">
                  Toca numa célula para editar essa semana, ou no nome do exercício para editar todas as semanas.
                </p>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="w-48 py-2 pr-2 text-left text-xs font-semibold uppercase text-muted">Exercício</th>
                      {versions.map((version) => (
                        <th key={version} className="w-28 px-2 py-2 text-center text-xs font-semibold uppercase text-muted">
                          Semana {version}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.orderIndex} className="border-b border-border">
                        <td className="py-3 pr-2">
                          <button
                            onClick={() => editExercise(row)}
                            className="text-left text-sm font-medium text-foreground hover:text-accent"
                          >
                            {row.name}
                          </button>
                        </td>
                        {versions.map((version) => {
                          const cell = row.cellsByVersion[version];
                          return (
                            <td key={version} className="px-1 py-1 text-center">
                              {cell ? (
                                <button
                                  onClick={() => editCell(row, version)}
                                  className="flex w-full flex-col items-center rounded-lg px-1 py-2 hover:bg-surface-elevated"
                                >
                                  <span className="text-sm font-semibold text-foreground">
                                    {cell.sets}×{cell.reps}
                                  </span>
                                  {cell.rir !== null ? (
                                    <span className="text-xs font-semibold" style={{ color: rirColor(cell.rir) }}>
                                      RIR {cell.rir}
                                    </span>
                                  ) : null}
                                </button>
                              ) : (
                                <span className="text-sm text-muted">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
