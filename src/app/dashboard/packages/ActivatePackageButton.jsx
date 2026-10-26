"use client";

import { useId, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { referralForCheckout } from "@/lib/referral-attribution";
import { checkoutErrorMessage, hostedCheckoutURL } from "@/lib/checkout-policy.mjs";
import { cn } from "@/lib/utils";

/**
 * El proveedor cobra una membresía; regresar al portal no confirma su activación.
 */
export default function ActivatePackageButton({ packageId, featured }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("stripe");
  const pending = useRef(false);
  const id = useId();

  async function activate() {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError("");
    try {
      let attribution = { code: "", email: "" };
      try {
        const session = await fetch("/api/auth/session", { cache: "no-store", signal: AbortSignal.timeout(8000) }).then((r) => (r.ok ? r.json() : null));
        attribution = referralForCheckout(session?.email || "");
      } catch {
        attribution = { code: "", email: "" };
      }
      const resp = await fetch("/api/payments/checkout", {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          package_id: packageId,
          provider,
          ref: attribution.code,
          ref_email: attribution.email,
          preferred_side: attribution.side || "",
        }),
      });
      const data = await resp.json().catch(() => ({}));
      const url = hostedCheckoutURL(data.url, provider, data.checkout_environment);
      if (!resp.ok || !url || data.provider !== provider
          || (provider === "nowpayments" && data.fulfillment_status !== "review_required")) {
        setError(checkoutErrorMessage(data.error, provider));
        setLoading(false);
        pending.current = false;
        return;
      }
      window.location.assign(url);
    } catch {
      setError(checkoutErrorMessage("payments-unreachable", provider));
      setLoading(false);
      pending.current = false;
    }
  }

  return (
    <div className="mt-5" aria-busy={loading}>
      <label htmlFor={`${id}-provider`} className="mb-2 block text-sm font-semibold" style={{ color: "var(--vp-text-soft)" }}>
        Método de pago
      </label>
      <select
        id={`${id}-provider`}
        value={provider}
        onChange={(event) => { setProvider(event.target.value); setError(""); }}
        disabled={loading}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        className="mb-3 min-h-11 w-full rounded-lg border px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
        style={{ background: "var(--vp-surface-raised)", color: "var(--vp-text)", borderColor: "var(--vp-border)", outlineColor: "var(--vp-accent)" }}
      >
        <option value="stripe">Tarjeta · Stripe</option>
        <option value="nowpayments">Cripto · NOWPayments</option>
      </select>
      <p id={`${id}-hint`} className="mb-3 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
        {provider === "nowpayments"
          ? "Compra de membresía sujeta a validación. No es una recarga de saldo. Disponible al finalizar la habilitación de pagos."
          : "La membresía se confirma cuando el servidor verifica el pago. No es una recarga de saldo."}
      </p>
      <button
        type="button"
        onClick={activate}
        disabled={loading}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        className={cn("executive-button w-full", featured && "primary")}
        style={
          featured
            ? undefined
            : { background: "var(--vp-surface-raised)", color: "var(--vp-text)", border: "1px solid var(--vp-border)" }
        }
      >
        {loading ? <><Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Preparando pago…</> : <>Continuar al pago <ArrowRight size={15} aria-hidden="true" /></>}
      </button>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-xs font-semibold" style={{ color: "var(--vp-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
