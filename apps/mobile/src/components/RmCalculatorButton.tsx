import { useState } from "react";
import { View, Text, Modal, Pressable, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";

const RM_TABLE = [
  { pct: 100, reps: 1 },
  { pct: 95, reps: 2 },
  { pct: 90, reps: 4 },
  { pct: 85, reps: 6 },
  { pct: 80, reps: 8 },
  { pct: 75, reps: 10 },
  { pct: 70, reps: 12 },
  { pct: 65, reps: 16 },
];

export function RmCalculatorButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [oneRepMax, setOneRepMax] = useState<number | null>(null);

  function handleCalculate() {
    const weightValue = Number(weight.replace(",", "."));
    const repsValue = Number(reps);
    if (!weightValue || !repsValue) return;
    setOneRepMax(weightValue * (1 + repsValue / 30));
  }

  function handleClose() {
    setOpen(false);
    setWeight("");
    setReps("");
    setOneRepMax(null);
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="h-8 w-8 items-center justify-center rounded-full border border-accent bg-surface-elevated"
      >
        <Ionicons name="calculator-outline" size={16} color="#C9A227" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={handleClose}>
        <Pressable className="flex-1 justify-end bg-black/70" onPress={handleClose}>
          <Pressable className="max-h-[85%] rounded-t-3xl bg-surface p-5" onPress={() => {}}>
            <ScrollView contentContainerClassName="gap-4 pb-6">
              <Text className="text-lg font-semibold text-foreground">{t("rmCalculator.title")}</Text>

              <View className="gap-2">
                <Text className="text-sm font-medium text-muted">{t("rmCalculator.weightLifted")}</Text>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#6B6B76"
                    className="flex-1 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-base text-foreground"
                  />
                  <Text className="text-sm text-muted">kg</Text>
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium text-muted">{t("rmCalculator.reps")}</Text>
                <TextInput
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#6B6B76"
                  className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-base text-foreground"
                />
              </View>

              <Button label={t("rmCalculator.calculate")} onPress={handleCalculate} />

              {oneRepMax != null ? (
                <View className="gap-3 border-t border-border pt-4">
                  <Text className="text-base font-semibold text-foreground">
                    {t("rmCalculator.result", { value: oneRepMax.toFixed(1) })}
                  </Text>

                  <View className="flex-row border-b border-border pb-2">
                    <Text className="flex-1 text-xs font-semibold uppercase text-muted">{t("rmCalculator.percentage")}</Text>
                    <Text className="flex-1 text-xs font-semibold uppercase text-muted">{t("rmCalculator.weightLifted")}</Text>
                    <Text className="flex-1 text-xs font-semibold uppercase text-muted">{t("rmCalculator.reps")}</Text>
                  </View>
                  {RM_TABLE.map((row) => (
                    <View key={row.pct} className="flex-row py-1">
                      <Text className="flex-1 text-sm text-foreground">{row.pct}%</Text>
                      <Text className="flex-1 text-sm text-foreground">{((oneRepMax * row.pct) / 100).toFixed(1)} kg</Text>
                      <Text className="flex-1 text-sm text-foreground">{row.reps}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
