"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, Network, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCheckoutActivation } from "@/hooks/useCheckoutActivation";
import { checkoutStatusCopy } from "@/lib/checkout-status.mjs";
import { useMemberSummary } from "@/hooks/useMemberSummary";
import NOWPaymentsReceiptPopup from './NOWPaymentsReceiptPopup';

/**
 * Popup de resultado del pago. Stripe redirige a
 * /dashboard/packages?paid=1&session_id=... (éxito) o ?canceled=1 (cancelado);
 * este modal consume esos parámetros y luego limpia la URL para que un
 * refresh no re-muestre el popup.
 */
export default function PaymentResultModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nowpayments = searchParams.get('payment_provider') === 'nowpayments';
  const nowOrderId = nowpayments && searchParams.getAll('order_id').length === 1 ? searchParams.get('order_id') : '';
  const result = nowpayments ? null : searchParams.get("paid") === "1" ? "paid" : searchParams.get("canceled") === "1" ? "canceled" : null;
  const requestKey = `${result}:${searchParams.get("session_id") || ""}`;
  const [dismissedKey, setDismissedKey] = useState(null);
  const visible = result !== null && dismissedKey !== requestKey;
  const activation = useCheckoutActivation({
    enabled: visible && result === "paid",
    requestKey,
  });
  const { reload } = useMemberSummary({ fresh: true });
  const refreshedKey = useRef(null);
  useEffect(() => {
    // Only confirmed membership activation invalidates the shared read. A
    // redirect query string or a pending/cancelled checkout is not payment proof.
    if (!visible || result !== "paid" || !activation.active || refreshedKey.current === requestKey) return;
    refreshedKey.current = requestKey;
    void reload();
  }, [visible, result, activation.active, requestKey, reload]);
  if (!visible) return <NOWPaymentsReceiptPopup orderId={nowOrderId} />;

  const close = () => {
    setDismissedKey(requestKey);
    router.replace("/dashboard/packages", { scroll: false });
    router.refresh(); // refreshes server-rendered catalog; the provider refreshes confirmed membership above
  };

  const goToNetwork = () => {
    setDismissedKey(requestKey);
    router.replace("/dashboard/network?tab=tree");
  };

  const paid = result === "paid";
  const copy = checkoutStatusCopy(activation);

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
          {paid && activation.checking ? (
            <Loader2 size={30} className="animate-spin" style={{ color: "var(--vp-accent)" }} />
          ) : paid && activation.active ? (
            <CheckCircle2 size={30} style={{ color: "var(--vp-accent)" }} />
          ) : paid ? (
            <Clock3 size={30} style={{ color: "var(--vp-accent)" }} />
          ) : (
            <XCircle size={30} style={{ color: "#ef4444" }} />
          )}
        </span>

        <h2 className="m-0 text-2xl font-bold" style={{ color: "var(--vp-text)" }}>
          {paid ? copy.title : "Tu compra quedó pendiente"}
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          {paid ? copy.description : "La compra no se completó en esta pantalla. Si observaste un cargo, revisa Mis pagos antes de volver a intentarlo."}
        </p>

        {paid && (
          <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
            <ActivationStep label="Membresía" ready={activation.active} loading={activation.checking && !activation.active} />
            <ActivationStep
              label="Árbol binario"
              ready={activation.positioned}
              loading={activation.checking && activation.active && !activation.positioned}
            />
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {paid && (
            <button type="button" className="executive-button primary w-full justify-center" onClick={goToNetwork}>
              <Network size={15} />
              Ver mi red
            </button>
          )}
          <button type="button" className={cn("executive-button w-full justify-center", !paid && "primary")} onClick={close}>
            {paid ? "Ver mis pagos" : "Elegir mi membresía"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivationStep({ label, ready, loading = false }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold" style={{ color: "var(--vp-text)" }}>
          {label}
        </span>
        {ready ? (
          <CheckCircle2 size={15} style={{ color: "var(--vp-accent)" }} />
        ) : loading ? (
          <Loader2 size={15} className="animate-spin" style={{ color: "var(--vp-accent)" }} />
        ) : (
          <span className="text-[10px] font-bold" style={{ color: "var(--vp-muted)" }}>
            En proceso
          </span>
        )}
      </div>
    </div>
  );
}
