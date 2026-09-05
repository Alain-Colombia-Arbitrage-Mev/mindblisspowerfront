"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { referralForCheckout } from "@/lib/referral-attribution";

/**
 * Botón "Activar membresía": pide al BFF crear la sesión de Stripe Checkout y
 * redirige a la página de pago hosted (tarjeta + crypto).
 */
export default function ActivatePackageButton({ packageId, featured }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function activate() {
    setLoading(true);
    setError("");
    try {
      let attribution = { code: "", email: "" };
      try {
        const session = await fetch("/api/auth/session", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
        attribution = referralForCheckout(session?.email || "");
      } catch {
        attribution = { code: "", email: "" };
      }
      const resp = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          package_id: packageId,
          ref: attribution.code,
          ref_email: attribution.email,
          preferred_side: attribution.side || "",
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.url) {
        setError(
          data.error === "buyer_not_found"
            ? "Tu cuenta aún no está registrada en la red."
            : data.error === "invalid_referral_code"
              ? "El enlace de referido no es válido o ya no está activo. Solicita un enlace nuevo antes de pagar."
            : data.error === "tree_relocation_required"
              ? "Tu cuenta requiere revisión de sponsor y árbol antes de comprar. No se generó ningún cobro; contacta soporte."
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
        {loading ? <Loader2 size={15} className="animate-spin" /> : <>Activar membresía <ArrowRight size={15} /></>}
      </button>
      {error && (
        <p className="mt-2 text-xs font-semibold" style={{ color: "var(--vp-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
