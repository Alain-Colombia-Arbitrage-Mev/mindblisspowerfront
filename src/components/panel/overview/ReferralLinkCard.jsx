"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

// Tarjeta del link de referido en la primera hoja del dashboard. El link sale de
// /api/member/referral (invitation_link real o MP{id}); al copiarlo, quien se
// registra por ese link queda atribuido bajo este miembro en el arbol.
export default function ReferralLinkCard() {
  const [link, setLink] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/member/referral", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (!d || d.error) {
          setStatus("error");
          return;
        }
        if (!d.positioned) {
          setStatus("pending");
          setLink("");
          setCode("");
          return;
        }
        if (d.link) setLink(d.link);
        if (d.code) setCode(d.code);
        setStatus(d.link ? "ready" : "pending");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard bloqueado: el usuario puede seleccionar y copiar manualmente */
    }
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Share2 size={18} style={{ color: "var(--vp-accent)" }} />
        <h3 className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>
          Tu link de referido
        </h3>
        {code ? (
          <span className="ml-auto text-xs font-semibold" style={{ color: "var(--vp-muted)" }}>
            Código: {code}
          </span>
        ) : null}
      </div>
      <p className="mb-3 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
        {status === "ready"
          ? "Comparte este link. Quien se registre por él queda en tu red."
          : "Tu link se activa cuando tu membresía queda pagada y tu posición existe en el árbol."}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={displayValue(status, link)}
          onFocus={(e) => e.target.select()}
          className="min-h-11 w-full min-w-0 rounded-lg px-3 text-sm font-semibold outline-none"
          style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }}
        />
        <button
          type="button"
          onClick={copy}
          disabled={!link}
          className="executive-button primary flex min-h-11 shrink-0 items-center justify-center gap-2 px-4 disabled:opacity-60"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

function displayValue(status, link) {
  if (link) return link;
  if (status === "loading") return "Cargando link...";
  if (status === "error") return "No se pudo consultar el link en este momento";
  return "Pendiente de activación y ubicación en el árbol";
}
