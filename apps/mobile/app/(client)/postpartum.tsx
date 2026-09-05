import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BabySex, DeliveryType } from "@tiagolifestyle/shared";
import { useAuth } from "@/context/AuthContext";
import { usePostpartum } from "@/hooks/usePostpartum";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";

const screenWidth = Dimensions.get("window").width;

const BABY_SEX_COLORS: Record<BabySex, string> = {
  boy: "#60A5FA",
  girl: "#F472B6",
  twins: "#3FAE6E",
};

type PostpartumTabKey = "birth" | "pelvicFloor" | "diastasis";

function Pill({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-full border px-3 py-2 ${
        selected ? "border-accent bg-surface-elevated" : "border-border"
      }`}
    >
      <Text className={`text-sm font-semibold ${selected ? "text-accent" : "text-muted"}`}>{label}</Text>
    </Pressable>
  );
}

function YesNoPills({ value, onChange, yesLabel, noLabel }: { value: boolean | null; onChange: (value: boolean) => void; yesLabel: string; noLabel: string }) {
  return (
    <View className="flex-row gap-2">
      <Pill selected={value === true} label={yesLabel} onPress={() => onChange(true)} />
      <Pill selected={value === false} label={noLabel} onPress={() => onChange(false)} />
    </View>
  );
}

export default function PostpartumScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { profile: pp, pelvicFloor, diastasis, saveProfile, addPelvicFloorAssessment, addDiastasisAssessment } =
    usePostpartum(profile?.id);
  const [activeTab, setActiveTab] = useState<PostpartumTabKey>("birth");

  const [birthDate, setBirthDate] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType | null>(null);
  const [gestationalWeeks, setGestationalWeeks] = useState("");
  const [firstChild, setFirstChild] = useState<boolean | null>(null);
  const [babySex, setBabySex] = useState<BabySex | null>(null);
  const [breastfeeding, setBreastfeeding] = useState<boolean | null>(null);
  const [complications, setComplications] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!pp) return;
    setBirthDate(pp.birth_date ?? "");
    setDeliveryType(pp.delivery_type);
    setGestationalWeeks(pp.gestational_weeks != null ? String(pp.gestational_weeks) : "");
    setFirstChild(pp.first_child);
    setBabySex(pp.baby_sex);
    setBreastfeeding(pp.breastfeeding);
    setComplications(pp.complications ?? "");
  }, [pp]);

  const [stressIncontinence, setStressIncontinence] = useState<boolean | null>(null);
  const [urgencyIncontinence, setUrgencyIncontinence] = useState<boolean | null>(null);
  const [pelvicPain, setPelvicPain] = useState<boolean | null>(null);
  const [pelvicNotes, setPelvicNotes] = useState("");
  const [savingPelvic, setSavingPelvic] = useState(false);

  const [supraumbilical, setSupraumbilical] = useState("");
  const [umbilical, setUmbilical] = useState("");
  const [infraumbilical, setInfraumbilical] = useState("");
  const [diastasisNotes, setDiastasisNotes] = useState("");
  const [savingDiastasis, setSavingDiastasis] = useState(false);

  const tabs: { key: PostpartumTabKey; label: string }[] = [
    { key: "birth", label: t("postpartum.tabBirth") },
    { key: "pelvicFloor", label: t("postpartum.tabPelvicFloor") },
    { key: "diastasis", label: t("postpartum.tabDiastasis") },
  ];

  const weeksPostpartum = useMemo(() => {
    if (!pp?.birth_date) return null;
    const birth = new Date(pp.birth_date);
    const diffMs = Date.now() - birth.getTime();
    if (diffMs < 0) return null;
    return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  }, [pp?.birth_date]);

  const diastasisChartData = useMemo(() => [...diastasis].reverse().slice(-6), [diastasis]);

  async function handleSaveProfile() {
    setSavingProfile(true);
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(birthDate);
    await saveProfile({
      birth_date: isValidDate ? birthDate : null,
      delivery_type: deliveryType,
      gestational_weeks: gestationalWeeks ? Number(gestationalWeeks) : null,
      first_child: firstChild,
      baby_sex: babySex,
      breastfeeding,
      complications: complications || null,
    });
    setSavingProfile(false);
  }

  async function handleSavePelvicFloor() {
    setSavingPelvic(true);
    await addPelvicFloorAssessment({
      stress_incontinence: stressIncontinence ?? false,
      urgency_incontinence: urgencyIncontinence ?? false,
      pelvic_pain: pelvicPain ?? false,
      notes: pelvicNotes || null,
    });
    setPelvicNotes("");
    setSavingPelvic(false);
  }

  async function handleSaveDiastasis() {
    setSavingDiastasis(true);
    await addDiastasisAssessment({
      supraumbilical_cm: supraumbilical ? Number(supraumbilical.replace(",", ".")) : null,
      umbilical_cm: umbilical ? Number(umbilical.replace(",", ".")) : null,
      infraumbilical_cm: infraumbilical ? Number(infraumbilical.replace(",", ".")) : null,
      notes: diastasisNotes || null,
    });
    setSupraumbilical("");
    setUmbilical("");
    setInfraumbilical("");
    setDiastasisNotes("");
    setSavingDiastasis(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-10">
        <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-semibold text-foreground">{t("postpartum.tileLabel")}</Text>
          {weeksPostpartum != null ? (
            <View className="rounded-full border border-accent bg-surface-elevated px-3 py-1.5">
              <Text className="text-xs font-bold uppercase tracking-wide text-accent">
                {t("postpartum.weeksPostpartum", { count: weeksPostpartum })}
              </Text>
            </View>
          ) : null}
        </View>

        {pp?.baby_sex ? (
          <Text className="text-base font-medium" style={{ color: BABY_SEX_COLORS[pp.baby_sex] }}>
            {t(`postpartum.greeting${pp.baby_sex === "boy" ? "Boy" : pp.baby_sex === "girl" ? "Girl" : "Twins"}`)}
          </Text>
        ) : null}

        <View className="flex-row gap-2">
          {tabs.map((tab) => (
            <Pill key={tab.key} selected={activeTab === tab.key} label={tab.label} onPress={() => setActiveTab(tab.key)} />
          ))}
        </View>

        {activeTab === "birth" && (
          <Card className="gap-4">
            <View className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("postpartum.birthDate")}</Text>
              <TextInput
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder={t("postpartum.birthDatePlaceholder")}
                placeholderTextColor="#6B6B76"
                className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-base text-foreground"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("postpartum.deliveryType")}</Text>
              <View className="flex-row gap-2">
                <Pill selected={deliveryType === "vaginal"} label={t("postpartum.deliveryVaginal")} onPress={() => setDeliveryType("vaginal")} />
                <Pill selected={deliveryType === "cesarean"} label={t("postpartum.deliveryCesarean")} onPress={() => setDeliveryType("cesarean")} />
              </View>
            </View>

            <TextField
              label={t("postpartum.gestationalWeeks")}
              keyboardType="number-pad"
              value={gestationalWeeks}
              onChangeText={setGestationalWeeks}
              placeholder="40"
            />

            <View className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("postpartum.firstChild")}</Text>
              <YesNoPills value={firstChild} onChange={setFirstChild} yesLabel={t("postpartum.yes")} noLabel={t("postpartum.no")} />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("postpartum.babySex")}</Text>
              <View className="flex-row gap-2">
                <Pill selected={babySex === "boy"} label={t("postpartum.babyBoy")} onPress={() => setBabySex("boy")} />
                <Pill selected={babySex === "girl"} label={t("postpartum.babyGirl")} onPress={() => setBabySex("girl")} />
                <Pill selected={babySex === "twins"} label={t("postpartum.babyTwins")} onPress={() => setBabySex("twins")} />
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("postpartum.breastfeeding")}</Text>
              <YesNoPills value={breastfeeding} onChange={setBreastfeeding} yesLabel={t("postpartum.yes")} noLabel={t("postpartum.no")} />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium text-muted">{t("postpartum.complications")}</Text>
              <TextInput
                value={complications}
                onChangeText={setComplications}
                multiline
                numberOfLines={3}
                placeholderTextColor="#6B6B76"
                className="min-h-20 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-base text-foreground"
              />
            </View>

            <Button label={t("common.save")} onPress={handleSaveProfile} loading={savingProfile} />
          </Card>
        )}

        {activeTab === "pelvicFloor" && (
          <>
            <Card className="gap-4">
              <View className="gap-2">
                <Text className="text-sm font-medium text-muted">{t("postpartum.stressIncontinence")}</Text>
                <YesNoPills value={stressIncontinence} onChange={setStressIncontinence} yesLabel={t("postpartum.yes")} noLabel={t("postpartum.no")} />
              </View>
              <View className="gap-2">
                <Text className="text-sm font-medium text-muted">{t("postpartum.urgencyIncontinence")}</Text>
                <YesNoPills value={urgencyIncontinence} onChange={setUrgencyIncontinence} yesLabel={t("postpartum.yes")} noLabel={t("postpartum.no")} />
              </View>
              <View className="gap-2">
                <Text className="text-sm font-medium text-muted">{t("postpartum.pelvicPain")}</Text>
                <YesNoPills value={pelvicPain} onChange={setPelvicPain} yesLabel={t("postpartum.yes")} noLabel={t("postpartum.no")} />
              </View>
              <View className="gap-2">
                <Text className="text-sm font-medium text-muted">{t("postpartum.notes")}</Text>
                <TextInput
                  value={pelvicNotes}
                  onChangeText={setPelvicNotes}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor="#6B6B76"
                  className="min-h-16 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-base text-foreground"
                />
              </View>
              <Button label={t("common.save")} onPress={handleSavePelvicFloor} loading={savingPelvic} />
            </Card>

            {pelvicFloor.length === 0 ? (
              <Text className="text-sm text-muted">{t("postpartum.noPelvicFloorHistory")}</Text>
            ) : (
              pelvicFloor.map((entry) => (
                <Card key={entry.id} className="gap-2">
                  <Text className="text-sm font-medium text-muted">{entry.assessed_at}</Text>
                  <View className="flex-row flex-wrap gap-x-6 gap-y-1">
                    <Text className="text-sm text-foreground">
                      {t("postpartum.stressIncontinence")} <Text className="font-medium">{entry.stress_incontinence ? t("postpartum.yes") : t("postpartum.no")}</Text>
                    </Text>
                    <Text className="text-sm text-foreground">
                      {t("postpartum.urgencyIncontinence")} <Text className="font-medium">{entry.urgency_incontinence ? t("postpartum.yes") : t("postpartum.no")}</Text>
                    </Text>
                    <Text className="text-sm text-foreground">
                      {t("postpartum.pelvicPain")} <Text className="font-medium">{entry.pelvic_pain ? t("postpartum.yes") : t("postpartum.no")}</Text>
                    </Text>
                  </View>
                  {entry.notes ? <Text className="text-sm text-muted">{entry.notes}</Text> : null}
                </Card>
              ))
            )}
          </>
        )}

        {activeTab === "diastasis" && (
          <>
            <Card className="gap-2">
              <Text className="text-sm font-medium text-foreground">{t("postpartum.functional")}</Text>
              <View className="gap-1">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">{t("postpartum.supraumbilical")}</Text>
                  <Text className="text-sm font-medium text-foreground">
                    {pp?.supraumbilical_functional == null
                      ? t("postpartum.notAssessed")
                      : pp.supraumbilical_functional
                        ? t("postpartum.yes")
                        : t("postpartum.no")}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">{t("postpartum.umbilical")}</Text>
                  <Text className="text-sm font-medium text-foreground">
                    {pp?.umbilical_functional == null
                      ? t("postpartum.notAssessed")
                      : pp.umbilical_functional
                        ? t("postpartum.yes")
                        : t("postpartum.no")}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">{t("postpartum.infraumbilical")}</Text>
                  <Text className="text-sm font-medium text-foreground">
                    {pp?.infraumbilical_functional == null
                      ? t("postpartum.notAssessed")
                      : pp.infraumbilical_functional
                        ? t("postpartum.yes")
                        : t("postpartum.no")}
                  </Text>
                </View>
              </View>
            </Card>

            {diastasisChartData.length >= 2 && (
              <Card>
                <LineChart
                  data={{
                    labels: diastasisChartData.map((entry) => entry.assessed_at.slice(5)),
                    datasets: [
                      { data: diastasisChartData.map((entry) => entry.supraumbilical_cm ?? 0), color: () => "#C9A227", strokeWidth: 2 },
                      { data: diastasisChartData.map((entry) => entry.umbilical_cm ?? 0), color: () => "#F472B6", strokeWidth: 2 },
                      { data: diastasisChartData.map((entry) => entry.infraumbilical_cm ?? 0), color: () => "#3FAE6E", strokeWidth: 2 },
                    ],
                    legend: [t("postpartum.supraumbilical"), t("postpartum.umbilical"), t("postpartum.infraumbilical")],
                  }}
                  width={screenWidth - 72}
                  height={200}
                  withInnerLines={false}
                  chartConfig={{
                    backgroundColor: "#16161D",
                    backgroundGradientFrom: "#16161D",
                    backgroundGradientTo: "#16161D",
                    decimalPlaces: 1,
                    color: () => "#9A9AA5",
                    labelColor: () => "#9A9AA5",
                    propsForDots: { r: "3" },
                  }}
                  bezier
                  style={{ borderRadius: 16 }}
                />
              </Card>
            )}

            <Card className="gap-4">
              <TextField
                label={`${t("postpartum.supraumbilical")} (cm)`}
                keyboardType="decimal-pad"
                value={supraumbilical}
                onChangeText={setSupraumbilical}
                placeholder="0"
              />
              <TextField
                label={`${t("postpartum.umbilical")} (cm)`}
                keyboardType="decimal-pad"
                value={umbilical}
                onChangeText={setUmbilical}
                placeholder="0"
              />
              <TextField
                label={`${t("postpartum.infraumbilical")} (cm)`}
                keyboardType="decimal-pad"
                value={infraumbilical}
                onChangeText={setInfraumbilical}
                placeholder="0"
              />
              <View className="gap-2">
                <Text className="text-sm font-medium text-muted">{t("postpartum.notes")}</Text>
                <TextInput
                  value={diastasisNotes}
                  onChangeText={setDiastasisNotes}
                  multiline
                  numberOfLines={2}
                  placeholderTextColor="#6B6B76"
                  className="min-h-16 rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-base text-foreground"
                />
              </View>
              <Button label={t("common.save")} onPress={handleSaveDiastasis} loading={savingDiastasis} />
            </Card>

            {diastasis.length === 0 ? (
              <Text className="text-sm text-muted">{t("postpartum.noDiastasisHistory")}</Text>
            ) : (
              diastasis.map((entry) => (
                <Card key={entry.id} className="gap-2">
                  <Text className="text-sm font-medium text-muted">{entry.assessed_at}</Text>
                  <View className="flex-row flex-wrap gap-x-6 gap-y-1">
                    {entry.supraumbilical_cm != null ? (
                      <Text className="text-sm text-foreground">
                        {t("postpartum.supraumbilical")}: <Text className="font-medium">{entry.supraumbilical_cm} cm</Text>
                      </Text>
                    ) : null}
                    {entry.umbilical_cm != null ? (
                      <Text className="text-sm text-foreground">
                        {t("postpartum.umbilical")}: <Text className="font-medium">{entry.umbilical_cm} cm</Text>
                      </Text>
                    ) : null}
                    {entry.infraumbilical_cm != null ? (
                      <Text className="text-sm text-foreground">
                        {t("postpartum.infraumbilical")}: <Text className="font-medium">{entry.infraumbilical_cm} cm</Text>
                      </Text>
                    ) : null}
                  </View>
                  {entry.notes ? <Text className="text-sm text-muted">{entry.notes}</Text> : null}
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
