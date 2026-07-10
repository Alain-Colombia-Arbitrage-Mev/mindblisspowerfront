"use client";

import { CreditCard, HandCoins, Network } from "lucide-react";

import PanelFooter from "@/components/panel/PanelFooter";
import EarningsCard from "@/components/panel/overview/EarningsCard";
import PerformanceChartCard from "@/components/panel/overview/PerformanceChartCard";
import RecentSignupsCard from "@/components/panel/overview/RecentSignupsCard";
import ShortcutPill from "@/components/panel/overview/ShortcutPill";
import TicketsTodayCard from "@/components/panel/overview/TicketsTodayCard";
import TopRanksCard from "@/components/panel/overview/TopRanksCard";

const SHORTCUTS = [
  { icon: HandCoins, label: "Solicitar Retiro", href: "/dashboard/withdrawals" },
  { icon: Network, label: "Ver Árbol de Red", href: "/dashboard/network" },
  { icon: CreditCard, label: "Gestionar Pagos", href: "/dashboard/payments" },
];

const RECENT_SIGNUPS = [
  { name: "Antonio Lara López", date: "19/01/2026", pack: "Pack 7", active: true },
  { name: "Alicia Orocio Baltazar", date: "09/11/2025", pack: "Pack 7", active: true },
  { name: "Susana Martínez M.", date: "09/07/2025", pack: "Pack 6", active: false },
];

const TOP_RANKS = [
  { tier: "diamond", name: "Diamond", username: "joseramos77", position: 1 },
  { tier: "emerald", name: "Emerald", username: "ana23", position: 2 },
  { tier: "sapphire", name: "Sapphire", username: "mfmartinez", position: 3 },
  { tier: "gold", name: "Gold", username: "ayala60", position: 5 },
];

export default function DashboardPage() {
  return (
    <div className="relative flex min-h-full flex-col gap-8 p-6 lg:p-10">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-4xl rounded-full"
        style={{ background: "var(--vp-accent)", opacity: 0.04, filter: "blur(100px)" }}
      />

      <div className="flex flex-wrap gap-4">
        {SHORTCUTS.map((shortcut) => (
          <ShortcutPill key={shortcut.href} {...shortcut} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <EarningsCard total="$0.00" wallet="$0.00" directNetwork={1} />
        <RecentSignupsCard signups={RECENT_SIGNUPS} pendingCount={425} />
        <TicketsTodayCard pendingCount={0} />
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        <PerformanceChartCard />
        <TopRanksCard ranks={TOP_RANKS} />
      </div>

      <PanelFooter />
    </div>
  );
}
