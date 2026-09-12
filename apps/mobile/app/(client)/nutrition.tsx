import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useNutritionPlan, type PlanMeal } from "@/hooks/useNutritionPlan";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";

// Ordem de exibição Segunda→Domingo; os valores são o índice de Date.getDay() (0=Domingo).
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function NutritionScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { plan, isLoading, refresh } = useNutritionPlan(profile?.id);
  const weekdayLabels = t("workout.weekdaysShort", { returnObjects: true }) as string[];
  const [selectedWeekday, setSelectedWeekday] = useState(() => new Date().getDay());

  const mealsByWeekday = useMemo(() => {
    const map = new Map<number, PlanMeal[]>();
    plan?.meals.forEach((meal) => {
      if (meal.weekday === null) return;
      const list = map.get(meal.weekday) ?? [];
      list.push(meal);
      map.set(meal.weekday, list);
    });
    return map;
  }, [plan]);

  const visibleMeals = mealsByWeekday.get(selectedWeekday) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#C9A227" />}
      >
        <Text className="mt-4 text-2xl font-semibold text-foreground">{plan?.name ?? t("dashboard.todayNutrition")}</Text>

        {plan && (
          <View className="flex-row gap-3">
            <StatTile label={t("nutrition.calories")} value={`${plan.calories ?? "—"}`} accentColor="#F97316" />
            <StatTile label={t("nutrition.protein")} value={`${plan.protein_g ?? "—"}g`} accentColor="#3B82F6" />
          </View>
        )}
        {plan && (
          <View className="flex-row gap-3">
            <StatTile label={t("nutrition.carbs")} value={`${plan.carbs_g ?? "—"}g`} accentColor="#FBBF24" />
            <StatTile label={t("nutrition.fat")} value={`${plan.fat_g ?? "—"}g`} accentColor="#3FAE6E" />
          </View>
        )}

        {!plan && !isLoading && <Text className="text-base text-muted">—</Text>}

        {plan && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pb-1">
              {WEEKDAY_ORDER.map((weekday) => {
                const dayMeals = mealsByWeekday.get(weekday);
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
                    {dayMeals?.length ? (
                      <View className="h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5">
                        <Text className="text-xs font-bold text-background">{dayMeals.length}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            {visibleMeals.length === 0 ? (
              <Text className="text-base text-muted">{t("nutrition.noMealsForDay")}</Text>
            ) : (
              visibleMeals.map((meal) => (
                <Card key={meal.id} className="gap-2">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-semibold text-foreground">{meal.name}</Text>
                    {meal.time ? <Text className="text-sm text-muted">{meal.time}</Text> : null}
                  </View>
                  {meal.items.map((item) => (
                    <Text key={item.id} className="text-sm text-muted">
                      • {item.food_name}
                      {item.quantity ? ` — ${item.quantity}${item.unit ?? ""}` : ""}
                    </Text>
                  ))}
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
