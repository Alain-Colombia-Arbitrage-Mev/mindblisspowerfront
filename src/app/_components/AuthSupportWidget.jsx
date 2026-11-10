"use client";

import { ChevronUp, Headphones, LifeBuoy, Loader2, Send, X } from "lucide-react";
import { useId, useState } from "react";

export default function AuthSupportWidget({ initialEmail = "", variant = "floating" }) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  const header = variant === "header";

  function close() {
    if (!sending) setOpen(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setFeedback({ type: "", text: "" });
    try {
      const response = await fetch("/api/auth/access-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          reason: "support_widget",
          note: note.trim() || "Solicitud de ayuda enviada desde el widget de acceso.",
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true) {
        setFeedback({ type: "error", text: payload.error || "No pudimos registrar tu solicitud. Intenta nuevamente." });
        return;
      }
      setFeedback({ type: "success", text: "Solicitud registrada. Soporte revisará tu caso y te contactará por los datos indicados." });
      setPhone("");
      setNote("");
    } catch {
      setFeedback({ type: "error", text: "No pudimos conectar con soporte. Revisa tu conexión e intenta nuevamente." });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={header ? "auth-support-trigger auth-support-trigger--header" : "vp-support-launcher auth-support-trigger auth-support-trigger--floating"}
        onClick={() => setOpen(true)}
        aria-label="Abrir soporte de acceso"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {header ? <><Headphones size={16} aria-hidden="true" />¿Necesitas ayuda?</> : <>
          <span className="vp-support-launcher-icon"><Headphones size={22} aria-hidden="true" /></span>
          <span className="vp-support-launcher-copy"><strong>¿Necesitas ayuda?</strong><small>Habla con soporte</small></span>
          <ChevronUp className="auth-support-chevron" size={18} aria-hidden="true" />
        </>}
      </button>

      {open ? <div className="auth-support-overlay" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
        <dialog open className="auth-support-dialog" aria-labelledby={titleId} aria-modal="true" onKeyDown={event => { if (event.key === "Escape") close(); }}>
          <div className="auth-support-dialog-header">
            <span className="auth-support-dialog-icon"><LifeBuoy size={20} aria-hidden="true" /></span>
            <div><p>Soporte de acceso</p><h2 id={titleId}>¿Cómo podemos ayudarte?</h2></div>
            <button type="button" className="auth-support-close" onClick={close} disabled={sending} aria-label="Cerrar soporte"><X size={19} aria-hidden="true" /></button>
          </div>

          {feedback.type === "success" ? <div className="auth-support-success" role="status">
            <LifeBuoy size={26} aria-hidden="true" />
            <p>{feedback.text}</p>
            <button type="button" onClick={close}>Cerrar</button>
          </div> : <form className="auth-support-form" onSubmit={submit}>
            <p>Cuéntanos el problema de acceso. No incluyas contraseñas ni códigos de verificación.</p>
            <label htmlFor={`${titleId}-email`}>Correo de tu cuenta</label>
            <input id={`${titleId}-email`} name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="nombre@correo.com…" disabled={sending} />
            <label htmlFor={`${titleId}-phone`}>Teléfono de contacto <span>opcional</span></label>
            <input id={`${titleId}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} value={phone} onChange={event => setPhone(event.target.value)} placeholder="+57 300 123 4567…" disabled={sending} />
            <label htmlFor={`${titleId}-note`}>¿Qué ocurrió?</label>
            <textarea id={`${titleId}-note`} name="note" autoComplete="off" rows={4} maxLength={500} value={note} onChange={event => setNote(event.target.value)} placeholder="Describe brevemente el problema…" disabled={sending} />
            {feedback.type === "error" ? <p className="auth-support-feedback" role="alert">{feedback.text}</p> : null}
            <button className="auth-support-submit" type="submit" disabled={sending || !email.trim()}>
              {sending ? <Loader2 className="animate-spin" size={17} aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
              {sending ? "Enviando solicitud…" : "Enviar a soporte"}
            </button>
          </form>}
        </dialog>
      </div> : null}
    </>
  );
}
