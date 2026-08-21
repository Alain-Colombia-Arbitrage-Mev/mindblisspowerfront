"use client";

import { useCallback, useEffect, useState } from "react";
import { Receipt, Loader2, RotateCcw } from "lucide-react";

const money = (v) => `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS = {
  activated: { label: "Activado", color: "var(--vp-accent)" },
  paid: { label: "Pagado", color: "var(--vp-accent)" },
  needs_placement: { label: "Sin colocar", color: "var(--vp-amber)" },
  created: { label: "Iniciado", color: "var(--vp-subtle)" },
  failed: { label: "Fallido", color: "var(--vp-danger)" },
  expired: { label: "Expirado", color: "var(--vp-subtle)" },
  refunded: { label: "Reembolsado", color: "var(--vp-subtle)" },
  security_blocked: { label: "Bloqueo seguridad", color: "var(--vp-danger)" },
  disputed: { label: "Disputa", color: "var(--vp-danger)" },
  chargeback: { label: "Chargeback", color: "var(--vp-danger)" },
};
const REFUNDABLE = new Set(["paid", "activated", "needs_placement", "security_blocked"]);
const PAGE = 25;

/** Pagos hechos por NUESTRO checkout/webhook (payments.purchase_intent). */
export default function PaymentsSection() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/payments?status=${encodeURIComponent(filter)}&limit=${PAGE}&offset=${offset}`, { cache: "no-store" })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (r.ok) { setItems(d.payments || []); setTotal(d.total || 0); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter, offset]);
  useEffect(() => { load(); }, [load]);

  const page = Math.floor(offset / PAGE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  async function refundPayment(payment) {
    if (!REFUNDABLE.has(payment.status)) return;
    const label = payment.name || payment.email || payment.id;
    if (!window.confirm(`Reembolsar el pago de ${label}? Esta accion ejecuta un reembolso real en Stripe.`)) return;
    const amountText = window.prompt("Monto a reembolsar en USD:", Number(payment.total_usd || 0).toFixed(2));
    if (amountText === null) return;
    const amountCents = usdToCents(amountText);
    if (!amountCents) {
      setMessage("Monto invalido.");
      return;
    }
    const reason = window.prompt("Motivo del reembolso (opcional):", "security");
    if (reason === null) return;
    if (!window.confirm("Confirmacion final: el reembolso se enviara a Stripe y el pago quedara como reembolsado.")) return;
    setBusyId(payment.id);
    setMessage("");
    try {
      const resp = await fetch("/api/admin/payments/refund", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: payment.id, reason, amount_cents: amountCents }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || "refund_failed");
      setMessage(`Reembolso creado: ${data.refund?.refund_id || "ok"}`);
      load();
    } catch (error) {
      setMessage(`No se pudo reembolsar: ${error.message}`);
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="executive-panel mt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="executive-section-title m-0"><Receipt size={18} style={{ color: "var(--vp-accent)" }} /> Pagos (este endpoint)</h2>
        <select value={filter} onChange={(e) => { setOffset(0); setFilter(e.target.value); }}
          className="h-9 rounded-lg px-3 text-sm" style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }}>
          <option value="">Todos</option>
          <option value="activated">Activados</option>
          <option value="paid">Pagados</option>
          <option value="created">Iniciados</option>
          <option value="needs_placement">Sin colocar</option>
          <option value="refunded">Reembolsados</option>
          <option value="security_blocked">Bloqueo seguridad</option>
          <option value="disputed">Disputa</option>
          <option value="chargeback">Chargeback</option>
        </select>
      </div>
      {message ? <div className="mb-3 text-xs font-semibold" style={{ color: "var(--vp-accent)" }}>{message}</div> : null}
      <div className="executive-table-wrap">
        <table className="executive-table">
          <thead><tr><th>Comprador</th><th>Pack</th><th>Total</th><th>Estado</th><th>Payment Intent</th><th>Fecha</th><th>Accion</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ color: "var(--vp-muted)" }}><Loader2 size={15} className="inline animate-spin" /> Cargando…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} style={{ color: "var(--vp-muted)" }}>Sin pagos.</td></tr>
            ) : items.map((p) => {
              const st = STATUS[p.status] || STATUS.created;
              const refundable = REFUNDABLE.has(p.status) && Boolean(p.payment_intent_id);
              return (
                <tr key={p.id}>
                  <td className="text-[12px]" style={{ color: "var(--vp-text)" }}>{p.name || p.email}<div className="text-[11px]" style={{ color: "var(--vp-subtle)" }}>{p.email}</div></td>
                  <td>#{p.package_id} · {money(p.amount_usd)}</td>
                  <td style={{ color: "var(--vp-accent)" }}>
                    {money(p.total_usd)}
                    {Number(p.refund_usd) > 0 ? (
                      <div className="text-[11px]" style={{ color: "var(--vp-danger)" }}>Reembolso {money(p.refund_usd)}</div>
                    ) : null}
                  </td>
                  <td style={{ color: st.color }}>{st.label}</td>
                  <td className="text-[11px]" style={{ color: "var(--vp-subtle)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{p.payment_intent_id || "—"}</td>
                  <td className="text-[11px]" style={{ color: "var(--vp-subtle)" }}>{p.created_at ? new Date(p.created_at).toLocaleDateString("es-CO") : "—"}</td>
                  <td>
                    <button
                      type="button"
                      disabled={!refundable || busyId === p.id}
                      onClick={() => refundPayment(p)}
                      title={refundable ? "Reembolsar pago" : "No reembolsable desde este estado"}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md disabled:opacity-35"
                      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: refundable ? "var(--vp-accent)" : "var(--vp-muted)" }}
                    >
                      {busyId === p.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm" style={{ color: "var(--vp-muted)" }}>
        <span>{total.toLocaleString("en-US")} pagos · pág {page}/{pages}</span>
        <div className="flex gap-2">
          <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}
            className="rounded-md px-3 py-1.5 text-xs font-bold disabled:opacity-40" style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }}>Anterior</button>
          <button type="button" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}
            className="rounded-md px-3 py-1.5 text-xs font-bold disabled:opacity-40" style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }}>Siguiente</button>
        </div>
      </div>
    </div>
  );
}

function usdToCents(value) {
  const normalized = String(value || "").trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return 0;
  const [whole, cents = ""] = normalized.split(".");
  return Number(whole) * 100 + Number(cents.padEnd(2, "0"));
}
