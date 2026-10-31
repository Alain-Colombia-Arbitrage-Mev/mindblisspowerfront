"use client";

import {
  LayoutDashboard,
  LogOut,
  Mail,
  Medal,
  Network,
  Package,
  Ticket,
  User,
  Wallet,
} from "lucide-react";

import SidebarLogo from "./SidebarLogo";
import SidebarNavGroup from "./SidebarNavGroup";
import SidebarNavItem from "./SidebarNavItem";
import SidebarUserCard from "./SidebarUserCard";
import { matchesRoute } from "@/lib/member-navigation.mjs";
import LogoutButton from "./LogoutButton";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Resumen", href: "/dashboard", exact: true, also: ["/dashboard/home"] },
  {
    icon: Mail,
    label: "Comunidad",
    items: [
      { label: "Mensajes", href: "/dashboard/communications", exact: true },
      { label: "Noticias", href: "/dashboard/communications/news" },
      { label: "Soporte", href: "/dashboard/support" },
      { label: "Testimonios", href: "/dashboard/communications/testimonials" },
    ],
  },
  { icon: Package, label: "Membresías", href: "/dashboard/packages" },
  { icon: Ticket, label: "Cupones", href: "/dashboard/coupons" },
  { icon: Wallet, label: "Billetera y retiros", href: "/dashboard/withdrawals" },
  { icon: User, label: "Mi perfil", href: "/dashboard/profile" },
  { icon: Medal, label: "Rangos", href: "/dashboard/rank", also: ["/dashboard/ranks"] },
  { icon: Network, label: "Mi red", href: "/dashboard/network", also: ["/dashboard/team"] },
];

export default function PanelSidebar({ pathname, member, onNavigate = undefined }) {
  return (
    <div className="flex h-full flex-col" style={{ background: "var(--vp-shell)" }}>
      <SidebarLogo onNavigate={onNavigate} />

      <SidebarUserCard name={member?.name} email={member?.email} onNavigate={onNavigate} />

      <nav aria-label="Navegación del miembro" className="vp-sidebar-nav">
        {NAV_ITEMS.map((item) =>
          item.items ? (
            <SidebarNavGroup
              key={item.label}
              icon={item.icon}
              label={item.label}
              items={item.items}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ) : (
            <SidebarNavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={
                (item.exact ? pathname === item.href : matchesRoute(pathname, item.href)) ||
                (item.also?.some((prefix) => matchesRoute(pathname, prefix)) ?? false)
              }
              onNavigate={onNavigate}
            />
          )
        )}
      </nav>

      <div className="border-t p-4" style={{ borderColor: "var(--vp-border)" }}>
        <LogoutButton
          className="vp-sidebar-link w-full"
          errorPlacement="above"
          style={{ color: "#f87171" }}
        >
          <LogOut size={16} aria-hidden="true" />
          Cerrar sesión
        </LogoutButton>
      </div>
    </div>
  );
}
