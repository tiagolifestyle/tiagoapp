import { useEffect, useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  QUESTIONNAIRES,
  QUESTIONNAIRE_KINDS,
  computeBmi,
  pickQText,
  todayLabel,
  type QPrefill,
  type QuestionnaireAnswers,
  type QuestionnaireDefinition,
  type QuestionnaireKind,
} from "@tiagolifestyle/shared";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { QuestionnaireField } from "@/components/QuestionnaireFields";

// Respostas iniciais de um questionário novo: o que a app já sabe (nome, email, data de hoje).
function initialAnswers(definition: QuestionnaireDefinition, values: Record<QPrefill, string>): QuestionnaireAnswers {
  const answers: QuestionnaireAnswers = {};
  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (field.type === "text" && field.prefill && values[field.prefill]) answers[field.key] = values[field.prefill];
      if ((field.type === "consent" || field.type === "signature") && values.name) answers[`${field.key}.name`] = values.name;
    }
  }
  return answers;
}

// Antes de guardar: IMC calculado e datas automáticas da declaração/assinatura.
function prepareForSave(definition: QuestionnaireDefinition, answers: QuestionnaireAnswers): QuestionnaireAnswers {
  const result = { ...answers };
  const text = (key: string) => (typeof result[key] === "string" ? (result[key] as string) : "");
  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (field.type === "bmi") result[field.key] = computeBmi(text(field.heightKey), text(field.weightKey)) ?? "";
      if (field.type === "consent") {
        result[`${field.key}.date`] = text(`${field.key}.accepted`) === "yes" ? todayLabel() : "";
      }
      if (field.type === "signature") {
        result[`${field.key}.date`] = text(`${field.key}.name`).trim() ? todayLabel() : "";
      }
    }
  }
  return result;
}

function QuestionnaireForm({ kind }: { kind: QuestionnaireKind }) {
  const { t, i18n } = useTranslation();
  const { profile, session } = useAuth();
  const definition = QUESTIONNAIRES[kind];
  const locale = i18n.language;
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"saving" | "saved" | "error" | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const fullName = (profile.full_name ?? "").trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    const prefills: Record<QPrefill, string> = {
      name: fullName,
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
      email: session?.user?.email ?? "",
      today: todayLabel(),
    };

    supabase
      .from("questionnaire_responses")
      .select("answers, updated_at")
      .eq("client_id", profile.id)
      .eq("kind", kind)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setAnswers((data.answers ?? {}) as QuestionnaireAnswers);
          setUpdatedAt(data.updated_at as string);
        } else {
          setAnswers(initialAnswers(definition, prefills));
        }
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile, session, kind, definition]);

  function setAnswer(key: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  }

  async function handleSave() {
    if (!profile) return;
    setStatus("saving");
    const toSave = prepareForSave(definition, answers);
    const { data, error } = await supabase
      .from("questionnaire_responses")
      .upsert({ client_id: profile.id, kind, answers: toSave }, { onConflict: "client_id,kind" })
      .select("updated_at")
      .single();
    if (error) {
      setStatus("error");
      return;
    }
    setAnswers(toSave);
    setUpdatedAt((data?.updated_at as string | undefined) ?? new Date().toISOString());
    setStatus("saved");
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-10" keyboardShouldPersistTaps="handled">
        <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />

        <View className="gap-1">
          {definition.header ? (
            <Text className="text-xs font-semibold uppercase tracking-wide text-accent">
              {pickQText(definition.header, locale)}
            </Text>
          ) : null}
          <Text className="text-2xl font-semibold text-foreground">{pickQText(definition.title, locale)}</Text>
          {definition.subtitle ? (
            <Text className="text-sm text-muted">{pickQText(definition.subtitle, locale)}</Text>
          ) : null}
        </View>

        {definition.intro ? (
          <Text className="text-sm leading-5 text-foreground">{pickQText(definition.intro, locale)}</Text>
        ) : null}

        <Card className="gap-1 border-accent-muted bg-surface-elevated">
          <Text className="text-sm text-foreground">{t("questionnaires.hint")}</Text>
          {updatedAt ? (
            <Text className="text-xs text-muted">
              {t("questionnaires.lastUpdated", { date: new Date(updatedAt).toLocaleDateString(locale) })}
            </Text>
          ) : null}
        </Card>

        {!isLoading &&
          definition.sections.map((section, index) => (
            <Card key={index} className="gap-4 bg-surface-elevated">
              {section.title ? (
                <Text className="text-sm font-semibold uppercase tracking-wide text-accent">
                  {section.number ? `${section.number}. ` : ""}
                  {pickQText(section.title, locale)}
                </Text>
              ) : null}
              {section.fields.map((field, fieldIndex) => (
                <QuestionnaireField
                  key={"key" in field ? field.key : `info-${fieldIndex}`}
                  field={field}
                  answers={answers}
                  setAnswer={setAnswer}
                  locale={locale}
                />
              ))}
            </Card>
          ))}

        {!isLoading && (
          <View className="gap-2">
            <Button
              label={status === "saving" ? t("questionnaires.saving") : t("questionnaires.save")}
              onPress={handleSave}
              loading={status === "saving"}
            />
            {status === "saved" ? (
              <Text className="text-center text-sm font-semibold text-success">{t("questionnaires.saved")}</Text>
            ) : status === "error" ? (
              <Text className="text-center text-sm text-danger">{t("questionnaires.saveError")}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function QuestionnaireScreen() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const validKind = QUESTIONNAIRE_KINDS.find((k) => k === kind);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {validKind ? <QuestionnaireForm key={validKind} kind={validKind} /> : null}
    </SafeAreaView>
  );
}
