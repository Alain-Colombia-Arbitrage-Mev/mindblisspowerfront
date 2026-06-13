"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownToLine, Banknote, Building2,
  Coins, Gauge, Loader2, ShieldCheck, TrendingUp, Trophy, Wallet,
} from "lucide-react";

const money = (v) => `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v) => Number(v ?? 0).toLocaleString("en-US");

// Etiquetas legibles del moneyflow por concepto.
const KIND_LABEL = {
  package_purchase: "Compra de pack", binary_bonus: "Bono binario", roi: "ROI / CD",
  r2_yield: "Yield (R2)", r3_points: "Puntos (R3)", rank_bonus: "Bono de rango",
  royalty: "Regalía gen-2", direct_bonus: "Bono referido", leadership_bonus: "Liderazgo",
  withdrawal: "Retiro", platform_fee: "Comisión plataforma", inter_platform: "Inter-plataforma",
  manual_adjustment: "Ajuste manual", reversal: "Reverso", retirement: "Jubilación",
};

const HEALTH = {
  OK:      { color: "var(--vp-accent)",  bg: "var(--vp-accent-muted)",  border: "var(--vp-accent-border)",  Icon: ShieldCheck,    label: "Estable" },
  WARN:    { color: "var(--vp-amber)",   bg: "rgba(217,180,65,.12)",    border: "rgba(217,180,65,.35)",     Icon: AlertTriangle,  label: "Tensionada" },
  BREACH:  { color: "var(--vp-danger)",  bg: "var(--vp-danger-muted)",  border: "var(--vp-danger-border)",  Icon: AlertTriangle,  label: "¡ALERTA!" },
  UNKNOWN: { color: "var(--vp-muted)",   bg: "var(--vp-surface)",       border: "var(--vp-border)",         Icon: Gauge,          label: "Sin datos" },
};

export default function FinanceSection() {
  const [fin, setFin] = useState(null);
  const [sv, setSv] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadFinance = useCallback(() => {
    fetch("/api/admin/finance", { cache: "no-store" })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (r.ok) setFin(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadSolvency = useCallback(() => {
    fetch("/api/admin/solvency", { cache: "no-store" })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (r.ok) setSv(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadFinance();
    loadSolvency();
    // "Live": refresca el monitor de solvencia cada 30s.
    const t = setInterval(loadSolvency, 30_000);
    return () => clearInterval(t);
  }, [loadFinance, loadSolvency]);

  const h = HEALTH[sv?.health] || HEALTH.UNKNOWN;
  const cur = sv?.current;

  return (
    <>
      {/* Monitor de solvencia (live) — ¿el árbol está por romperse? */}
      <div className="executive-panel mt-6" style={{ borderColor: h.border, background: h.bg }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="executive-icon-badge" style={{ color: h.color }}><h.Icon size={20} /></span>
            <div>
              <h2 className="executive-section-title m-0" style={{ color: h.color }}>
                Monitor de solvencia · {h.label}
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
                  <Activity size={11} className="animate-pulse" /> live
                </span>
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--vp-text)" }}>{sv?.alert || "Cargando…"}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>α techo pago</div>
            <div className="text-lg font-semibold" style={{ color: h.color }}>{sv ? `${Math.round(Number(sv.treasury_alpha) * 100)}%` : "…"}</div>
          </div>
        </div>

        {cur && (
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Mini label="θ período" value={cur.theta != null ? Number(cur.theta).toFixed(4) : "pendiente"} tone={h.color} />
            <Mini label="Inflows" value={money(cur.inflows_usd)} />
            <Mini label="Techo pago (α·inflows)" value={money(cur.max_payout_allowed_usd)} />
            <Mini label="Pagado / inflows" value={cur.payout_pct_of_inflow != null ? `${cur.payout_pct_of_inflow}%` : "—"} />
          </div>
        )}

        {sv?.recent?.length > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>θ últimos cierres</div>
            <div className="flex items-end gap-1.5" style={{ height: 44 }}>
              {[...sv.recent].reverse().map((p) => {
                const t = Number(p.theta ?? 0);
                const c = t >= 0.6 ? "var(--vp-accent)" : t >= 0.3 ? "var(--vp-amber)" : "var(--vp-danger)";
                return (
                  <div key={p.period_id} title={`Período ${p.period_id}: θ=${t.toFixed(4)}`}
                    className="flex-1 rounded-t" style={{ height: `${Math.max(6, t * 100)}%`, background: c, opacity: 0.85 }} />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tablero financiero */}
      <div className="executive-panel mt-6">
        <h2 className="executive-section-title"><TrendingUp size={18} style={{ color: "var(--vp-accent)" }} /> Finanzas de la red</h2>
        {loading ? (
          <p style={{ color: "var(--vp-muted)" }}><Loader2 size={15} className="inline animate-spin" /> Cargando…</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Kpi Icon={ArrowDownToLine} label="Dinero entrante" value={money(fin?.inflows_usd)} accent />
              <Kpi Icon={Banknote} label="Packs pagados" value={num(fin?.packs_paid)} />
              <Kpi Icon={Coins} label="Comisiones distribuidas" value={money(fin?.commissions_distributed_usd)} />
              <Kpi Icon={Wallet} label="Pendiente de pago" value={money(fin?.pending_payout_usd)} />
              <Kpi Icon={Building2} label="Tesorería (empresa)" value={money(fin?.treasury_usd)} accent />
              <Kpi Icon={Trophy} label="Rangos alcanzados" value={num(fin?.ranks_achieved)} />
              <Kpi Icon={Trophy} label="Dinero de rangos" value={money(fin?.ranks_bonus_usd)} />
              <Kpi Icon={ArrowDownToLine} label="Retiros pendientes" value={money(fin?.withdrawals_pending_usd)} />
            </div>

            {fin?.moneyflow?.length > 0 && (
              <div className="executive-table-wrap mt-5">
                <table className="executive-table">
                  <thead><tr><th>Concepto (moneyflow)</th><th>Movimientos</th><th>Neto</th></tr></thead>
                  <tbody>
                    {fin.moneyflow.map((m) => (
                      <tr key={m.kind}>
                        <td>{KIND_LABEL[m.kind] || m.kind}</td>
                        <td>{num(m.count)}</td>
                        <td style={{ color: Number(m.total_usd) < 0 ? "var(--vp-danger)" : "var(--vp-accent)" }}>{money(m.total_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 text-[11px]" style={{ color: "var(--vp-subtle)" }}>
              Tesorería ≈ entrante − comisiones distribuidas − retiros pagados. El ledger (wallet_movement) está en 0 hasta el primer cierre de período; ahí empiezan los valores reales.
            </p>
          </>
        )}
      </div>
    </>
  );
}

function Kpi({ Icon, label, value, accent }) {
  return (
    <div className="executive-card p-3 vp-glass">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}><Icon size={12} /> {label}</div>
      <div className="text-lg font-semibold" style={{ color: accent ? "var(--vp-accent)" : "var(--vp-text)" }}>{value}</div>
    </div>
  );
}

function Mini({ label, value, tone }) {
  return (
    <div className="executive-card p-2.5 vp-glass">
      <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>{label}</div>
      <div className="text-base font-semibold" style={{ color: tone || "var(--vp-text)" }}>{value}</div>
    </div>
  );
}
