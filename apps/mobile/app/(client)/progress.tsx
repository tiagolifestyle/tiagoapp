import { useState } from "react";
import { View, Text, ScrollView, RefreshControl, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/hooks/useProgress";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";

const screenWidth = Dimensions.get("window").width;

export default function ProgressScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { metrics, isLoading, refresh, logWeight } = useProgress(profile?.id);
  const [weightInput, setWeightInput] = useState("");
  const [saving, setSaving] = useState(false);

  const weighed = metrics.filter((metric) => metric.weight_kg != null);

  async function handleLogWeight() {
    const value = Number(weightInput.replace(",", "."));
    if (!value || Number.isNaN(value)) return;
    setSaving(true);
    await logWeight(value);
    setWeightInput("");
    setSaving(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#C9A227" />}
      >
        <Text className="mt-4 text-2xl font-semibold text-foreground">{t("dashboard.progress")}</Text>

        {weighed.length >= 2 && (
          <Card>
            <LineChart
              data={{
                labels: weighed.slice(-6).map((metric) => metric.recorded_at.slice(5)),
                datasets: [{ data: weighed.slice(-6).map((metric) => metric.weight_kg ?? 0) }],
              }}
              width={screenWidth - 72}
              height={180}
              withInnerLines={false}
              chartConfig={{
                backgroundColor: "#16161D",
                backgroundGradientFrom: "#16161D",
                backgroundGradientTo: "#16161D",
                decimalPlaces: 1,
                color: () => "#C9A227",
                labelColor: () => "#9A9AA5",
                propsForDots: { r: "3" },
              }}
              bezier
              style={{ borderRadius: 16 }}
            />
          </Card>
        )}

        <Card className="gap-3">
          <Text className="text-base font-medium text-foreground">{t("dashboard.currentWeight")}</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField
                label="kg"
                keyboardType="decimal-pad"
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder="76.5"
              />
            </View>
            <View className="justify-end">
              <Button label={t("common.save")} onPress={handleLogWeight} loading={saving} />
            </View>
          </View>
        </Card>

        <Card className="gap-2">
          {[...weighed].reverse().slice(0, 10).map((metric) => (
            <View key={metric.id} className="flex-row justify-between border-b border-border py-2 last:border-b-0">
              <Text className="text-sm text-muted">{metric.recorded_at}</Text>
              <Text className="text-sm font-medium text-foreground">{metric.weight_kg} kg</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
