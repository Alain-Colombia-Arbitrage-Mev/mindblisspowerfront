"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import PanelHeader from "@/components/panel/PanelHeader";
import PanelSidebar from "@/components/panel/PanelSidebar";
import NavigationDrawer from "@/components/panel/NavigationDrawer";
import { memberPageFor } from "@/lib/member-navigation.mjs";
import { MemberSessionContext } from "@/lib/member-session-context";
import "@/components/panel/panel-shell.css";

export default function DashboardShell({ authMode, children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [member, setMember] = useState(null);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const loadSession = () => {
      fetch("/api/auth/session", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return;
          if (d?.name || d?.email)
            setMember({
              name: d.name,
              email: d.email,
              subject: d.subject,
              referralCode: d.referralCode,
            });
        })
        .catch(() => {});
    };
    loadSession();
    // Al editar el perfil (nombre/datos) se dispara este evento con el nombre
    // nuevo → actualizamos el sidebar de INMEDIATO (optimista) y re-consultamos
    // la sesión para confirmar, sin recargar la página.
    const onProfileUpdated = (e) => {
      const newName = e?.detail?.name;
      // Solo actualización optimista con el nombre guardado. NO re-consultamos la
      // sesión aquí: el POST ya confirmó el guardado, y una re-consulta podría
      // devolver un nombre stale (lag de réplica/cache) y pisar el valor nuevo.
      // La sesión se sincroniza sola en el próximo montaje/navegación.
      if (newName) setMember((m) => ({ ...(m || {}), name: newName }));
    };
    window.addEventListener("vp:profile-updated", onProfileUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("vp:profile-updated", onProfileUpdated);
    };
  }, []);

  const { title, section } = memberPageFor(pathname);

  return (
    <MemberSessionContext.Provider value={member}>
      <div className="vp-dashboard-shell">
        <a className="vp-skip-link" href="#member-main">
          Ir al contenido
        </a>
        <NavigationDrawer open={mobileMenuOpen} onClose={closeMenu}>
          <PanelSidebar
            pathname={pathname}
            member={member}
            onNavigate={closeMenu}
          />
        </NavigationDrawer>
        <aside className="vp-panel-sidebar">
          <PanelSidebar pathname={pathname} member={member} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <PanelHeader
            title={title}
            section={section}
            mobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={() => setMobileMenuOpen((current) => !current)}
          />
          <main
            id="member-main"
            tabIndex={-1}
            className="vp-dashboard-main flex-1 overflow-y-auto"
          >
            {children}
          </main>
        </div>
      </div>
    </MemberSessionContext.Provider>
  );
}
