"use client";

import { Building2, Copy, CreditCard, Info, Loader2, PlusCircle, ReceiptText, RefreshCw, ShieldCheck, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { useMemberSummary } from "@/hooks/useMemberSummary";
import { useI18n } from "@/i18n/LanguageProvider";
import { isRecoverySummary } from "@/lib/member-read.mjs";
import { formatPaymentDate as fmtMoneyDate, formatPaymentMoney as money } from "@/lib/payment-display.mjs";
import NOWPaymentsBalances from "@/components/panel/NOWPaymentsBalances";
import StripeSalesHistory from "../../packages/StripeSalesHistory";
import { MetricCard, PageHeader, StatusPill } from "./executive-ui";
import StablecoinOnrampForm from "./StablecoinOnrampForm";
import { useReownWallet } from "@/components/reown/ReownContext";
import { ensureAdministrativeWallet, readAdministrativeWallet } from "@/lib/administrative-wallet.mjs";

const ReownProvider = dynamic(() => import("@/components/reown/ReownProvider"), {
  ssr: false,
  loading: () => <WalletProviderLoading />,
});

const PAYMENT_STATUS = {
  activated: { label: "financePage.statusActivated", tone: "success" },
  paid: { label: "financePage.statusPaid", tone: "success" },
  needs_placement: { label: "financePage.statusPending", tone: "warning" },
  created: { label: "financePage.statusStarted", tone: "warning" },
  failed: { label: "financePage.statusFailed", tone: "danger" },
  expired: { label: "financePage.statusExpired", tone: "muted" },
  refunded: { label: "financePage.statusRefunded", tone: "muted" },
};

export function FinanceDashboardPage() {
  return <ReownProvider><FinanceDashboardContent /></ReownProvider>;
}

function FinanceDashboardContent() {
  const { t } = useI18n();
  const { state, reload } = useMemberSummary();

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader eyebrow={t("walletPage.eyebrow")} title={t("walletPage.title")} subtitle={t("walletPage.subtitle")} />
        <section id="personal-wallet" className="mb-personal-wallet-section">
          <TopUpPanel />
        </section>

        <div id="wallet-finance" className="mb-wallet-finance">
          {state.loading ? <FinanceLoading /> : state.error ? <FinanceError onRetry={reload} /> : <FinanceContent data={state.data || {}} />}
        </div>
        <AdministrativeWalletPanel />
      </div>
    </section>
  );
}

function WalletProviderLoading() {
  const { t } = useI18n();
  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader eyebrow={t("walletPage.eyebrow")} title={t("walletPage.title")} subtitle={t("walletPage.subtitle")} />
        <div className="executive-panel flex items-center justify-center gap-2 py-16 text-sm" style={{ color: "var(--vp-muted)" }} role="status">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          {t("walletPage.loading")}
        </div>
      </div>
    </section>
  );
}

function FinanceLoading() {
  const { t } = useI18n();
  return (
    <>
      <div className="executive-grid metrics mb-6">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="executive-card">
            <div className="mb-5 flex items-start justify-between gap-4">
              <span className="skeleton-line" style={{ width: "60%", height: 12, borderRadius: 6, background: "var(--vp-surface-raised)" }} />
              <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--vp-surface-raised)" }} />
            </div>
            <div className="skeleton-line" style={{ width: "45%", height: 26, borderRadius: 8, background: "var(--vp-surface-raised)" }} />
          </div>
        ))}
      </div>
      <div className="executive-panel flex items-center justify-center gap-2 py-16 text-sm" style={{ color: "var(--vp-muted)" }}>
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        {t("walletPage.loading")}
      </div>
    </>
  );
}

function FinanceError({ onRetry }) {
  const { t } = useI18n();
  return (
    <div className="executive-panel flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--vp-info-muted)", border: "1px solid var(--vp-info-border)", color: "var(--vp-info)" }}>
        <Info size={22} aria-hidden="true" />
      </span>
      <div>
        <p className="text-base font-bold" style={{ color: "var(--vp-text)" }}>{t("walletPage.summaryUnavailable")}</p>
        <p className="mt-1 text-sm" style={{ color: "var(--vp-muted)" }}>{t("walletPage.summaryUnavailableCopy")}</p>
      </div>
      <button className="executive-button primary" type="button" onClick={onRetry}>{t("walletPage.retry")}</button>
    </div>
  );
}

