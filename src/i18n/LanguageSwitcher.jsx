"use client";

import { Globe2 } from "lucide-react";
import { useI18n } from "./LanguageProvider";
import { LOCALE_OPTIONS } from "./messages";

export default function LanguageSwitcher({ compact = false }) {
  const { locale, setLocale } = useI18n();
  return (
    <label className={`vp-language-switcher${compact ? " is-compact" : ""}`}>
      <Globe2 size={16} aria-hidden="true" />
      <span className="sr-only">Language / Idioma / اللغة / 语言</span>
      <select value={locale} onChange={(event) => setLocale(event.target.value)} aria-label="Language / Idioma / اللغة / 语言">
        {LOCALE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{compact ? option.short : option.label}</option>)}
      </select>
    </label>
  );
}

