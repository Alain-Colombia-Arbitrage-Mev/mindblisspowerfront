"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowDownRight, Check, Copy, Share2 } from "lucide-react";

const EMPTY_LINKS = { left: "", right: "" };

// Resumen de los dos enlaces binarios. Cada enlace conserva el mismo sponsor,
// pero solicita que la colocación derrame por la rama elegida.
export default function ReferralLinkCard() {
  const [links, setLinks] = useState(EMPTY_LINKS);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState("");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/member/referral", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (!data || data.error) {
          setStatus("error");
          return;
        }
        if (!data.positioned) {
          setStatus("pending");
          setLinks(EMPTY_LINKS);
          setCode("");
          return;
        }
        const nextLinks = referralLinksFrom(data);
        setLinks(nextLinks);
        setCode(data.code || "");
        setStatus(nextLinks.left && nextLinks.right ? "ready" : "pending");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function copy(side) {
    const link = links[side];
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(side);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      // El campo sigue siendo seleccionable si el navegador bloquea clipboard.
    }
  }

  return (
    <div className="rounded-2xl p-5" style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Share2 size={18} style={{ color: "var(--vp-accent)" }} />
        <h3 className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>Tus enlaces de red</h3>
        {code ? <span className="ml-auto text-xs font-semibold" style={{ color: "var(--vp-muted)" }}>Código: {code}</span> : null}
      </div>
      <p className="mb-4 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
        {status === "ready"
          ? "Elige la rama antes de compartir. Si el puesto está ocupado, el nuevo usuario continúa debajo por ese mismo lado."
          : "Tus enlaces se activan cuando tu membresía queda pagada y tu posición existe en el árbol."}
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        <SideLink label="Rama izquierda" hint="Colocación L → L" Icon={ArrowDownLeft} link={links.left} status={status} copied={copied === "left"} onCopy={() => copy("left")} />
        <SideLink label="Rama derecha" hint="Colocación R → R" Icon={ArrowDownRight} link={links.right} status={status} copied={copied === "right"} onCopy={() => copy("right")} />
      </div>
    </div>
  );
}

function SideLink({ label, hint, Icon, link, status, copied, onCopy }) {
  return (
    <section className="min-w-0 rounded-xl border p-3" style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--vp-accent-muted)", color: "var(--vp-accent)" }}>
          <Icon size={16} />
        </span>
        <div>
          <p className="m-0 text-xs font-bold" style={{ color: "var(--vp-text)" }}>{label}</p>
          <p className="m-0 text-[10px] font-semibold" style={{ color: "var(--vp-subtle)" }}>{hint}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <input readOnly value={displayValue(status, link)} onFocus={(event) => event.target.select()} aria-label={`Enlace para ${label.toLowerCase()}`} className="min-h-11 w-full min-w-0 rounded-lg px-3 text-xs font-semibold outline-none" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }} />
        <button type="button" onClick={onCopy} disabled={!link} aria-label={`Copiar enlace de ${label.toLowerCase()}`} className="executive-button primary flex min-h-11 w-11 shrink-0 items-center justify-center p-0 disabled:opacity-60">
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </section>
  );
}

function referralLinksFrom(data) {
  const left = data?.links?.left || data?.link_left || data?.link || "";
  const right = data?.links?.right || data?.link_right || linkWithSide(left, "R");
  return { left, right };
}

function linkWithSide(link, side) {
  if (!link) return "";
  try {
    const url = new URL(link);
    url.searchParams.set("side", side);
    return url.toString();
  } catch {
    return link;
  }
}

function displayValue(status, link) {
  if (link) return link;
  if (status === "loading") return "Cargando enlace...";
  if (status === "error") return "No disponible en este momento";
  return "Pendiente de activación";
}
