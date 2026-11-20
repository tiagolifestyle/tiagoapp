import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getLevel, type ClientSex, type RecordRow } from "@tiagolifestyle/shared";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { LEVEL_IMAGES } from "@/components/levelImages";

const GENDERS: ClientSex[] = ["male", "female"];

export default function RecordsScreen() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gender, setGender] = useState<ClientSex>("male");

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.rpc("get_records");
    setRecords((data ?? []) as RecordRow[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Abre no separador do sexo do próprio cliente (se o coach o tiver preenchido).
  useEffect(() => {
    if (!profile) return;
    supabase
      .from("clients")
      .select("sex")
      .eq("id", profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.sex === "female" || data?.sex === "male") setGender(data.sex);
      });
  }, [profile]);

  const visible = records.filter((record) => record.gender === gender);
  const formatWeight = (value: number) => `${Number(value).toLocaleString(i18n.language)} kg`;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerClassName="gap-4 pb-10"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} tintColor="#C9A227" />}
      >
        <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />
        <Text className="text-2xl font-semibold text-foreground">🏆 {t("records.title")}</Text>

        <Card className="flex-row gap-3 border-accent-muted bg-surface-elevated">
          <Ionicons name="videocam-outline" size={20} color="#C9A227" />
          <Text className="flex-1 text-sm text-foreground">{t("records.requirements")}</Text>
        </Card>

        <View className="flex-row gap-3">
          {GENDERS.map((key) => (
            <Pressable
              key={key}
              onPress={() => setGender(key)}
              className={`flex-1 items-center rounded-2xl border px-4 py-3 ${
                gender === key ? "border-accent bg-surface-elevated" : "border-border"
              }`}
            >
              <Text className={gender === key ? "font-semibold text-accent" : "text-foreground"}>
                {t(`records.${key}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {visible.length === 0 && !isLoading ? (
          <Text className="text-sm text-muted">{t("records.empty")}</Text>
        ) : (
          visible.map((record) => {
            const hasRecord = record.weight_kg != null && (record.holder_name || record.holder_hidden);
            const level = record.holder_points != null ? getLevel(record.holder_points).current : null;
            return (
              <Card key={record.id} className="gap-3 bg-surface-elevated">
                <View className="flex-row items-center gap-3">
                  {record.image_url ? (
                    <Image
                      source={{ uri: record.image_url }}
                      className="rounded-2xl bg-white"
                      style={{ width: 56, height: 56 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <View className="h-14 w-14 items-center justify-center rounded-2xl bg-surface">
                      <Ionicons name="barbell-outline" size={22} color="#9A9AA5" />
                    </View>
                  )}
                  <Text className="flex-1 text-base font-semibold text-foreground">{record.exercise_name}</Text>
                </View>

                {hasRecord ? (
                  <View className="flex-row items-center gap-3 rounded-2xl border border-accent bg-surface px-4 py-3">
                    <Text className="text-xl">🥇</Text>
                    {level ? (
                      <Image source={LEVEL_IMAGES[level.key]} style={{ width: 28, height: 28 }} resizeMode="contain" />
                    ) : null}
                    <Text className="flex-1 text-base font-semibold text-foreground">
                      {record.holder_hidden ? t("records.anonymous") : record.holder_name}
                    </Text>
                    <Text className="text-lg font-bold text-accent">{formatWeight(record.weight_kg as number)}</Text>
                  </View>
                ) : (
                  <Text className="text-sm text-muted">{t("records.noRecord")}</Text>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
