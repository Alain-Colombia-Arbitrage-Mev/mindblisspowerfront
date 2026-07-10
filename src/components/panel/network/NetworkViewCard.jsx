import { Users } from "lucide-react";

export default function NetworkViewCard({ title, memberCount, filterLabel = "Red Completa", children }) {
  return (
    <section
      className="rounded-2xl border p-6"
      style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
    >
      <div
        className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-3"
        style={{ borderColor: "var(--vp-border)" }}
      >
        <span className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
          <Users size={13} style={{ color: "var(--vp-accent)" }} />
          {title} -{" "}
          <span style={{ color: "var(--vp-accent)" }}>
            {memberCount} {memberCount === 1 ? "Miembro" : "Miembros"}
          </span>
        </span>
        <span
          className="rounded-full border px-2.5 py-1 text-[10px]"
          style={{ color: "var(--vp-muted)", background: "rgba(0,0,0,0.3)", borderColor: "var(--vp-border)" }}
        >
          Filtro Activo: {filterLabel}
        </span>
      </div>
      {children}
    </section>
  );
}
