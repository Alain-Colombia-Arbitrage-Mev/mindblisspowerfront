"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/LanguageProvider";

const THEME_STORAGE_KEY = "vp-theme";
const THEME_EVENT = "vp:theme-change";
const THEME_COLORS = { dark: "#050f19", light: "#f3f5fb" };

function isTheme(value) {
  return value === "light" || value === "dark";
}

function applyTheme(next) {
  const root = document.documentElement;
  root.dataset.theme = next;
  root.classList.toggle("dark", next === "dark");
  root.style.colorScheme = next;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[next]);
}

export default function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    let next = "dark";
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (isTheme(saved)) next = saved;
    } catch {
      /* ignore */
    }
    applyTheme(next);
    setTheme(next);

    const syncTheme = (event) => {
      const incoming = event.detail?.theme;
      if (!isTheme(incoming)) return;
      applyTheme(incoming);
      setTheme(incoming);
    };
    const syncStorage = (event) => {
      if (event.key !== THEME_STORAGE_KEY || !isTheme(event.newValue)) return;
      applyTheme(event.newValue);
      setTheme(event.newValue);
    };
    window.addEventListener(THEME_EVENT, syncTheme);
    window.addEventListener("storage", syncStorage);
    return () => {
      window.removeEventListener(THEME_EVENT, syncTheme);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* The theme still works for this session when storage is unavailable. */
    }
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: next } }));
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
