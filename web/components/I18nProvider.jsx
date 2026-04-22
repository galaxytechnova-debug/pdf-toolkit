"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STRINGS } from "@/lib/i18n/strings";

const STORAGE_KEY = "pdf-toolkit-lang";
const I18nContext = createContext({ lang: "en", t: (k) => k, setLang: () => {} });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "hi" || v === "mr" || v === "en") queueMicrotask(() => setLangState(v));
    } catch {}
  }, []);

  const setLang = useCallback((next) => {
    const v = next === "hi" || next === "mr" ? next : "en";
    setLangState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {}
  }, []);

  const t = useCallback(
    (key) => {
      const pack = STRINGS[lang] || STRINGS.en;
      return pack[key] ?? STRINGS.en[key] ?? key;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
