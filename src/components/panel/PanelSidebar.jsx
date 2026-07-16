"use client";

import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Mail,
  Medal,
  Network,
  Package,
  ShieldCheck,
  Ticket,
  User,
  Wallet,
  Wrench,
} from "lucide-react";

import SidebarLogo from "./SidebarLogo";
import SidebarNavGroup from "./SidebarNavGroup";
import SidebarNavItem from "./SidebarNavItem";
import SidebarUserCard from "./SidebarUserCard";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", exact: true, also: ["/dashboard/home"] },
  {
    icon: Mail,
    label: "Communication",
    items: [
      { label: "Internal Messages", href: "/dashboard/communications", exact: true },
      { label: "Internal News", href: "/dashboard/communications/news" },
      { label: "Support Tickets", href: "/dashboard/support" },
      { label: "Testimonials", href: "/dashboard/communications/testimonials" },
    ],
  },
  { icon: Package, label: "Membresías", href: "/dashboard/packages" },
  { icon: Ticket, label: "Coupons", href: "/dashboard/coupons" },
  { icon: Wallet, label: "Finance", href: "/dashboard/withdrawals" },
  { icon: CreditCard, label: "KYC", href: "/dashboard/kyc" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: Medal, label: "Ranks", href: "/dashboard/rank" },
  { icon: Network, label: "Team / Network", href: "/dashboard/network", also: ["/dashboard/team"] },
  { icon: Wrench, label: "Tools", href: "/dashboard/tools" },
];

export default function PanelSidebar({ pathname, isAdmin, member, onNavigate }) {
  const items = isAdmin
    ? [...NAV_ITEMS, { icon: ShieldCheck, label: "Panel Admin", href: "/dashboard/admin" }]
    : NAV_ITEMS;

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--vp-shell)" }}>
      <SidebarLogo onNavigate={onNavigate} />

      <SidebarUserCard name={member?.name} email={member?.email} role={isAdmin ? "Administrator" : "Member"} />

      <nav className="mt-4 flex flex-1 flex-col gap-2 overflow-y-auto px-4 pt-2">
        {items.map((item) =>
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
                (item.exact ? pathname === item.href : pathname.startsWith(item.href)) ||
                (item.also?.some((prefix) => pathname.startsWith(prefix)) ?? false)
              }
              onNavigate={onNavigate}
            />
          )
        )}
      </nav>

      <div className="border-t p-4" style={{ borderColor: "var(--vp-border)" }}>
        <a
          className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium no-underline"
          href="/api/auth/logout"
          style={{ color: "#f87171" }}
        >
          <LogOut size={16} />
          Sign Out
        </a>
      </div>
    </div>
  );
}
