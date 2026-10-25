"use client";

import { useState } from "react";
import { ArrowDownToLine, Banknote, Loader2 } from "lucide-react";
import { formatPaymentMoney as money, withdrawalTerms } from "@/lib/payment-display.mjs";

export default function WithdrawalRequest({ data, onDone }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const { min, available, allowed } = withdrawalTerms(data);

  async function submit() {
    setMsg({ type: "", text: "" });
    if (!allowed || busy) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < min) return setMsg({ type: "err", text: `El mínimo de retiro es $${min}.` });
    if (amt > available) return setMsg({ type: "err", text: "Supera tu saldo disponible." });
    if (bank.trim().length < 6) return setMsg({ type: "err", text: "Ingresa los datos bancarios." });
    setBusy(true);
    try {
      const r = await fetch("/api/payments/withdraw", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: amt.toFixed(2), bank_info: bank.trim() }),
      });
      const p = await r.json().catch(() => ({}));
      if (!r.ok) {
        const text = { min_withdrawal: `El mínimo es $${min}.`, insufficient_balance: "Saldo insuficiente.", no_balance: "No tienes saldo de comisiones." }[p.error] || "No se pudo solicitar el retiro.";
        setMsg({ type: "err", text });
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
      {!open || !allowed ? (
        <button type="button" onClick={() => setOpen(true)} disabled={!allowed}
          className="executive-button primary disabled:opacity-50">
          <ArrowDownToLine size={15} /> Solicitar retiro
        </button>
      ) : (
        <div className="rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
          <div className="mb-3 text-xs font-bold" style={{ color: "var(--vp-muted)" }}>
            Disponible {money(available)} · mínimo ${min} · transferencia bancaria
          </div>
          <label htmlFor="withdrawal-amount" className="mb-1 block text-[11px] font-black uppercase" style={{ color: "var(--vp-subtle)" }}>Monto (USD)</label>
          <input id="withdrawal-amount" type="number" min={min} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="executive-input mb-3" placeholder={`${min}.00`} />
          <label htmlFor="withdrawal-bank" className="mb-1 block text-[11px] font-black uppercase" style={{ color: "var(--vp-subtle)" }}>Datos bancarios</label>
          <textarea id="withdrawal-bank" rows={3} value={bank} onChange={(e) => setBank(e.target.value)}
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
