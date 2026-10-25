"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock3, Loader2, Network, Receipt, XCircle } from "lucide-react";
import { useCheckoutActivation } from "@/hooks/useCheckoutActivation";
import { checkoutStatusCopy } from "@/lib/checkout-status.mjs";
import { formatPaymentMoney as money } from "@/lib/payment-display.mjs";

/**
 * Página de confirmación de pago (membresía). Stripe redirige aquí tras el
 * checkout: ?paid=1&session_id=... (éxito) o ?canceled=1 (cancelado).
 *
 * La URL inicia una consulta, no prueba un cobro. El hook verifica membresía y
 * posición; el detalle de un pago siempre se consulta en Mis pagos.
 */
export default function PaymentConfirmationPage() {
  const params = useSearchParams();
  const paid = params.get("paid") === "1";
  const canceled = params.get("canceled") === "1";

  const activation = useCheckoutActivation({
    enabled: paid,
    requestKey: `${paid}:${params.get("session_id") || ""}`,
    maxAttempts: 12,
    maxDurationMs: 36_000,
  });
  if (!paid && canceled) return <CanceledView />;

  const { summary, positioned, checking: verificando } = activation;
  const activa = activation.active && positioned;
  const copy = checkoutStatusCopy(activation);
  // Sin ?paid ni ?canceled (navegación directa): no afirmamos éxito de un pago
  // que no consta — estado neutro que remite a "Mis pagos".
  const desconocido = !paid && !canceled;
  const lastPayment = summary?.payments?.[0];

  return (
    <section className="executive-page">
      <div className="executive-container" style={{ maxWidth: 640 }}>
        <div
          className="rounded-3xl p-8 text-center sm:p-10"
          style={{
            background: "var(--vp-surface)",
            border: "1px solid var(--vp-amber-border, rgba(250,204,21,0.35))",
            boxShadow: "0 20px 70px rgba(0,0,0,0.35)",
          }}
        >
          <span
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: "rgba(250, 204, 21, 0.12)",
              border: "1px solid rgba(250, 204, 21, 0.32)",
            }}
          >
            {verificando ? (
              <Loader2 size={38} className="animate-spin" style={{ color: "var(--vp-accent)" }} />
            ) : activation.active ? (
              <CheckCircle2 size={38} style={{ color: "var(--vp-accent)" }} />
            ) : (
              <Clock3 size={38} style={{ color: "var(--vp-accent)" }} />
            )}
          </span>

          <h1 className="executive-title m-0 text-3xl font-bold" style={{ color: "var(--vp-text)" }}>
            {desconocido ? "Estado del pago" : copy.title}
          </h1>

          <p className="mt-4 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
            {desconocido
              ? "No encontramos información de un pago reciente en esta sesión. Si acabas de pagar, tu membresía aparecerá en \"Mis pagos\" en unos minutos."
              : copy.description}
          </p>

          {(lastPayment || summary) && (
            <div
              className="mt-7 grid gap-3 rounded-2xl p-5 text-left sm:grid-cols-2"
              style={{ background: "var(--vp-surface-2, rgba(255,255,255,0.03))", border: "1px solid var(--vp-border)" }}
            >
              <Detail
                label="Estado"
                value={activa ? "Membresía y árbol listos" : activation.active ? "Membresía activa" : "Activación sin confirmar"}
                accent={activa}
              />
              <Detail label="Membresías activas" value={String(summary?.active_packages ?? "…")} />
              <Detail label="Posición en árbol" value={positioned ? "Lista" : "Sincronizando"} accent={positioned} />
              {lastPayment && (
                <>
                  <Detail label="Monto" value={money(lastPayment.total_usd ?? lastPayment.amount_usd)} />
                  <Detail label="Referencia" value={String(lastPayment.purchase_id || lastPayment.id || "").slice(0, 12) || "—"} />
                </>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard/network?tab=tree" className="executive-button primary flex-1 justify-center no-underline">
              <Network size={16} /> Ir a mi red <ArrowRight size={15} />
            </Link>
            <Link href="/dashboard/packages" className="executive-button flex-1 justify-center no-underline">
              <Receipt size={16} /> Ver mis membresías
            </Link>
          </div>

          {!activa && verificando && (
            <p className="mt-5 text-xs" style={{ color: "var(--vp-subtle)" }}>
              No cierres esta página; se actualizará sola al confirmarse.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Detail({ label, value, accent = false }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase" style={{ letterSpacing: "0.12em", color: "var(--vp-subtle)" }}>
        {label}
      </div>
      <div className="mt-1 text-base font-bold" style={{ color: accent ? "var(--vp-accent)" : "var(--vp-text)" }}>
        {value}
      </div>
    </div>
  );
}

function CanceledView() {
  return (
    <section className="executive-page">
      <div className="executive-container" style={{ maxWidth: 560 }}>
        <div
          className="rounded-3xl p-8 text-center sm:p-10"
          style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
        >
          <span
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: "rgba(239, 68, 68, 0.10)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
          >
            <XCircle size={38} style={{ color: "#ef4444" }} />
          </span>
          <h1 className="executive-title m-0 text-3xl font-bold" style={{ color: "var(--vp-text)" }}>
            Pago cancelado
          </h1>
          <p className="mt-4 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
            La compra no se completó en esta pantalla. Si observaste un cargo, revisa Mis pagos antes de volver a intentarlo.
          </p>
          <Link href="/dashboard/packages" className="executive-button primary mt-8 w-full justify-center no-underline">
            Volver a las membresías
          </Link>
        </div>
      </div>
    </section>
  );
}
