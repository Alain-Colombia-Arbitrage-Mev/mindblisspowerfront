"use client";

import Link from "next/link";
import { CreditCard, Info, Loader2, PlusCircle, ReceiptText, Wallet } from "lucide-react";

import { useMemberSummary } from "@/hooks/useMemberSummary";
import { useI18n } from "@/i18n/LanguageProvider";
import { isRecoverySummary } from "@/lib/member-read.mjs";
import { formatPaymentDate as fmtMoneyDate, formatPaymentMoney as money } from "@/lib/payment-display.mjs";
import NOWPaymentsBalances from "@/components/panel/NOWPaymentsBalances";
import StripeSalesHistory from "../../packages/StripeSalesHistory";
import { MetricCard, PageHeader, StatusPill } from "./executive-ui";
import WalletGettingStarted from "./WalletGettingStarted";

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
  const { t } = useI18n();
  const { state, reload } = useMemberSummary();

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader eyebrow={t("walletPage.eyebrow")} title={t("walletPage.title")} subtitle={t("walletPage.subtitle")} />
        <WalletGettingStarted />

        <div id="wallet-finance" className="mb-wallet-finance">
          {state.loading ? <FinanceLoading /> : state.error ? <FinanceError onRetry={reload} /> : <FinanceContent data={state.data || {}} />}
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
        <p className="text-base font-bold" style={{ color: "var(--vp-text)" }}>{t("walletPage.syncing")}</p>
        <p className="mt-1 text-sm" style={{ color: "var(--vp-muted)" }}>{t("walletPage.syncingCopy")}</p>
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
        <TopUpPanel />
        <div className="executive-panel">
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
      </div>
    </>
  );
}

function TopUpPanel() {
  const { t } = useI18n();
  return (
    <div className="executive-panel">
      <h2 className="executive-section-title">
        <PlusCircle size={18} style={{ color: "var(--vp-accent)" }} />
        {t("walletPage.topUpTitle")}
      </h2>
      <p className="mb-5 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>{t("walletPage.topUpCopy")}</p>
      <div className="rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
        <p className="m-0 text-sm font-semibold" style={{ color: "var(--vp-text)" }}>{t("walletPage.onlyTopUps")}</p>
        <p className="m-0 mt-2 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>{t("walletPage.onlyTopUpsCopy")}</p>
      </div>
      <Link className="executive-button primary mt-5 w-full" href="/dashboard/packages">
        <PlusCircle size={16} aria-hidden="true" />
        {t("walletPage.topUpAction")}
      </Link>
    </div>
  );
}
