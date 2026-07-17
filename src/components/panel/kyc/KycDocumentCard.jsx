"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";

import KycStatusBadge from "./KycStatusBadge";
import { KYC_ACCEPTED_MIMES, KYC_MAX_SIZE_BYTES } from "./kycConfig";

const ERROR_MESSAGES = {
  "invalid-mime": "Formato no permitido. Usa PDF, JPG o PNG.",
  "invalid-size": "El archivo supera el límite de 15 MB.",
  "payments-unconfigured": "El servicio de verificación no está disponible.",
  "payments-unreachable": "El servicio de verificación no está disponible.",
  "kyc-unconfigured": "La subida de documentos aún no está habilitada.",
  "object-not-uploaded": "La subida a almacenamiento falló. Intenta de nuevo.",
  "person-not-found": "Tu perfil aún no está registrado. Contacta a soporte.",
};

function friendlyError(code) {
  return ERROR_MESSAGES[code] ?? "No se pudo subir el documento. Intenta de nuevo.";
}

export default function KycDocumentCard({ docType, currentDocument, onUploaded }) {
  const inputRef = useRef(null);
  const [phase, setPhase] = useState("idle"); // idle | uploading | error
  const [error, setError] = useState("");
  const Icon = docType.icon;

  // Solo se bloquea si ya está APROBADO. En revisión o rechazado se puede volver
  // a subir (para no quedar atascado esperando).
  const locked = currentDocument && currentDocument.status === "approved";

  const upload = async (file) => {
    setError("");
    if (!KYC_ACCEPTED_MIMES.includes(file.type)) {
      setError(friendlyError("invalid-mime"));
      return;
    }
    if (file.size > KYC_MAX_SIZE_BYTES || file.size <= 0) {
      setError(friendlyError("invalid-size"));
      return;
    }
    setPhase("uploading");
    try {
      const urlResp = await fetch("/api/member/kyc/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ doc_type: docType.id, file_name: file.name, mime: file.type, size: file.size }),
      });
      const urlPayload = await urlResp.json().catch(() => ({}));
      if (!urlResp.ok) throw new Error(urlPayload.error || "upload-url-failed");

      const putResp = await fetch(urlPayload.upload_url, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putResp.ok) throw new Error("object-not-uploaded");

      const confirmResp = await fetch("/api/member/kyc/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ document_id: urlPayload.document_id }),
      });
      const confirmPayload = await confirmResp.json().catch(() => ({}));
      if (!confirmResp.ok) throw new Error(confirmPayload.error || "confirm-failed");

      setPhase("idle");
      onUploaded?.();
    } catch (err) {
      setPhase("error");
      setError(friendlyError(err.message));
    }
  };

  return (
    <div
      className="flex flex-col rounded-2xl border p-5"
      style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ background: "rgba(250, 204, 21, 0.1)", border: "1px solid rgba(250, 204, 21, 0.2)" }}
        >
          <Icon size={16} style={{ color: "var(--vp-accent)" }} />
        </span>
        {currentDocument ? <KycStatusBadge status={currentDocument.status} /> : null}
      </div>

      <h3 className="m-0 mt-4 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
        {docType.title}
      </h3>
      <p className="m-0 mt-1 flex-1 text-xs font-light leading-relaxed" style={{ color: "var(--vp-muted)" }}>
        {docType.description}
      </p>

      {currentDocument?.status === "rejected" && currentDocument.reject_reason ? (
        <p className="m-0 mt-2 text-xs" style={{ color: "#f87171" }}>
          Motivo: {currentDocument.reject_reason}
        </p>
      ) : null}
      {error ? (
        <p className="m-0 mt-2 text-xs" style={{ color: "#f87171" }}>
          {error}
        </p>
      ) : null}

      <input
        ref={inputRef}
        accept={KYC_ACCEPTED_MIMES.join(",")}
        className="hidden"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) upload(file);
        }}
      />

      <button
        className="mt-4 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold"
        disabled={locked || phase === "uploading"}
        style={
          locked
            ? { background: "var(--vp-surface-raised)", color: "var(--vp-subtle)", border: 0, cursor: "not-allowed" }
            : { background: "var(--vp-accent)", color: "#000000", border: 0, cursor: "pointer" }
        }
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        {phase === "uploading" ? (
          <>
            <Loader2 className="animate-spin" size={13} />
            Subiendo…
          </>
        ) : locked ? (
          currentDocument.status === "approved" ? "Documento aprobado" : "En revisión"
        ) : (
          <>
            <Upload size={13} />
            {currentDocument ? "Volver a subir" : "Subir documento"}
          </>
        )}
      </button>

      <p className="m-0 mt-2 text-center text-[10px]" style={{ color: "var(--vp-subtle)" }}>
        PDF, JPG o PNG · máx. 15 MB
      </p>
    </div>
  );
}
