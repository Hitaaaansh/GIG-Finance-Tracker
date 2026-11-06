"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { en } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import type { Language } from "@/types/domain";
import type { TranslationKey } from "@/lib/i18n/en";

const translations: Record<Language, TranslationKey> = { en, hi };

interface I18nContextValue {
  lang: Language;
  t: TranslationKey;
  setLang: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  t: en,
  setLang: () => {},
});

const LANG_KEY = "gt_language";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY) as Language | null;
    if (stored === "en" || stored === "hi") setLangState(stored);
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(LANG_KEY, newLang);
  }, []);

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
