"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  Bell,
  Crown,
  DollarSign,
  FileText,
  HelpCircle,
  Home,
  IdCard,
  LogOut,
  Mail,
  Menu,
  Network,
  Package,
  Power,
  Receipt,
  Search,
  ShieldCheck,
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
    section: "OPERACION",
    items: [
      { icon: Home, label: "Dashboard", href: "/dashboard" },
      { icon: Network, label: "Red", href: "/dashboard/network" },
      { icon: Users, label: "Equipo Pro", href: "/dashboard/team" },
    ],
  },
  {
    section: "CRECIMIENTO",
    items: [
      { icon: Share2, label: "Referidos", href: "/dashboard/referrals" },
      { icon: Zap, label: "IA Asesor", href: "/dashboard/ai" },
      { icon: Power, label: "Auto Mode", href: "/dashboard/auto" },
      { icon: TrendingUp, label: "Rangos", href: "/dashboard/rank" },
      { icon: Activity, label: "Actividad", href: "/dashboard/activity" },
    ],
  },
  {
    section: "FINANZAS",
    items: [
      { icon: Package, label: "Paquetes", href: "/dashboard/packages" },
      { icon: Receipt, label: "Mis pagos", href: "/dashboard/payments" },
      { icon: Wallet, label: "Finanzas", href: "/dashboard/withdrawals" },
      { icon: DollarSign, label: "Bonuses", href: "/dashboard/bonificaciones" },
    ],
  },
  {
    section: "ACCESO",
    items: [
      { icon: Mail, label: "Comunicacion", href: "/dashboard/communications" },
      { icon: IdCard, label: "KYC", href: "/dashboard/kyc" },
      { icon: ShoppingBag, label: "Productos", href: "/dashboard/products" },
      { icon: User, label: "Perfil", href: "/dashboard/profile" },
      { icon: HelpCircle, label: "Soporte", href: "/dashboard/support" },
      { icon: FileText, label: "Legal", href: "/dashboard/legal" },
    ],
  },
];

