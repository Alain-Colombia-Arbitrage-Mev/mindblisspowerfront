"use client";
import { useState } from "react";

export default function UnsubscribeForm({ token }) {
  const [state, setState] = useState({ busy: false, done: false, error: token ? "" : "Enlace inválido." });
  const confirm = async () => {
    setState({ busy: true, done: false, error: "" });
    const r = await fetch("/api/comms/unsubscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
    const data = await r.json().catch(() => ({}));
    setState({ busy: false, done: r.ok, error: r.ok ? "" : data.error || "No se pudo procesar." });
  };
  // aria-live: el resultado aparece sin cambiar de página, así que un lector de
  // pantalla no lo anunciaría; "polite" espera a que termine la locución en curso.
  if (state.done) return <p aria-live="polite" style={{ marginTop: 24 }}>Listo. No volverás a recibir comunicados generales.</p>;
  return (
    <div style={{ marginTop: 24 }}>
      <button
        type="button"
        disabled={state.busy || !token}
        onClick={confirm}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          color: "var(--vp-shell)",
          background: "var(--vp-accent)",
          border: "1px solid var(--vp-accent-strong)",
        }}
      >
        {state.busy ? "Procesando…" : "Confirmar baja"}
      </button>
      <p aria-live="polite" style={{ color: "#f87171", marginTop: state.error ? 12 : 0 }}>{state.error}</p>
    </div>
  );
}
