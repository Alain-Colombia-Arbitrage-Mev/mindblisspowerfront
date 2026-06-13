"use client";

import { useEffect } from "react";

/**
 * Light mode DESACTIVADO temporalmente: forzamos dark y ocultamos el toggle.
 * (Para reactivar light: restaurar el toggle y el script en layout.jsx.)
 */
export default function ThemeToggle() {
  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    try {
      localStorage.setItem("vp-theme", "dark");
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
