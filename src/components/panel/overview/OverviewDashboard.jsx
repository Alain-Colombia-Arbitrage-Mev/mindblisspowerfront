"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CreditCard, HandCoins, LifeBuoy, Network, RefreshCw } from "lucide-react";
import Link from "next/link";

import PanelFooter from "@/components/panel/PanelFooter";
import NOWPaymentsBalances from "@/components/panel/NOWPaymentsBalances";
import EarningsCard from "./EarningsCard";
import ReferralLinkCard from "./ReferralLinkCard";
import PositionSnapshotCard from "./PositionSnapshotCard";
import RecentSignupsCard from "./RecentSignupsCard";
import ShortcutPill from "./ShortcutPill";
import TopRanksCard from "./TopRanksCard";
import { readMemberParts, validMemberTree, validMemberSummary } from "@/lib/member-read.mjs";
import { formatPaymentMoney as usd } from "@/lib/payment-display.mjs";

const SHORTCUTS = [
  { icon: HandCoins, label: "Solicitar retiro", href: "/dashboard/withdrawals" },
  { icon: Network, label: "Ver mi red", href: "/dashboard/network" },
  { icon: CreditCard, label: "Mis pagos", href: "/dashboard/payments" },
];

/**
 * Overview del miembro con datos REALES:
 *  - saldo/billetera desde /api/payments/me; recuperación sin cierre ⇒ pendiente
 *  - red directa, últimos de la red y rangos desde /api/member/tree
 * Los fallos de carga no se representan como saldos o posiciones vacios.
 */
export default function OverviewDashboard({ plans = null }) {
  const [summary, setSummary] = useState(null);
  const [network, setNetwork] = useState(null);
  const [summaryStatus, setSummaryStatus] = useState("loading");
  const [networkStatus, setNetworkStatus] = useState("loading");
  const [errors, setErrors] = useState({ summary: null, network: null });
  const request = useRef(null);

  const load = useCallback(() => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setSummaryStatus("loading");
    setNetworkStatus("loading");
    setErrors({ summary: null, network: null });
    return readMemberParts({
      summary: { url: "/api/payments/me", validate: validMemberSummary },
      network: { url: "/api/member/tree?depth=4&limit=64", validate: validMemberTree },
    }, { signal: controller.signal, onPart: (key, result) => {
      if ([401, 403].includes(result.error?.status)) {
        setSummary(null); setNetwork(null); setSummaryStatus("error"); setNetworkStatus("error");
        setErrors({ summary: result.error, network: result.error });
        return;
      }
      const setData = key === "summary" ? setSummary : setNetwork;
      const setStatus = key === "summary" ? setSummaryStatus : setNetworkStatus;
      setData(result.data || null);
      setStatus(result.error ? "error" : "ready");
      setErrors(previous => ({ ...previous, [key]: result.error }));
    } });
  }, []);

  useEffect(() => {
    load();
    return () => request.current?.abort();
  }, [load]);

  const nodes = network?.positioned && Array.isArray(network.tree) ? network.tree : [];
  const directs = nodes.filter((n) => n.level === 1);

  const recentSignups = nodes.slice(0, 3).map((n) => {
    const branch = n.rootSide || n.side;
    return {
      name: n.name,
      date: `Nivel ${n.level} · ${branch === "L" ? "Rama izquierda" : branch === "R" ? "Rama derecha" : "Raíz"}`,
      pack: n.rank?.name || (n.status === "active" ? "Activo" : "Inactivo"),
      active: n.status === "active",
    };
  });

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
    <div className="vp-overview flex min-h-full flex-col" aria-busy={summaryStatus === "loading" || networkStatus === "loading"}>
      <div className="vp-overview-actions">
        <div className="vp-overview-shortcuts">{SHORTCUTS.map((shortcut) => <ShortcutPill key={shortcut.href} {...shortcut} />)}</div>
        <button className="vp-shell-icon" type="button" onClick={load} disabled={summaryStatus === "loading" || networkStatus === "loading"} aria-label="Actualizar resumen" title="Actualizar resumen"><RefreshCw size={17} /></button>
      </div>

      <div className="vp-overview-grid">
        {summaryStatus === "loading" ? <LoadingPanel label="Cargando billetera" /> : summaryStatus === "error" ? <ErrorPanel title="Billetera no disponible" error={errors.summary} onRetry={load} /> : <EarningsCard
          total={usd(summary?.wallet_balance_usd)}
          wallet={usd(summary?.available_for_withdrawal_usd)}
          directNetwork={directs.length}
          networkReady={networkStatus === "ready"}
          historical={summary?.data_source === "verified_stripe_recovery"}
        />}
        {networkStatus === "loading" ? <><LoadingPanel label="Cargando posición" /><LoadingPanel label="Cargando red" /></> : networkStatus === "error" ? <ErrorPanel title="Red no disponible" error={errors.network} onRetry={load} /> : <>
          <PositionSnapshotCard network={network} />
        <RecentSignupsCard
          signups={recentSignups}
          pendingCount={Math.max(0, nodes.length - recentSignups.length)}
          onRefresh={load}
          onSeeAll={() => window.location.assign("/dashboard/network")}
        />
        </>}
      </div>

      {summaryStatus === "ready" && <NOWPaymentsBalances data={summary?.nowpayments} />}

      <ReferralLinkCard />

      {plans}

      {/* Sin gráfica de "volumen": la directiva árbol 2.0 prohíbe mostrar
          volumen al miembro, y la curva anterior era simulada ($100M falsos). */}
      <div className="vp-overview-secondary">
        {networkStatus === "ready" ? <TopRanksCard ranks={topRanks} /> : null}
        <div className="vp-overview-support">
          <LifeBuoy size={22} style={{ color: "var(--vp-accent)" }} />
          <h2>Centro de soporte</h2>
          <p>Consulta tus solicitudes o contacta al equipo de atención.</p>
          <Link href="/dashboard/support" className="executive-button">Mis solicitudes</Link>
        </div>
      </div>

      <PanelFooter />
    </div>
  );
}

function LoadingPanel({ label }) {
  return <section className="vp-overview-loading" role="status" aria-label={label}><span className="sr-only">{label}</span><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /></section>;
}

function ErrorPanel({ title, error, onRetry }) {
  return <section className="vp-overview-error" role="alert"><AlertCircle size={22} style={{ color: "var(--vp-danger)" }} /><h2>{title}</h2><p>{error?.message || "No se pudieron consultar los datos. Intenta nuevamente."}</p>{error?.status === 401
    ? <Link href="/login" className="executive-button">Iniciar sesion</Link>
    : <button type="button" className="executive-button" onClick={onRetry}><RefreshCw size={15} />Reintentar</button>}</section>;
}