export default function DashboardShell({ authMode, children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [memberName, setMemberName] = useState("");
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
        if (d?.name) setMemberName(d.name);
        if (d?.isAdmin) setIsAdmin(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "var(--vp-bg)", color: "var(--vp-text)" }}>
      <header
        className="flex h-20 shrink-0 items-center justify-between gap-3 border-b px-3 sm:px-5 lg:h-24 lg:px-7"
        style={{ borderColor: "var(--vp-border)", background: "var(--vp-shell)" }}
      >
        <div className="flex min-w-0 items-center gap-3 lg:gap-7">
          <button
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-dashboard-nav"
            aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl md:hidden"
            style={{ color: "var(--vp-muted)", background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
            title="Menu"
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            <Menu size={20} />
          </button>

          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Crown size={16} style={{ color: "var(--vp-accent)" }} />
              <h1 className="truncate text-sm font-bold sm:text-base" style={{ color: "var(--vp-text)", maxWidth: 220 }}>
                {memberName || "Mi cuenta"}
              </h1>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className="truncate text-[10px] font-extrabold uppercase"
                style={{ color: "var(--vp-accent)", letterSpacing: "0.14em", maxWidth: 190 }}
              >
                Embajador Corona
              </span>
              <span className="hidden text-[10px] font-semibold sm:inline" style={{ color: "var(--vp-muted)" }}>
                Plan Elite
              </span>
            </div>
          </div>

          <div className="hidden gap-7 border-l pl-7 md:flex" style={{ borderColor: "var(--vp-border)" }}>
            {[
              { label: "RED ACTIVA", value: 9 },
              { label: "ACTIVOS", value: 8 },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="mb-1 text-[9px] font-bold uppercase" style={{ color: "var(--vp-muted)", letterSpacing: "0.14em" }}>
                  {stat.label}
                </p>
                <p className="m-0 text-lg font-bold" style={{ color: "var(--vp-accent)" }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="relative hidden md:block" style={{ width: 230 }}>
            <input
              aria-label="Buscar en tu red"
              className="h-10 w-full rounded-xl pl-10 pr-3 text-sm"
              placeholder="Buscar en tu red..."
              style={{
                background: "var(--vp-surface)",
                border: "1px solid var(--vp-border)",
                color: "var(--vp-text)",
                outline: "none",
              }}
              type="text"
            />
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--vp-muted)",
              }}
            />
          </div>

          <button
            className="relative hidden h-11 w-11 items-center justify-center rounded-full sm:flex"
            style={{ color: "var(--vp-muted)", background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
            type="button"
            title="Notificaciones"
          >
            <Bell size={18} />
            <span
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold"
              style={{ background: "var(--vp-accent)", color: "#0a0a0a", border: "1.5px solid var(--vp-shell)" }}
            >
              2
            </span>
          </button>

          <ThemeToggle compact />

          <Link
            href="/dashboard/profile"
            className="hidden h-11 w-11 items-center justify-center rounded-full sm:flex"
            style={{ color: "var(--vp-muted)", background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
            title="Configuracion"
          >
            <Settings size={18} />
          </Link>

          <a
            href="/api/auth/logout"
            className="flex h-11 w-11 items-center justify-center gap-2 rounded-full text-sm font-bold sm:w-auto sm:px-5"
            style={{ background: "var(--vp-surface)", color: "var(--vp-text-soft)", border: "1px solid var(--vp-border)" }}
          >
            <LogOut size={15} />
            <span className="hidden md:inline">Salir</span>
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
              style={{ background: "rgba(0,0,0,0.55)" }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside
              id="mobile-dashboard-nav"
              className="absolute left-0 top-0 flex h-full w-[min(86vw,320px)] flex-col border-r"
              style={{ borderColor: "var(--vp-border)", background: "var(--vp-shell)", boxShadow: "var(--vp-shadow)" }}
            >
              <DashboardNav authMode={authMode} pathname={pathname} isAdmin={isAdmin} onNavigate={() => setMobileMenuOpen(false)} />
            </aside>
          </div>
        )}

        <aside
          className="hidden h-full w-72 shrink-0 flex-col border-r md:flex"
          style={{ borderColor: "var(--vp-border)", background: "var(--vp-shell)" }}
        >
          <DashboardNav authMode={authMode} pathname={pathname} isAdmin={isAdmin} />
        </aside>

        <main className="vp-dashboard-main flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function DashboardNav({ authMode, pathname, isAdmin, onNavigate }) {
  const navSections = isAdmin
    ? [...sections, { section: "ADMINISTRACION", items: [{ icon: ShieldCheck, label: "Panel Admin", href: "/dashboard/admin" }] }]
    : sections;
  return (
    <>
      <div className="border-b px-6 py-6" style={{ borderColor: "var(--vp-border)" }}>
        <Link href="/dashboard" className="flex items-center gap-3 no-underline" onClick={onNavigate}>
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
            style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}
          >
            <Image
              src="/mindbliss/mindbliss-symbol.png"
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover"
              priority
            />
          </span>
          <span className="flex flex-col">
            <span className="text-xl font-extrabold leading-none" style={{ color: "var(--vp-text)" }}>
              Mindbliss
            </span>
            <span className="text-[11px] font-bold uppercase" style={{ color: "var(--vp-accent)", letterSpacing: "0.2em" }}>
              Power
            </span>
          </span>
        </Link>
        <div className="mt-5 inline-flex rounded-full px-3 py-1" style={{ background: "var(--vp-accent-muted)", border: "1px solid var(--vp-accent-border)" }}>
          <span className="text-[9px] font-extrabold uppercase" style={{ color: "var(--vp-accent)", letterSpacing: "0.12em" }}>
            {authMode === "cognito" ? "Acceso seguro" : "Acceso demo"}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        {navSections.map((section) => (
          <div key={section.section} className="mb-6">
            <div
              className="mb-2 px-3 text-[10px] font-bold uppercase"
              style={{ color: "var(--vp-subtle)", letterSpacing: "0.16em" }}
            >
              {section.section}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate} className="block no-underline">
                    <div
                      className="flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5"
                      style={{
                        background: active ? "var(--vp-accent-muted)" : "transparent",
                        color: active ? "var(--vp-accent)" : "var(--vp-muted)",
                        borderLeft: `2px solid ${active ? "var(--vp-accent)" : "transparent"}`,
                      }}
                    >
                      <Icon size={17} style={{ flexShrink: 0 }} />
                      <span className="text-sm font-semibold">{item.label}</span>
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: "var(--vp-accent)" }} />}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t px-5 py-5" style={{ borderColor: "var(--vp-border)" }}>
        <div className="flex items-center gap-3 rounded-2xl p-4 text-left" style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}>
          <Image
            src="/mindbliss/mindbliss-symbol.png"
            alt=""
            width={34}
            height={34}
            className="h-8 w-8 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <p className="mb-1 truncate text-[10px] font-extrabold uppercase" style={{ color: "var(--vp-text)", letterSpacing: "0.14em" }}>
              Mindbliss Power
            </p>
            <p className="m-0 truncate text-[11px] font-medium" style={{ color: "var(--vp-muted)" }}>
              Member Platform v2.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
