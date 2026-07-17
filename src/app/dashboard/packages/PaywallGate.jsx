"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Network, ReceiptText } from "lucide-react";
import Link from "next/link";

const PLAN_LABEL = {
  starter: "Starter",
  basic: "Básico",
  pro: "Pro",
  premium: "Premium",
  elite: "Elite",
};

/**
 * Puerta del paywall: si el miembro YA tiene una membresía activa, en vez de
 * ofrecerle comprar otra vez muestra una pantalla de "membresía activa" y deja
 * los planes ocultos tras un toggle (por si quiere ver/mejorar). Si no está
 * activo (o aún carga), muestra el paywall normal (children).
 */
export default function PaywallGate({ children }) {
  const [state, setState] = useState({ loading: true, active: false, data: null });
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/payments/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) {
          setState({ loading: false, active: Number(d?.active_packages ?? 0) > 0, data: d });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, active: false, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Mientras carga o si no está activo → paywall normal (evita parpadeo).
  if (state.loading || !state.active) return children;

  const d = state.data;
  const plan = d?.plan ? PLAN_LABEL[d.plan] || d.plan : null;
  const rank = d?.rank && d.rank !== "—" ? d.rank : null;

  return (
    <div>
      <div
        className="rounded-3xl p-8 text-center sm:p-10"
        style={{
          background: "var(--vp-surface)",
          border: "1px solid var(--vp-amber-border, rgba(250,204,21,0.35))",
          boxShadow: "0 20px 70px rgba(0,0,0,0.30)",
        }}
      >
        <span
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "rgba(250, 204, 21, 0.12)", border: "1px solid rgba(250, 204, 21, 0.32)" }}
        >
          <CheckCircle2 size={32} style={{ color: "var(--vp-accent)" }} />
        </span>
        <h2 className="m-0 text-2xl font-bold" style={{ color: "var(--vp-text)" }}>
          Tu membresía está activa
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          Tu posición en la red está habilitada. Ya puedes invitar, construir tu equipo y hacer seguimiento de tu progreso.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Membresías activas" value={String(d?.active_packages ?? 1)} accent />
          <Stat label="Plan" value={plan || "Activo"} />
          <Stat label="Rango" value={rank || "En progreso"} />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard/network" className="executive-button primary justify-center no-underline">
            <Network size={16} /> Ir a mi red
          </Link>
          <Link href="/dashboard/referrals" className="executive-button justify-center no-underline">
            <ReceiptText size={16} /> Mi enlace de referido
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setShowPlans((v) => !v)}
          className="executive-button ghost"
        >
          {showPlans ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {showPlans ? "Ocultar planes" : "Ver otros planes"}
        </button>
      </div>

      {showPlans && <div className="mt-6">{children}</div>}
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
      <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
        {label}
      </div>
      <div className="mt-1 text-lg font-bold" style={{ color: accent ? "var(--vp-accent)" : "var(--vp-text)" }}>
        {value}
      </div>
    </div>
  );
}
