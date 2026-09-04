import { useMemo, useState } from "react";
import { View, Text, ScrollView, RefreshControl, Dimensions, Pressable, Image, Modal } from "react-native";
import { LineChart } from "react-native-chart-kit";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PhotoAngle } from "@tiagolifestyle/shared";
import { useAuth } from "@/context/AuthContext";
import { useProgress, type ProgressPhotoWithUrl } from "@/hooks/useProgress";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";

const screenWidth = Dimensions.get("window").width;

type ProgressTabKey = "weight" | "photo" | "measurements";

const MEASUREMENT_FIELDS: { key: string; labelKey: string }[] = [
  { key: "waist", labelKey: "progress.waist" },
  { key: "abdomen", labelKey: "progress.abdomen" },
  { key: "arm", labelKey: "progress.arm" },
  { key: "legs", labelKey: "progress.legs" },
  { key: "diastasis", labelKey: "progress.diastasis" },
];

export default function ProgressScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { metrics, photos, isLoading, refresh, logWeight, logMeasurements, uploadPhoto } = useProgress(profile?.id);
  const [activeTab, setActiveTab] = useState<ProgressTabKey>("weight");

  const [weightInput, setWeightInput] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);

  const [selectedAngle, setSelectedAngle] = useState<PhotoAngle>("front");
  const [uploading, setUploading] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<ProgressPhotoWithUrl | null>(null);

  const [measurementInputs, setMeasurementInputs] = useState<Record<string, string>>({});
  const [savingMeasurements, setSavingMeasurements] = useState(false);

  const weighed = metrics.filter((metric) => metric.weight_kg != null);
  const measured = [...metrics].reverse().filter((metric) => Object.keys(metric.measurements ?? {}).length > 0);

  const photosByDate = useMemo(() => {
    const groups: { date: string; items: ProgressPhotoWithUrl[] }[] = [];
    for (const photo of photos) {
      const group = groups.find((g) => g.date === photo.taken_at);
      if (group) group.items.push(photo);
      else groups.push({ date: photo.taken_at, items: [photo] });
    }
    return groups;
  }, [photos]);

  const tabs: { key: ProgressTabKey; label: string }[] = [
    { key: "weight", label: t("progress.tabWeight") },
    { key: "photo", label: t("progress.tabPhoto") },
    { key: "measurements", label: t("progress.tabMeasurements") },
  ];

  const angles: { key: PhotoAngle; labelKey: string }[] = [
    { key: "front", labelKey: "progress.angleFront" },
    { key: "side", labelKey: "progress.angleSide" },
    { key: "back", labelKey: "progress.angleBack" },
  ];

  async function handleLogWeight() {
    const value = Number(weightInput.replace(",", "."));
    if (!value || Number.isNaN(value)) return;
    setSavingWeight(true);
    await logWeight(value);
    setWeightInput("");
    setSavingWeight(false);
  }

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    await uploadPhoto(selectedAngle, result.assets[0].uri);
    setUploading(false);
  }

  async function handleSaveMeasurements() {
    const values: Record<string, number> = {};
    for (const field of MEASUREMENT_FIELDS) {
      const raw = measurementInputs[field.key];
      const value = raw ? Number(raw.replace(",", ".")) : NaN;
      if (!Number.isNaN(value)) values[field.key] = value;
    }
    if (Object.keys(values).length === 0) return;

    setSavingMeasurements(true);
    await logMeasurements(values);
    setMeasurementInputs({});
    setSavingMeasurements(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor="#C9A227" />}
      >
        <Text className="mt-4 text-2xl font-semibold text-foreground">{t("dashboard.progress")}</Text>

        <View className="flex-row gap-2">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-1 items-center rounded-full border px-3 py-2 ${
                  isSelected ? "border-accent bg-surface-elevated" : "border-border"
                }`}
              >
                <Text className={`text-sm font-semibold ${isSelected ? "text-accent" : "text-muted"}`}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "weight" && (
          <>
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
                  <Button label={t("common.save")} onPress={handleLogWeight} loading={savingWeight} />
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
          </>
        )}

        {activeTab === "photo" && (
          <>
            <Card className="gap-3">
              <Text className="text-base font-medium text-foreground">{t("progress.addPhoto")}</Text>
              <View className="flex-row gap-2">
                {angles.map((angle) => {
                  const isSelected = selectedAngle === angle.key;
                  return (
                    <Pressable
                      key={angle.key}
                      onPress={() => setSelectedAngle(angle.key)}
                      className={`flex-1 items-center rounded-full border px-3 py-2 ${
                        isSelected ? "border-accent bg-surface-elevated" : "border-border"
                      }`}
                    >
                      <Text className={`text-xs font-semibold ${isSelected ? "text-accent" : "text-muted"}`}>
                        {t(angle.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Button label={t("progress.addPhoto")} onPress={handlePickPhoto} loading={uploading} />
            </Card>

            {photosByDate.length === 0 ? (
              <Text className="text-sm text-muted">{t("progress.noPhotos")}</Text>
            ) : (
              photosByDate.map((group) => (
                <Card key={group.date} className="gap-3">
                  <Text className="text-sm font-medium text-muted">{group.date}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {group.items.map((photo) => (
                      <Pressable key={photo.id} onPress={() => setExpandedPhoto(photo)}>
                        {photo.signedUrl ? (
                          <Image source={{ uri: photo.signedUrl }} className="h-24 w-24 rounded-xl bg-surface-elevated" />
                        ) : (
                          <View className="h-24 w-24 rounded-xl bg-surface-elevated" />
                        )}
                      </Pressable>
                    ))}
                  </View>
                </Card>
              ))
            )}

            <Modal visible={!!expandedPhoto} transparent animationType="fade" onRequestClose={() => setExpandedPhoto(null)}>
              <Pressable className="flex-1 items-center justify-center bg-black/90 p-6" onPress={() => setExpandedPhoto(null)}>
                {expandedPhoto?.signedUrl && (
                  <Image source={{ uri: expandedPhoto.signedUrl }} className="h-full w-full" resizeMode="contain" />
                )}
              </Pressable>
            </Modal>
          </>
        )}

        {activeTab === "measurements" && (
          <>
            <Card className="gap-3">
              <Text className="text-base font-medium text-foreground">{t("progress.tabMeasurements")}</Text>
              {MEASUREMENT_FIELDS.map((field) => (
                <View key={field.key} className="flex-row items-center gap-3">
                  <Text className="w-32 text-sm text-muted">{t(field.labelKey)}</Text>
                  <View className="flex-1">
                    <TextField
                      label="cm"
                      keyboardType="decimal-pad"
                      value={measurementInputs[field.key] ?? ""}
                      onChangeText={(value) => setMeasurementInputs((prev) => ({ ...prev, [field.key]: value }))}
                      placeholder="0"
                    />
                  </View>
                </View>
              ))}
              <Button label={t("common.save")} onPress={handleSaveMeasurements} loading={savingMeasurements} />
            </Card>

            {measured.length === 0 ? (
              <Text className="text-sm text-muted">{t("progress.noMeasurements")}</Text>
            ) : (
              measured.map((metric) => (
                <Card key={metric.id} className="gap-2">
                  <Text className="text-sm font-medium text-muted">{metric.recorded_at}</Text>
                  {MEASUREMENT_FIELDS.filter((field) => metric.measurements[field.key] != null).map((field) => (
                    <View key={field.key} className="flex-row justify-between">
                      <Text className="text-sm text-foreground">{t(field.labelKey)}</Text>
                      <Text className="text-sm font-medium text-foreground">{metric.measurements[field.key]} cm</Text>
                    </View>
                  ))}
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
