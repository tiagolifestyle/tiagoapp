import { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";
import { useNutritionPlan } from "@/hooks/useNutritionPlan";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

// Cores das categorias, pela ordem em que o coach as escreve (proteína, hidratos, gorduras, verduras, fruta, outros).
const CATEGORY_COLORS = ["#3B82F6", "#FBBF24", "#3FAE6E", "#22C55E", "#F97316", "#C9A227"];

// A quantidade pode vir depois de " - " ou " — ", e fica alinhada à direita.
function splitItem(line: string): [string, string | null] {
  const match = line.match(/^(.*?)\s+[-–—]\s+(.+)$/);
  return match ? [match[1], match[2]] : [line, null];
}

export default function ShoppingListScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { plan, isLoading, refresh } = useNutritionPlan(profile?.id);
  const [checked, setChecked] = useState<string[]>([]);

  // Os artigos riscados ficam guardados só neste telemóvel, por plano.
  const storageKey = plan ? `shopping-checked:${plan.id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.getItem(storageKey)
      .then((saved) => setChecked(saved ? (JSON.parse(saved) as string[]) : []))
      .catch(() => setChecked([]));
  }, [storageKey]);

  function updateChecked(next: string[]) {
    setChecked(next);
    if (storageKey) AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
  }

  function toggle(key: string) {
    updateChecked(checked.includes(key) ? checked.filter((k) => k !== key) : [...checked, key]);
  }

  const categories = (plan?.shopping_list ?? []).filter((category) => category.items.length > 0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#C9A227" />}
      >
        <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />
        <View className="flex-row items-end justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-2xl font-semibold text-foreground">{t("shopping.title")}</Text>
            <Text className="text-sm text-muted">{t("shopping.hint")}</Text>
          </View>
          {checked.length > 0 && (
            <Pressable
              onPress={() => updateChecked([])}
              className="flex-row items-center gap-1.5 rounded-full border border-border px-3 py-1.5"
            >
              <Ionicons name="refresh" size={14} color="#C9A227" />
              <Text className="text-xs font-semibold text-accent">{t("shopping.clear")}</Text>
            </Pressable>
          )}
        </View>

        {categories.length === 0 && !isLoading && <Text className="text-base text-muted">—</Text>}

        {categories.map((category, categoryIndex) => {
          const color = CATEGORY_COLORS[categoryIndex % CATEGORY_COLORS.length];
          return (
            <Card key={`${category.category}-${categoryIndex}`} className="gap-1">
              <View className="mb-2 flex-row items-center gap-2">
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <Text className="text-base font-semibold" style={{ color }}>
                  {category.category}
                </Text>
              </View>
              {category.items.map((line, itemIndex) => {
                const key = `${category.category}|${line}`;
                const isChecked = checked.includes(key);
                const [name, quantity] = splitItem(line);
                return (
                  <Pressable
                    key={`${line}-${itemIndex}`}
                    onPress={() => toggle(key)}
                    className="flex-row items-center gap-3 py-2 active:opacity-70"
                  >
                    <Ionicons
                      name={isChecked ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={isChecked ? "#3FAE6E" : "#6B6B76"}
                    />
                    <Text className={`flex-1 text-sm ${isChecked ? "text-muted line-through" : "text-foreground"}`}>
                      {name}
                    </Text>
                    {quantity ? (
                      <Text className={`text-sm font-bold ${isChecked ? "text-muted line-through" : "text-accent"}`}>
                        {quantity}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
