import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { supportedLocales, type SupportedLocale, type SubscriptionTier } from "@tiagolifestyle/shared";
import { useAuth } from "@/context/AuthContext";
import { useTheme, type ThemeMode } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

const localeLabels: Record<SupportedLocale, string> = {
  pt: "Português",
  es: "Español",
  en: "English",
};

const THEME_MODES: ThemeMode[] = ["dark", "light"];

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { profile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tier, setTier] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("clients")
      .select("subscription_tier")
      .eq("id", profile.id)
      .single()
      .then(({ data }) => setTier(data?.subscription_tier ?? null));
  }, [profile]);

  async function changeLocale(locale: SupportedLocale) {
    await i18n.changeLanguage(locale);
    if (profile) {
      await supabase.from("profiles").update({ locale }).eq("id", profile.id);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-10">
        <View className="mt-4 flex-row items-center justify-between">
          <Text className="text-2xl font-semibold text-foreground">{t("profile.title")}</Text>
          {tier ? (
            <View className="rounded-full border border-accent bg-surface-elevated px-3 py-1.5">
              <Text className="text-xs font-bold uppercase tracking-wide text-accent">
                {t(`profile.tier${tier === "free" ? "Basic" : tier === "premium" ? "Premium" : "Vip"}`)}
              </Text>
            </View>
          ) : null}
        </View>

        <Card className="gap-1">
          <Text className="text-lg font-medium text-foreground">{profile?.full_name}</Text>
          <Text className="text-sm text-muted">{profile?.role === "client" ? "Cliente" : profile?.role}</Text>
        </Card>

        <Card className="gap-3">
          <Text className="text-base font-medium text-foreground">{t("profile.language")}</Text>
          <View className="flex-row gap-3">
            {supportedLocales.map((locale) => (
              <Pressable
                key={locale}
                onPress={() => changeLocale(locale)}
                className={`flex-1 items-center rounded-2xl border px-4 py-3 ${
                  i18n.language === locale ? "border-accent bg-surface-elevated" : "border-border"
                }`}
              >
                <Text className="text-foreground">{localeLabels[locale]}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card className="gap-3">
          <Text className="text-base font-medium text-foreground">{t("profile.theme")}</Text>
          <View className="flex-row gap-3">
            {THEME_MODES.map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setTheme(mode)}
                className={`flex-1 items-center rounded-2xl border px-4 py-3 ${
                  theme === mode ? "border-accent bg-surface-elevated" : "border-border"
                }`}
              >
                <Text className="text-foreground">{t(`profile.theme${mode === "dark" ? "Dark" : "Light"}`)}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Button label={t("auth.logout")} variant="secondary" onPress={signOut} />
      </ScrollView>
    </SafeAreaView>
  );
}
