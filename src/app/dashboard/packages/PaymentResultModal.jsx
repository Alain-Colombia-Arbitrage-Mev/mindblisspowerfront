"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, Loader2, Network, XCircle } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useCheckoutActivation } from "@/hooks/useCheckoutActivation";
import { checkoutStatusCopy } from "@/lib/checkout-status.mjs";
import { useMemberSummary } from "@/hooks/useMemberSummary";
import NOWPaymentsReceiptPopup from './NOWPaymentsReceiptPopup';
import { useI18n } from '@/i18n/LanguageProvider';

/**
 * Popup de resultado del pago. Stripe redirige a
 * /dashboard/packages?paid=1&session_id=... (éxito) o ?canceled=1 (cancelado);
 * este modal consume esos parámetros y luego limpia la URL para que un
 * refresh no re-muestre el popup.
 */
export default function PaymentResultModal() {
  const { t } = useI18n();
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
    <Dialog.Root open onOpenChange={(open) => { if (!open) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[18px] p-6 text-center shadow-2xl sm:p-8"
          style={{
            background: "var(--vp-surface)",
            border: `1px solid ${paid ? "var(--vp-action-border)" : "var(--vp-border)"}`,
            overscrollBehavior: "contain",
          }}
          onCloseAutoFocus={(event) => { event.preventDefault(); document.getElementById("memberships-title")?.focus(); }}
        >
        <span
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{
            background: paid ? "var(--vp-action-muted)" : "var(--vp-danger-muted)",
            border: `1px solid ${paid ? "var(--vp-action-border)" : "var(--vp-danger-border)"}`,
          }}
        >
          {paid && activation.checking ? (
            <Loader2 size={30} className="animate-spin" style={{ color: "var(--vp-accent)" }} />
          ) : paid && activation.active ? (
            <CheckCircle2 size={30} style={{ color: "var(--vp-accent)" }} />
          ) : paid ? (
            <Clock3 size={30} style={{ color: "var(--vp-accent)" }} />
          ) : (
            <XCircle size={30} style={{ color: "var(--vp-danger)" }} />
          )}
        </span>

        <Dialog.Title className="m-0 text-2xl font-bold" style={{ color: "var(--vp-text)" }}>
          {paid ? copy.title : t("paymentResult.pendingTitle")}
        </Dialog.Title>
        <Dialog.Description className="mt-3 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          {paid ? copy.description : t("paymentResult.pendingCopy")}
        </Dialog.Description>

        {paid && (
          <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
            <ActivationStep label={t("paymentResult.membership")} ready={activation.active} loading={activation.checking && !activation.active} t={t} />
            <ActivationStep
              label={t("paymentResult.binaryTree")}
              ready={activation.positioned}
              loading={activation.checking && activation.active && !activation.positioned}
              t={t}
            />
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {paid && (
            <button type="button" className="executive-button primary w-full justify-center" onClick={goToNetwork}>
              <Network size={15} />
              {t("paymentResult.viewNetwork")}
            </button>
          )}
          <button type="button" className={cn("executive-button w-full justify-center", !paid && "primary")} onClick={close}>
            {paid ? t("paymentResult.viewPayments") : t("paymentResult.chooseMembership")}
          </button>
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ActivationStep({ label, ready, loading = false, t }) {
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
            {t("paymentResult.processing")}
          </span>
        )}
      </div>
    </div>
  );
}
