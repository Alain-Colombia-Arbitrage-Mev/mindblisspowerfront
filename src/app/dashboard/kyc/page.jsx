"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import KycDocumentCard from "@/components/panel/kyc/KycDocumentCard";
import KycStatusBadge from "@/components/panel/kyc/KycStatusBadge";
import { KYC_DOC_TYPES } from "@/components/panel/kyc/kycConfig";

export default function KycPage() {
  const [state, setState] = useState({ loading: true, error: "", documents: [], kycStatus: "not_started" });
  const [legalName, setLegalName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState({ type: "", text: "" });
  const nameEditedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/member/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // No pisar lo que el usuario ya empezó a escribir si el fetch llega tarde.
        if (cancelled || !d || nameEditedRef.current) return;
        setLegalName([d.first_name, d.last_name].filter(Boolean).join(" ").trim());
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  async function saveName() {
    setNameSaving(true);
    setNameMsg({ type: "", text: "" });
    try {
      const r = await fetch("/api/member/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: legalName.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setNameMsg({ type: "err", text: d.error === "person_not_found" ? "No se pudo guardar." : "No se pudieron guardar los cambios." });
      } else {
        setNameMsg({ type: "ok", text: "Nombre guardado." });
        try { window.dispatchEvent(new CustomEvent("vp:profile-updated", { detail: { name: legalName.trim() } })); } catch { /* ignore */ }
      }
    } catch {
      setNameMsg({ type: "err", text: "Sin conexión. Intenta de nuevo." });
    } finally {
      setNameSaving(false);
    }
  }

  const load = useCallback(() => {
    fetch("/api/member/kyc/documents", { cache: "no-store" })
      .then(async (resp) => {
        const payload = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          setState({ loading: false, error: payload.error || "kyc-list-failed", documents: [], kycStatus: "not_started" });
          return;
        }
        setState({
          loading: false,
          error: "",
          documents: payload.documents ?? [],
          kycStatus: payload.kyc_status ?? "not_started",
        });
      })
      .catch(() => setState({ loading: false, error: "payments-unreachable", documents: [], kycStatus: "not_started" }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // TODOS los documentos se validan automáticamente por OCR en segundos. Mientras
  // haya alguno "en revisión" hacemos poll cada 2s (hasta 60s) para reflejar la
  // aprobación/rechazo sin recargar.
  const ocrPending = state.documents.some((d) => d.status === "in_review");
  const [pollTimedOut, setPollTimedOut] = useState(false);
  useEffect(() => {
    if (!ocrPending) {
      setPollTimedOut(false);
      return undefined;
    }
    setPollTimedOut(false);
    const started = Date.now();
    const id = setInterval(() => {
      if (Date.now() - started > 60000) {
        clearInterval(id);
        setPollTimedOut(true); // deja de girar y muestra un aviso distinto
        return;
      }
      load();
    }, 2000);
    return () => clearInterval(id);
  }, [ocrPending, load]);

  const latestByType = new Map();
  for (const doc of state.documents) {
    if (!latestByType.has(doc.doc_type)) latestByType.set(doc.doc_type, doc);
  }

  return (
    <div className="flex min-h-full flex-col gap-6 p-6 lg:p-8">
      <section
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-6"
        style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
      >
        <div className="flex items-center gap-4">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "rgba(250, 204, 21, 0.1)", border: "1px solid rgba(250, 204, 21, 0.2)" }}
          >
            <ShieldCheck size={20} style={{ color: "var(--vp-accent)" }} />
          </span>
          <div>
            <h2 className="m-0 text-base font-bold" style={{ color: "var(--vp-text)" }}>
              Verificación de identidad
            </h2>
            <p className="m-0 mt-1 text-xs font-light" style={{ color: "var(--vp-muted)" }}>
              Sube tus documentos para habilitar retiros y funciones completas de la cuenta.
            </p>
          </div>
        </div>
        {state.loading ? (
          <Loader2 className="animate-spin" size={16} style={{ color: "var(--vp-accent)" }} />
        ) : (
          <KycStatusBadge status={state.kycStatus} />
        )}
      </section>

      <section
        className="rounded-2xl border p-6"
        style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
      >
        <h3 className="m-0 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
          Tu nombre legal
        </h3>
        <p className="m-0 mt-1 text-xs font-light" style={{ color: "var(--vp-muted)" }}>
          Debe coincidir EXACTAMENTE con el nombre de tu documento; se usa para validar tu identidad.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            className="executive-input flex-1"
            value={legalName}
            onChange={(e) => { nameEditedRef.current = true; setLegalName(e.target.value); }}
            placeholder="Nombre(s) y apellido(s) como en tu documento"
          />
          <button
            type="button"
            className="executive-button primary"
            onClick={saveName}
            disabled={nameSaving || !legalName.trim()}
          >
            {nameSaving ? "Guardando…" : "Guardar nombre"}
          </button>
        </div>
        {nameMsg.text ? (
          <p className="mt-2 text-xs font-semibold" style={{ color: nameMsg.type === "ok" ? "var(--vp-accent)" : "#f87171" }}>
            {nameMsg.text}
          </p>
        ) : null}
      </section>

      {ocrPending && !pollTimedOut ? (
        <section
          className="flex items-center gap-3 rounded-2xl border p-4 text-xs"
          style={{ background: "var(--vp-surface)", borderColor: "rgba(250,204,21,0.3)", color: "var(--vp-muted)" }}
        >
          <Loader2 className="animate-spin" size={15} style={{ color: "var(--vp-accent)" }} />
          Validando tus documentos automáticamente… suele tardar solo unos segundos. No cierres esta página.
        </section>
      ) : ocrPending && pollTimedOut ? (
        <section
          className="flex items-center justify-between gap-3 rounded-2xl border p-4 text-xs"
          style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)", color: "var(--vp-muted)" }}
        >
          <span>La validación está tardando más de lo normal. Puedes recargar para ver el estado.</span>
          <button type="button" className="executive-button" onClick={() => { setPollTimedOut(false); load(); }}>
            Actualizar
          </button>
        </section>
      ) : null}

      {state.error ? (
        <section
          className="rounded-2xl border p-5 text-sm"
          style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)", color: "var(--vp-muted)" }}
        >
          {state.error === "payments-unconfigured" || state.error === "payments-unreachable" || state.error === "kyc-unconfigured"
            ? "El servicio de verificación no está disponible en este momento. Intenta más tarde."
            : "No se pudieron cargar tus documentos. Recarga la página."}
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {KYC_DOC_TYPES.map((docType) => (
          <KycDocumentCard
            key={docType.id}
            docType={docType}
            currentDocument={latestByType.get(docType.id) ?? null}
            onUploaded={load}
          />
        ))}
      </div>
    </div>
  );
}
