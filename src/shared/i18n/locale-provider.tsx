"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { normalizeLocale, type AppLocale } from "./locales";
import { translate, type TranslationKey } from "./messages";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: TranslationKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: AppLocale;
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState<AppLocale>(normalizeLocale(initialLocale));
  const value = useMemo(
    () => ({ locale, setLocale, t: (key: TranslationKey) => translate(locale, key) }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale mesti digunakan dalam LocaleProvider.");
  return value;
}
