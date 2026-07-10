"use client";

import { Bell, ChevronDown, Menu, Power, Search } from "lucide-react";
import ThemeToggle from "@/app/_components/ThemeToggle";

export default function PanelHeader({ title, subtitle, hasNotifications = true, mobileMenuOpen, onToggleMobileMenu }) {
  return (
    <header
      className="flex h-20 shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-6 lg:h-24 lg:px-10"
      style={{ borderColor: "var(--vp-border)", background: "var(--vp-surface)" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-dashboard-nav"
          aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full md:hidden"
          style={{ color: "var(--vp-muted)", background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
          title="Menu"
          type="button"
          onClick={onToggleMobileMenu}
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0">
          <h1 className="m-0 truncate text-lg font-semibold lg:text-2xl" style={{ color: "var(--vp-text)" }}>
            {title}
          </h1>
          {subtitle ? (
            <p className="m-0 mt-1 hidden truncate text-sm font-light sm:block" style={{ color: "var(--vp-muted)" }}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 lg:gap-6">
        <label
          className="hidden items-center gap-3 rounded-full px-4 py-2 lg:flex"
          style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
        >
          <Search size={14} style={{ color: "var(--vp-muted)" }} />
          <input
            aria-label="Buscar"
            className="w-44 bg-transparent text-sm font-light outline-none"
            placeholder="Buscar usuarios, tickets..."
            style={{ color: "var(--vp-text)" }}
            type="text"
          />
        </label>

        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-full"
          style={{ color: "var(--vp-muted)", background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
          title="Notificaciones"
          type="button"
        >
          <Bell size={16} />
          {hasNotifications ? (
            <span
              className="absolute right-2.5 top-2 h-2 w-2 rounded-full"
              style={{ background: "var(--vp-accent)", border: "2px solid var(--vp-surface)" }}
            />
          ) : null}
        </button>

        <span className="hidden h-8 w-px lg:block" style={{ background: "var(--vp-border)" }} />

        <button
          className="hidden items-center gap-2 lg:flex"
          style={{ background: "transparent", border: 0, cursor: "pointer" }}
          title="Idioma"
          type="button"
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium"
            style={{ color: "var(--vp-muted)", background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
          >
            ES
          </span>
          <ChevronDown size={10} style={{ color: "var(--vp-muted)" }} />
        </button>

        <ThemeToggle compact />

        <a
          className="flex h-10 w-10 items-center justify-center rounded-full"
          href="/api/auth/logout"
          style={{ color: "var(--vp-muted)", background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
          title="Cerrar sesión"
        >
          <Power size={16} />
        </a>
      </div>
    </header>
  );
}
