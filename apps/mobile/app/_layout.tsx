import "../src/global.css";
import "../src/lib/i18n";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../src/lib/i18n";
import { LANGUAGE_STORAGE_KEY } from "../src/lib/i18n";
import { AuthProvider } from "@/context/AuthContext";
import { LanguagePickerScreen } from "@/components/LanguagePickerScreen";
import type { SupportedLocale } from "@tiagolifestyle/shared";

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

  if (languageReady === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <StatusBar style="light" />
        <ActivityIndicator color="#C9A227" />
      </View>
    );
  }

  if (languageReady === false) {
    return (
      <>
        <StatusBar style="light" />
        <LanguagePickerScreen onSelect={handleLanguageSelect} />
      </>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B0B0F" } }} />
    </AuthProvider>
  );
}
