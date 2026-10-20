import { useState } from "react";
import { View, Text, ScrollView, RefreshControl, Image, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { SpecialDish, SpecialDishCategory } from "@tiagolifestyle/shared";
import { useAuth } from "@/context/AuthContext";
import { useSpecialDishes, requestDish } from "@/hooks/useSpecialDishes";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatTile } from "@/components/StatTile";

const CATEGORIES: SpecialDishCategory[] = ["breakfast", "lunch_dinner", "snack", "dessert"];

type LocalizedField = "name" | "ingredients" | "preparation" | "notes";

function pickLocalized(dish: SpecialDish, field: LocalizedField, locale: string): string {
  for (const loc of [locale, "pt", "es", "en"]) {
    const value = dish[`${field}_${loc}` as keyof SpecialDish] as string | null;
    if (value) return value;
  }
  return "";
}

function formatNumber(value: number | null) {
  return value == null ? "—" : `${Number(value)}`;
}

// Cada linha de ingredientes pode ter a quantidade depois de " - " ou " — ", que fica alinhada à direita.
function splitIngredient(line: string): [string, string | null] {
  const match = line.match(/^(.*?)\s+[-–—]\s+(.+)$/);
  return match ? [match[1], match[2]] : [line, null];
}

function DishDetail({ dish, onBack }: { dish: SpecialDish; onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"sent" | "error" | null>(null);

  const name = pickLocalized(dish, "name", i18n.language);
  const ingredients = pickLocalized(dish, "ingredients", i18n.language)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const preparation = pickLocalized(dish, "preparation", i18n.language);
  const notes = pickLocalized(dish, "notes", i18n.language);

  async function handleWant() {
    if (!profile) return;
    setSending(true);
    const ok = await requestDish(profile.id, t("dishes.wantMessage", { name }));
    setStatus(ok ? "sent" : "error");
    setSending(false);
  }

  return (
    <>
      <Button label={t("common.back")} variant="ghost" onPress={onBack} />
      {dish.image_url ? (
        <Image source={{ uri: dish.image_url }} className="h-56 w-full rounded-3xl bg-surface-elevated" resizeMode="cover" />
      ) : null}
      <Text className="text-2xl font-semibold text-foreground">{name}</Text>

      <View className="flex-row gap-3">
        <StatTile label={t("nutrition.calories")} value={formatNumber(dish.calories)} accentColor="#F97316" />
        <StatTile label={t("nutrition.protein")} value={`${formatNumber(dish.protein_g)}g`} accentColor="#3B82F6" />
      </View>
      <View className="flex-row gap-3">
        <StatTile label={t("nutrition.carbs")} value={`${formatNumber(dish.carbs_g)}g`} accentColor="#FBBF24" />
        <StatTile label={t("nutrition.fat")} value={`${formatNumber(dish.fat_g)}g`} accentColor="#3FAE6E" />
      </View>

      {notes ? (
        <Card className="flex-row gap-3 border-warning">
          <Ionicons name="warning-outline" size={20} color="#D9A441" />
          <View className="flex-1 gap-1">
            <Text className="text-sm font-semibold text-warning">{t("dishes.notes")}</Text>
            <Text className="text-sm text-foreground">{notes}</Text>
          </View>
        </Card>
      ) : null}

      {ingredients.length > 0 && (
        <Card className="gap-2.5">
          <Text className="text-base font-semibold text-foreground">{t("dishes.ingredients")}</Text>
          {ingredients.map((line, index) => {
            const [ingredient, quantity] = splitIngredient(line);
            return (
              <View key={index} className="flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-sm text-muted">{ingredient}</Text>
                {quantity ? <Text className="text-sm font-bold text-accent">{quantity}</Text> : null}
              </View>
            );
          })}
        </Card>
      )}

      {preparation ? (
        <Card className="gap-2">
          <Text className="text-base font-semibold text-foreground">{t("dishes.preparation")}</Text>
          <Text className="text-sm leading-6 text-muted">{preparation}</Text>
        </Card>
      ) : null}

      {status === "sent" ? (
        <View className="flex-row items-center justify-center gap-2 rounded-2xl border border-success px-5 py-4">
          <Ionicons name="checkmark-circle" size={18} color="#3FAE6E" />
          <Text className="text-sm font-semibold text-success">{t("dishes.wantSent")}</Text>
        </View>
      ) : (
        <Pressable
          onPress={handleWant}
          disabled={sending}
          className="items-center rounded-2xl bg-accent px-6 py-4 active:opacity-80"
        >
          {sending ? (
            <ActivityIndicator color="#0B0B0F" />
          ) : (
            <Text className="text-base font-semibold text-background">{t("dishes.want")}</Text>
          )}
        </Pressable>
      )}
      {status === "error" && <Text className="text-center text-sm text-danger">{t("dishes.wantError")}</Text>}
    </>
  );
}

export default function SpecialDishesScreen() {
  const { t, i18n } = useTranslation();
  const { dishes, isLoading, refresh } = useSpecialDishes();
  const [category, setCategory] = useState<SpecialDishCategory | null>(null);
  const [selected, setSelected] = useState<SpecialDish | null>(null);

  const visible = category ? dishes.filter((dish) => dish.category === category) : dishes;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#C9A227" />}
      >
        {selected ? (
          <DishDetail key={selected.id} dish={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />
            <View className="gap-1">
              <Text className="text-2xl font-semibold text-foreground">{t("dishes.title")}</Text>
              <Text className="text-sm text-muted">{t("dishes.subtitle")}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pb-1">
              {[null, ...CATEGORIES].map((key) => {
                const isSelected = category === key;
                return (
                  <Pressable
                    key={key ?? "all"}
                    onPress={() => setCategory(key)}
                    className={`rounded-full border px-4 py-2 ${isSelected ? "border-accent bg-surface-elevated" : "border-border"}`}
                  >
                    <Text className={`text-xs font-semibold ${isSelected ? "text-accent" : "text-muted"}`}>
                      {t(key ? `dishes.${key}` : "dishes.all")}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {visible.length === 0 && !isLoading ? (
              <Text className="text-sm text-muted">{t("dishes.empty")}</Text>
            ) : (
              visible.map((dish) => (
                <Pressable key={dish.id} onPress={() => setSelected(dish)} className="active:opacity-80">
                  <Card className="overflow-hidden p-0">
                    {dish.image_url ? (
                      <Image source={{ uri: dish.image_url }} className="h-44 w-full bg-surface-elevated" resizeMode="cover" />
                    ) : (
                      <View className="h-24 w-full items-center justify-center bg-surface-elevated">
                        <Ionicons name="restaurant-outline" size={28} color="#6B6B76" />
                      </View>
                    )}
                    <View className="gap-1 p-4">
                      <View className="flex-row items-center gap-2">
                        <Text className="flex-1 text-base font-semibold text-foreground">
                          {pickLocalized(dish, "name", i18n.language)}
                        </Text>
                        {pickLocalized(dish, "notes", i18n.language) ? (
                          <Ionicons name="warning" size={16} color="#D9A441" />
                        ) : null}
                      </View>
                      <Text className="text-xs text-muted">
                        {t(`dishes.${dish.category}`)} · {formatNumber(dish.calories)} kcal
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
