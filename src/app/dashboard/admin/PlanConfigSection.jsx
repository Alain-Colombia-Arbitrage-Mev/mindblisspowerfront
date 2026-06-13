"use client";

import { useCallback, useEffect, useState } from "react";
import { Sliders, Loader2, CheckCircle2, XCircle, ShieldAlert, Send } from "lucide-react";

// Etiquetas legibles de los parámetros de comisión.
const LABELS = {
  treasury_alpha: "α tesorería (techo pago)", block_size: "Tamaño bloque (pts)", bonus_per_block: "Bono por bloque ($)",
  depth_cap: "Profundidad pago (niveles)", daily_cap_factor: "Cap diario (×rango)", lifetime_cap_factor: "Cap por paquete (×)",
  period_cap_factor: "Cap período (×paquete)", carry_decay_days: "Decaimiento carry (días)",
  qualified_directs_left: "Directos calif. izq", qualified_directs_right: "Directos calif. der",
  yield_enabled: "R2 yield activo", yield_annual_rate: "Yield anual", yield_cadence_periods: "Cadencia yield",
  capital_lock_periods: "Lock capital (períodos)", points_enabled: "R3 puntos activo", points_per_block: "Puntos/bloque",
  points_dollars_per_point: "$/punto", points_cadence_periods: "Cadencia puntos", ranks_enabled: "Rangos activos",
  rank_installments: "Cuotas de rango", rank_installment_cadence: "Cadencia cuotas", royalty_enabled: "Regalía activa",
  royalty_rate: "Regalía gen-2", royalty_generation: "Generación regalía", referral_rate: "Referido (no fundador)",
  founder_enrollment_open: "Inscripción fundadores", founder_referral_rate: "Referido fundador", founder_binary_matched_rate: "Binario fundador",
  cd_lock_days: "CD lock (días)", cd_qualified_directs: "CD directos calif.", cd_same_tier_required: "CD mismo tier req.",
  pause_mode: "Modo pausa (R1)", pause_reduction_factor: "Factor reducción pausa", depth_repurchase_enabled: "Recompra por profundidad",
  repurchase_threshold: "Umbral recompra", purchase_stale_periods: "Períodos stale", paused_carry_decay_periods: "Decaimiento carry pausa",
  renewal_cost_factor: "Factor costo renovación", retirement_age: "Edad jubilación", retirement_early_penalty: "Penalidad retiro anticipado",
  directs_active_required: "Directos activos req.",
};
const META = new Set(["version_label", "effective_from"]);
const STATUS_LABEL = { pending: "Pendiente", approved: "Aprobada", executed: "Aplicada", rejected: "Rechazada", expired: "Expirada" };

