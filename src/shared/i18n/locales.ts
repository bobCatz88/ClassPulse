export const supportedLocales = ["ms-MY", "en"] as const;

export type AppLocale = (typeof supportedLocales)[number];

export const localeLabels: Record<AppLocale, string> = {
  "ms-MY": "Bahasa Melayu",
  en: "English",
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && supportedLocales.includes(value as AppLocale);
}

export function normalizeLocale(value: unknown): AppLocale {
  return isAppLocale(value) ? value : "ms-MY";
}

export function speechLocale(locale: AppLocale): string {
  return locale === "en" ? "en-MY" : "ms-MY";
}
