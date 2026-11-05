"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { verifiedReferralForCheckout } from '@/lib/referral-sync.mjs';
import { useMemberSession } from "@/lib/member-session-context";
import { checkoutErrorNotice, hostedCheckoutURL } from "@/lib/checkout-policy.mjs";
import { clearCheckoutIntent, getOrCreateCheckoutIntent, readCheckoutIntent } from "@/lib/checkout-intent.mjs";
import { cn } from "@/lib/utils";
import { browserRequestDeadline } from '@/lib/browser-request-deadline.mjs';

/**
 * El proveedor cobra una membresía; regresar al portal no confirma su activación.
 */
export default function ActivatePackageButton({ packageId, featured, stripeEnabled = false, nowpaymentsEnabled = false }) {
  const memberSession = useMemberSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState(() => stripeEnabled === true ? "stripe" : "nowpayments");
  const pending = useRef(false);
  const mounted = useRef(true);
  const activeRequest = useRef(null);
  // A retry belongs to this exact intent. Independent purchases of the same
  // package are allowed, but must never arise from a timeout or page reload.
  const purchaseRequest = useRef(null);
  const [processed, setProcessed] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const id = useId();
  const providerEnabled = provider === "stripe" ? stripeEnabled === true
    : provider === "nowpayments" && nowpaymentsEnabled === true;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      activeRequest.current?.abort();
      activeRequest.current = null;
      pending.current = false;
    };
  }, []);

  useEffect(() => {
    try {
      const requestId = readCheckoutIntent(window.sessionStorage, memberSession?.subject, packageId);
      purchaseRequest.current = requestId ? { subject: memberSession.subject, requestId } : null;
      setPrepared(Boolean(requestId));
    } catch { /* Missing context/storage is checked before any checkout POST. */ }
  }, [memberSession?.subject, packageId]);

  useEffect(() => {
    const returned = (event) => {
      if (!event.persisted) return;
      pending.current = false;
      setLoading(false);
      // Returning from a hosted invoice releases the button, not its intent.
    };
    window.addEventListener("pageshow", returned);
    return () => window.removeEventListener("pageshow", returned);
  }, []);

  function prepareAnotherPurchase() {
    if (pending.current || provider !== "nowpayments") return;
    try {
      clearCheckoutIntent(window.sessionStorage, purchaseRequest.current?.subject || memberSession?.subject, packageId);
      purchaseRequest.current = null;
      setPrepared(false);
      setProcessed(false);
      setError("");
    } catch {
      setError("No pudimos preparar otra compra segura. Permite el almacenamiento de esta pestaña y vuelve a intentarlo.");
    }
  }

  async function activate() {
    if (pending.current || !mounted.current) return;
    if (provider === "stripe" && stripeEnabled !== true) {
      setError(checkoutErrorNotice("stripe_checkout_disabled", provider));
      return;
    }
    if (provider === "nowpayments" && nowpaymentsEnabled !== true) {
      setError(checkoutErrorNotice("nowpayments_checkout_disabled", provider));
      return;
    }
    if (!providerEnabled) {
      setError("Selecciona un método de pago disponible.");
      return;
    }
    pending.current = true;
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError("");
    let requestSent = false;
    try {
      /** @type {{ code?: string, email?: string, side?: string }} */
      let attribution = { code: "", email: "" };
      let session = null;
      try {
        // The mounted shell already reads this presentation context. Reuse it
        // only for an email-bound referral hint; the BFF still verifies the
        // live cookie/JWT and matches ref_email to its authoritative identity.
        // Preserve the cold-start fallback instead of dropping attribution.
        if (typeof memberSession?.email === "string" && memberSession.email.trim()
            && (provider !== "nowpayments" || memberSession?.subject)) session = memberSession;
        else {
          const deadline = browserRequestDeadline(controller.signal, 8000);
          try {
            // Checkout needs only canonical identity. Optional display/referral
            // enrichment can be slower than this deadline and must not turn a
            // valid session into an unavailable attribution preflight.
            const response = await fetch('/api/auth/session?view=access', { cache: 'no-store', signal: deadline.signal });
            session = response.ok ? await response.json() : null;
          } finally { deadline.dispose(); }
        }
      } catch {
        attribution = { code: "", email: "" };
      }
      if (!mounted.current || activeRequest.current !== controller || controller.signal.aborted) return;
      const referral = await verifiedReferralForCheckout(session?.email || '');
      if (!mounted.current || activeRequest.current !== controller || controller.signal.aborted) return;
      if (!referral.ok) {
        setError(referral.error === 'pending'
          ? 'Tu enlace de referido aún no quedó confirmado. Usa «Reintentar guardar enlace» en el aviso del panel antes de comprar. No se inició ningún cobro.'
          : referral.error === 'unconfirmed'
            ? 'El servidor no tiene confirmado tu enlace de referido. En el aviso del panel, revisa el referido y usa «Guardar este enlace como mi elección» antes de comprar. No se inició ningún cobro.'
          : 'No pudimos comprobar tu enlace de referido de forma segura. Recarga el panel o inténtalo más tarde. No se inició ningún cobro.');
        setLoading(false);
        pending.current = false;
        return;
      }
      attribution = referral;
      if (provider === "nowpayments") {
        const requestId = getOrCreateCheckoutIntent(window.sessionStorage, session?.subject, packageId, () => crypto.randomUUID());
        purchaseRequest.current = { subject: session.subject, requestId };
        setPrepared(true);
      }
      requestSent = true;
      const deadline = browserRequestDeadline(controller.signal, 20000);
      let resp, data;
      try {
      resp = await fetch("/api/payments/checkout", {
        method: "POST",
        cache: "no-store",
        signal: deadline.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          package_id: packageId,
          provider,
          ref: attribution.code,
          ref_email: attribution.email,
          preferred_side: attribution.side || "",
          ...(provider === "nowpayments" ? {
            purchase_request_id: purchaseRequest.current.requestId,
            purchase_subject: purchaseRequest.current.subject,
          } : {}),
        }),
      });
      data = await resp.json().catch(() => ({}));
      } finally { deadline.dispose(); }
      if (!mounted.current || activeRequest.current !== controller || controller.signal.aborted) return;
      const url = hostedCheckoutURL(data.url, provider, data.checkout_environment);
      if (!resp.ok || !url || data.provider !== provider
          || (provider === "nowpayments" && !["review_required", "awaiting_payment"].includes(data.fulfillment_status))) {
        setError(checkoutErrorNotice(resp.ok ? "invalid-checkout-response" : data.error, provider));
        if (data.error === "membership_purchase_already_processed") setProcessed(true);
        setLoading(false);
        pending.current = false;
        return;
      }
      window.location.assign(url);
    } catch {
      if (!mounted.current || activeRequest.current !== controller || controller.signal.aborted) return;
      setError(!requestSent && provider === "nowpayments"
        ? "No pudimos preparar una compra segura. Recarga la página o permite el almacenamiento de esta pestaña. No se inició ningún cobro."
        : checkoutErrorNotice("payments-unreachable", provider));
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
        {stripeEnabled === true ? <option value="stripe">Tarjeta · Stripe</option> : null}
        <option value="nowpayments" disabled={nowpaymentsEnabled !== true}>Cripto · NOWPayments{nowpaymentsEnabled !== true ? " (no habilitado)" : ""}</option>
      </select>
      <p id={`${id}-hint`} className="mb-3 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
        {!providerEnabled
          ? "Los pagos de membresías aún no están habilitados para este método. No se ha iniciado ningún cobro. No es una recarga de saldo."
          : provider === "nowpayments"
            ? "Realizarás un pago real de membresía. El servidor debe validar el pago y confirmar su activación. No es una recarga de saldo."
          : "La membresía se confirma cuando el servidor verifica el pago. No es una recarga de saldo."}
      </p>
      <button
        type="button"
        onClick={activate}
        disabled={loading || !providerEnabled || processed}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        className={cn("executive-button w-full", featured && "primary")}
        style={
          featured
            ? undefined
            : { background: "var(--vp-surface-raised)", color: "var(--vp-text)", border: "1px solid var(--vp-border)" }
        }
      >
        {loading ? <><Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Preparando pago…</>
          : providerEnabled ? <>Continuar al pago <ArrowRight size={15} aria-hidden="true" /></> : "Pagos no disponibles"}
      </button>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-xs font-semibold" style={{ color: "var(--vp-danger)" }}>
          {error}
        </p>
      )}
      {error && <a href="#nowpayments-purchases" className="mt-2 inline-block text-xs underline" style={{ color: "var(--vp-accent)" }}>Revisar historial NOWPayments</a>}
      {provider === "nowpayments" && (prepared || processed) && <div className="mt-3">
        <p className="text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
          Continuar reintenta la misma compra. Preparar otra conserva las facturas anteriores y permite pagar ambas por separado.
        </p>
        <button type="button" disabled={loading} className="executive-button mt-2 w-full" onClick={prepareAnotherPurchase}>
          {processed ? "Iniciar otra compra de esta membresía" : "Preparar otra compra independiente"}
        </button>
      </div>}
    </div>
  );
}
