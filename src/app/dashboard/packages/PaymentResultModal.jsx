"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Network, XCircle } from "lucide-react";

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
  const [activation, setActivation] = useState({
    checking: false,
    active: false,
    positioned: false,
    done: false,
  });

  useEffect(() => {
    if (searchParams.get("paid") === "1") setResult("paid");
    else if (searchParams.get("canceled") === "1") setResult("canceled");
  }, [searchParams]);

  useEffect(() => {
    if (result !== "paid") return undefined;

    let cancelled = false;
    let tries = 0;
    const maxTries = 20; // ~60s
    let timer = null;

    const checkActivation = async () => {
      tries += 1;
      try {
        const [summary, tree] = await Promise.all([
          fetch("/api/payments/me?fresh=1", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
          fetch("/api/member/tree", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        ]);
        if (cancelled) return;
        const active = Number(summary?.active_packages ?? 0) > 0;
        const positioned = Boolean(tree?.positioned);
        const done = positioned || tries >= maxTries;
        setActivation({ checking: !done, active, positioned, done });
        if (done && timer) clearInterval(timer);
      } catch {
        if (cancelled) return;
        const done = tries >= maxTries;
        setActivation((current) => ({ ...current, checking: !done, done }));
        if (done && timer) clearInterval(timer);
      }
    };

    setActivation({ checking: true, active: false, positioned: false, done: false });
    checkActivation();
    timer = setInterval(checkActivation, 3000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [result]);

  if (!result) return null;

  const close = () => {
    setResult(null);
    router.replace("/dashboard/packages", { scroll: false });
    router.refresh(); // re-consulta MyPaymentsPanel para reflejar la activación
  };

  const goToNetwork = () => {
    setResult(null);
    router.replace("/dashboard/network");
  };

  const paid = result === "paid";
  const paidTitle = activation.positioned
    ? "Membresía activa y posición lista"
    : activation.active
      ? "Membresía activa"
      : "Pago recibido";

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
          ) : paid ? (
            <CheckCircle2 size={30} style={{ color: "var(--vp-accent)" }} />
          ) : (
            <XCircle size={30} style={{ color: "#ef4444" }} />
          )}
        </span>

        <h2 className="m-0 text-2xl font-bold" style={{ color: "var(--vp-text)" }}>
          {paid ? paidTitle : "Tu compra quedó pendiente"}
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          {paid && activation.positioned
            ? "Ya puedes entrar a tu red y ver tu ubicación dentro del árbol binario."
            : paid && activation.active
              ? "Tu pago ya activó la membresía. Estamos terminando de reflejar la posición del árbol; si no aparece de inmediato, vuelve a intentar en unos segundos."
              : paid
                ? "Estamos confirmando la activación con el backend. Esto suele tomar solo unos segundos."
                : "No se realizó ningún cargo y tu cupo no se pierde. Puedes completar tu compra cuando quieras; si no lo haces ahora, te enviaremos un correo con un enlace para retomarla."}
        </p>

        {paid && (
          <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
            <ActivationStep label="Pago" ready />
            <ActivationStep label="Membresía" ready={activation.active} loading={activation.checking && !activation.active} />
            <ActivationStep
              label="Árbol binario"
              ready={activation.positioned}
              loading={activation.checking && activation.active && !activation.positioned}
              span
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
          <button type="button" className={`executive-button ${paid ? "" : "primary"} w-full justify-center`} onClick={close}>
            {paid ? "Ver mis pagos" : "Elegir mi membresía"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivationStep({ label, ready, loading = false, span = false }) {
  return (
    <div
      className={span ? "rounded-xl p-3 sm:col-span-2" : "rounded-xl p-3"}
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
