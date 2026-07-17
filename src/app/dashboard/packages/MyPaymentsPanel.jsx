"use client";

import { useEffect, useRef, useState } from "react";
import { Wallet, ReceiptText, Loader2, CheckCircle2, Clock, AlertTriangle, ArrowDownToLine, Banknote } from "lucide-react";

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

const money = (v) => `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (s) => { if (!s) return "—"; try { return new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }); } catch { return s; } };

export default function MyPaymentsPanel() {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const mountedRef = useRef(true);

  const load = () => {
    fetch("/api/payments/me", { cache: "no-store" })
      .then(async (r) => {
        const p = await r.json().catch(() => ({}));
        if (!mountedRef.current) return;
        if (!r.ok) return setState({ loading: false, error: p.error || "error", data: null });
        setState({ loading: false, error: "", data: p });
      })
      .catch(() => { if (mountedRef.current) setState({ loading: false, error: "Sin conexión.", data: null }); });
  };
  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, []);

  if (state.loading) {
    return <Card><div className="flex items-center gap-2 text-sm" style={{ color: "var(--vp-muted)" }}><Loader2 size={15} className="animate-spin" /> Cargando…</div></Card>;
  }
  if (state.error === "buyer_not_found") return null;
  if (state.error) return <Card><div className="text-sm" style={{ color: "var(--vp-muted)" }}>No se pudieron cargar tus datos.</div></Card>;

  const d = state.data;

  return (
    <Card>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric Icon={Wallet} label="Disponible para retirar" value={money(d.available_for_withdrawal_usd)} accent />
        <Metric Icon={Clock} label="Comisiones en maduración" value={money(d.commission_maturing_usd)} />
        <Metric Icon={CheckCircle2} label="Membresías activas" value={String(d.active_packages ?? 0)} />
      </div>

      <WithdrawSection data={d} onDone={load} />

      <div className="mt-5 flex items-center gap-2 text-xs font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
        <ReceiptText size={13} /> Mis pagos
      </div>
      {(!d.payments || d.payments.length === 0) ? (
        <p className="mt-2 text-sm" style={{ color: "var(--vp-muted)" }}>Aún no has realizado pagos.</p>
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
      )}

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

function WithdrawSection({ data, onDone }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const min = data.min_withdrawal_usd ?? 100;
  const avail = Number(data.available_for_withdrawal_usd ?? 0);

  async function submit() {
    setMsg({ type: "", text: "" });
    const amt = Number(amount);
    if (!amt || amt < min) return setMsg({ type: "err", text: `El mínimo de retiro es $${min}.` });
    if (amt > avail) return setMsg({ type: "err", text: "Supera tu saldo disponible." });
    if (bank.trim().length < 6) return setMsg({ type: "err", text: "Ingresa los datos bancarios." });
    setBusy(true);
    try {
      const r = await fetch("/api/payments/withdraw", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: amt.toFixed(2), bank_info: bank.trim() }),
      });
      const p = await r.json().catch(() => ({}));
      if (!r.ok) {
        const m = { min_withdrawal: `El mínimo es $${min}.`, insufficient_balance: "Saldo insuficiente.", no_balance: "No tienes saldo de comisiones." }[p.error] || "No se pudo solicitar el retiro.";
        setMsg({ type: "err", text: m });
      } else {
        setMsg({ type: "ok", text: "Solicitud enviada. Queda pendiente de aprobación." });
        setAmount(""); setBank(""); setOpen(false); onDone();
      }
    } catch {
      setMsg({ type: "err", text: "Sin conexión." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} disabled={avail < min}
          className="executive-button primary disabled:opacity-50">
          <ArrowDownToLine size={15} /> Solicitar retiro
        </button>
      ) : (
        <div className="rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
          <div className="mb-3 text-xs font-bold" style={{ color: "var(--vp-muted)" }}>
            Disponible {money(avail)} · mínimo ${min} · transferencia bancaria
          </div>
          <label className="mb-1 block text-[11px] font-black uppercase" style={{ color: "var(--vp-subtle)" }}>Monto (USD)</label>
          <input type="number" min={min} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="executive-input mb-3" placeholder={`${min}.00`} />
          <label className="mb-1 block text-[11px] font-black uppercase" style={{ color: "var(--vp-subtle)" }}>Datos bancarios</label>
          <textarea rows={3} value={bank} onChange={(e) => setBank(e.target.value)}
            className="executive-textarea mb-3"
            placeholder="Banco, número de cuenta/CLABE, titular, documento" />
          <div className="flex items-center gap-2">
            <button type="button" onClick={submit} disabled={busy}
              className="executive-button primary disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Banknote size={15} />} Enviar solicitud
            </button>
            <button type="button" onClick={() => { setOpen(false); setMsg({ type: "", text: "" }); }}
              className="executive-button ghost">Cancelar</button>
          </div>
        </div>
      )}
      {msg.text && (
        <p className="mt-2 text-xs font-semibold" style={{ color: msg.type === "ok" ? "var(--vp-accent)" : "var(--vp-danger)" }}>{msg.text}</p>
      )}
    </div>
  );
}

function Card({ children }) {
  return <section className="executive-panel vp-glass">{children}</section>;
}
function Metric({ Icon, label, value, accent }) {
  return (
    <div className={`executive-card p-3 ${accent ? "vp-glass-accent" : "vp-glass"}`}>
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
