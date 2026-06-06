"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  Cpu,
  Crown,
  DollarSign,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Mail,
  Menu,
  Network,
  Power,
  Search,
  Settings,
  Share2,
  ShoppingBag,
  TrendingUp,
  User,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import ThemeToggle from "../../_components/ThemeToggle";

const sections = [
  {
    section: "OPERACIONES",
    items: [
      { icon: Home, label: "Home", href: "/dashboard" },
      { icon: Cpu, label: "War Room", href: "/dashboard/war-room" },
      { icon: Network, label: "Red Binaria", href: "/dashboard/network" },
      { icon: Users, label: "Equipo Pro", href: "/dashboard/team" },
    ],
  },
  {
    section: "RED & CRECIMIENTO",
    items: [{ icon: Share2, label: "Referidos", href: "/dashboard/referrals" }],
  },
  {
    section: "INTELIGENCIA",
    items: [
      { icon: Zap, label: "IA Asesor", href: "/dashboard/ai" },
      { icon: Power, label: "Auto Mode", href: "/dashboard/auto" },
      { icon: DollarSign, label: "Bonuses", href: "/dashboard/bonificaciones" },
      { icon: TrendingUp, label: "Rango Pro", href: "/dashboard/rank" },
      { icon: Activity, label: "Actividad", href: "/dashboard/activity" },
    ],
  },
  {
    section: "FINANZAS",
    items: [{ icon: Wallet, label: "Retiros", href: "/dashboard/withdrawals" }],
  },
  {
    section: "COMUNICACION",
    items: [{ icon: Mail, label: "Mensajes", href: "/dashboard/communications" }],
  },
  {
    section: "ACCESO",
    items: [
      { icon: ShoppingBag, label: "Productos", href: "/dashboard/products" },
      { icon: User, label: "Perfil", href: "/dashboard/profile" },
      { icon: HelpCircle, label: "Soporte", href: "/dashboard/support" },
      { icon: FileText, label: "Centro Legal", href: "/dashboard/legal" },
    ],
  },
];

