"use client";

import {
  CreditCard,
  LayoutDashboard,
  Mail,
  Medal,
  Network,
  ShieldCheck,
  Ticket,
  User,
  Wallet,
} from "lucide-react";

import SidebarLogo from "./SidebarLogo";
import SidebarNavGroup from "./SidebarNavGroup";
import SidebarNavItem from "./SidebarNavItem";
import SidebarUserCard from "./SidebarUserCard";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", exact: true },
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
  { icon: Ticket, label: "Coupons", href: "/dashboard/coupons" },
  { icon: Wallet, label: "Finance", href: "/dashboard/withdrawals" },
  { icon: CreditCard, label: "KYC", href: "/dashboard/kyc" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: Medal, label: "Ranks", href: "/dashboard/rank" },
  { icon: Network, label: "Team", href: "/dashboard/team" },
];

export default function PanelSidebar({ pathname, isAdmin, member, onNavigate }) {
  const items = isAdmin
    ? [...NAV_ITEMS, { icon: ShieldCheck, label: "Panel Admin", href: "/dashboard/admin" }]
    : NAV_ITEMS;

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--vp-shell)" }}>
      <SidebarLogo onNavigate={onNavigate} />

      <SidebarUserCard name={member?.name} email={member?.email} role={isAdmin ? "Administrator" : "Member"} />

      <nav className="mt-4 flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4 pt-2">
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
              active={item.exact ? pathname === item.href : pathname.startsWith(item.href)}
              onNavigate={onNavigate}
            />
          )
        )}
      </nav>
    </div>
  );
}
