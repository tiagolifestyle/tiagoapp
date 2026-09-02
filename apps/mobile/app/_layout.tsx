import "../src/global.css";
import "../src/lib/i18n";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../src/lib/i18n";
import { LANGUAGE_STORAGE_KEY } from "../src/lib/i18n";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { LanguagePickerScreen } from "@/components/LanguagePickerScreen";
import type { SupportedLocale } from "@tiagolifestyle/shared";

function AuthenticatedApp() {
  const { theme } = useTheme();
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme === "dark" ? "#0B0B0F" : "#F7F7F4" },
        }}
      />
    </AuthProvider>
  );
}

export default function RootLayout() {
  const [languageReady, setLanguageReady] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((savedLocale) => {
      if (savedLocale) {
        i18n.changeLanguage(savedLocale);
        setLanguageReady(true);
      } else {
        setLanguageReady(false);
      }
    });
  }, []);

  async function handleLanguageSelect(locale: SupportedLocale) {
    await i18n.changeLanguage(locale);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
    setLanguageReady(true);
  }

  return (
    <ThemeProvider>
      {languageReady === null && (
        <View className="flex-1 items-center justify-center bg-background">
          <ActivityIndicator color="#C9A227" />
        </View>
      )}
      {languageReady === false && <LanguagePickerScreen onSelect={handleLanguageSelect} />}
      {languageReady === true && <AuthenticatedApp />}
    </ThemeProvider>
  );
}
