"use client";

import {
  ArrowUpRight,
  History,
  LayoutDashboard,
  LogOut,
  Network,
  Trophy,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

import SidebarLogo from "./SidebarLogo";
import SidebarNavItem from "./SidebarNavItem";
import SidebarUserCard from "./SidebarUserCard";
import SidebarWalletCard from "./SidebarWalletCard";
import { matchesRoute } from "@/lib/member-navigation.mjs";
import LogoutButton from "./LogoutButton";
import { useI18n } from "@/i18n/LanguageProvider";

const NAV_GROUPS = [
  { label: "nav.account", items: [
    { icon: LayoutDashboard, label: "nav.summary", href: "/dashboard", exact: true, also: ["/dashboard/home"] },
    { icon: Wallet, label: "nav.wallet", href: "/dashboard/payments", exact: true, also: ["/dashboard/wallet-personal"] },
    { icon: History, label: "funding.history", href: "/dashboard/wallet-personal/requests" },
    { icon: ArrowUpRight, label: "companyPayment.transferAction", href: "/dashboard/wallet-personal/pay" },
  ] },
  { label: "nav.communityGroup", items: [
    { icon: Users, label: "nav.community", href: "/dashboard/referrals" },
    { icon: Network, label: "nav.referrals", href: "/dashboard/network", also: ["/dashboard/team"] },
    { icon: Trophy, label: "nav.ranks", href: "/dashboard/rank", also: ["/dashboard/ranks"] },
  ] },
  { label: "nav.settings", items: [
    { icon: UserRound, label: "nav.profile", href: "/dashboard/profile" },
  ] },
];

export default function PanelSidebar({ pathname, member, onNavigate = undefined }) {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col" style={{ background: "var(--vp-shell)" }}>
      <SidebarLogo onNavigate={onNavigate} />
      <SidebarWalletCard key={`${member?.subject || ''}:${member?.email || ''}`} onNavigate={onNavigate} />

      <nav aria-label={t("dashboard.memberNavigation")} className="vp-sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div className="vp-sidebar-nav-group" key={group.label}>
            <p>{t(group.label)}</p>
            {group.items.map((item) => (
              <SidebarNavItem
                key={item.href}
                icon={item.icon}
                label={t(item.label)}
                href={item.href}
                active={
                  (item.exact ? pathname === item.href : matchesRoute(pathname, item.href)) ||
                  (item.also?.some((prefix) => item.exact ? pathname === prefix : matchesRoute(pathname, prefix)) ?? false)
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
          {t("nav.logout")}
        </LogoutButton>
      </div>
    </div>
  );
}
