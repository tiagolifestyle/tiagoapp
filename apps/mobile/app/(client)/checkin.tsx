import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Checkin } from "@tiagolifestyle/shared";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

function currentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function RatingRow({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <View className="flex-row gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          className={`h-10 w-10 items-center justify-center rounded-full border ${
            value === n ? "border-accent bg-accent" : "border-border"
          }`}
        >
          <Text className={`text-sm font-semibold ${value === n ? "text-background" : "text-foreground"}`}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function CheckinScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<Checkin | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [feeling, setFeeling] = useState("");
  const [workoutsCompleted, setWorkoutsCompleted] = useState("");
  const [nutritionRating, setNutritionRating] = useState(0);
  const [sleepRating, setSleepRating] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(0);
  const [difficulties, setDifficulties] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("checkins")
      .select("*")
      .eq("client_id", profile.id)
      .eq("week_start", currentWeekStart())
      .maybeSingle()
      .then(({ data }) => {
        setExisting((data as Checkin | null) ?? null);
        setLoading(false);
      });
  }, [profile]);

  async function handleSubmit() {
    if (!profile) return;
    setSubmitting(true);
    await supabase.from("checkins").upsert(
      {
        client_id: profile.id,
        week_start: currentWeekStart(),
        answers: {
          feeling: feeling || undefined,
          workouts_completed: workoutsCompleted ? Number(workoutsCompleted) : undefined,
          nutrition_rating: nutritionRating || undefined,
          sleep_rating: sleepRating || undefined,
          energy_level: energyLevel || undefined,
          difficulties: difficulties || undefined,
          observations: observations || undefined,
        },
        status: "pending",
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "client_id,week_start" }
    );
    setSubmitting(false);
    router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-10">
        <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />
        <Text className="text-2xl font-semibold text-foreground">{t("checkin.title")}</Text>

        {!loading && existing ? (
          <Card className="gap-2">
            <Text className="text-base text-foreground">{t("checkin.alreadySubmitted")}</Text>
            {existing.coach_response ? (
              <View className="mt-2 rounded-xl border border-accent-muted bg-surface-elevated p-3">
                <Text className="text-sm text-muted">{t("checkin.coachResponse")}</Text>
                <Text className="mt-1 text-sm text-foreground">{existing.coach_response}</Text>
              </View>
            ) : null}
          </Card>
        ) : null}

        {!loading && !existing ? (
          <>
            <Text className="text-base text-muted">{t("checkin.subtitle")}</Text>

            <Card className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("checkin.feeling")}</Text>
              <TextInput
                value={feeling}
                onChangeText={setFeeling}
                placeholder={t("checkin.feelingPlaceholder")}
                placeholderTextColor="#6B6B76"
                className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-base text-foreground"
              />
            </Card>

            <Card className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("checkin.workoutsCompleted")}</Text>
              <TextInput
                value={workoutsCompleted}
                onChangeText={setWorkoutsCompleted}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#6B6B76"
                className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-base text-foreground"
              />
            </Card>

            <Card className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("checkin.nutritionRating")}</Text>
              <RatingRow value={nutritionRating} onChange={setNutritionRating} />
            </Card>

            <Card className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("checkin.sleepRating")}</Text>
              <RatingRow value={sleepRating} onChange={setSleepRating} />
            </Card>

            <Card className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("checkin.energyLevel")}</Text>
              <RatingRow value={energyLevel} onChange={setEnergyLevel} />
            </Card>

            <Card className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("checkin.difficulties")}</Text>
              <TextInput
                value={difficulties}
                onChangeText={setDifficulties}
                multiline
                numberOfLines={3}
                placeholderTextColor="#6B6B76"
                className="min-h-20 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-base text-foreground"
              />
            </Card>

            <Card className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("checkin.observations")}</Text>
              <TextInput
                value={observations}
                onChangeText={setObservations}
                multiline
                numberOfLines={3}
                placeholderTextColor="#6B6B76"
                className="min-h-20 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-base text-foreground"
              />
            </Card>

            <Button label={t("checkin.submit")} onPress={handleSubmit} loading={submitting} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
