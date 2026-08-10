import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { PlanExercise } from "@/hooks/useWorkoutPlan";

export function ExerciseRow({ item, index }: { item: PlanExercise; index: number }) {
  const { t } = useTranslation();

  return (
    <View className="flex-row gap-3 border-b border-border py-4 last:border-b-0">
      {item.exercise.image_url ? (
        <Image source={{ uri: item.exercise.image_url }} className="h-14 w-14 rounded-xl bg-surface-elevated" />
      ) : (
        <View className="h-14 w-14 items-center justify-center rounded-xl bg-surface-elevated">
          <Ionicons name="barbell-outline" size={22} color="#6B6B76" />
        </View>
      )}

      <View className="flex-1 gap-1">
        <Text className="text-base font-medium text-foreground">
          {index + 1}. {item.exercise.name}
        </Text>
        <Text className="text-sm text-muted">
          {item.sets} {t("workout.sets")} · {item.reps} {t("workout.reps")}
          {item.rest_seconds ? ` · ${item.rest_seconds}s ${t("workout.rest")}` : ""}
          {item.rir ? ` · RIR ${item.rir}` : ""}
        </Text>
        {item.notes ? <Text className="text-sm italic text-muted">&quot;{item.notes}&quot;</Text> : null}
      </View>
    </View>
  );
}
