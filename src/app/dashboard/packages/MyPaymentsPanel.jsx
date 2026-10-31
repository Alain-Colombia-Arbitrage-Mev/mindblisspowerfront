"use client";

import { Wallet, ReceiptText, Loader2, CheckCircle2, Clock, AlertTriangle, ArrowDownToLine } from "lucide-react";
import { isRecoverySummary } from "@/lib/member-read.mjs";
import { useMemberSummary } from "@/hooks/useMemberSummary";
import { formatPaymentMoney as money, formatPaymentDate as fmtDate } from "@/lib/payment-display.mjs";
import { cn } from "@/lib/utils";
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

  if (state.loading) {
    return <><Card><div role="status" aria-live="polite" aria-busy="true" className="flex items-center gap-2 text-sm" style={{ color: "var(--vp-muted)" }}><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Cargando pagos…</div></Card><NOWPaymentsPurchases onChange={load} /></>;
  }
  if (state.error || !state.data) return <><Card>
    <div role="alert" className="text-sm" style={{ color: "var(--vp-muted)" }}>{state.error || "No se pudieron cargar los pagos. Intenta de nuevo."}</div>
    <button type="button" onClick={load} className="executive-button mt-3">Reintentar pagos</button>
  </Card><NOWPaymentsPurchases onChange={load} /></>;

  const d = state.data;
  const recovered = isRecoverySummary(d);

  return (
    <Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric Icon={Wallet} label={recovered ? "Saldo histórico Stripe" : "Disponible para retirar"} value={money(d.available_for_withdrawal_usd)} accent />
        <Metric Icon={Clock} label={recovered ? "Comisiones históricas en revisión" : "Comisiones en maduración"} value={money(d.commission_maturing_usd)} />
        <Metric Icon={CheckCircle2} label="Membresías activas" value={String(d.active_packages ?? 0)} />
      </div>

      {recovered && (
        <p role="status" className="mt-4 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          Las comisiones están pendientes de cálculo y revisión. Los saldos aún no están determinados y los retiros están bloqueados; esto no significa que tu balance sea cero.
        </p>
      )}

      <NOWPaymentsBalances data={d.nowpayments} />
      <NOWPaymentsPurchases onChange={load} />
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
  return <section className="executive-panel vp-glass">{children}</section>;
}
function Metric({ Icon, label, value, accent = false }) {
  return (
    <div className={cn("executive-card p-3", accent ? "vp-glass-accent" : "vp-glass")}>
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}><Icon size={12} /> {label}</div>
      <div className="text-xl font-semibold" style={{ color: accent ? "var(--vp-accent)" : "var(--vp-text)" }}>{value}</div>
    </div>
  );
}
function Row({ top, left, badge }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderTop: top ? "none" : "1px solid var(--vp-border)", background: "var(--vp-surface)" }}>
      <div className="min-w-0">{left}</div>{badge}
    </div>
  );
}
function Badge({ color, children }) {
  return <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black" style={{ color, background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}>{children}</span>;
}
