"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "vp-theme";

export default function ThemeToggle({ compact = false }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const storedTheme = localStorage.getItem(STORAGE_KEY) || "dark";
    applyTheme(storedTheme);
    setTheme(storedTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isLight ? "Cambiar a dark" : "Cambiar a light"}
      aria-label={isLight ? "Cambiar a dark" : "Cambiar a light"}
      className="inline-flex items-center justify-center rounded-lg transition"
      style={{
        width: compact ? 36 : 40,
        height: compact ? 36 : 40,
        color: "var(--vp-muted)",
        background: "var(--vp-surface)",
        border: "1px solid var(--vp-border)",
      }}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
}
