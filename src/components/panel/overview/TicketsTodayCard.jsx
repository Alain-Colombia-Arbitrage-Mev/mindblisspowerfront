import { CheckCircle2 } from "lucide-react";

export default function TicketsTodayCard({ pendingCount = 0 }) {
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
          Tickets Hoy
        </h2>
        <span
          className="rounded-md px-2 py-1 text-xs"
          style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)", color: "var(--vp-muted)" }}
        >
          {pendingCount} Pendientes
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <span
          className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
        >
          <CheckCircle2 size={40} style={{ color: "var(--vp-accent)" }} />
        </span>
        <p className="m-0 mt-6 text-lg font-medium" style={{ color: "var(--vp-text)" }}>
          Todo al día
        </p>
        <p
          className="m-0 mt-2 max-w-60 text-center text-sm font-light"
          style={{ color: "var(--vp-muted)" }}
        >
          No tienes seguimientos o tickets asignados para el día de hoy.
        </p>
      </div>
    </section>
  );
}
