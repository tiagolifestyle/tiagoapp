import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useWorkoutPlan } from "@/hooks/useWorkoutPlan";
import { Card } from "@/components/Card";
import { ExerciseRow } from "@/components/ExerciseRow";

export default function WorkoutScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { plan, isLoading, refresh } = useWorkoutPlan(profile?.id);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#C9A227" />}
      >
        <View className="mt-4 mb-1 flex-row items-center justify-between">
          <Text className="text-2xl font-semibold text-foreground">{plan?.name ?? t("dashboard.todayWorkout")}</Text>
          {plan ? <Text className="text-sm text-muted">{t("workout.planVersion", { version: plan.version })}</Text> : null}
        </View>

        {!plan && !isLoading && <Text className="text-base text-muted">{t("dashboard.noWorkoutToday")}</Text>}

        {plan?.days.map((day) => (
          <Card key={day.id} className="gap-1">
            <Text className="mb-2 text-lg font-semibold text-foreground">{day.name}</Text>
            {day.exercises.map((exercise, index) => (
              <ExerciseRow key={exercise.id} item={exercise} index={index} />
            ))}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
