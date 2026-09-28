"use client";

import { useState } from "react";
import { TrendingUp, X } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

interface ProgressionRow {
  orderIndex: number;
  name: string;
  cellsByVersion: Record<number, { sets: number | null; reps: string | null; rir: number | null } | null>;
}

interface ProgressionModalProps {
  clientId: string;
  planId: string;
  parentPlanId: string | null;
  weekday: number;
  dayName: string;
}

function rirColor(rir: number | null) {
  if (rir === null) return "#9A9AA5";
  if (rir <= 1) return "#E97A6C";
  if (rir === 2) return "#E3A93B";
  if (rir === 3) return "#5FC57F";
  return "#4FBBAE";
}

export function ProgressionModal({ clientId, planId, parentPlanId, weekday, dayName }: ProgressionModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [versions, setVersions] = useState<number[]>([]);
  const [rows, setRows] = useState<ProgressionRow[]>([]);

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
      .select("day_id, order_index, sets, reps, rir, exercise:exercises(name)")
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
      row.cellsByVersion[version] = { sets: ex.sets, reps: ex.reps, rir: ex.rir };
    }

    const sortedVersions = [...new Set(familyPlans.map((p) => p.version as number))].sort((a, b) => a - b);
    const sortedRows = [...rowsByOrder.values()].sort((a, b) => a.orderIndex - b.orderIndex);

    setVersions(sortedVersions);
    setRows(sortedRows);
    setIsLoading(false);
  }

  function handleOpen() {
    setOpen(true);
    loadProgression();
  }

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
                <h2 className="text-lg font-semibold text-foreground">Progressão</h2>
                <p className="mt-0.5 text-sm text-muted">{dayName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            {isLoading ? (
              <p className="text-sm text-muted">A carregar…</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted">Sem dados de progressão para este dia.</p>
            ) : (
              <div className="overflow-x-auto">
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
                        <td className="py-3 pr-2 text-sm font-medium text-foreground">{row.name}</td>
                        {versions.map((version) => {
                          const cell = row.cellsByVersion[version];
                          return (
                            <td key={version} className="px-2 py-3 text-center">
                              {cell ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-semibold text-foreground">
                                    {cell.sets}×{cell.reps}
                                  </span>
                                  {cell.rir !== null ? (
                                    <span className="text-xs font-semibold" style={{ color: rirColor(cell.rir) }}>
                                      RIR {cell.rir}
                                    </span>
                                  ) : null}
                                </div>
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
