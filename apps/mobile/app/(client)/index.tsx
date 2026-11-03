import { useCallback, useEffect, useState } from "react";
import { View, Text, Image, ScrollView, RefreshControl, Pressable } from "react-native";
import { Link, router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useDashboard } from "@/hooks/useDashboard";
import { Card } from "@/components/Card";
import { StatTile } from "@/components/StatTile";
import { LEVEL_IMAGES } from "@/components/levelImages";
import { getLevel } from "@tiagolifestyle/shared";
import { darkenColor } from "@/lib/darkenColor";
import postpartumIllustration from "../../assets/postpartum-illustration.png";
import brandLogo from "../../assets/logo.png";
import nutritionCardPhoto from "../../assets/card-nutrition.jpg";
import mentorCardPhoto from "../../assets/card-mentor.jpg";

const NUTRITION_COLOR = "#C9A227";
const MENTOR_COLOR = "#F472B6";

function greetingKey(): "dashboard.greetingMorning" | "dashboard.greetingAfternoon" | "dashboard.greetingEvening" {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboard.greetingMorning";
  if (hour < 19) return "dashboard.greetingAfternoon";
  return "dashboard.greetingEvening";
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { theme } = useTheme();
  const { data, isLoading, refresh, refreshCompletedToday } = useDashboard(profile?.id);
  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  // No fundo claro, o dourado e o rosa escurecem um pouco para se lerem bem.
  const nutritionColor = theme === "light" ? darkenColor(NUTRITION_COLOR) : NUTRITION_COLOR;
  const mentorColor = theme === "light" ? darkenColor(MENTOR_COLOR) : MENTOR_COLOR;
  // O Mentor LifeStyle ainda não tem conteúdo: ao tocar mostra "Em breve" durante uns segundos.
  const [mentorSoon, setMentorSoon] = useState(false);

  useEffect(() => {
    if (!mentorSoon) return;
    const timer = setTimeout(() => setMentorSoon(false), 2500);
    return () => clearTimeout(timer);
  }, [mentorSoon]);

  useFocusEffect(
    useCallback(() => {
      refreshCompletedToday();
    }, [refreshCompletedToday])
  );

  // Abre o separador Treino já no dia de hoje (o "at" garante que muda mesmo que o cliente tenha escolhido outro dia).
  function openTodayWorkout() {
    router.push({
      pathname: "/(client)/workout",
      params: { day: String(new Date().getDay()), at: String(Date.now()) },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#C9A227" />}
      >
        <View className="mt-4 mb-2 flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-sm text-muted">TiagoLifeStyle</Text>
            <Text className="text-2xl font-semibold text-foreground">{t(greetingKey(), { name: firstName })}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Link href="/(client)/coach">
              <View className="rounded-full border border-border bg-surface p-3">
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color={theme === "light" ? "#14141A" : "#F5F5F2"}
                />
                {data.unreadMessagesCount > 0 && (
                  <View className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full bg-accent">
                    <Text className="text-[10px] font-bold text-background">{data.unreadMessagesCount}</Text>
                  </View>
                )}
              </View>
            </Link>
            <Image source={brandLogo} resizeMode="contain" style={{ width: 50, height: 53 }} />
          </View>
        </View>

        <Link href="/(client)/rewards">
          <Card className="w-full flex-row items-center gap-3 border-accent-muted bg-surface-elevated">
            <Ionicons name="flame" size={22} color="#C9A227" />
            <Text className="flex-1 text-base font-medium text-foreground">
              {t("dashboard.streak", { count: data.streakDays })}
            </Text>
            <Image source={LEVEL_IMAGES[getLevel(data.streakDays).current.key]} style={{ width: 30, height: 30 }} />
            <Ionicons name="chevron-forward" size={18} color="#C9A227" />
          </Card>
        </Link>

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
          <View className="flex-1">
            <Link href="/(client)/postpartum">
              <View
                className="w-full rounded-3xl"
                style={{
                  shadowColor: "#F472B6",
                  shadowOpacity: 0.35,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 10 },
                  elevation: 10,
                }}
              >
                <View
                  className="w-full items-end overflow-hidden rounded-3xl border p-5"
                  style={{ borderColor: "rgba(244,114,182,0.4)", backgroundColor: "rgba(244,114,182,0.08)", minHeight: 104 }}
                >
                  <LinearGradient
                    colors={["rgba(244,114,182,0.9)", "rgba(244,114,182,0)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      borderTopLeftRadius: 24,
                      borderTopRightRadius: 24,
                    }}
                  />
                  <Text className="text-right text-xs uppercase tracking-wide" style={{ color: "#F472B6" }}>
                    {t("postpartum.tileLabel")}
                  </Text>
                </View>
                <Image
                  source={postpartumIllustration}
                  resizeMode="contain"
                  style={{ position: "absolute", left: -16, bottom: -10, width: 82, height: 100 }}
                />
              </View>
            </Link>
          </View>
        </View>

        <View className="overflow-hidden rounded-3xl border bg-surface-elevated p-6" style={{ borderColor: "rgba(201,162,39,0.45)" }}>
          <LinearGradient
            colors={["rgba(201,162,39,0.16)", "rgba(201,162,39,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <Text className="text-xs font-semibold uppercase text-accent" style={{ letterSpacing: 3 }}>
            {t("dashboard.todayWorkout")}
          </Text>
          {/* Nomes como "Pecho+Deltoides+Tríceps" partem a linha no "+" e não a meio de uma palavra. */}
          <Text className="mt-3 text-2xl font-bold text-foreground">
            {data.todayDay?.name.replace(/([+/])/g, "$1​") ?? t("workout.restDay")}
          </Text>

          {data.planWeek && (
            <>
              <Text className="mt-2 text-base text-muted">
                {data.planWeek.total
                  ? t("dashboard.planWeek", { week: data.planWeek.week, total: data.planWeek.total })
                  : t("workout.progressionWeek", { week: data.planWeek.week })}
              </Text>
              {data.planWeek.total ? (
                <View className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <LinearGradient
                    colors={["#A8862A", "#E9CF7A", "#C9A227"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ height: "100%", width: `${Math.min(100, (data.planWeek.week / data.planWeek.total) * 100)}%` }}
                  />
                </View>
              ) : null}
            </>
          )}

          {data.todayDay && (
            <Pressable onPress={openTodayWorkout} className="mt-6 self-start active:opacity-80">
              {data.completedToday ? (
                <View className="flex-row items-center gap-1.5 rounded-full border border-accent px-5 py-3">
                  <Text numberOfLines={1} className="text-[15px] font-bold text-accent">
                    {t("dashboard.workoutDone")}
                  </Text>
                  <Ionicons name="checkmark" size={18} color="#C9A227" />
                </View>
              ) : (
                <LinearGradient
                  colors={["#E9CF7A", "#C9A227", "#A8862A"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 }}
                >
                  <Text className="text-base font-bold" style={{ color: "#0B0B0F" }}>
                    {t("dashboard.startWorkout")}
                  </Text>
                </LinearGradient>
              )}
            </Pressable>
          )}
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push("/(client)/nutrition")}
            className="flex-1 rounded-3xl border bg-surface-elevated p-3 active:opacity-80"
            style={{ borderColor: `${NUTRITION_COLOR}99` }}
          >
            <View className="h-28 w-full overflow-hidden rounded-2xl">
              <Image source={nutritionCardPhoto} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
            </View>
            <View className="flex-1 gap-1 px-1 pt-3">
              <Text className="text-xs font-bold uppercase" style={{ color: nutritionColor }}>
                {t("dashboard.nutritionCardLabel")}
              </Text>
              <Text className="text-sm font-bold text-foreground">{t("dashboard.nutritionCardTitle")}</Text>
              <Text className="text-xs text-muted">
                {data.nutritionPlan?.calories ? t("dashboard.nutritionCardKcal", { kcal: data.nutritionPlan.calories }) : "—"}
              </Text>
              <Text className="mt-auto pt-2 text-xs font-semibold uppercase" style={{ color: nutritionColor }}>
                {t("dashboard.nutritionCardCta")}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setMentorSoon(true)}
            className="flex-1 rounded-3xl border bg-surface-elevated p-3 active:opacity-80"
            style={{ borderColor: `${MENTOR_COLOR}99` }}
          >
            <View className="h-28 w-full overflow-hidden rounded-2xl">
              <Image source={mentorCardPhoto} resizeMode="cover" style={{ width: "100%", height: "100%" }} />
            </View>
            <View className="flex-1 gap-1 px-1 pt-3">
              <Text className="text-xs font-bold uppercase" style={{ color: mentorColor }}>
                Mentor LifeStyle
              </Text>
              <Text className="text-sm font-bold text-foreground">{t("dashboard.mentorTitle")}</Text>
              <Text className="text-xs text-muted">{t("dashboard.mentorSubtitle")}</Text>
              <Text className="mt-auto pt-2 text-xs font-semibold uppercase" style={{ color: mentorColor }}>
                {mentorSoon ? t("dashboard.comingSoon") : t("dashboard.mentorCta")}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
