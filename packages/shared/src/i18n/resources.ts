import pt from "./pt.json";
import es from "./es.json";

export const i18nResources = {
  pt: { translation: pt },
  es: { translation: es },
} as const;

export const supportedLocales = ["pt", "es"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];
export const defaultLocale: SupportedLocale = "pt";
