"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BarChart3, Loader2 } from "lucide-react";

const money = (v) => `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const RANGES = [7, 30, 90];

/**
 * Reporte de ventas del producto PACK MINDBLISS por tier de precio:
 * intents creados / pagados / activados y revenue confirmado (activados).
 */
export default function SalesSection() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/sales?days=${days}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d && !d.error) setReport(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  const rows = report?.rows ?? [];
  const totals = rows.reduce(
    (acc, r) => ({
      created: acc.created + Number(r.created),
      paid: acc.paid + Number(r.paid),
      activated: acc.activated + Number(r.activated),
      revenue: acc.revenue + Number(r.revenue_usd),
      refunded: acc.refunded + Number(r.refunded_usd),
    }),
    { created: 0, paid: 0, activated: 0, revenue: 0, refunded: 0 },
  );
  const cash = report?.cash_summary || {};
  const security = report?.security_charges || {};

  return (
    <section className="executive-panel">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="executive-section-title mb-0">
          <BarChart3 size={18} style={{ color: "var(--vp-accent)" }} />
          Ventas de membresías {report?.from ? `(desde ${report.from})` : ""}
        </h2>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setDays(r)}
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: days === r ? "var(--vp-accent)" : "transparent",
                color: days === r ? "#111" : "var(--vp-muted)",
                border: "1px solid var(--vp-border)",
                cursor: "pointer",
              }}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--vp-muted)" }}>
          <Loader2 size={14} className="animate-spin" /> Cargando ventas…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm font-semibold" style={{ color: "var(--vp-muted)" }}>
          Sin ventas registradas en los últimos {days} días.
        </p>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <Mini label="Bruto neto" value={money(cash.gross_charged_usd)} />
            <Mini label="Reembolsado" value={money(cash.refunded_usd)} tone="var(--vp-danger)" />
            <Mini label="Cargos exitosos" value={Number(cash.successful_charges || 0).toLocaleString("en-US")} />
            <Mini label="Cargos operativos" value={money(security.pending_charge_usd)} tone="var(--vp-danger)" />
          </div>
          {Number(security.affected_sales || 0) > 0 ? (
            <div className="mb-4 rounded-lg p-3 text-xs font-semibold" style={{ background: "var(--vp-danger-muted)", border: "1px solid var(--vp-danger-border)", color: "var(--vp-text)" }}>
              <div className="mb-1 flex items-center gap-2" style={{ color: "var(--vp-danger)" }}>
                <AlertTriangle size={14} /> {Number(security.affected_sales).toLocaleString("en-US")} procesos con cargo operativo · {money(security.unit_charge_usd)} c/u
              </div>
              <div style={{ color: "var(--vp-subtle)" }}>
                Fallidos/rechazados: {Number(security.failed_sales || 0).toLocaleString("en-US")} · Reembolsos: {Number(security.refunded_sales || 0).toLocaleString("en-US")} · Seguridad: {Number(security.security_blocked_sales || 0).toLocaleString("en-US")} · Disputas: {Number(security.disputed_sales || 0).toLocaleString("en-US")} · Chargebacks: {Number(security.chargeback_sales || 0).toLocaleString("en-US")} · Ajustes manuales: {Number(security.manual_adjustments || 0).toLocaleString("en-US")}
              </div>
            </div>
          ) : null}
          <div className="executive-table-wrap">
            <table className="executive-table">
              <thead>
                <tr>
                  <th>Membresía</th>
                  <th>Precio</th>
                  <th>Iniciados</th>
                  <th>Pagados</th>
                  <th>Activados</th>
                  <th>Revenue</th>
                  <th>Reembolsado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.package_id}>
                    <td>{r.name}</td>
                    <td>{money(r.amount_usd)}</td>
                    <td>{r.created}</td>
                    <td>{r.paid}</td>
                    <td>{r.activated}</td>
                    <td style={{ color: "var(--vp-accent)", fontWeight: 600 }}>{money(r.revenue_usd)}</td>
                    <td style={{ color: Number(r.refunded_usd) > 0 ? "var(--vp-danger)" : "var(--vp-subtle)" }}>{money(r.refunded_usd)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 700 }}>
                  <td>Total</td>
                  <td>—</td>
                  <td>{totals.created}</td>
                  <td>{totals.paid}</td>
                  <td>{totals.activated}</td>
                  <td style={{ color: "var(--vp-accent)" }}>{money(totals.revenue)}</td>
                  <td style={{ color: totals.refunded > 0 ? "var(--vp-danger)" : "var(--vp-subtle)" }}>{money(totals.refunded)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function Mini({ label, value, tone = "var(--vp-text)" }) {
  return (
    <div className="executive-card p-3 vp-glass">
      <div className="mb-1 text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>{label}</div>
      <div className="text-lg font-semibold" style={{ color: tone }}>{value}</div>
    </div>
  );
}
