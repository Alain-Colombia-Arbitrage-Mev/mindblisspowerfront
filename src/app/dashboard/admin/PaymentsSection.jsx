"use client";

import { useCallback, useEffect, useState } from "react";
import { Receipt, Loader2 } from "lucide-react";

const money = (v) => `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const STATUS = {
  activated: { label: "Activado", color: "var(--vp-accent)" },
  paid: { label: "Pagado", color: "var(--vp-accent)" },
  needs_placement: { label: "Sin colocar", color: "var(--vp-amber)" },
  created: { label: "Iniciado", color: "var(--vp-subtle)" },
  failed: { label: "Fallido", color: "var(--vp-danger)" },
  expired: { label: "Expirado", color: "var(--vp-subtle)" },
  refunded: { label: "Reembolsado", color: "var(--vp-subtle)" },
};
const PAGE = 25;

/** Pagos hechos por NUESTRO checkout/webhook (payments.purchase_intent). */
export default function PaymentsSection() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

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
        </select>
      </div>
      <div className="executive-table-wrap">
        <table className="executive-table">
          <thead><tr><th>Comprador</th><th>Pack</th><th>Total</th><th>Estado</th><th>Payment Intent</th><th>Fecha</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ color: "var(--vp-muted)" }}><Loader2 size={15} className="inline animate-spin" /> Cargando…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} style={{ color: "var(--vp-muted)" }}>Sin pagos.</td></tr>
            ) : items.map((p) => {
              const st = STATUS[p.status] || STATUS.created;
              return (
                <tr key={p.id}>
                  <td className="text-[12px]" style={{ color: "var(--vp-text)" }}>{p.name || p.email}<div className="text-[11px]" style={{ color: "var(--vp-subtle)" }}>{p.email}</div></td>
                  <td>#{p.package_id} · {money(p.amount_usd)}</td>
                  <td style={{ color: "var(--vp-accent)" }}>{money(p.total_usd)}</td>
                  <td style={{ color: st.color }}>{st.label}</td>
                  <td className="text-[11px]" style={{ color: "var(--vp-subtle)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{p.payment_intent_id || "—"}</td>
                  <td className="text-[11px]" style={{ color: "var(--vp-subtle)" }}>{p.created_at ? new Date(p.created_at).toLocaleDateString("es-CO") : "—"}</td>
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
