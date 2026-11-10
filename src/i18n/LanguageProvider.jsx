"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LOCALE_OPTIONS, messages, SUPPORTED_LOCALES } from "./messages";

const LanguageContext = createContext(null);

function normalizedLocale(value) {
  const candidate = String(value || "").toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.includes(candidate) ? candidate : "es";
}

function storedLocale() {
  try {
    const saved = localStorage.getItem("mindbliss-locale");
    if (saved) return normalizedLocale(saved);
  } catch {
    /* The browser language remains available without storage. */
  }
  const cookie = document.cookie.match(/(?:^|;\s*)mindbliss_locale=([^;]+)/)?.[1];
  return normalizedLocale(cookie || navigator.language);
}

function messageAt(locale, key) {
  const path = key.split(".");
  let value = messages[locale];
  for (const part of path) value = value?.[part];
  if (typeof value === "string") return value;
  value = messages.es;
  for (const part of path) value = value?.[part];
  return typeof value === "string" ? value : key;
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState("es");

  const applyLocale = useCallback((nextValue) => {
    const next = normalizedLocale(nextValue);
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
    let value = messageAt(locale, key);
    if (variables) for (const [name, replacement] of Object.entries(variables)) value = value.replaceAll(`{${name}}`, String(replacement));
    return value;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale: applyLocale, t, dir: locale === "ar" ? "rtl" : "ltr" }), [applyLocale, locale, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useI18n must be used inside LanguageProvider");
  return value;
}

