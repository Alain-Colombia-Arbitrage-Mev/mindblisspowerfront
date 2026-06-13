"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

/**
 * Botón "Activar paquete": pide al BFF crear la sesión de Stripe Checkout y
 * redirige a la página de pago hosted (tarjeta + crypto).
 */
export default function ActivatePackageButton({ packageId, featured }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function activate() {
    setLoading(true);
    setError("");
    try {
      let ref = "";
      try { ref = localStorage.getItem("mp_ref") || ""; } catch { /* ignore */ }
      const resp = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ package_id: packageId, ref }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.url) {
        setError(
          data.error === "buyer_not_found"
            ? "Tu cuenta aún no está registrada en la red."
            : data.error === "payments-unconfigured"
              ? "Pagos no configurados todavía."
              : "No se pudo iniciar el pago. Intenta de nuevo."
        );
        setLoading(false);
        return;
      }
      window.location.href = data.url; // → Stripe Checkout
    } catch {
      setError("Sin conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={activate}
        disabled={loading}
        className={`executive-button w-full ${featured ? "primary" : ""}`}
        style={
          featured
            ? undefined
            : { background: "var(--vp-surface-raised)", color: "var(--vp-text)", border: "1px solid var(--vp-border)" }
        }
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <>Activar paquete <ArrowRight size={15} /></>}
      </button>
      {error && (
        <p className="mt-2 text-xs font-semibold" style={{ color: "var(--vp-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
