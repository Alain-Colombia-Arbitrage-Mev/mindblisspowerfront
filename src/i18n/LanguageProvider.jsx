"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LOCALE_OPTIONS } from "./messages";
import { normalizeLocale, translateMessage } from "./translate.mjs";

const LanguageContext = createContext(null);

function storedLocale() {
  try {
    const saved = localStorage.getItem("mindbliss-locale");
    if (saved) return normalizeLocale(saved);
  } catch {
    /* The browser language remains available without storage. */
  }
  const cookie = document.cookie.match(/(?:^|;\s*)mindbliss_locale=([^;]+)/)?.[1];
  return normalizeLocale(cookie || navigator.language);
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState("es");

  const applyLocale = useCallback((nextValue) => {
    const next = normalizeLocale(nextValue);
    const option = LOCALE_OPTIONS.find((item) => item.code === next) || LOCALE_OPTIONS[0];
    document.documentElement.lang = next;
    document.documentElement.dir = option.dir;
    document.documentElement.dataset.locale = next;
    setLocaleState(next);
    try {
      localStorage.setItem("mindbliss-locale", next);
      document.cookie = `mindbliss_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {
      /* Locale remains active for the current view. */
    }
  }, []);

  useEffect(() => applyLocale(storedLocale()), [applyLocale]);

  const t = useCallback((key, variables = undefined) => {
    return translateMessage(locale, key, variables);
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale: applyLocale, t, dir: locale === "ar" ? "rtl" : "ltr" }), [applyLocale, locale, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useI18n must be used inside LanguageProvider");
  return value;
}

