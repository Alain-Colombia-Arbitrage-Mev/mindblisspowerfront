"use client";

import { ArrowRight, RefreshCw } from "lucide-react";
import SignupItem from "./SignupItem";

export default function RecentSignupsCard({ signups, pendingCount = 0, onRefresh, onSeeAll }) {
  return (
    <section
      className="flex flex-col overflow-hidden rounded-3xl"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <div
        className="flex items-center justify-between border-b px-6 py-5"
        style={{ borderColor: "var(--vp-border)" }}
      >
        <h2 className="m-0 text-base font-semibold" style={{ color: "var(--vp-text)" }}>
          Últimos Registros
        </h2>
        <button
          aria-label="Actualizar registros"
          style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0 }}
          type="button"
          onClick={onRefresh}
        >
          <RefreshCw size={15} style={{ color: "var(--vp-muted)" }} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 py-4">
        {signups.map((signup) => (
          <SignupItem key={signup.name} signup={signup} />
        ))}
      </div>

      {pendingCount > 0 ? (
        <button
          className="flex items-center justify-center gap-2 border-t p-4 text-xs font-semibold uppercase"
          style={{
            background: "transparent",
            border: 0,
            borderTop: "1px solid var(--vp-border)",
            color: "var(--vp-accent)",
            cursor: "pointer",
            letterSpacing: "0.08em",
          }}
          type="button"
          onClick={onSeeAll}
        >
          Ver +{pendingCount} en espera
          <ArrowRight size={12} />
        </button>
      ) : null}
    </section>
  );
}
