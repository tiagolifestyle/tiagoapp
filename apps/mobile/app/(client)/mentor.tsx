import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { Habit } from "@tiagolifestyle/shared";
import { useTheme } from "@/context/ThemeContext";
import { useHabits } from "@/hooks/useHabits";
import { habitIconName } from "@/components/habitIcons";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

function habitTitle(habit: Habit, locale: string): string {
  for (const loc of [locale, "pt", "es", "en"]) {
    const value = habit[`title_${loc}` as keyof Habit] as string | undefined;
    if (value) return value;
  }
  return "";
}

export default function MentorScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { habits, done, toggle, isLoading, refresh } = useHabits();

  const completed = habits.filter((habit) => done.includes(habit.id)).length;
  const total = habits.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const pendingIconColor = theme === "light" ? "#6B6B76" : "#9A9AA5";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#C9A227" />}
      >
        <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />
        <View className="gap-1">
          <Text className="text-2xl font-semibold text-foreground">Mentor LifeStyle</Text>
          <Text className="text-sm text-muted">{t("dashboard.mentorSubtitle")}</Text>
        </View>

        <Card className="gap-3 bg-surface-elevated">
          <View className="flex-row items-end justify-between gap-3">
            <Text className="flex-1 text-base text-muted">{t("mentor.progressToday")}</Text>
            <Text className="text-2xl font-bold text-accent">
              {completed}/{total}
            </Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full bg-border">
            <LinearGradient
              colors={["#A8862A", "#E9CF7A", "#C9A227"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: "100%", width: `${percent}%` }}
            />
          </View>
          <Text className={`text-xs ${total > 0 && completed === total ? "font-semibold text-success" : "text-muted"}`}>
            {total > 0 && completed === total ? t("mentor.allDone") : t("mentor.hint")}
          </Text>
        </Card>

        {total === 0 && !isLoading ? (
          <Text className="text-sm text-muted">{t("mentor.empty")}</Text>
        ) : (
          <Card className="gap-1 bg-surface-elevated p-2">
            {habits.map((habit) => {
              const isDone = done.includes(habit.id);
              return (
                <Pressable
                  key={habit.id}
                  onPress={() => toggle(habit.id)}
                  className="flex-row items-center gap-3 rounded-2xl px-3 py-3 active:opacity-70"
                >
                  <Ionicons name={habitIconName(habit.icon)} size={20} color={isDone ? "#C9A227" : pendingIconColor} />
                  <Text className="flex-1 text-base font-semibold text-foreground">
                    {habitTitle(habit, i18n.language)}
                  </Text>
                  {isDone ? (
                    <View className="rounded-full px-3 py-1" style={{ backgroundColor: "rgba(63,174,110,0.15)" }}>
                      <Text className="text-xs font-semibold text-success">{t("mentor.done")}</Text>
                    </View>
                  ) : (
                    <Text className="px-3 py-1 text-xs text-muted">{t("mentor.pending")}</Text>
                  )}
                </Pressable>
              );
            })}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
