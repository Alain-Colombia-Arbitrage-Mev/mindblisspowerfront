"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CreditCard,
  LifeBuoy,
  Network,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";

import NOWPaymentsBalances from "@/components/panel/NOWPaymentsBalances";
import PanelFooter from "@/components/panel/PanelFooter";
import { readMemberParts, validMemberSummary, validMemberTree } from "@/lib/member-read.mjs";
import { formatPaymentMoney as usd } from "@/lib/payment-display.mjs";

import EarningsCard from "./EarningsCard";
import OverviewDiscoveryCard from "./OverviewDiscoveryCard";
import PositionSnapshotCard from "./PositionSnapshotCard";
import RecentSignupsCard from "./RecentSignupsCard";
import TopRanksCard from "./TopRanksCard";

const QUICK_ACTIONS = [
  { icon: CreditCard, label: "Ver mis movimientos", href: "/dashboard/payments" },
  { icon: Network, label: "Explorar mi red", href: "/dashboard/network" },
  { icon: Users, label: "Invitar a mi comunidad", href: "/dashboard/referrals" },
];

export default function OverviewDashboard({ plans = null }) {
  const router = useRouter();
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
        setSummary(null);
        setNetwork(null);
        setSummaryStatus("error");
        setNetworkStatus("error");
        setErrors({ summary: result.error, network: result.error });
        return;
      }
      const setData = key === "summary" ? setSummary : setNetwork;
      const setStatus = key === "summary" ? setSummaryStatus : setNetworkStatus;
      setData(result.data || null);
      setStatus(result.error ? "error" : "ready");
      setErrors((previous) => ({ ...previous, [key]: result.error }));
    } });
  }, []);

  useEffect(() => {
    load();
    return () => request.current?.abort();
  }, [load]);

  const nodes = network?.positioned && Array.isArray(network.tree) ? network.tree : [];
  const directs = nodes.filter((node) => node.level === 1);
  const recentSignups = nodes.slice(0, 3).map((node) => {
    const branch = node.rootSide || node.side;
    return {
      name: node.name,
      date: `Nivel ${node.level} · ${branch === "L" ? "Rama izquierda" : branch === "R" ? "Rama derecha" : "Raíz"}`,
      pack: node.rank?.name || (node.status === "active" ? "Activo" : "Inactivo"),
      active: node.status === "active",
    };
  });
  const topRanks = nodes.filter((node) => node.rank).slice(0, 4).map((node, index) => ({
    tier: String(node.rank.code || "gold").toLowerCase(),
    name: node.rank.name,
    username: node.name,
    position: index + 1,
  }));

  return (
    <div className="vp-overview flex min-h-full flex-col" aria-busy={summaryStatus === "loading" || networkStatus === "loading"}>
      <header className="mb-overview-heading">
        <div>
          <h1>Tu espacio Mindbliss</h1>
          <p>Lo más importante de tu cuenta, en un solo lugar.</p>
        </div>
        <button className="vp-shell-icon" type="button" onClick={load} disabled={summaryStatus === "loading" || networkStatus === "loading"} aria-label="Actualizar resumen" title="Actualizar resumen">
          <RefreshCw size={17} />
        </button>
      </header>

      <div className="mb-overview-primary">
        {summaryStatus === "loading" ? <LoadingPanel label="Cargando wallet" /> : summaryStatus === "error" ? <ErrorPanel title="Wallet no disponible" error={errors.summary} onRetry={load} /> : (
          <EarningsCard total={usd(summary?.wallet_balance_usd)} wallet={usd(summary?.available_for_withdrawal_usd)} directNetwork={directs.length} networkReady={networkStatus === "ready"} historical={summary?.data_source === "verified_stripe_recovery"} />
        )}
        <OverviewDiscoveryCard />
      </div>

      <div className="mb-overview-membership-grid">
        <section className="executive-card mb-membership-summary">
          <div>
            <p className="executive-card-label">Mis membresías</p>
            <h2>{summaryStatus === "ready" ? String(summary?.active_packages ?? 0) : "—"}</h2>
            <p>{summary?.active_packages ? "Membresías activas en tu cuenta." : "Tu próxima membresía puede empezar aquí."}</p>
          </div>
          <Link className="executive-button" href="/dashboard/packages">Revisar mis membresías <ArrowRight size={14} /></Link>
        </section>
        <section className="executive-card mb-membership-cta">
          <Sparkles size={20} aria-hidden="true" />
          <div><p className="executive-card-label">Empieza con claridad</p><h2>Elige el plan que encaja contigo</h2><p>Compara beneficios, condiciones y precios vigentes.</p></div>
          <Link className="executive-button primary" href="/dashboard/packages">Conocer membresías <ArrowRight size={14} /></Link>
        </section>
      </div>

      <div className="mb-overview-network-grid">
        {networkStatus === "loading" ? <LoadingPanel label="Cargando posición" /> : networkStatus === "error" ? <ErrorPanel title="Red no disponible" error={errors.network} onRetry={load} /> : <PositionSnapshotCard network={network} />}
        <section className="executive-card mb-quick-actions">
          <p className="executive-card-label">Acciones rápidas</p>
          {QUICK_ACTIONS.map(({ icon: Icon, label, href }) => <Link key={href} href={href}><Icon size={16} /><span>{label}</span><ArrowRight size={14} /></Link>)}
        </section>
      </div>

      {summaryStatus === "ready" ? <NOWPaymentsBalances data={summary?.nowpayments} /> : null}

      <div className="mb-overview-plans">{plans}</div>

      {networkStatus === "ready" ? <div className="vp-overview-secondary">
        <RecentSignupsCard signups={recentSignups} pendingCount={Math.max(0, nodes.length - recentSignups.length)} onRefresh={load} onSeeAll={() => router.push("/dashboard/network")} />
        <TopRanksCard ranks={topRanks} />
      </div> : null}

      <section className="mb-support-strip">
        <LifeBuoy size={20} aria-hidden="true" />
        <div><h2>Centro de soporte</h2><p>Revisa respuestas rápidas o habla con soporte cuando lo necesites.</p></div>
        <Link href="/dashboard/support">Abrir soporte <ArrowRight size={14} /></Link>
      </section>

      <PanelFooter />
    </div>
  );
}

function LoadingPanel({ label }) {
  return <section className="vp-overview-loading" role="status" aria-label={label}><span className="sr-only">{label}</span><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /></section>;
}

function ErrorPanel({ title, error, onRetry }) {
  return <section className="vp-overview-error" role="alert"><AlertCircle size={22} style={{ color: "var(--vp-danger)" }} /><h2>{title}</h2><p>{error?.message || "No se pudieron consultar los datos. Intenta nuevamente."}</p>{error?.status === 401
    ? <Link href="/login" className="executive-button">Iniciar sesión</Link>
    : <button type="button" className="executive-button" onClick={onRetry}><RefreshCw size={15} />Reintentar</button>}</section>;
}
