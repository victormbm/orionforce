"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { isLanguage, translate, locales, LANGUAGE_STORAGE_KEY, type Language, type MessageValues } from "@/lib/i18n";
export type { Language } from "@/lib/i18n";

type Translator = (text: string, values?: MessageValues) => string;
const LanguageContext = createContext<{
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: Translator;
  formatNumber: (value: number, suffix?: string) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, updateLanguage] = useState<Language>("pt");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isLanguage(saved)) updateLanguage(saved);
    } catch { /* Language switching also works when storage is unavailable. */ }
  }, []);
  useEffect(() => {
    document.documentElement.lang = locales[language];
    document.title = translate(language, "Orion Force — Gestão & Roster");
  }, [language]);
  const setLanguage = useCallback((next: Language) => {
    updateLanguage(next);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* Optional persistence. */ }
  }, []);
  const t = useCallback<Translator>((text, values) => translate(language, text, values), [language]);
  const formatNumber = useCallback((value: number, suffix?: string) => new Intl.NumberFormat(locales[language], { maximumFractionDigits: 2 }).format(value) + (suffix ?? ""), [language]);
  return <LanguageContext.Provider value={{ language, locale: locales[language], setLanguage, t, formatNumber }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage requires LanguageProvider");
  return context;
}
