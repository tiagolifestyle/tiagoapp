import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import {
  computeBmi,
  pickQText,
  type QField,
  type QGridColumn,
  type QOption,
  type QuestionnaireAnswers,
} from "@tiagolifestyle/shared";

const INPUT_CLASS = "rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-base text-foreground";

interface FieldProps {
  field: QField;
  answers: QuestionnaireAnswers;
  setAnswer: (key: string, value: string | string[]) => void;
  locale: string;
}

function asText(answers: QuestionnaireAnswers, key: string): string {
  const value = answers[key];
  return typeof value === "string" ? value : "";
}

function asList(answers: QuestionnaireAnswers, key: string): string[] {
  const value = answers[key];
  return Array.isArray(value) ? value : [];
}

function Label({ children }: { children: string }) {
  return <Text className="text-sm font-medium text-foreground">{children}</Text>;
}

// Opções para tocar (uma ou várias). Tocar outra vez numa escolha única limpa-a.
function OptionPills({
  options,
  selected,
  onToggle,
  locale,
  multi = false,
}: {
  options: QOption[];
  selected: string[];
  onToggle: (key: string) => void;
  locale: string;
  multi?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isOn = selected.includes(option.key);
        return (
          <Pressable
            key={option.key}
            onPress={() => onToggle(option.key)}
            className={`flex-row items-center gap-1.5 rounded-full border px-4 py-2 ${
              isOn ? "border-accent bg-surface-elevated" : "border-border"
            }`}
          >
            {multi ? (
              <Ionicons name={isOn ? "checkbox" : "square-outline"} size={16} color={isOn ? "#C9A227" : "#9A9AA5"} />
            ) : null}
            <Text className={`text-sm ${isOn ? "font-semibold text-accent" : "text-foreground"}`}>
              {pickQText(option.label, locale)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function GridCell({
  column,
  cellKey,
  answers,
  setAnswer,
  locale,
}: {
  column: QGridColumn;
  cellKey: string;
  answers: QuestionnaireAnswers;
  setAnswer: FieldProps["setAnswer"];
  locale: string;
}) {
  const value = asText(answers, cellKey);
  return (
    <View className="gap-1.5">
      <Text className="text-xs text-muted">{pickQText(column.label, locale)}</Text>
      {column.type === "text" ? (
        <TextInput
          value={value}
          onChangeText={(text) => setAnswer(cellKey, text)}
          placeholderTextColor="#6B6B76"
          className={INPUT_CLASS}
        />
      ) : (
        <OptionPills
          options={column.options}
          selected={value ? [value] : []}
          onToggle={(key) => setAnswer(cellKey, value === key ? "" : key)}
          locale={locale}
        />
      )}
    </View>
  );
}

export function QuestionnaireField({ field, answers, setAnswer, locale }: FieldProps) {
  const { t } = useTranslation();

  switch (field.type) {
    case "info":
      return <Text className="text-sm leading-5 text-muted">{pickQText(field.text, locale)}</Text>;

    case "text":
    case "textarea":
      return (
        <View className="gap-2">
          <Label>{pickQText(field.label, locale)}</Label>
          <TextInput
            value={asText(answers, field.key)}
            onChangeText={(text) => setAnswer(field.key, text)}
            multiline={field.type === "textarea"}
            keyboardType={field.type === "text" && field.numeric ? "decimal-pad" : "default"}
            placeholderTextColor="#6B6B76"
            className={`${INPUT_CLASS} ${field.type === "textarea" ? "min-h-20" : ""}`}
            style={field.type === "textarea" ? { textAlignVertical: "top" } : undefined}
          />
        </View>
      );

    case "single": {
      const value = asText(answers, field.key);
      return (
        <View className="gap-2">
          <Label>{pickQText(field.label, locale)}</Label>
          <OptionPills
            options={field.options}
            selected={value ? [value] : []}
            onToggle={(key) => setAnswer(field.key, value === key ? "" : key)}
            locale={locale}
          />
        </View>
      );
    }

    case "multi": {
      const selected = asList(answers, field.key);
      const otherKey = `${field.key}.other`;
      return (
        <View className="gap-2">
          <Label>{pickQText(field.label, locale)}</Label>
          <OptionPills
            options={field.options}
            selected={selected}
            onToggle={(key) =>
              setAnswer(field.key, selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key])
            }
            locale={locale}
            multi
          />
          {field.otherKey && selected.includes(field.otherKey) ? (
            <TextInput
              value={asText(answers, otherKey)}
              onChangeText={(text) => setAnswer(otherKey, text)}
              placeholder={t("questionnaires.otherPlaceholder")}
              placeholderTextColor="#6B6B76"
              className={INPUT_CLASS}
            />
          ) : null}
        </View>
      );
    }

    case "scale": {
      const value = asText(answers, field.key);
      const numbers = Array.from({ length: field.max - field.min + 1 }, (_, i) => String(field.min + i));
      return (
        <View className="gap-2">
          <Label>{pickQText(field.label, locale)}</Label>
          <View className="flex-row flex-wrap gap-2">
            {numbers.map((n) => (
              <Pressable
                key={n}
                onPress={() => setAnswer(field.key, value === n ? "" : n)}
                className={`h-10 w-10 items-center justify-center rounded-full border ${
                  value === n ? "border-accent bg-accent" : "border-border"
                }`}
              >
                <Text className={`text-sm font-semibold ${value === n ? "text-background" : "text-foreground"}`}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      );
    }

    case "grid":
      return (
        <View className="gap-2">
          <Label>{pickQText(field.label, locale)}</Label>
          {field.rows.map((row) => (
            <View key={row.key} className="gap-3 rounded-2xl border border-border p-3">
              <Text className="text-sm font-semibold text-accent">{pickQText(row.label, locale)}</Text>
              {field.columns.map((column) => (
                <GridCell
                  key={column.key}
                  column={column}
                  cellKey={`${field.key}.${row.key}.${column.key}`}
                  answers={answers}
                  setAnswer={setAnswer}
                  locale={locale}
                />
              ))}
            </View>
          ))}
        </View>
      );

    case "bmi": {
      const bmi = computeBmi(asText(answers, field.heightKey), asText(answers, field.weightKey));
      return (
        <View className="gap-2">
          <Label>{pickQText(field.label, locale)}</Label>
          <View className="rounded-2xl border border-border bg-surface px-4 py-3">
            <Text className="text-base font-semibold text-accent">{bmi ?? "—"}</Text>
          </View>
          <Text className="text-xs text-muted">{t("questionnaires.bmiAuto")}</Text>
        </View>
      );
    }

    case "consent": {
      const name = asText(answers, `${field.key}.name`);
      const accepted = asText(answers, `${field.key}.accepted`) === "yes";
      const date = asText(answers, `${field.key}.date`);
      const text = pickQText(field.text, locale).replace("{{name}}", name || `[${t("questionnaires.namePlaceholder")}]`);
      return (
        <View className="gap-3">
          {text.split("\n\n").map((paragraph, index) => (
            <Text key={index} className="text-sm leading-5 text-foreground">
              {paragraph}
            </Text>
          ))}
          <Pressable
            onPress={() => setAnswer(`${field.key}.accepted`, accepted ? "" : "yes")}
            className="flex-row items-start gap-3 rounded-2xl border border-border p-3 active:opacity-80"
          >
            <Ionicons name={accepted ? "checkbox" : "square-outline"} size={22} color={accepted ? "#C9A227" : "#9A9AA5"} />
            <Text className="flex-1 text-sm font-medium text-foreground">{pickQText(field.accept, locale)}</Text>
          </Pressable>
          <View className="gap-2">
            <Label>{t("questionnaires.fullName")}</Label>
            <TextInput
              value={name}
              onChangeText={(value) => setAnswer(`${field.key}.name`, value)}
              placeholderTextColor="#6B6B76"
              className={INPUT_CLASS}
            />
          </View>
          <Text className="text-xs text-muted">
            {t("questionnaires.date")}: {date || t("questionnaires.autoDate")}
          </Text>
        </View>
      );
    }

    case "signature": {
      const name = asText(answers, `${field.key}.name`);
      const date = asText(answers, `${field.key}.date`);
      return (
        <View className="gap-2">
          <Label>{pickQText(field.label, locale)}</Label>
          <TextInput
            value={name}
            onChangeText={(value) => setAnswer(`${field.key}.name`, value)}
            placeholder={t("questionnaires.fullName")}
            placeholderTextColor="#6B6B76"
            className={INPUT_CLASS}
          />
          <Text className="text-xs text-muted">
            {t("questionnaires.date")}: {date || t("questionnaires.autoDate")}
          </Text>
        </View>
      );
    }
  }
}
