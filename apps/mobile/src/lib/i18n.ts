import { getLocales } from "expo-localization";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import {
  defaultLocale,
  i18nResources,
  supportedLocales,
  type SupportedLocale,
} from "@tiagolifestyle/shared";

export const LANGUAGE_STORAGE_KEY = "tiagolifestyle.language";

function detectDeviceLocale(): SupportedLocale {
  const deviceLocale = getLocales()[0]?.languageCode;
  return (supportedLocales as readonly string[]).includes(deviceLocale ?? "")
    ? (deviceLocale as SupportedLocale)
    : defaultLocale;
}

i18next.use(initReactI18next).init({
  resources: i18nResources,
  lng: detectDeviceLocale(),
  fallbackLng: defaultLocale,
  interpolation: { escapeValue: false },
});

export default i18next;
