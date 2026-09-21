import { useState } from "react";
import { View, Text, Modal, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";

interface ProgressionRow {
  orderIndex: number;
  name: string;
  cellsByVersion: Record<number, { sets: number | null; reps: string | null; rir: number | null } | null>;
}

interface PlanProgressButtonProps {
  clientId: string;
  planId: string;
  parentPlanId: string | null;
  dayName: string;
  weekday: number;
}

export function PlanProgressButton({ clientId, planId, parentPlanId, dayName, weekday }: PlanProgressButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [versions, setVersions] = useState<number[]>([]);
  const [rows, setRows] = useState<ProgressionRow[]>([]);

  async function loadProgression() {
    setIsLoading(true);
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

  const rirColor = (rir: number | null) => {
    if (rir === null) return "#9A9AA5";
    if (rir <= 1) return "#E97A6C";
    if (rir === 2) return "#E3A93B";
    if (rir === 3) return "#5FC57F";
    return "#4FBBAE";
  };

  return (
    <>
      <Pressable
        onPress={handleOpen}
        className="h-8 w-8 items-center justify-center rounded-full border border-accent bg-surface-elevated"
      >
        <Ionicons name="trending-up-outline" size={16} color="#C9A227" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/70" onPress={() => setOpen(false)}>
          <Pressable className="max-h-[85%] rounded-t-3xl bg-surface p-5" onPress={() => {}}>
            <Text className="text-lg font-semibold text-foreground">{t("workout.progression")}</Text>
            <Text className="mb-4 mt-1 text-sm text-muted">{dayName}</Text>

            {isLoading ? (
              <ActivityIndicator color="#C9A227" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View className="flex-row border-b border-border pb-2">
                    <Text className="w-44 text-xs font-semibold uppercase text-muted">{t("workout.exercise")}</Text>
                    {versions.map((version) => (
                      <Text key={version} className="w-24 text-center text-xs font-semibold uppercase text-muted">
                        {t("workout.progressionWeek", { week: version })}
                      </Text>
                    ))}
                  </View>
                  <ScrollView contentContainerClassName="pb-6">
                    {rows.map((row) => (
                      <View key={row.orderIndex} className="flex-row items-center border-b border-border py-3">
                        <Text className="w-44 pr-2 text-sm font-medium text-foreground">{row.name}</Text>
                        {versions.map((version) => {
                          const cell = row.cellsByVersion[version];
                          return (
                            <View key={version} className="w-24 items-center">
                              {cell ? (
                                <>
                                  <Text className="text-sm font-semibold text-foreground">
                                    {cell.sets}×{cell.reps}
                                  </Text>
                                  {cell.rir !== null ? (
                                    <Text className="text-xs font-semibold" style={{ color: rirColor(cell.rir) }}>
                                      RIR {cell.rir}
                                    </Text>
                                  ) : null}
                                </>
                              ) : (
                                <Text className="text-sm text-muted">—</Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
