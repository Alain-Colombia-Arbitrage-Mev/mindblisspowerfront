"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CreditCard,
  Headphones,
  LifeBuoy,
  RefreshCw,
  UserRound,
} from "lucide-react";

import ThemeToggle from "@/app/_components/ThemeToggle";
import { readMemberParts, validMemberSummary, validMemberTree } from "@/lib/member-read.mjs";
import { formatPaymentMoney as usd } from "@/lib/payment-display.mjs";

import EarningsCard from "./EarningsCard";
import OverviewDiscoveryCard from "./OverviewDiscoveryCard";
import PositionSnapshotCard from "./PositionSnapshotCard";
import { useI18n } from "@/i18n/LanguageProvider";

const QUICK_ACTIONS = [
  { icon: CreditCard, label: "overview.payments", href: "/dashboard/payments" },
  { icon: UserRound, label: "overview.completeProfile", href: "/dashboard/profile" },
];

export default function OverviewDashboard() {
  const { t } = useI18n();
  const localWalletPreview = process.env.NODE_ENV === "development";
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

  const unavailable = summaryStatus === "error" || networkStatus === "error";

  return (
    <div className="vp-overview flex min-h-full flex-col" aria-busy={summaryStatus === "loading" || networkStatus === "loading"}>
      <header className="mb-overview-heading">
        <div>
          <h1>{t("overview.title")}</h1>
          <p>{t("overview.subtitle")}</p>
        </div>
        <div className="mb-overview-tools" aria-label="Herramientas del resumen">
          <button className="vp-shell-icon vp-header-pill" type="button" onClick={load} disabled={summaryStatus === "loading" || networkStatus === "loading"} aria-label="Actualizar resumen" title="Actualizar resumen">
            <RefreshCw size={16} /><span>{t("common.update")}</span>
          </button>
          <Link className="vp-shell-icon" href="/dashboard/support" aria-label="Centro de ayuda" title="Centro de ayuda"><Headphones size={17} /></Link>
          <ThemeToggle />
          <Link className="vp-shell-icon" href="/dashboard/profile" aria-label="Abrir mi cuenta" title="Abrir mi cuenta"><UserRound size={17} /></Link>
        </div>
      </header>

      <div className="mb-overview-primary">
        <div className="mb-overview-main-column">
          {localWalletPreview ? <EarningsCard total="$120,456.50" ready preview /> : summaryStatus === "loading" ? <LoadingPanel label="Cargando wallet" /> : summaryStatus === "error" ? <ErrorPanel title="Wallet no disponible" error={errors.summary} onRetry={load} /> : (
            <EarningsCard
              total={Number(summary?.wallet_balance_usd) > 0 ? usd(summary.wallet_balance_usd) : "—"}
              ready={Number(summary?.wallet_balance_usd) > 0}
              historical={summary?.data_source === "verified_stripe_recovery"}
            />
          )}
          <section className="executive-card mb-membership-summary">
            <div className="mb-membership-header"><h2>{t("overview.myMemberships")}</h2><span>{summaryStatus === "ready" ? t("overview.updated") : t("overview.pending")}</span></div>
            <div className="mb-membership-count"><strong>{summaryStatus === "ready" ? String(summary?.active_packages ?? 0) : "—"}</strong><p>{summary?.active_packages === 1 ? t("overview.oneMembership") : t("overview.memberships")}</p></div>
            <Link className="executive-button" href="/dashboard/packages">{t("overview.reviewMembership")} <ArrowRight size={14} /></Link>
          </section>
        </div>
        <OverviewDiscoveryCard />
      </div>

      <div className="mb-overview-network-grid">
        {networkStatus === "loading" ? <LoadingPanel label="Cargando posición" /> : networkStatus === "error" ? <ErrorPanel title="Red no disponible" error={errors.network} onRetry={load} /> : <PositionSnapshotCard network={network} />}
        <section className="executive-card mb-quick-actions">
          <h2>{t("overview.quickAccess")}</h2>
          {QUICK_ACTIONS.map(({ icon: Icon, label, href }) => <Link key={href} href={href}><Icon size={16} /><span>{t(label)}</span><ArrowRight size={14} /></Link>)}
        </section>
      </div>

      {unavailable ? <section className="mb-overview-availability" role="status">
        <LifeBuoy size={20} aria-hidden="true" />
        <div><h2>{t("overview.syncing")}</h2><p>{t("overview.syncingCopy")}</p></div>
      </section> : null}

      <p className="mb-overview-footnote">{t("overview.question")}</p>
    </div>
  );
}

function LoadingPanel({ label }) {
  return <section className="vp-overview-loading" role="status" aria-label={label}><span className="sr-only">{label}</span><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /></section>;
}

function ErrorPanel({ title, error, onRetry }) {
  const restricted = [401, 403].includes(error?.status);
  const heading = restricted ? title : title.replace("no disponible", "en sincronización");
  return <section className="vp-overview-error" role={restricted ? "alert" : "status"}><AlertCircle size={22} style={{ color: restricted ? "var(--vp-danger)" : "var(--vp-info)" }} /><h2>{heading}</h2><p>{error?.message || "Los datos aparecerán cuando finalice la actualización."}</p>{error?.status === 401
    ? <Link href="/login" className="executive-button">Iniciar sesión</Link>
    : <button type="button" className="executive-button" onClick={onRetry}><RefreshCw size={15} />Actualizar</button>}</section>;
}
