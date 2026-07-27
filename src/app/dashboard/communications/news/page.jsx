"use client";

import { useEffect, useState } from "react";

// Comunicados/news servidos desde el backend (support.news vía /api/member/news).
// Antes había un array NEWS hardcodeado con datos bancarios OBSOLETOS (el negocio
// cobra SOLO por Stripe, no por depósito bancario) — eliminado. Nada hardcodeado.

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}

export default function InternalNewsPage() {
  const [news, setNews] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resp = await fetch("/api/member/news", { cache: "no-store" });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (!active) return;
        setNews(Array.isArray(data.news) ? data.news : []);
        setStatus("ready");
      } catch {
        if (active) setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <header>
        <h1 className="m-0 text-lg font-semibold" style={{ color: "var(--vp-text)" }}>
          Comunicados
        </h1>
        <p className="m-0 mt-1 text-sm" style={{ color: "var(--vp-muted)" }}>
          Anuncios oficiales del equipo Mindbliss Power.
        </p>
      </header>

      {status === "loading" ? (
        <p className="text-sm" style={{ color: "var(--vp-muted)" }}>
          Cargando comunicados…
        </p>
      ) : null}

      {status === "error" ? (
        <p className="text-sm" style={{ color: "var(--vp-danger, #ef4444)" }}>
          No se pudieron cargar los comunicados. Intenta de nuevo más tarde.
        </p>
      ) : null}

      {status === "ready" && news.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--vp-muted)" }}>
          No hay comunicados por ahora.
        </p>
      ) : null}

      {status === "ready" && news.length > 0 ? (
        <ul className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-0" style={{ listStyle: "none" }}>
          {news.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl p-5"
              style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="m-0 text-base font-semibold" style={{ color: "var(--vp-text)" }}>
                  {item.title}
                </h2>
                <time className="shrink-0 text-[11px]" style={{ color: "var(--vp-muted)" }}>
                  {formatDate(item.created_at)}
                </time>
              </div>
              <p
                className="m-0 mt-3 whitespace-pre-line text-sm leading-relaxed"
                style={{ color: "var(--vp-text-soft)" }}
              >
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
