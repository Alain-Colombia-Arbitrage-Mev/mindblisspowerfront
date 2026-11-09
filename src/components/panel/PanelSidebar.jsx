"use client";

import {
  LayoutDashboard,
  LogOut,
  Medal,
  Network,
  Package,
  User,
  Users,
  Wallet,
} from "lucide-react";

import SidebarLogo from "./SidebarLogo";
import SidebarNavItem from "./SidebarNavItem";
import SidebarUserCard from "./SidebarUserCard";
import SidebarWalletCard from "./SidebarWalletCard";
import { matchesRoute } from "@/lib/member-navigation.mjs";
import LogoutButton from "./LogoutButton";

const NAV_GROUPS = [
  { label: "CUENTA", items: [
    { icon: LayoutDashboard, label: "Resumen", href: "/dashboard", exact: true, also: ["/dashboard/home"] },
    { icon: Package, label: "Membresías", href: "/dashboard/packages" },
    { icon: Wallet, label: "Billetera y retiros", href: "/dashboard/withdrawals", also: ["/dashboard/payments"] },
  ] },
  { label: "COMUNIDAD", items: [
    { icon: Users, label: "Comunidad", href: "/dashboard/referrals" },
    { icon: Network, label: "Referidos por niveles", href: "/dashboard/network", also: ["/dashboard/team"] },
    { icon: Medal, label: "Rangos", href: "/dashboard/rank", also: ["/dashboard/ranks"] },
  ] },
  { label: "AJUSTES", items: [
    { icon: User, label: "Mi perfil", href: "/dashboard/profile" },
  ] },
];

export default function PanelSidebar({ pathname, member, onNavigate = undefined }) {
  return (
    <div className="flex h-full flex-col" style={{ background: "var(--vp-shell)" }}>
      <SidebarLogo onNavigate={onNavigate} />
      <SidebarWalletCard onNavigate={onNavigate} />

      <nav aria-label="Navegación del miembro" className="vp-sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div className="vp-sidebar-nav-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map((item) => (
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
            ))}
          </div>
        ))}
      </nav>

      <div className="vp-sidebar-footer">
        <SidebarUserCard name={member?.name} email={member?.email} onNavigate={onNavigate} />
        <LogoutButton
          className="vp-sidebar-logout"
          errorPlacement="above"
        >
          <LogOut size={16} aria-hidden="true" />
          Cerrar sesión
        </LogoutButton>
      </div>
    </div>
  );
}
