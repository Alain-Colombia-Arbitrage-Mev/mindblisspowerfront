"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

/**
 * Popup de resultado del pago. Stripe redirige a
 * /dashboard/packages?paid=1&session_id=... (éxito) o ?canceled=1 (cancelado);
 * este modal consume esos parámetros y luego limpia la URL para que un
 * refresh no re-muestre el popup.
 */
export default function PaymentResultModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState(null); // "paid" | "canceled" | null

  useEffect(() => {
    if (searchParams.get("paid") === "1") setResult("paid");
    else if (searchParams.get("canceled") === "1") setResult("canceled");
  }, [searchParams]);

  if (!result) return null;

  const close = () => {
    setResult(null);
    router.replace("/dashboard/packages", { scroll: false });
    router.refresh(); // re-consulta MyPaymentsPanel para reflejar la activación
  };

  const paid = result === "paid";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 text-center"
        style={{
          background: "var(--vp-surface)",
          border: `1px solid ${paid ? "var(--vp-amber-border, rgba(250,204,21,0.35))" : "var(--vp-border)"}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: paid ? "rgba(250, 204, 21, 0.12)" : "rgba(239, 68, 68, 0.10)",
            border: `1px solid ${paid ? "rgba(250, 204, 21, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
          }}
        >
          {paid ? (
            <CheckCircle2 size={30} style={{ color: "var(--vp-accent)" }} />
          ) : (
            <XCircle size={30} style={{ color: "#ef4444" }} />
          )}
        </span>

        <h2 className="m-0 text-2xl font-bold" style={{ color: "var(--vp-text)" }}>
          {paid ? "¡Pago completado con éxito!" : "Pago cancelado"}
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          {paid
            ? "Tu paquete se está activando: en unos segundos aparecerá en \"Mis pagos\" y tu posición en la red quedará habilitada."
            : "No se realizó ningún cargo. Puedes intentar de nuevo cuando quieras."}
        </p>

        <button type="button" className="executive-button primary mt-6 w-full" onClick={close}>
          {paid ? "Ver mis pagos" : "Volver al catálogo"}
        </button>
      </div>
    </div>
  );
}
