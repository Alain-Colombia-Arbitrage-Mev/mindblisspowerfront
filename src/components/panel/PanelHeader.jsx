"use client";

import Link from "./IntentLink";
import { LifeBuoy, Mail, Menu, Power, UserRound } from "lucide-react";
import ThemeToggle from "@/app/_components/ThemeToggle";
import LogoutButton from "./LogoutButton";

export default function PanelHeader({
  title,
  section,
  mobileMenuOpen,
  onToggleMobileMenu,
}) {
  return (
    <header className="vp-panel-header">
      <div className="vp-panel-heading">
        <button
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-dashboard-nav"
          aria-label="Abrir menú"
          className="vp-shell-icon vp-mobile-menu"
          title="Abrir menú"
          type="button"
          onClick={onToggleMobileMenu}
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="vp-panel-section">{section}</p>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="vp-panel-actions">
        <Link
          className="vp-shell-icon vp-desktop-action"
          href="/dashboard/communications"
          aria-label="Mensajes"
          title="Mensajes"
        >
          <Mail size={18} />
        </Link>
        <Link
          className="vp-shell-icon vp-desktop-action"
          href="/dashboard/support"
          aria-label="Soporte"
          title="Soporte"
        >
          <LifeBuoy size={18} />
        </Link>
        <Link
          className="vp-shell-icon"
          href="/dashboard/profile"
          aria-label="Mi perfil"
          title="Mi perfil"
        >
          <UserRound size={18} />
        </Link>
        <LogoutButton
          className="vp-shell-icon vp-desktop-action"
        >
          <Power size={18} aria-hidden="true" />
        </LogoutButton>
        <ThemeToggle />
      </div>
    </header>
  );
}
