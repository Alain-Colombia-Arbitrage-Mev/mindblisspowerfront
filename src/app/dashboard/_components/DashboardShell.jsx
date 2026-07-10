"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import PanelHeader from "@/components/panel/PanelHeader";
import PanelSidebar from "@/components/panel/PanelSidebar";

const PAGE_TITLES = [
  { prefix: "/dashboard/communications/news", title: "Internal News" },
  { prefix: "/dashboard/communications/testimonials", title: "Testimonials" },
  { prefix: "/dashboard/communications", title: "Internal Messages" },
  { prefix: "/dashboard/support", title: "Support Tickets" },
  { prefix: "/dashboard/coupons", title: "Coupons" },
  { prefix: "/dashboard/withdrawals", title: "Finance" },
  { prefix: "/dashboard/kyc", title: "KYC" },
  { prefix: "/dashboard/profile", title: "Profile" },
  { prefix: "/dashboard/rank", title: "Ranks" },
  { prefix: "/dashboard/team", title: "Team" },
  {
    prefix: "/dashboard/network",
    title: "Motor de Crecimiento • Red Binaria",
    subtitle:
      "Cada persona que invitas construye tu red. Comparte tu código de referido con intención y convierte cada invitación en un activo permanente de tu estructura binaria.",
  },
  { prefix: "/dashboard/tools", title: "Tools", subtitle: "Configuraciones" },
  { prefix: "/dashboard/admin", title: "Panel Admin" },
];

function pageTitleFor(pathname) {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/home")) {
    return { title: "Overview", subtitle: "Bienvenido de vuelta, gestiona tu red hoy." };
  }
  const match = PAGE_TITLES.find((entry) => pathname.startsWith(entry.prefix));
  return { title: match?.title ?? "Dashboard", subtitle: match?.subtitle ?? null };
}

export default function DashboardShell({ authMode, children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [member, setMember] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.name || d?.email) setMember({ name: d.name, email: d.email });
        if (d?.isAdmin) setIsAdmin(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const { title, subtitle } = pageTitleFor(pathname);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--vp-bg)", color: "var(--vp-text)" }}>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menu"
            className="absolute inset-0 h-full w-full"
            style={{ background: "rgba(0,0,0,0.55)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            id="mobile-dashboard-nav"
            className="absolute left-0 top-0 h-full w-[min(86vw,320px)] border-r"
            style={{ borderColor: "var(--vp-border)", boxShadow: "var(--vp-shadow)" }}
          >
            <PanelSidebar
              pathname={pathname}
              isAdmin={isAdmin}
              member={member}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </aside>
        </div>
      )}

      <aside
        className="hidden h-full w-72 shrink-0 border-r md:block"
        style={{ borderColor: "var(--vp-border)" }}
      >
        <PanelSidebar pathname={pathname} isAdmin={isAdmin} member={member} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PanelHeader
          title={title}
          subtitle={subtitle}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((current) => !current)}
        />
        <main className="vp-dashboard-main flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
