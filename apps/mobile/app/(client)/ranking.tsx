import { useState } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLevel, type RankingRow } from "@tiagolifestyle/shared";
import { useRanking, type RankingPeriod } from "@/hooks/useRanking";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { LEVEL_IMAGES } from "@/components/levelImages";

const PERIODS: RankingPeriod[] = ["month", "all"];
const MEDALS = ["🥇", "🥈", "🥉"];

function RankRow({ row }: { row: RankingRow }) {
  const { t } = useTranslation();
  // O nível vem sempre dos pontos totais, mesmo no separador do mês.
  const level = getLevel(row.total_points).current;

  return (
    <View
      className={`flex-row items-center gap-3 rounded-2xl px-3 py-3 ${row.is_me ? "border border-accent bg-surface" : ""}`}
    >
      <View className="w-8 items-center">
        {row.rank <= 3 && row.points > 0 ? (
          <Text className="text-xl">{MEDALS[row.rank - 1]}</Text>
        ) : (
          <Text className="text-sm font-bold text-muted">{row.rank}</Text>
        )}
      </View>
      <Image source={LEVEL_IMAGES[level.key]} style={{ width: 30, height: 30 }} resizeMode="contain" />
      <Text className={`flex-1 text-base font-semibold ${row.is_me ? "text-accent" : "text-foreground"}`}>
        {row.display_name}
        {row.is_me ? ` (${t("ranking.you")})` : ""}
      </Text>
      <Text className="text-sm font-bold text-accent">{t("ranking.points", { count: row.points })}</Text>
    </View>
  );
}

export default function RankingScreen() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<RankingPeriod>("month");
  const { rows, isLoading, refresh } = useRanking(period);

  const top = rows.filter((row) => row.rank <= 10);
  const me = rows.find((row) => row.is_me);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#C9A227" />}
      >
        <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />
        <Text className="text-2xl font-semibold text-foreground">🏆 {t("ranking.title")}</Text>

        <View className="flex-row gap-3">
          {PERIODS.map((key) => (
            <Pressable
              key={key}
              onPress={() => setPeriod(key)}
              className={`flex-1 items-center rounded-2xl border px-4 py-3 ${
                period === key ? "border-accent bg-surface-elevated" : "border-border"
              }`}
            >
              <Text className={period === key ? "font-semibold text-accent" : "text-foreground"}>
                {t(key === "month" ? "ranking.thisMonth" : "ranking.allTime")}
              </Text>
            </Pressable>
          ))}
        </View>

        {!isLoading && (
          <Card className="items-center bg-surface-elevated">
            <Text className="text-center text-base font-semibold text-foreground">
              {me ? t("ranking.yourPosition", { position: me.rank }) : t("ranking.hidden")}
            </Text>
          </Card>
        )}

        {top.length === 0 && !isLoading ? (
          <Text className="text-sm text-muted">{t("ranking.empty")}</Text>
        ) : (
          <Card className="gap-1 bg-surface-elevated p-2">
            {top.map((row) => (
              <RankRow key={`${period}-${row.rank}`} row={row} />
            ))}
            {me && me.rank > 10 ? (
              <>
                <Text className="text-center text-muted">⋯</Text>
                <RankRow row={me} />
              </>
            ) : null}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