export default function PlanConfigSection() {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState({});
  const [reason, setReason] = useState("");
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/plan", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/admin/plan/proposals", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ]).then(([cfg, props]) => {
      if (cfg?.config) { setData(cfg); setDraft({ ...cfg.config }); }
      if (props?.proposals) setProposals(props.proposals);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="executive-panel mt-6"><Loader2 size={16} className="inline animate-spin" /> Cargando comisiones…</div>;
  if (!data?.config) {
    return <div className="executive-panel mt-6" style={{ color: "var(--vp-muted)" }}>
      <h2 className="executive-section-title"><Sliders size={18} style={{ color: "var(--vp-accent)" }} /> Comisiones</h2>
      No hay configuración de comisiones activa.
    </div>;
  }

  const fields = (data.editable || []).filter((k) => !META.has(k));
  const changes = {};
  for (const k of fields) {
    const orig = data.config[k], cur = draft[k];
    if (String(orig) !== String(cur)) changes[k] = coerce(orig, cur);
  }
  const nChanges = Object.keys(changes).length;

  async function propose() {
    if (nChanges === 0 || reason.trim().length < 10) { setMsg({ tone: "bad", text: "Cambia algún valor y escribe una razón (≥10 caracteres)." }); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/plan/propose", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ changes, reason }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setMsg({ tone: "ok", text: `Propuesta #${d.request_id} creada. Necesita la aprobación de OTRO admin.` }); setReason(""); load(); }
      else setMsg({ tone: "bad", text: d.error || "No se pudo crear la propuesta." });
    } finally { setBusy(false); }
  }

  async function decide(id, approve) {
    const rzn = approve ? "Aprobado desde panel" : "Rechazado desde panel";
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/plan/decide", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, approve, reason: rzn }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setMsg({ tone: "ok", text: approve ? `Propuesta #${id}: ${d.status === "executed" ? "APLICADA ✓" : d.status}` : `Propuesta #${id} rechazada.` }); load(); }
      else if (d.error === "approver_is_initiator") setMsg({ tone: "bad", text: "No puedes aprobar tu propia propuesta (four-eyes). Debe hacerlo otro admin." });
      else setMsg({ tone: "bad", text: d.error || "No se pudo decidir." });
    } finally { setBusy(false); }
  }

  return (
    <div className="executive-panel mt-6">
      <h2 className="executive-section-title"><Sliders size={18} style={{ color: "var(--vp-accent)" }} /> Comisiones del plan
        <span className="ml-2 text-[11px] font-normal" style={{ color: "var(--vp-subtle)" }}>v: {data.config.version_label} · desde {data.config.effective_from}</span>
      </h2>
      <p className="mb-3 text-[11px]" style={{ color: "var(--vp-subtle)" }}>
        <ShieldAlert size={12} className="inline" /> Cambios afectan los pagos en producción → se aplican por <b>four-eyes</b>: tú propones, OTRO admin aprueba.
      </p>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((k) => {
          const v = draft[k];
          const isBool = typeof data.config[k] === "boolean";
          const changed = String(data.config[k]) !== String(v);
          return (
            <label key={k} className="flex items-center justify-between gap-2 rounded-lg p-2 text-xs"
              style={{ background: "var(--vp-surface)", border: `1px solid ${changed ? "var(--vp-accent-border)" : "var(--vp-border)"}` }}>
              <span style={{ color: "var(--vp-muted)" }}>{LABELS[k] || k}</span>
              {isBool ? (
                <input type="checkbox" checked={!!v} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.checked }))} />
              ) : k === "pause_mode" ? (
                <select value={v ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                  style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)", color: "var(--vp-text)", borderRadius: 6, padding: "2px 6px" }}>
                  <option value="skip">skip</option><option value="carry">carry</option><option value="reduce">reduce</option>
                </select>
              ) : (
                <input type="number" step="any" value={v ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                  className="w-24 text-right" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)", color: changed ? "var(--vp-accent)" : "var(--vp-text)", borderRadius: 6, padding: "2px 6px" }} />
              )}
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Razón del cambio (≥10 caracteres)…"
          className="h-10 flex-1 rounded-lg px-3 text-sm" style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }} />
        <button type="button" onClick={propose} disabled={busy || nChanges === 0}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-40"
          style={{ background: "var(--vp-accent-muted)", color: "var(--vp-accent)", border: "1px solid var(--vp-accent-border)" }}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Proponer {nChanges > 0 ? `(${nChanges})` : ""}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs font-semibold" style={{ color: msg.tone === "ok" ? "var(--vp-accent)" : "var(--vp-danger)" }}>{msg.text}</p>}

      {/* Propuestas */}
      {proposals.length > 0 && (
        <div className="executive-table-wrap mt-5">
          <table className="executive-table">
            <thead><tr><th>#</th><th>Estado</th><th>Propuso</th><th>Cambios</th><th>Razón</th><th></th></tr></thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td><span style={{ color: p.status === "executed" ? "var(--vp-accent)" : p.status === "rejected" ? "var(--vp-danger)" : "var(--vp-amber)" }}>{STATUS_LABEL[p.status] || p.status}</span></td>
                  <td className="text-[11px]">{p.initiator}</td>
                  <td className="text-[11px]" style={{ color: "var(--vp-muted)", maxWidth: 220 }}>{fmtPayload(p.payload)}</td>
                  <td className="text-[11px]" style={{ color: "var(--vp-subtle)", maxWidth: 160 }}>{p.initiator_reason}</td>
                  <td>
                    {p.status === "pending" && (
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => decide(p.id, true)} disabled={busy}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold disabled:opacity-50"
                          style={{ background: "var(--vp-accent-muted)", color: "var(--vp-accent)", border: "1px solid var(--vp-accent-border)" }}><CheckCircle2 size={12} /> Aprobar</button>
                        <button type="button" onClick={() => decide(p.id, false)} disabled={busy}
                          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold disabled:opacity-50"
                          style={{ background: "var(--vp-danger-muted)", color: "var(--vp-danger)", border: "1px solid var(--vp-danger-border)" }}><XCircle size={12} /> Rechazar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px]" style={{ color: "var(--vp-subtle)" }}>El proponente no puede aprobar su propia propuesta. Al aprobar un 2º admin, la nueva config queda vigente al instante.</p>
        </div>
      )}
    </div>
  );
}

// coerce: convierte el valor del input al tipo del original (number/bool/string).
function coerce(orig, cur) {
  if (typeof orig === "boolean") return Boolean(cur);
  if (typeof orig === "number") { const n = Number(cur); return Number.isNaN(n) ? cur : n; }
  return cur;
}

function fmtPayload(p) {
  try {
    const o = typeof p === "string" ? JSON.parse(p) : p;
    return Object.entries(o).map(([k, v]) => `${LABELS[k] || k}=${v}`).join(", ");
  } catch { return ""; }
}
