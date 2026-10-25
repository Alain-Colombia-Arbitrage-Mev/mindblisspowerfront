import { ReceiptText } from "lucide-react";
import { formatPaymentDate, formatPaymentMoney } from "@/lib/payment-display.mjs";

const STATUS_LABELS = { paid: "Cobrado en Stripe", refunded: "Reembolsado", disputed: "En disputa", under_review: "Bajo revisión" };

/** Provider evidence is deliberately separate from activated memberships. */
export default function StripeSalesHistory({ sales }) {
  return (
    <div className="mt-5">
      <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
        <ReceiptText size={13} /> Ventas Stripe recuperadas
      </h3>
      <p className="mt-2 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
        Evidencia vinculada a tu identidad. Estas ventas no activan membresías ni representan comisiones disponibles para retirar.
      </p>
      {sales.length === 0 ? (
        <p className="mt-2 text-sm" style={{ color: "var(--vp-muted)" }}>No hay ventas Stripe verificadas vinculadas a esta cuenta.</p>
      ) : (
        <div className="mt-3 overflow-hidden rounded-lg" style={{ border: "1px solid var(--vp-border)" }}>
          {sales.map(sale => (
            <div key={sale.payment_intent_id} className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0" style={{ borderColor: "var(--vp-border)" }}>
              <div>
                <div className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>Bruto {formatPaymentMoney(sale.total_usd)}</div>
                <div className="text-[11px]" style={{ color: "var(--vp-subtle)" }}>
                  {formatPaymentDate(sale.charged_at)} · {sale.payment_intent_id.slice(0, 12)}
                  {Number(sale.refunded_usd) > 0 && ` · Reembolso ${formatPaymentMoney(sale.refunded_usd)}`}
                </div>
              </div>
              <span className="text-xs font-bold" style={{ color: "var(--vp-muted)" }}>
                {STATUS_LABELS[sale.status] || "Bajo revisión"}{!sale.source_eligible && " · Revisión requerida"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
