import { View, Text, ScrollView, RefreshControl } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";

function greetingKey(): "dashboard.greetingMorning" | "dashboard.greetingAfternoon" | "dashboard.greetingEvening" {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboard.greetingMorning";
  if (hour < 19) return "dashboard.greetingAfternoon";
  return "dashboard.greetingEvening";
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data, isLoading, refresh } = useDashboard(profile?.id);
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#C9A227" />}
      >
        <View className="mt-4 mb-2 flex-row items-start justify-between">
          <View className="gap-1">
            <Text className="text-2xl font-semibold text-foreground">{t(greetingKey(), { name: firstName })}</Text>
            <Text className="text-base text-muted">{t("dashboard.todayPlanIntro")}</Text>
          </View>
          <Link href="/(client)/coach">
            <View className="rounded-full border border-border bg-surface p-3">
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#F5F5F2" />
              {data.unreadMessagesCount > 0 && (
                <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-accent">
                  <Text className="text-[10px] font-bold text-background">{data.unreadMessagesCount}</Text>
                </View>
              )}
            </View>
          </Link>
        </View>

        {data.streakDays > 0 && (
          <Card className="flex-row items-center gap-3 border-accent-muted bg-surface-elevated">
            <Ionicons name="flame" size={22} color="#C9A227" />
            <Text className="text-base font-medium text-foreground">
              {t("dashboard.streak", { count: data.streakDays })}
            </Text>
          </Card>
        )}

        {data.pendingCheckin && (
          <Link href="/(client)/checkin">
            <Card className="flex-row items-center gap-3 border-warning">
              <Ionicons name="alert-circle-outline" size={22} color="#D9A441" />
              <Text className="flex-1 text-base text-foreground">👀 {t("dashboard.alerts")}: check-in semanal pendente</Text>
              <Ionicons name="chevron-forward" size={18} color="#D9A441" />
            </Card>
          </Link>
        )}

        <View className="flex-row gap-3">
          <StatTile
            label={t("dashboard.currentWeight")}
            value={data.latestMetric?.weight_kg ? `${data.latestMetric.weight_kg} kg` : "—"}
          />
          <StatTile label={t("dashboard.nextSession")} value="—" />
        </View>

        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">{t("dashboard.todayWorkout")}</Text>
            <Link href="/(client)/workout">
              <Text className="text-sm font-medium text-accent">{t("common.seeAll")}</Text>
            </Link>
          </View>

          {data.todayDay ? (
            <View className="gap-2">
              <Text className="text-base font-medium text-foreground">{data.todayDay.name}</Text>
              {data.todayDay.exercises.slice(0, 3).map((item, index) => (
                <Text key={item.id} className="text-sm text-muted">
                  {index + 1}. {item.exercise.name} · {item.sets}×{item.reps}
                </Text>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted">{t("dashboard.noWorkoutToday")}</Text>
          )}
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">{t("dashboard.todayNutrition")}</Text>
            <Link href="/(client)/nutrition">
              <Text className="text-sm font-medium text-accent">{t("common.seeAll")}</Text>
            </Link>
          </View>
          {data.nutritionPlan ? (
            <View className="flex-row flex-wrap gap-x-6 gap-y-1">
              <Text className="text-sm text-muted">{t("nutrition.calories")}: {data.nutritionPlan.calories ?? "—"}</Text>
              <Text className="text-sm text-muted">{t("nutrition.protein")}: {data.nutritionPlan.protein_g ?? "—"}g</Text>
              <Text className="text-sm text-muted">{t("nutrition.carbs")}: {data.nutritionPlan.carbs_g ?? "—"}g</Text>
              <Text className="text-sm text-muted">{t("nutrition.fat")}: {data.nutritionPlan.fat_g ?? "—"}g</Text>
            </View>
          ) : (
            <Text className="text-sm text-muted">—</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
