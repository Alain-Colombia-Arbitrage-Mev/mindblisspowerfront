"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, HandCoins, Network } from "lucide-react";

import PanelFooter from "@/components/panel/PanelFooter";
import EarningsCard from "./EarningsCard";
import RecentSignupsCard from "./RecentSignupsCard";
import ShortcutPill from "./ShortcutPill";
import TicketsTodayCard from "./TicketsTodayCard";
import TopRanksCard from "./TopRanksCard";

const SHORTCUTS = [
  { icon: HandCoins, label: "Solicitar Retiro", href: "/dashboard/withdrawals" },
  { icon: Network, label: "Ver Árbol de Red", href: "/dashboard/network" },
  { icon: CreditCard, label: "Gestionar Pagos", href: "/dashboard/payments" },
];

function usd(value) {
  return `$${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Overview del miembro con datos REALES:
 *  - saldo/billetera desde /api/payments/me (vp-payments; migración 2.0 ⇒ $0.00)
 *  - red directa, últimos de la red y rangos desde /api/member/tree
 * Sin datos simulados: si un endpoint falla se muestran ceros/listas vacías.
 */
export default function OverviewDashboard() {
  const [summary, setSummary] = useState(null);
  const [network, setNetwork] = useState(null);

  const load = useCallback(() => {
    fetch("/api/payments/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && !d.error) setSummary(d); })
      .catch(() => {});
    fetch("/api/member/tree", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && !d.error) setNetwork(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const nodes = network?.positioned ? network.tree : [];
  const directs = nodes.filter((n) => n.level === 1);

  const recentSignups = nodes.slice(0, 3).map((n) => ({
    name: n.name,
    date: `Nivel ${n.level} · ${n.side === "L" ? "Izquierda" : "Derecha"}`,
    pack: n.rank?.name || (n.status === "active" ? "Activo" : "Inactivo"),
    active: n.status === "active",
  }));

  const topRanks = nodes
    .filter((n) => n.rank)
    .slice(0, 4)
    .map((n, i) => ({
      tier: String(n.rank.code || "gold").toLowerCase(),
      name: n.rank.name,
      username: n.name,
      position: i + 1,
    }));

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
        <EarningsCard
          total={usd(summary?.wallet_balance_usd)}
          wallet={usd(summary?.available_for_withdrawal_usd)}
          directNetwork={directs.length}
        />
        <RecentSignupsCard
          signups={recentSignups}
          pendingCount={Math.max(0, nodes.length - recentSignups.length)}
          onRefresh={load}
          onSeeAll={() => window.location.assign("/dashboard/network")}
        />
        <TicketsTodayCard pendingCount={0} />
      </div>

      {/* Sin gráfica de "volumen": la directiva árbol 2.0 prohíbe mostrar
          volumen al miembro, y la curva anterior era simulada ($100M falsos). */}
      <div className="flex flex-col gap-6 xl:flex-row">
        <TopRanksCard ranks={topRanks} />
      </div>

      <PanelFooter />
    </div>
  );
}
