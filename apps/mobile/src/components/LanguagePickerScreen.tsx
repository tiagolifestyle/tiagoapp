import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { supportedLocales, type SupportedLocale } from "@tiagolifestyle/shared";

const localeLabels: Record<SupportedLocale, string> = {
  pt: "Português",
  es: "Español",
  en: "English",
};

interface LanguagePickerScreenProps {
  onSelect: (locale: SupportedLocale) => void;
}

export function LanguagePickerScreen({ onSelect }: LanguagePickerScreenProps) {
  const { t, i18n } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center gap-8 px-6">
        <View className="gap-2">
          <Text className="text-3xl font-semibold text-foreground">{t("onboarding.chooseLanguage")}</Text>
          <Text className="text-base text-muted">{t("onboarding.chooseLanguageSubtitle")}</Text>
        </View>

        <View className="gap-3">
          {supportedLocales.map((locale) => (
            <Pressable
              key={locale}
              accessibilityRole="button"
              onPress={() => onSelect(locale)}
              className={`items-center rounded-2xl border px-4 py-4 active:opacity-80 ${
                i18n.language === locale ? "border-accent bg-surface-elevated" : "border-border"
              }`}
            >
              <Text className="text-base font-medium text-foreground">{localeLabels[locale]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
