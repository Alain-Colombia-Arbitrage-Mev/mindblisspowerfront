"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";

export default function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    let next = "dark";
    try {
      const saved = localStorage.getItem("vp-theme");
      if (saved === "light" || saved === "dark") next = saved;
    } catch {
      /* ignore */
    }
    document.documentElement.dataset.theme = next;
    setTheme(next);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem("vp-theme", next);
    } catch {
      /* The theme still works for this session when storage is unavailable. */
    }
  }

  const nextLabel = theme === "dark" ? t("theme.enableLight") : t("theme.enableDark");

  return (
    <button
      type="button"
      className="vp-shell-icon vp-theme-toggle"
      data-theme={theme}
      role="switch"
      aria-label={nextLabel}
      aria-checked={theme === "dark"}
      title={nextLabel}
      onClick={toggleTheme}
    >
      <span className="vp-theme-switch" aria-hidden="true">
        <span className="vp-theme-thumb" />
        <span className="vp-theme-glyph vp-theme-glyph--sun"><Sun size={15} /></span>
        <span className="vp-theme-glyph vp-theme-glyph--moon"><Moon size={15} /></span>
      </span>
      <span className="vp-theme-label">{theme === "dark" ? t("theme.dark") : t("theme.light")}</span>
    </button>
  );
}