function FinanceContent({ data }) {
  const { t } = useI18n();
  const recovered = isRecoverySummary(data);
  const payments = Array.isArray(data.payments) ? data.payments : [];
  const pendingPayments = payments.filter((payment) => payment.status === "created" || payment.status === "needs_placement").length;
  const history = payments.map((payment) => ({
    key: `pay-${payment.purchase_id}`,
    date: payment.created_at,
    type: "financePage.membership",
    amount: payment.total_usd,
    status: PAYMENT_STATUS[payment.status] || PAYMENT_STATUS.created,
  })).sort((left, right) => (new Date(right.date || 0)).getTime() - (new Date(left.date || 0)).getTime());

  return (
    <>
      <div className="executive-grid metrics mb-6">
        <MetricCard label={t("walletPage.balance")} value={money(data.wallet_balance_usd)} detail={t("walletPage.balanceCopy")} icon={Wallet} tone="success" />
        <MetricCard label={t("walletPage.activeMemberships")} value={String(data.active_packages ?? 0)} detail={t("walletPage.activeMembershipsCopy")} icon={CreditCard} tone="info" />
        <MetricCard label={t("walletPage.registeredPayments")} value={String(payments.length)} detail={t("walletPage.registeredPaymentsCopy")} icon={ReceiptText} tone="accent" />
        <MetricCard label={t("walletPage.pendingPayments")} value={String(pendingPayments)} detail={t("walletPage.pendingPaymentsCopy")} icon={Info} tone="muted" />
      </div>

      {recovered && (
        <div role="status" className="executive-panel mb-6 text-sm" style={{ color: "var(--vp-muted)" }}>
          {t("walletPage.recoveryNotice")}
          <StripeSalesHistory sales={data.stripe_sales} />
        </div>
      )}

      <NOWPaymentsBalances data={data.nowpayments} />

      <div className="executive-panel mt-6">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h2 className="executive-section-title mb-0">
              <ReceiptText size={18} style={{ color: "var(--vp-accent)" }} />
              {t("walletPage.history")}
            </h2>
          </div>
          <div className="executive-table-wrap">
            {history.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: "var(--vp-muted)" }}>{t("walletPage.noMovements")}</p>
            ) : (
              <table className="executive-table">
                <thead><tr><th>{t("financePage.date")}</th><th>{t("financePage.type")}</th><th>{t("financePage.amount")}</th><th>{t("financePage.status")}</th></tr></thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.key}>
                      <td>{fmtMoneyDate(row.date)}</td>
                      <td>{t(row.type)}</td>
                      <td>{money(row.amount)}</td>
                      <td><StatusPill tone={row.status.tone}>{t(row.status.label)}</StatusPill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
      </div>
    </>
  );
}

function TopUpPanel() {
  const { t } = useI18n();
  const reown = useReownWallet();
  const [providerError, setProviderError] = useState("");
  const busy = ["connecting", "linking", "opening"].includes(reown.onrampStatus);
  const openProvider = async input => {
    setProviderError("");
    try {
      await reown.startOnramp(input);
    } catch {
      setProviderError(t("walletPage.quoteUnavailable"));
    }
  };

  return (
    <div id="wallet-topup" className="executive-panel mb-wallet-topup-card" style={{ scrollMarginTop: 20 }}>
      <div className="mb-wallet-topup-heading">
        <span><PlusCircle size={20} aria-hidden="true" /></span>
        <div>
          <p>{t("walletPage.personalEyebrow")}</p>
          <h2>{t("walletPage.personalTitle")}</h2>
          <small>{t("walletPage.personalCopy")}</small>
        </div>
      </div>
      <StablecoinOnrampForm walletAddress={reown.address || reown.linkedAddress || ""} busy={busy} onContinue={openProvider} />
      <div className="mb-wallet-provider-note">
        <ShieldCheck size={16} aria-hidden="true" />
        <p>{t("onramp.simpleProviderNote")}</p>
      </div>
      {providerError ? <p className="mt-3 text-xs" role="alert" style={{ color: "var(--vp-danger)" }}>{providerError}</p> : null}
    </div>
  );
}

