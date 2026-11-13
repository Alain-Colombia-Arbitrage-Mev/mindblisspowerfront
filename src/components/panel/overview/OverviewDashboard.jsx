"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CreditCard,
  LifeBuoy,
  Plus,
  RefreshCw,
  UserRound,
} from "lucide-react";

import LanguageSwitcher from "@/i18n/LanguageSwitcher";
import { readMemberParts, validMemberSummary, validMemberTree } from "@/lib/member-read.mjs";
import { usePersonalWalletBalance } from "@/hooks/usePersonalWalletBalance";
import { personalCompanyPaymentAtomic } from "@/lib/personal-company-payment-values.mjs";
import PersonalWalletBalances from "@/components/wallet/PersonalWalletBalances";

import OverviewDiscoveryCard from "./OverviewDiscoveryCard";
import PositionSnapshotCard from "./PositionSnapshotCard";
import { useI18n } from "@/i18n/LanguageProvider";

const QUICK_ACTIONS = [
  { icon: CreditCard, label: "overview.payments", href: "/dashboard/payments" },
  { icon: UserRound, label: "overview.completeProfile", href: "/dashboard/profile" },
];

const RECHARGE_SEEN_KEY = "mindbliss:first-recharge-popup:v1";
const ReownRechargeDialog = dynamic(() => import("./ReownRechargeDialog"), { ssr: false });

export default function OverviewDashboard() {
  const { t } = useI18n();
  const polygonWallet = usePersonalWalletBalance('', 'polygon');
  const polygonBalance = personalCompanyPaymentAtomic(polygonWallet.balanceAtomic, true);
  const polygonReady = !polygonWallet.loading && !polygonWallet.error && /^0x[0-9a-f]{40}$/i.test(polygonWallet.walletAddress || "") && polygonBalance !== null;
  const emptyWallet = polygonReady && polygonBalance === 0n;
  const fundedWallet = polygonReady && polygonBalance > 0n;
  const [summary, setSummary] = useState(null);
  const [network, setNetwork] = useState(null);
  const [summaryStatus, setSummaryStatus] = useState("loading");
  const [networkStatus, setNetworkStatus] = useState("loading");
  const [errors, setErrors] = useState({ summary: null, network: null });
  const [rechargeDialog, setRechargeDialog] = useState({ open: false, step: "welcome" });
  const [reownLoaded, setReownLoaded] = useState(false);
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
    if (!emptyWallet || rechargeChecked.current) return;
    rechargeChecked.current = true;
    let seen = false;
    try { seen = sessionStorage.getItem(RECHARGE_SEEN_KEY) === "seen"; } catch { /* storage is optional */ }
    if (!seen) {
      try { sessionStorage.setItem(RECHARGE_SEEN_KEY, "seen"); } catch { /* storage is optional */ }
      setReownLoaded(true);
      setRechargeDialog({ open: true, step: "welcome" });
    }
  }, [emptyWallet]);

  useEffect(() => {
    if (fundedWallet) {
      setRechargeDialog(current => current.open ? { ...current, open: false } : current);
    }
  }, [fundedWallet]);

  const openRecharge = useCallback((step = "welcome") => {
    try { sessionStorage.setItem(RECHARGE_SEEN_KEY, "seen"); } catch { /* storage is optional */ }
    setReownLoaded(true);
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
          <LanguageSwitcher compact />
          <Link className="vp-shell-icon" href="/dashboard/profile" aria-label={t("pages.profile")} title={t("pages.profile")}><UserRound size={17} /></Link>
        </div>
      </header>

      <div className="mb-overview-primary">
        <div className="mb-overview-main-column">
          <section className="mb-wallet-card">
            <div className="mb-wallet-heading"><h2>{t("overview.wallet")}</h2><span>USDT</span></div>
            <PersonalWalletBalances showGasNotice={false} />
            <div className="mb-wallet-actions">
              <button className="executive-button primary" type="button" onClick={() => openRecharge("methods")}><Plus size={14} />{t("overview.topUp")}</button>
              <button className="executive-button" type="button" onClick={() => openRecharge("welcome")}>{t("overview.howItWorks")}<ArrowUpRight size={14} /></button>
            </div>
          </section>
          <section className="executive-card mb-membership-summary">
            <div className="mb-membership-header"><h2>{t("overview.myMemberships")}</h2><span>{summaryStatus === "ready" ? t("overview.updated") : t("overview.pending")}</span></div>
            <div className="mb-membership-count"><strong>{summaryStatus === "ready" ? String(summary?.active_packages ?? 0) : "—"}</strong><p>{summary?.active_packages === 1 ? t("overview.oneMembership") : t("overview.memberships")}</p></div>
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

      {reownLoaded ? <ReownRechargeDialog open={rechargeDialog.open} initialStep={rechargeDialog.step} onOpenChange={open => setRechargeDialog(current => ({ ...current, open }))} /> : null}
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
