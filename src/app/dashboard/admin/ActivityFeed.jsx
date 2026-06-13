"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Loader2 } from "lucide-react";

const LABELS = {
  "payment.activated": "Pack activado",
  "plan.published": "Comisiones publicadas",
  "withdrawal.approved": "Retiro aprobado",
  "withdrawal.paid": "Retiro pagado",
  "withdrawal.rejected": "Retiro rechazado",
  "withdrawal.cancelled": "Retiro cancelado",
};

export default function ActivityFeed() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch("/api/admin/activity", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.events) setEvents(d.events); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000); // feed "live" cada 30s
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="executive-panel mt-6">
      <h2 className="executive-section-title">
        <Activity size={18} style={{ color: "var(--vp-accent)" }} /> Actividad reciente
        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
          <Activity size={10} className="animate-pulse" /> live · eventos
        </span>
      </h2>
      {loading ? (
        <p style={{ color: "var(--vp-muted)" }}><Loader2 size={15} className="inline animate-spin" /> Cargando…</p>
      ) : events.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--vp-muted)" }}>Sin eventos aún. Aparecerán activaciones, publicaciones de plan y retiros.</p>
      ) : (
        <ul className="space-y-1.5">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 rounded-lg p-2 text-xs"
              style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}>
              <span className="font-semibold" style={{ color: "var(--vp-text)" }}>{LABELS[e.type] || e.type}</span>
              <span className="truncate text-[11px]" style={{ color: "var(--vp-muted)", maxWidth: 360 }}>{e.payload}</span>
              <span className="shrink-0 text-[10px]" style={{ color: "var(--vp-subtle)" }}>
                {e.at_ms ? new Date(e.at_ms).toLocaleString("es-CO") : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
