"use client";

import { useState } from "react";
import { LifeBuoy, Loader2, Send } from "lucide-react";

// Formulario real de creación de tickets de soporte.
// POST /api/member/support/ticket -> backend {id, status:"open"}.
export default function SupportTicketForm({ onCreated }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const canSend = subject.trim() && body.trim() && !sending;

  async function submit(e) {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setMsg({ type: "", text: "" });
    try {
      const r = await fetch("/api/member/support/ticket", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const m =
          {
            invalid_ticket: "El asunto y el mensaje son obligatorios.",
            unauthenticated: "Tu sesión expiró. Vuelve a iniciar sesión.",
            "session-invalid": "Tu sesión expiró. Vuelve a iniciar sesión.",
            "payments-unreachable": "No pudimos conectar con soporte. Intenta de nuevo.",
            "payments-unconfigured": "Soporte no está disponible por ahora.",
          }[d.error] || "No se pudo crear el ticket. Intenta de nuevo.";
        setMsg({ type: "err", text: m });
      } else {
        const id = d.id != null ? d.id : "";
        setMsg({ type: "ok", text: id ? `Ticket #${id} creado. Te responderemos pronto.` : "Ticket creado. Te responderemos pronto." });
        setSubject("");
        setBody("");
        if (typeof onCreated === "function") onCreated();
      }
    } catch {
      setMsg({ type: "err", text: "Sin conexión. Intenta de nuevo." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="executive-panel mb-6">
      <h2 className="executive-section-title mb-5">
        <LifeBuoy size={18} style={{ color: "var(--vp-accent)" }} />
        Crear ticket de soporte
      </h2>
      <form className="space-y-4" onSubmit={submit}>
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase" style={{ color: "var(--vp-muted)", letterSpacing: "0.1em" }}>
            Asunto
          </span>
          <input
            className="executive-input"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Resume tu consulta (login, KYC, pagos, retiros…)"
            maxLength={140}
            disabled={sending}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase" style={{ color: "var(--vp-muted)", letterSpacing: "0.1em" }}>
            Mensaje
          </span>
          <textarea
            className="executive-textarea"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe tu problema con el mayor detalle posible."
            disabled={sending}
          />
        </label>
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
          <button className="executive-button primary" type="submit" disabled={!canSend}>
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? "Enviando…" : "Enviar ticket"}
          </button>
          {msg.text && (
            <span className="text-sm font-semibold" style={{ color: msg.type === "ok" ? "var(--vp-accent)" : "#f87171" }}>
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
