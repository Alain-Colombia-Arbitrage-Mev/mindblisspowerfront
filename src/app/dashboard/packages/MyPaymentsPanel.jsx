"use client";

import { Wallet, ReceiptText, Loader2, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { isRecoverySummary } from "@/lib/member-read.mjs";
import { useMemberSummary } from "@/hooks/useMemberSummary";
import { formatPaymentMoney as money, formatPaymentDate as fmtDate } from "@/lib/payment-display.mjs";
import styles from "./payments-summary.module.css";
import StripeSalesHistory from "./StripeSalesHistory";
import NOWPaymentsBalances from "@/components/panel/NOWPaymentsBalances";
import NOWPaymentsPurchases from "./NOWPaymentsPurchases";
import { useI18n } from "@/i18n/LanguageProvider";

const PAY_STATUS = {
  activated: { label: "paymentsSummary.activated", color: "var(--vp-accent)", Icon: CheckCircle2 },
  paid: { label: "paymentsSummary.paid", color: "var(--vp-accent)", Icon: CheckCircle2 },
  needs_placement: { label: "paymentsSummary.needsPlacement", color: "var(--vp-amber)", Icon: AlertTriangle },
  created: { label: "paymentsSummary.created", color: "var(--vp-subtle)", Icon: Clock },
  failed: { label: "paymentsSummary.failed", color: "var(--vp-danger)", Icon: AlertTriangle },
  expired: { label: "paymentsSummary.expired", color: "var(--vp-subtle)", Icon: Clock },
  refunded: { label: "paymentsSummary.refunded", color: "var(--vp-subtle)", Icon: Clock },
};
export default function MyPaymentsPanel() {
  const { state, reload: load } = useMemberSummary({ fresh: true });
  // Keep history at the same React position while the independent summary
  // changes loading/error/ready. A summary refresh must not remount its GET.
  return <><PaymentsSummary state={state} load={load} /><NOWPaymentsPurchases onChange={load} /></>;
}

function PaymentsSummary({ state, load }) {
  const { t } = useI18n();
  if (state.loading) {
    return <Card><div role="status" aria-live="polite" aria-busy="true" className={styles.loading}><Loader2 size={18} className="animate-spin" aria-hidden="true" /> {t("paymentsSummary.loading")}</div><div className={styles.skeletons} aria-hidden="true"><span /><span /><span /></div></Card>;
  }
  if (state.error || !state.data) {
    const restricted = [401, 403].includes(state.errorStatus);
    const title = state.errorStatus === 401 ? t("paymentsSummary.signInTitle")
      : state.errorStatus === 403 ? t("paymentsSummary.restrictedTitle") : t("paymentsSummary.syncingTitle");
    const message = state.errorStatus === 401 ? t("paymentsSummary.signInCopy")
      : state.errorStatus === 403 ? t("paymentsSummary.restrictedCopy") : t("paymentsSummary.syncingCopy");
    return <Card>
    <div role={restricted ? "alert" : "status"} className={styles.availability}><Clock size={21} aria-hidden="true" /><div><h3>{title}</h3><p>{message}</p></div></div>
    {state.errorStatus === 401
      ? <a href="/login" className={`executive-button ${styles.retry}`}>{t("paymentsSummary.signIn")}</a>
      : <button type="button" onClick={load} className={`executive-button ${styles.retry}`}>{t("paymentsSummary.refresh")}</button>}
  </Card>;
  }

  const d = state.data;
  const recovered = isRecoverySummary(d);

  return (
    <Card>
      <div className={styles.heading}><span className={styles.headingIcon}><Wallet size={21} aria-hidden="true" /></span><div><h2>{t("paymentsSummary.title")}</h2><p>{t("paymentsSummary.copy")}</p></div></div>
      <div className={styles.metrics}>
        <Metric Icon={Wallet} label={t("walletPage.balance")} value={money(d.wallet_balance_usd)} accent />
        <Metric Icon={Clock} label={t(recovered ? "paymentsSummary.historicalReview" : "paymentsSummary.maturing")} value={money(d.commission_maturing_usd)} />
        <Metric Icon={CheckCircle2} label={t("paymentsSummary.activeMemberships")} value={String(d.active_packages ?? 0)} />
      </div>

      {recovered && (
        <p role="status" className={styles.recovery}>
          {t("walletPage.recoveryNotice")}
        </p>
      )}

      <NOWPaymentsBalances data={d.nowpayments} />
      {recovered && <StripeSalesHistory sales={d.stripe_sales} />}

      {!recovered && <><div className="mt-5 flex items-center gap-2 text-xs font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
        <ReceiptText size={13} /> {t("paymentsSummary.previous")}
      </div>
      {(!d.payments || d.payments.length === 0) ? (
        <p className="mt-2 text-sm" style={{ color: "var(--vp-muted)" }}>{t("paymentsSummary.noPrevious")}</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg" style={{ border: "1px solid var(--vp-border)" }}>
          {d.payments.map((p, i) => {
            const st = PAY_STATUS[p.status] || PAY_STATUS.created;
            return (
              <Row key={p.purchase_id} top={i === 0}
                left={<><div className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>{money(p.total_usd)}</div>
                  <div className="text-[11px]" style={{ color: "var(--vp-subtle)" }}>{t("paymentsSummary.pack", { amount: money(p.amount_usd), fee: money(p.fee_usd), date: fmtDate(p.created_at) })}</div></>}
                badge={<Badge color={st.color}><st.Icon size={12} /> {t(st.label)}</Badge>} />
            );
          })}
        </div>
      )}</>}

    </Card>
  );
}

function Card({ children }) {
  return <section className={`executive-panel ${styles.panel}`}>{children}</section>;
}
function Metric({ Icon, label, value, accent = false }) {
  return (
    <div className={`${styles.metric} ${accent ? styles.metricAccent : ''}`}>
      <div className={styles.metricLabel}><Icon size={15} aria-hidden="true" /> {label}</div>
      <div className={styles.metricValue}>{value}</div>
    </div>
  );
}
function Row({ top, left, badge }) {
  return (
    <div className={styles.row} style={{ borderTop: top ? "none" : "1px solid var(--vp-border)", background: "var(--vp-surface)" }}>
      <div className="min-w-0">{left}</div>{badge}
    </div>
  );
}
function Badge({ color, children }) {
  return <span className={styles.badge} style={{ color, background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}>{children}</span>;
}