export default function DashboardShell({ authMode, children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "var(--vp-bg)" }}>
      <header
        className="flex shrink-0 items-center justify-between gap-3 border-b px-3 py-3 sm:px-4 lg:px-6"
        style={{
          borderColor: "var(--vp-border)",
          background: "var(--vp-shell)",
        }}
      >
        <div className="flex min-w-0 items-center gap-3 lg:gap-6">
          <button
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-dashboard-nav"
            aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:hidden"
            style={{ color: "var(--vp-muted)", background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
            title="Menu"
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
              <Crown size={15} style={{ color: "var(--vp-amber)" }} />
              <h1
                className="vp-display truncate"
                style={{ color: "var(--vp-text)", fontSize: 15, margin: 0, maxWidth: 170 }}
              >
                Javier Demo MVP
              </h1>
            </div>
            <div className="min-w-0" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span
                className="truncate"
                style={{
                  color: "var(--vp-amber)",
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  maxWidth: 170,
                }}
              >
                Embajador Corona
              </span>
              <span className="hidden sm:inline" style={{ color: "var(--vp-subtle)", fontSize: 9 }}>
                •
              </span>
              <span className="hidden sm:inline" style={{ color: "var(--vp-muted)", fontSize: 10, fontWeight: 600 }}>
                Plan: Elite
              </span>
            </div>
          </div>

          <div className="hidden gap-5 border-l pl-5 md:flex" style={{ borderColor: "var(--vp-border)" }}>
            {[
              { label: "RED ACTIVA", value: 9 },
              { label: "ACTIVOS", value: 8 },
            ].map((stat) => (
              <div key={stat.label}>
                <p
                  style={{
                    color: "var(--vp-subtle)",
                    fontSize: 9,
                    margin: "0 0 2px 0",
                    letterSpacing: "0.12em",
                    fontWeight: 700,
                  }}
                >
                  {stat.label}
                </p>
                <p className="vp-display" style={{ color: "var(--vp-amber)", fontSize: 17, margin: 0 }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative hidden overflow-hidden md:block" style={{ width: 180 }}>
            <input
              type="text"
              placeholder="Buscar en tu red..."
              style={{
                width: "100%",
                padding: "7px 12px 7px 32px",
                borderRadius: 8,
                background: "var(--vp-surface)",
                border: "1px solid var(--vp-border)",
                color: "var(--vp-text)",
                fontSize: 11,
                outline: "none",
              }}
            />
            <Search
              size={12}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--vp-subtle)",
              }}
            />
          </div>

          <button
            className="relative hidden rounded-lg p-2 sm:block"
            style={{ color: "var(--vp-muted)", background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
            type="button"
            title="Notificaciones"
          >
            <Bell size={17} />
            <span
              style={{
                position: "absolute",
                top: -3,
                right: -3,
                background: "var(--vp-accent)",
                color: "#06110f",
                fontSize: 9,
                fontWeight: 800,
                width: 17,
                height: 17,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid var(--vp-shell)",
              }}
            >
              2
            </span>
          </button>

          <ThemeToggle compact />

          <Link
            href="/dashboard/profile"
            className="hidden rounded-lg p-2 sm:block"
            style={{ color: "var(--vp-muted)", background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
            title="Configuracion"
          >
            <Settings size={17} />
          </Link>

          <a
            href="/api/auth/logout"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold sm:w-auto sm:px-4 sm:py-2"
            style={{
              background: "var(--vp-surface)",
              color: "var(--vp-muted)",
              border: "1px solid var(--vp-border)",
            }}
          >
            <LogOut size={13} />
            <span className="hidden md:inline" style={{ fontSize: 11, fontWeight: 600 }}>
              Salir
            </span>
          </a>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              aria-label="Cerrar menu"
              className="absolute inset-0 h-full w-full"
              style={{ background: "rgba(0,0,0,0.38)" }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside
              id="mobile-dashboard-nav"
              className="absolute left-0 top-0 flex h-full w-[min(84vw,320px)] flex-col border-r"
              style={{ borderColor: "var(--vp-border)", background: "var(--vp-shell)", boxShadow: "var(--vp-shadow)" }}
            >
              <DashboardNav
                authMode={authMode}
                pathname={pathname}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </aside>
          </div>
        )}

        <aside
          className="hidden h-full w-56 shrink-0 flex-col border-r md:flex"
          style={{ borderColor: "var(--vp-border)", background: "var(--vp-shell)" }}
        >
          <DashboardNav authMode={authMode} pathname={pathname} />
        </aside>

        <main className="vp-dashboard-main flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function DashboardNav({ authMode, pathname, onNavigate }) {
  return (
    <>
      <div className="border-b px-5 py-5" style={{ borderColor: "var(--vp-border)" }}>
        <div className="vp-display" style={{ fontSize: 16, marginBottom: 7, lineHeight: 1 }}>
          <span style={{ color: "var(--vp-text)" }}>Mindbliss </span>
          <span style={{ color: "var(--vp-amber)" }}>Power</span>
        </div>
        <div
          style={{
            display: "inline-block",
            background: "var(--vp-accent-muted)",
            border: "1px solid var(--vp-accent-border)",
            borderRadius: 20,
            padding: "2px 8px",
          }}
        >
          <span
            style={{
              color: "var(--vp-accent)",
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            {authMode === "cognito" ? "Cognito" : "Acceso demo"}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.section} className="mb-5">
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: "var(--vp-subtle)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: 5,
                paddingLeft: 12,
              }}
            >
              {section.section}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate} style={{ textDecoration: "none", display: "block" }}>
                    <div
                      className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2"
                      style={{
                        background: active ? "var(--vp-accent-muted)" : "transparent",
                        color: active ? "var(--vp-accent)" : "var(--vp-muted)",
                        borderLeft: `2px solid ${active ? "var(--vp-accent)" : "transparent"}`,
                        paddingLeft: 11,
                        position: "relative",
                      }}
                    >
                      <Icon size={15} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, letterSpacing: "0.01em" }}>
                        {item.label}
                      </span>
                      {active && (
                        <span
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: "var(--vp-accent)",
                            marginLeft: "auto",
                          }}
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t px-4 py-4" style={{ borderColor: "var(--vp-border)" }}>
        <div style={{ fontSize: 9, color: "var(--vp-subtle)", textAlign: "center", lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 2px 0", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em" }}>
            Mindbliss Power
          </p>
          <p style={{ margin: 0, fontWeight: 500 }}>Member Platform v2.0</p>
        </div>
      </div>
    </>
  );
}
