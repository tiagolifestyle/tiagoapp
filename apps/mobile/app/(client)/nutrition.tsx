import { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useNutritionPlan, type PlanMeal } from "@/hooks/useNutritionPlan";
import { supabase } from "@/lib/supabase";
import { StatTile } from "@/components/StatTile";
import { MealCard } from "@/components/MealCard";

// Ordem de exibição Segunda→Domingo; os valores são o índice de Date.getDay() (0=Domingo).
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Cores por refeição (pequeno-almoço, meio da manhã, almoço, lanche, jantar), na ordem em que aparecem no dia.
const MEAL_COLORS = ["#F97316", "#3B82F6", "#FBBF24", "#3FAE6E", "#C9A227"];

export default function NutritionScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { plan, isLoading, refresh } = useNutritionPlan(profile?.id);
  const weekdayLabels = t("workout.weekdaysShort", { returnObjects: true }) as string[];
  const [selectedWeekday, setSelectedWeekday] = useState(() => new Date().getDay());
  const [downloading, setDownloading] = useState(false);

  async function handleDownloadDocument() {
    if (!plan?.document_url) return;
    setDownloading(true);
    const { data } = await supabase.storage.from("nutrition-documents").createSignedUrl(plan.document_url, 60);
    if (data?.signedUrl) {
      Linking.openURL(data.signedUrl);
    }
    setDownloading(false);
  }

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
        <View className="mt-4 flex-row items-start justify-between gap-3">
          <Text className="flex-1 text-2xl font-semibold text-foreground">{plan?.name ?? t("dashboard.todayNutrition")}</Text>
          {plan?.document_url ? (
            <Pressable
              onPress={handleDownloadDocument}
              disabled={downloading}
              className="h-10 w-10 items-center justify-center rounded-full border border-accent bg-surface-elevated"
            >
              <Ionicons name="download-outline" size={18} color="#C9A227" />
            </Pressable>
          ) : null}
        </View>

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
              visibleMeals.map((meal, index) => (
                <MealCard key={meal.id} meal={meal} accentColor={MEAL_COLORS[index % MEAL_COLORS.length]} />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