function AdministrativeWalletPanel() {
  const { t } = useI18n();
  const reown = useReownWallet();
  const [wallet, setWallet] = useState({ status: "loading", address: "", checkoutReference: "", assignedAt: "" });
  const [actionError, setActionError] = useState("");

  const loadWallet = async (signal) => {
    setActionError("");
    setWallet(current => ({ ...current, status: "loading" }));
    try {
      let next = await readAdministrativeWallet({ signal });
      if (next.status === "pending") next = await ensureAdministrativeWallet({ signal });
      setWallet(next);
    } catch (error) {
      if (error?.name !== "AbortError") setWallet({ status: "error", address: "", checkoutReference: "", assignedAt: "" });
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadWallet(controller.signal);
    return () => controller.abort();
  }, []);

  async function topUp(input) {
    if (wallet.status !== "assigned") return;
    setActionError("");
    try {
      await reown.startAdministrativeOnramp({ address: wallet.address, ...input });
    } catch { setActionError(t("walletPage.quoteUnavailable")); }
  }

  async function copyAddress() {
    if (wallet.status !== "assigned") return;
    try { await navigator.clipboard.writeText(wallet.address); }
    catch { setActionError(t("walletPage.administrativeCopyFailed")); }
  }

  const busy = reown.administrativeOnrampStatus === "opening";
  return (
    <section id="administrative-wallet" className="mb-administrative-wallet" aria-labelledby="administrative-wallet-title">
      <div className="mb-administrative-wallet-heading">
        <span className="mb-administrative-wallet-icon"><Building2 size={20} aria-hidden="true" /></span>
        <div>
          <p>{t("walletPage.administrativeEyebrow")}</p>
          <h2 id="administrative-wallet-title">{t("walletPage.administrativeTitle")}</h2>
          <small>{t("walletPage.administrativeCopy")}</small>
        </div>
        <span className={`mb-administrative-wallet-status ${wallet.status === "assigned" ? "ready" : ""}`}>
          {wallet.status === "assigned" ? t("walletPage.administrativeReady")
            : wallet.status === "exhausted" ? t("walletPage.administrativeUnavailable")
              : t("walletPage.administrativeAssigning")}
        </span>
      </div>
      {wallet.status === "loading" ? (
        <div className="mb-administrative-wallet-state" role="status"><Loader2 className="animate-spin" size={18} /> {t("walletPage.administrativeAssigning")}</div>
      ) : wallet.status === "error" ? (
        <div className="mb-administrative-wallet-state error" role="alert">
          <span>{t("walletPage.administrativeLoadError")}</span>
          <button className="executive-button" type="button" onClick={() => loadWallet()}><RefreshCw size={14} /> {t("walletPage.retry")}</button>
        </div>
      ) : wallet.status === "exhausted" ? (
        <div className="mb-administrative-wallet-state" role="status">{t("walletPage.administrativeExhaustedCopy")}</div>
      ) : (
        <div className="mb-administrative-wallet-body">
          <div className="mb-administrative-wallet-address">
            <span>{t("walletPage.administrativeAddress")}</span>
            <code title={wallet.address}>{wallet.address}</code>
            <button type="button" onClick={copyAddress} aria-label={t("walletPage.copyAddress")}><Copy size={15} /></button>
          </div>
          <div className="mb-administrative-wallet-summary">
            <span>{t("onramp.administrativeRoute")}</span><strong>USDT · Polygon</strong>
            <small>{t("onramp.administrativeProviderCopy")}</small>
          </div>
          <StablecoinOnrampForm walletAddress={wallet.address} busy={busy} onContinue={topUp} />
          <p className="mb-administrative-wallet-separation"><ShieldCheck size={15} /> {t("walletPage.administrativeSeparation")}</p>
        </div>
      )}
      {actionError ? <p className="mb-reown-wallet-error" role="alert">{actionError}</p> : null}
    </section>
  );
}
