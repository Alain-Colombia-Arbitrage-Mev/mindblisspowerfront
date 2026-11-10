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
import LanguageSwitcher from "@/i18n/LanguageSwitcher";
import { readMemberParts, validMemberSummary, validMemberTree } from "@/lib/member-read.mjs";
import { formatPaymentMoney as usd } from "@/lib/payment-display.mjs";

import EarningsCard from "./EarningsCard";
import FirstRechargeDialog from "./FirstRechargeDialog";
import OverviewDiscoveryCard from "./OverviewDiscoveryCard";
import PositionSnapshotCard from "./PositionSnapshotCard";
import { useI18n } from "@/i18n/LanguageProvider";

const QUICK_ACTIONS = [
  { icon: CreditCard, label: "overview.payments", href: "/dashboard/payments" },
  { icon: UserRound, label: "overview.completeProfile", href: "/dashboard/profile" },
];

const RECHARGE_SEEN_KEY = "mindbliss:first-recharge-popup:v1";

export default function OverviewDashboard() {
  const { t } = useI18n();
  const localWalletPreview = process.env.NODE_ENV === "development";
  const [summary, setSummary] = useState(null);
  const [network, setNetwork] = useState(null);
  const [summaryStatus, setSummaryStatus] = useState("loading");
  const [networkStatus, setNetworkStatus] = useState("loading");
  const [errors, setErrors] = useState({ summary: null, network: null });
  const [rechargeDialog, setRechargeDialog] = useState({ open: false, step: "welcome" });
  const request = useRef(null);
  const rechargeChecked = useRef(false);

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

  useEffect(() => {
    if (summaryStatus !== "ready" || Number(summary?.wallet_balance_usd) > 0 || rechargeChecked.current) return;
    rechargeChecked.current = true;
    let seen = false;
    try { seen = sessionStorage.getItem(RECHARGE_SEEN_KEY) === "seen"; } catch { /* storage is optional */ }
    if (!seen) {
      try { sessionStorage.setItem(RECHARGE_SEEN_KEY, "seen"); } catch { /* storage is optional */ }
      setRechargeDialog({ open: true, step: "welcome" });
    }
  }, [summary?.wallet_balance_usd, summaryStatus]);

  useEffect(() => {
    if (summaryStatus === "ready" && Number(summary?.wallet_balance_usd) > 0) {
      setRechargeDialog(current => current.open ? { ...current, open: false } : current);
    }
  }, [summary?.wallet_balance_usd, summaryStatus]);

  const openRecharge = useCallback((step = "welcome") => {
    try { sessionStorage.setItem(RECHARGE_SEEN_KEY, "seen"); } catch { /* storage is optional */ }
    setRechargeDialog({ open: true, step });
  }, []);

  const unavailable = summaryStatus === "error" || networkStatus === "error";

  return (
    <div className="vp-overview flex min-h-full flex-col" aria-busy={summaryStatus === "loading" || networkStatus === "loading"}>
      <header className="mb-overview-heading">
        <div>
          <h1>{t("overview.title")}</h1>
          <p>{t("overview.subtitle")}</p>
        </div>
        <div className="mb-overview-tools" aria-label={t("dashboard.overviewTools")}>
          <button className="vp-shell-icon vp-header-pill" type="button" onClick={load} disabled={summaryStatus === "loading" || networkStatus === "loading"} aria-label={t("dashboard.refreshOverview")} title={t("dashboard.refreshOverview")}>
            <RefreshCw size={16} /><span>{t("common.update")}</span>
          </button>
          <Link className="vp-shell-icon" href="/dashboard/support" aria-label={t("pages.support")} title={t("pages.support")}><Headphones size={17} /></Link>
          <LanguageSwitcher compact />
          <ThemeToggle />
          <Link className="vp-shell-icon" href="/dashboard/profile" aria-label={t("pages.profile")} title={t("pages.profile")}><UserRound size={17} /></Link>
        </div>
      </header>

      <div className="mb-overview-primary">
        <div className="mb-overview-main-column">
          {localWalletPreview ? <EarningsCard total="$120,456.50" ready preview onRecharge={openRecharge} /> : summaryStatus === "loading" ? <LoadingPanel label={t("dashboard.loadingWallet")} /> : summaryStatus === "error" ? <ErrorPanel title={t("dashboard.walletUnavailable")} syncingTitle={t("dashboard.walletSyncing")} error={errors.summary} onRetry={load} /> : (
            <EarningsCard
              total={Number(summary?.wallet_balance_usd) > 0 ? usd(summary.wallet_balance_usd) : "—"}
              ready={Number(summary?.wallet_balance_usd) > 0}
              historical={summary?.data_source === "verified_stripe_recovery"}
              onRecharge={openRecharge}
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
        {networkStatus === "loading" ? <LoadingPanel label={t("dashboard.loadingPosition")} /> : networkStatus === "error" ? <ErrorPanel title={t("dashboard.networkUnavailable")} syncingTitle={t("dashboard.networkSyncing")} error={errors.network} onRetry={load} /> : <PositionSnapshotCard network={network} />}
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
      <FirstRechargeDialog open={rechargeDialog.open} initialStep={rechargeDialog.step} onOpenChange={open => setRechargeDialog(current => ({ ...current, open }))} />
    </div>
  );
}

function LoadingPanel({ label }) {
  return <section className="vp-overview-loading" role="status" aria-label={label}><span className="sr-only">{label}</span><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /></section>;
}

function ErrorPanel({ title, syncingTitle, error, onRetry }) {
  const { t } = useI18n();
  const restricted = [401, 403].includes(error?.status);
  const heading = restricted ? title : syncingTitle;
  return <section className="vp-overview-error" role={restricted ? "alert" : "status"}><AlertCircle size={22} style={{ color: restricted ? "var(--vp-danger)" : "var(--vp-info)" }} /><h2>{heading}</h2><p>{error?.message || t("dashboard.dataAfterUpdate")}</p>{error?.status === 401
    ? <Link href="/login" className="executive-button">{t("dashboard.signIn")}</Link>
    : <button type="button" className="executive-button" onClick={onRetry}><RefreshCw size={15} />{t("common.update")}</button>}</section>;
}
