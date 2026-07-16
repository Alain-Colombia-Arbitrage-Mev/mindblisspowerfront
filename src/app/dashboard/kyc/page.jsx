"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import KycDocumentCard from "@/components/panel/kyc/KycDocumentCard";
import KycStatusBadge from "@/components/panel/kyc/KycStatusBadge";
import { KYC_DOC_TYPES } from "@/components/panel/kyc/kycConfig";

export default function KycPage() {
  const [state, setState] = useState({ loading: true, error: "", documents: [], kycStatus: "not_started" });

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

  // Mientras haya un documento "en revisión" (p. ej. un pasaporte con el OCR
  // corriendo), poll cada 3s hasta 60s para reflejar la auto-aprobación/rechazo
  // sin recargar la página. El tope evita poll infinito si queda revisión manual.
  const inReview = state.documents.some((d) => d.status === "in_review");
  useEffect(() => {
    if (!inReview) return undefined;
    const started = Date.now();
    const id = setInterval(() => {
      if (Date.now() - started > 60000) {
        clearInterval(id);
        return;
      }
      load();
    }, 3000);
    return () => clearInterval(id);
  }, [inReview, load]);

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

      {inReview ? (
        <section
          className="flex items-center gap-3 rounded-2xl border p-4 text-xs"
          style={{ background: "var(--vp-surface)", borderColor: "rgba(250,204,21,0.3)", color: "var(--vp-muted)" }}
        >
          <Loader2 className="animate-spin" size={15} style={{ color: "var(--vp-accent)" }} />
          Estamos verificando tus documentos. Los pasaportes se validan automáticamente en unos segundos; no cierres esta página.
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
