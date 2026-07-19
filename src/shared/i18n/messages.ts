import type { AppLocale } from "./locales";

const messages = {
  "ms-MY": {
    language: "Bahasa",
    languageMalay: "Bahasa Melayu",
    languageEnglish: "English",
    save: "Simpan perubahan",
    saving: "Menyimpan…",
    signOut: "Keluar",
    signIn: "Daftar masuk",
    createAccount: "Cipta akaun guru",
  },
  en: {
    language: "Language",
    languageMalay: "Bahasa Melayu",
    languageEnglish: "English",
    save: "Save changes",
    saving: "Saving…",
    signOut: "Sign out",
    signIn: "Sign in",
    createAccount: "Create teacher account",
  },
} as const;

export type TranslationKey = keyof (typeof messages)["ms-MY"];

export function translate(locale: AppLocale, key: TranslationKey): string {
  return messages[locale][key] ?? messages["ms-MY"][key];
}
