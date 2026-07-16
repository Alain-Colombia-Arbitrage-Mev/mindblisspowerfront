"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Network, Receipt, XCircle } from "lucide-react";

const money = (v) =>
  `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Página de confirmación de pago (membresía). Stripe redirige aquí tras el
 * checkout: ?paid=1&session_id=... (éxito) o ?canceled=1 (cancelado).
 *
 * MANEJADOR DE ESTADOS: en éxito no asumimos la activación — la VERIFICAMOS
 * consultando /api/payments/me en un poll corto. Estados:
 *   - "verificando": esperando que el webhook/sweep active la membresía.
 *   - "activa": la membresía ya figura activa (active_packages > 0).
 *   - "procesando": pagado pero aún sin reflejar (async/crypto o webhook en
 *     camino); mensaje tranquilizador, se activará en breve.
 *   - "cancelado": no hubo cargo.
 */
export default function PaymentConfirmationPage() {
  const params = useSearchParams();
  const paid = params.get("paid") === "1";
  const canceled = params.get("canceled") === "1";

  const [phase, setPhase] = useState(paid ? "verificando" : canceled ? "cancelado" : "desconocido");
  const [summary, setSummary] = useState(null);
  const pollRef = useRef(null);
  const baselineRef = useRef(null);

  useEffect(() => {
    if (!paid) return;
    let tries = 0;
    const maxTries = 12; // ~36s (3s * 12)

    const check = async () => {
      tries += 1;
      try {
        const r = await fetch("/api/payments/me", { cache: "no-store" });
        if (r.ok) {
          const d = await r.json();
          setSummary(d);
          const active = Number(d?.active_packages ?? 0);
          // Baseline en la 1ª lectura; consideramos "activa" si hay al menos una
          // membresía activa (la recién comprada normalmente aparece en segundos).
          if (baselineRef.current === null) baselineRef.current = active;
          if (active > 0) {
            setPhase("activa");
            clearInterval(pollRef.current);
            return;
          }
        }
      } catch {
        /* reintenta */
      }
      if (tries >= maxTries) {
        setPhase("procesando");
        clearInterval(pollRef.current);
      }
    };

    check();
    pollRef.current = setInterval(check, 3000);
    return () => clearInterval(pollRef.current);
  }, [paid]);

  if (phase === "cancelado") return <CanceledView />;

  const activa = phase === "activa";
  const verificando = phase === "verificando";
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
            ) : (
              <CheckCircle2 size={38} style={{ color: "var(--vp-accent)" }} />
            )}
          </span>

          <h1 className="executive-title m-0 text-3xl font-bold" style={{ color: "var(--vp-text)" }}>
            ¡Pago completado con éxito!
          </h1>

          <p className="mt-4 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
            {activa
              ? "Tu membresía está activa. Tu posición en la red quedó habilitada y ya puedes operar."
              : verificando
                ? "Estamos activando tu membresía. Esto toma solo unos segundos…"
                : "Tu pago fue recibido. La activación de tu membresía se completará en breve; la verás reflejada en \"Mis pagos\"."}
          </p>

          {(lastPayment || summary) && (
            <div
              className="mt-7 grid gap-3 rounded-2xl p-5 text-left sm:grid-cols-2"
              style={{ background: "var(--vp-surface-2, rgba(255,255,255,0.03))", border: "1px solid var(--vp-border)" }}
            >
              <Detail
                label="Estado"
                value={activa ? "Membresía activa" : "Procesando activación"}
                accent={activa}
              />
              <Detail label="Membresías activas" value={String(summary?.active_packages ?? "…")} />
              {lastPayment && (
                <>
                  <Detail label="Monto" value={money(lastPayment.total_usd ?? lastPayment.amount_usd)} />
                  <Detail label="Referencia" value={(lastPayment.id || "").slice(0, 12) || "—"} />
                </>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard/network" className="executive-button primary flex-1 justify-center no-underline">
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

function Detail({ label, value, accent }) {
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
            No se realizó ningún cargo. Puedes activar tu membresía cuando quieras.
          </p>
          <Link href="/dashboard/packages" className="executive-button primary mt-8 w-full justify-center no-underline">
            Volver a las membresías
          </Link>
        </div>
      </div>
    </section>
  );
}
