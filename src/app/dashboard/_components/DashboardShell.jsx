"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import PanelHeader from "@/components/panel/PanelHeader";
import PanelSidebar from "@/components/panel/PanelSidebar";
import NavigationDrawer from "@/components/panel/NavigationDrawer";
import { memberPageKeysFor } from "@/lib/member-navigation.mjs";
import { MemberSessionContext } from "@/lib/member-session-context";
import { browserRequestDeadline } from "@/lib/browser-request-deadline.mjs";
import { useI18n } from "@/i18n/LanguageProvider";
import "@/components/panel/panel-shell.css";

/** Administrative portal shell: authentication never starts a personal wallet or community request. */
export default function DashboardShell({ authMode: _authMode, children }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [member, setMember] = useState(null);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const controller = new AbortController();
    const deadline = browserRequestDeadline(controller.signal, 12000);
    void fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin", redirect: "error", signal: deadline.signal })
      .then(response => response.ok ? response.json() : null)
      .then(session => {
        if (deadline.signal.aborted) return;
        if (session?.authenticated === true && typeof session.email === "string" && session.email)
          setMember({ name: session.name, email: session.email, subject: session.subject });
      }).catch(() => {}).finally(() => deadline.dispose());
    const onProfileUpdated = event => {
      const name = event?.detail?.name;
      if (typeof name === "string" && name) setMember(current => current ? { ...current, name } : current);
    };
    window.addEventListener("vp:profile-updated", onProfileUpdated);
    return () => { controller.abort(); deadline.dispose(); window.removeEventListener("vp:profile-updated", onProfileUpdated); };
  }, []);

  const pageKeys = memberPageKeysFor(pathname);
  const overview = pathname === "/dashboard" || pathname === "/dashboard/home";
  return <MemberSessionContext.Provider value={member}>
    <div className="vp-dashboard-shell">
      <a className="vp-skip-link" href="#member-main">{t("dashboard.skipToContent")}</a>
      <NavigationDrawer open={mobileMenuOpen} onClose={closeMenu}>
        <PanelSidebar pathname={pathname} member={member} onNavigate={closeMenu} />
      </NavigationDrawer>
      <aside className="vp-panel-sidebar"><PanelSidebar pathname={pathname} member={member} /></aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PanelHeader title={t(pageKeys.title)} section={t(pageKeys.section)} overview={overview}
          mobileMenuOpen={mobileMenuOpen} onToggleMobileMenu={() => setMobileMenuOpen(current => !current)} />
        <main id="member-main" tabIndex={-1} className="vp-dashboard-main flex-1 overflow-y-auto">
          <div className="vp-dashboard-content">{children}</div>
        </main>
      </div>
    </div>
  </MemberSessionContext.Provider>;
}
