import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useWorkoutPlan, type PlanDay } from "@/hooks/useWorkoutPlan";
import { Card } from "@/components/Card";
import { ExerciseRow } from "@/components/ExerciseRow";
import { RmCalculatorButton } from "@/components/RmCalculatorButton";
import { PlanProgressButton } from "@/components/PlanProgressButton";
import { Button } from "@/components/Button";

// Ordem de exibição Segunda→Domingo; os valores são o índice de Date.getDay() (0=Domingo).
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { plan, loads, saveLoad, completedToday, markComplete, isLoading, refresh } = useWorkoutPlan(profile?.id);
  const weekdayLabels = t("workout.weekdaysShort", { returnObjects: true }) as string[];
  const [selectedWeekday, setSelectedWeekday] = useState(() => new Date().getDay());

  const dayByWeekday = useMemo(() => {
    const map = new Map<number, PlanDay>();
    plan?.days.forEach((day) => {
      if (day.weekday !== null) map.set(day.weekday, day);
    });
    return map;
  }, [plan]);

  const selectedDay = dayByWeekday.get(selectedWeekday) ?? null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#C9A227" />}
      >
        <View className="mt-4 mb-1 flex-row items-center justify-between">
          <Text className="text-2xl font-semibold text-foreground">{plan?.name ?? t("dashboard.todayWorkout")}</Text>
          {plan ? (
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-muted">{t("workout.planVersion", { version: plan.version })}</Text>
              <RmCalculatorButton />
              {selectedDay && profile?.id ? (
                <PlanProgressButton
                  clientId={profile.id}
                  planId={plan.id}
                  parentPlanId={plan.parent_plan_id}
                  dayName={selectedDay.name}
                  weekday={selectedWeekday}
                />
              ) : null}
            </View>
          ) : null}
        </View>

        {!plan && !isLoading && <Text className="text-base text-muted">{t("dashboard.noWorkoutToday")}</Text>}

        {plan && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pb-1">
              {WEEKDAY_ORDER.map((weekday) => {
                const day = dayByWeekday.get(weekday);
                const isSelected = selectedWeekday === weekday;
                return (
                  <Pressable
                    key={weekday}
                    onPress={() => setSelectedWeekday(weekday)}
                    className={`flex-row items-center gap-2 rounded-full border px-4 py-2 ${
                      isSelected ? "border-accent bg-surface-elevated" : "border-border"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        isSelected ? "text-accent" : "text-muted"
                      }`}
                    >
                      {weekdayLabels[weekday]}
                    </Text>
                    {day ? (
                      <View className="h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5">
                        <Text className="text-xs font-bold text-background">{day.exercises.length}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            {selectedDay ? (
              <Card key={selectedDay.id} className="gap-1">
                <Text className="mb-2 text-lg font-semibold text-foreground">{selectedDay.name}</Text>
                {selectedDay.exercises.map((exercise, index) => (
                  <ExerciseRow
                    key={exercise.id}
                    item={exercise}
                    index={index}
                    loads={loads[exercise.id] ?? []}
                    onSaveLoad={(setIndex, value) => saveLoad(exercise.id, setIndex, value)}
                  />
                ))}

                <View className="mt-3">
                  <Button
                    label={completedToday ? `✓ ${t("workout.completedToday")}` : t("workout.markComplete")}
                    onPress={markComplete}
                    disabled={completedToday}
                    variant={completedToday ? "secondary" : "primary"}
                  />
                </View>
              </Card>
            ) : (
              <Text className="text-base text-muted">{t("workout.restDay")}</Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
