import { useEffect, useState } from "react";
import { View, Text, Image, TextInput, Pressable, Modal, ScrollView, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { PlanExercise } from "@/hooks/useWorkoutPlan";

interface ExerciseRowProps {
  item: PlanExercise;
  index: number;
  load: string;
  onSaveLoad: (value: string) => void;
}

export function ExerciseRow({ item, index, load, onSaveLoad }: ExerciseRowProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(load);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const hasDetails =
    item.exercise.video_url || item.exercise.instructions || item.exercise.common_mistakes || item.exercise.tips;

  useEffect(() => {
    setDraft(load);
  }, [load]);

  function handleBlur() {
    if (draft !== load) onSaveLoad(draft);
  }

  return (
    <View className="flex-row gap-3 border-b border-border py-4 last:border-b-0">
      {item.exercise.image_url ? (
        <Pressable onPress={() => setImageExpanded(true)}>
          <Image source={{ uri: item.exercise.image_url }} className="h-14 w-14 rounded-xl bg-surface-elevated" />
        </Pressable>
      ) : (
        <View className="h-14 w-14 items-center justify-center rounded-xl bg-surface-elevated">
          <Ionicons name="barbell-outline" size={22} color="#6B6B76" />
        </View>
      )}

      {item.exercise.image_url && (
        <Modal visible={imageExpanded} transparent animationType="fade" onRequestClose={() => setImageExpanded(false)}>
          <Pressable
            className="flex-1 items-center justify-center bg-black/90 p-6"
            onPress={() => setImageExpanded(false)}
          >
            <Image
              source={{ uri: item.exercise.image_url }}
              className="h-full w-full"
              resizeMode="contain"
            />
          </Pressable>
        </Modal>
      )}

      <View className="flex-1 gap-1">
        <Pressable onPress={() => setDetailsOpen(true)}>
          <Text className="text-base font-medium text-foreground">
            {index + 1}. {item.exercise.name}
          </Text>
        </Pressable>

        <Modal visible={detailsOpen} transparent animationType="fade" onRequestClose={() => setDetailsOpen(false)}>
          <Pressable className="flex-1 justify-end bg-black/70" onPress={() => setDetailsOpen(false)}>
            <Pressable className="max-h-[80%] rounded-t-3xl bg-surface p-5" onPress={() => {}}>
              <ScrollView contentContainerClassName="gap-4 pb-6">
                <Text className="text-lg font-semibold text-foreground">{item.exercise.name}</Text>

                {item.exercise.video_url ? (
                  <Pressable
                    onPress={() => Linking.openURL(item.exercise.video_url!)}
                    className="flex-row items-center gap-2 self-start rounded-full border border-accent px-4 py-2"
                  >
                    <Ionicons name="play-circle-outline" size={18} color="#C9A227" />
                    <Text className="text-sm font-semibold text-accent">{t("workout.watchVideo")}</Text>
                  </Pressable>
                ) : null}

                {item.exercise.instructions ? (
                  <View className="gap-1">
                    <Text className="text-sm font-semibold text-accent">{t("workout.instructions")}</Text>
                    <Text className="text-sm text-foreground">{item.exercise.instructions}</Text>
                  </View>
                ) : null}

                {item.exercise.common_mistakes ? (
                  <View className="gap-1">
                    <Text className="text-sm font-semibold text-accent">{t("workout.commonMistakes")}</Text>
                    <Text className="text-sm text-foreground">{item.exercise.common_mistakes}</Text>
                  </View>
                ) : null}

                {item.exercise.tips ? (
                  <View className="gap-1">
                    <Text className="text-sm font-semibold text-accent">{t("workout.tips")}</Text>
                    <Text className="text-sm text-foreground">{item.exercise.tips}</Text>
                  </View>
                ) : null}

                {!hasDetails ? <Text className="text-sm text-muted">{t("workout.noDetails")}</Text> : null}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
        <Text className="text-sm text-muted">
          <Text className="text-foreground">{item.sets} </Text>
          <Text className="font-semibold text-accent">{t("workout.sets")}</Text>
          <Text> · </Text>
          <Text className="text-foreground">{item.reps} </Text>
          <Text className="font-semibold text-accent">{t("workout.reps")}</Text>
          {item.rest_seconds ? (
            <>
              <Text> · </Text>
              <Text className="text-foreground">{item.rest_seconds}s </Text>
              <Text className="font-semibold text-accent">{t("workout.rest")}</Text>
            </>
          ) : null}
          {item.rir ? (
            <>
              <Text> · </Text>
              <Text className="font-semibold text-accent">RIR </Text>
              <Text className="text-foreground">{item.rir}</Text>
            </>
          ) : null}
          {item.tempo ? (
            <>
              <Text> · </Text>
              <Text className="font-semibold text-accent">{t("workout.tempo")} </Text>
              <Text className="text-foreground">{item.tempo}</Text>
            </>
          ) : null}
        </Text>
        {item.notes ? (
          <View className="mt-1 rounded-lg border border-accent-muted bg-surface-elevated px-3 py-2">
            <Text className="text-sm italic text-accent">&quot;{item.notes}&quot;</Text>
          </View>
        ) : null}

        <View className="mt-2 flex-row items-center gap-2">
          <Text className="text-sm text-muted">{t("workout.load")}:</Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onBlur={handleBlur}
            keyboardType="numeric"
            placeholder="—"
            placeholderTextColor="#6B6B76"
            className="w-16 rounded-lg border border-border bg-surface-elevated px-2 py-1 text-center text-sm text-foreground"
          />
          <Text className="text-sm text-muted">kg</Text>
        </View>
      </View>
    </View>
  );
}
