"use client";

import { Wallet, ReceiptText, Loader2, CheckCircle2, Clock, AlertTriangle, ArrowDownToLine } from "lucide-react";
import { isRecoverySummary } from "@/lib/member-read.mjs";
import { useMemberSummary } from "@/hooks/useMemberSummary";
import { formatPaymentMoney as money, formatPaymentDate as fmtDate } from "@/lib/payment-display.mjs";
import styles from "./payments-summary.module.css";
import StripeSalesHistory from "./StripeSalesHistory";
import WithdrawalRequest from "./WithdrawalRequest";
import NOWPaymentsBalances from "@/components/panel/NOWPaymentsBalances";
import NOWPaymentsPurchases from "./NOWPaymentsPurchases";

const PAY_STATUS = {
  activated: { label: "Activado", color: "var(--vp-accent)", Icon: CheckCircle2 },
  paid: { label: "Pagado", color: "var(--vp-accent)", Icon: CheckCircle2 },
  needs_placement: { label: "Pendiente de colocación", color: "var(--vp-amber)", Icon: AlertTriangle },
  created: { label: "Iniciado", color: "var(--vp-subtle)", Icon: Clock },
  failed: { label: "Fallido", color: "var(--vp-danger)", Icon: AlertTriangle },
  expired: { label: "Expirado", color: "var(--vp-subtle)", Icon: Clock },
  refunded: { label: "Reembolsado", color: "var(--vp-subtle)", Icon: Clock },
};
const WD_STATUS = {
  requested: { label: "Solicitado", color: "var(--vp-amber)" },
  approved: { label: "Aprobado", color: "var(--vp-accent)" },
  paid: { label: "Pagado", color: "var(--vp-accent)" },
  rejected: { label: "Rechazado", color: "var(--vp-danger)" },
  cancelled: { label: "Cancelado", color: "var(--vp-subtle)" },
};

export default function MyPaymentsPanel() {
  const { state, reload: load } = useMemberSummary({ fresh: true });
  // Keep history at the same React position while the independent summary
  // changes loading/error/ready. A summary refresh must not remount its GET.
  return <><PaymentsSummary state={state} load={load} /><NOWPaymentsPurchases onChange={load} /></>;
}

function PaymentsSummary({ state, load }) {
  if (state.loading) {
    return <Card><div role="status" aria-live="polite" aria-busy="true" className={styles.loading}><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Cargando pagos…</div><div className={styles.skeletons} aria-hidden="true"><span /><span /><span /></div></Card>;
  }
  if (state.error || !state.data) return <Card>
    <div role="alert" className={styles.error}><AlertTriangle size={21} aria-hidden="true" /><div><h3>No pudimos cargar el resumen</h3><p>{state.error || "No se pudieron cargar los pagos. Intenta de nuevo."}</p></div></div>
    <button type="button" onClick={load} className={`executive-button ${styles.retry}`}>Reintentar pagos</button>
  </Card>;

  const d = state.data;
  const recovered = isRecoverySummary(d);

  return (
    <Card>
      <div className={styles.heading}><span className={styles.headingIcon}><Wallet size={21} aria-hidden="true" /></span><div><h2>Tu resumen de pagos</h2><p>Membresías, comisiones y movimientos, en un solo lugar.</p></div></div>
      <div className={styles.metrics}>
        <Metric Icon={Wallet} label={recovered ? "Saldo histórico Stripe" : "Disponible para retirar"} value={money(d.available_for_withdrawal_usd)} accent />
        <Metric Icon={Clock} label={recovered ? "Comisiones históricas en revisión" : "Comisiones en maduración"} value={money(d.commission_maturing_usd)} />
        <Metric Icon={CheckCircle2} label="Membresías activas" value={String(d.active_packages ?? 0)} />
      </div>

      {recovered && (
        <p role="status" className={styles.recovery}>
          Las comisiones están pendientes de cálculo y revisión. Los saldos aún no están determinados y los retiros están bloqueados; esto no significa que tu balance sea cero.
        </p>
      )}

      <NOWPaymentsBalances data={d.nowpayments} />
      <WithdrawalRequest data={d} onDone={load} />

      {recovered && <StripeSalesHistory sales={d.stripe_sales} />}

      {!recovered && <><div className="mt-5 flex items-center gap-2 text-xs font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
        <ReceiptText size={13} /> Pagos anteriores
      </div>
      {(!d.payments || d.payments.length === 0) ? (
        <p className="mt-2 text-sm" style={{ color: "var(--vp-muted)" }}>No hay pagos anteriores en este registro. Las compras NOWPayments se muestran por separado arriba.</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg" style={{ border: "1px solid var(--vp-border)" }}>
          {d.payments.map((p, i) => {
            const st = PAY_STATUS[p.status] || PAY_STATUS.created;
            return (
              <Row key={p.purchase_id} top={i === 0}
                left={<><div className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>{money(p.total_usd)}</div>
                  <div className="text-[11px]" style={{ color: "var(--vp-subtle)" }}>Pack {money(p.amount_usd)} + activación {money(p.fee_usd)} · {fmtDate(p.created_at)}</div></>}
                badge={<Badge color={st.color}><st.Icon size={12} /> {st.label}</Badge>} />
            );
          })}
        </div>
      )}</>}

      {d.withdrawals && d.withdrawals.length > 0 && (
        <>
          <div className="mt-5 flex items-center gap-2 text-xs font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
            <ArrowDownToLine size={13} /> Mis retiros
          </div>
          <div className="mt-3 overflow-hidden rounded-lg" style={{ border: "1px solid var(--vp-border)" }}>
            {d.withdrawals.map((wd, i) => {
              const st = WD_STATUS[wd.status] || WD_STATUS.requested;
              return (
                <Row key={wd.id} top={i === 0}
                  left={<><div className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>{money(wd.amount_usd)}</div>
                    <div className="text-[11px]" style={{ color: "var(--vp-subtle)" }}>{fmtDate(wd.created_at)}</div></>}
                  badge={<Badge color={st.color}>{st.label}</Badge>} />
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
}

function Card({ children }) {
  return <section className={`executive-panel vp-glass ${styles.panel}`}>{children}</section>;
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
