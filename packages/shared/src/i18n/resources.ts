import pt from "./pt.json";
import es from "./es.json";
import en from "./en.json";

export const i18nResources = {
  pt: { translation: pt },
  es: { translation: es },
  en: { translation: en },
} as const;

export const supportedLocales = ["pt", "es", "en"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export const defaultLocale: SupportedLocale = "pt";
