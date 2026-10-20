import { useState } from "react";
import { View, Text, ScrollView, RefreshControl, Image, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LEVELS, getLevel, type Reward } from "@tiagolifestyle/shared";
import { useAuth } from "@/context/AuthContext";
import { useRewards } from "@/hooks/useRewards";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { LEVEL_IMAGES } from "@/components/levelImages";

function pickLocalized(reward: Reward, field: "title" | "description", locale: string): string {
  for (const loc of [locale, "pt", "es", "en"]) {
    const value = reward[`${field}_${loc}` as keyof Reward] as string | null;
    if (value) return value;
  }
  return "";
}

export default function RewardsScreen() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const { points, rewards, redemptions, isLoading, refresh, redeem } = useRewards(profile?.id);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const { current, next } = getLevel(points);
  const progress = next ? (points - current.minPoints) / (next.minPoints - current.minPoints) : 1;

  async function handleRedeem(rewardId: string) {
    setRedeemingId(rewardId);
    setErrorId(null);
    const ok = await redeem(rewardId);
    if (!ok) setErrorId(rewardId);
    setRedeemingId(null);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#C9A227" />}
      >
        <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />
        <Text className="text-2xl font-semibold text-foreground">{t("rewards.title")}</Text>

        <Card className="items-center gap-3" style={{ borderColor: `${current.color}66` }}>
          <Image source={LEVEL_IMAGES[current.key]} style={{ width: 120, height: 120 }} resizeMode="contain" />
          <Text className="text-2xl font-bold" style={{ color: current.color }}>
            {current.name}
          </Text>
          <Text className="text-base font-medium text-foreground">{t("rewards.points", { count: points })}</Text>
          <View className="h-2.5 w-full overflow-hidden rounded-full bg-surface-elevated">
            <View
              className="h-full rounded-full"
              style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%`, backgroundColor: current.color }}
            />
          </View>
          <Text className="text-sm text-muted">
            {next ? t("rewards.toNextLevel", { count: next.minPoints - points, level: next.name }) : t("rewards.maxLevel")}
          </Text>
          <Text className="text-center text-xs text-muted">{t("rewards.howItWorks")}</Text>
        </Card>

        <Card className="gap-3">
          <Text className="text-base font-semibold text-foreground">{t("rewards.levels")}</Text>
          <View className="flex-row justify-between">
            {LEVELS.map((level) => {
              const reached = points >= level.minPoints;
              return (
                <View key={level.key} className="items-center gap-1" style={{ opacity: reached ? 1 : 0.35 }}>
                  <Image source={LEVEL_IMAGES[level.key]} style={{ width: 48, height: 48 }} resizeMode="contain" />
                  <Text className="text-[11px] font-semibold" style={{ color: level.color }}>
                    {level.name}
                  </Text>
                  <Text className="text-[10px] text-muted">{level.minPoints}+</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <Text className="mt-2 text-lg font-semibold text-foreground">{t("rewards.promotions")}</Text>

        {rewards.length === 0 && !isLoading ? (
          <Text className="text-sm text-muted">{t("rewards.noPromotions")}</Text>
        ) : (
          rewards.map((reward) => {
            const redemption = redemptions.find((r) => r.reward_id === reward.id);
            const unlocked = points >= reward.points_required;
            const description = pickLocalized(reward, "description", i18n.language);
            return (
              <Card
                key={reward.id}
                className={`gap-3 ${unlocked ? "border-accent-muted" : ""}`}
                style={{ opacity: unlocked || redemption ? 1 : 0.55 }}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="flex-1 text-base font-semibold text-foreground">
                    {pickLocalized(reward, "title", i18n.language)}
                  </Text>
                  <View className="flex-row items-center gap-1 rounded-full bg-surface-elevated px-2.5 py-1">
                    {!unlocked && <Ionicons name="lock-closed" size={12} color="#9A9AA5" />}
                    <Text className="text-xs font-semibold text-accent">{t("rewards.points", { count: reward.points_required })}</Text>
                  </View>
                </View>
                {description ? <Text className="text-sm text-muted">{description}</Text> : null}

                {redemption ? (
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name={redemption.delivered_at ? "checkmark-circle" : "time-outline"}
                      size={18}
                      color={redemption.delivered_at ? "#3FAE6E" : "#C9A227"}
                    />
                    <Text className="text-sm font-medium" style={{ color: redemption.delivered_at ? "#3FAE6E" : "#C9A227" }}>
                      {redemption.delivered_at ? t("rewards.delivered") : t("rewards.redeemed")}
                    </Text>
                  </View>
                ) : unlocked ? (
                  <Pressable
                    onPress={() => handleRedeem(reward.id)}
                    disabled={redeemingId !== null}
                    className="items-center rounded-2xl bg-accent px-5 py-3 active:opacity-80"
                  >
                    {redeemingId === reward.id ? (
                      <ActivityIndicator color="#0B0B0F" />
                    ) : (
                      <Text className="text-sm font-semibold text-background">{t("rewards.redeem")}</Text>
                    )}
                  </Pressable>
                ) : (
                  <Text className="text-sm text-muted">{t("rewards.unlocksAt", { count: reward.points_required })}</Text>
                )}

                {errorId === reward.id && <Text className="text-sm text-danger">{t("rewards.redeemError")}</Text>}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
