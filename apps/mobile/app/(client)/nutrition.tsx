import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useNutritionPlan } from "@/hooks/useNutritionPlan";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";

export default function NutritionScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { plan, isLoading, refresh } = useNutritionPlan(profile?.id);

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
            <StatTile label={t("nutrition.calories")} value={`${plan.calories ?? "—"}`} />
            <StatTile label={t("nutrition.protein")} value={`${plan.protein_g ?? "—"}g`} />
          </View>
        )}
        {plan && (
          <View className="flex-row gap-3">
            <StatTile label={t("nutrition.carbs")} value={`${plan.carbs_g ?? "—"}g`} />
            <StatTile label={t("nutrition.fat")} value={`${plan.fat_g ?? "—"}g`} />
          </View>
        )}

        {!plan && !isLoading && <Text className="text-base text-muted">—</Text>}

        {plan?.meals.map((meal) => (
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
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
