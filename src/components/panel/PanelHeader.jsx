"use client";

import Link from "./IntentLink";
import { Menu, UserRound } from "lucide-react";
import ThemeToggle from "@/app/_components/ThemeToggle";
import LanguageSwitcher from "@/i18n/LanguageSwitcher";
import { useI18n } from "@/i18n/LanguageProvider";

export default function PanelHeader({
  title,
  section,
  overview = false,
  mobileMenuOpen,
  onToggleMobileMenu,
}) {
  const { t } = useI18n();
  return (
    <header className={`vp-panel-header${overview ? " vp-overview-mobile-header" : ""}`}>
      <div className="vp-panel-heading">
        <button
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-dashboard-nav"
          aria-label={t("dashboard.openMenu")}
          className="vp-shell-icon vp-mobile-menu"
          title={t("dashboard.openMenu")}
          type="button"
          onClick={onToggleMobileMenu}
        >
          <Menu size={20} />
        </button>
        {!overview ? <div className="vp-panel-title">
          <p className="vp-panel-section">{section}</p>
          <h1 title={title}>{title}</h1>
        </div> : null}
      </div>
      <div className="vp-panel-actions">
        <LanguageSwitcher compact />
        <ThemeToggle />
        <Link
          className="vp-shell-icon vp-profile-action"
          href="/dashboard/profile"
          aria-label={t("pages.profile")}
          title={t("pages.profile")}
        >
          <UserRound size={18} />
        </Link>
      </div>
    </header>
  );
}
