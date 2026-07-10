import { Network } from "lucide-react";

function StatBox({ label, value }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: "var(--vp-bg)", borderColor: "var(--vp-border)" }}
    >
      <span className="mb-1 block text-[10px] font-medium" style={{ color: "var(--vp-muted)" }}>
        {label}
      </span>
      <span className="block truncate text-sm font-bold" style={{ color: "var(--vp-accent)" }}>
        {value}
      </span>
    </div>
  );
}

function LegRow({ label, occupant }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl border p-3"
      style={{ background: "var(--vp-bg)", borderColor: "var(--vp-border)" }}
    >
      <span className="text-[10px] font-medium" style={{ color: "var(--vp-muted)" }}>
        {label}
      </span>
      <span
        className="rounded border px-2 py-0.5 text-xs font-bold"
        style={{
          color: "var(--vp-accent)",
          background: "rgba(250, 204, 21, 0.1)",
          borderColor: "rgba(250, 204, 21, 0.2)",
        }}
      >
        {occupant || "Disponible"}
      </span>
    </div>
  );
}

export default function PositionCard({ rank, depth, side, sponsor, leftLeg, rightLeg }) {
  return (
    <section
      className="rounded-2xl border p-5 xl:col-span-2"
      style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <Network size={18} style={{ color: "var(--vp-accent)" }} />
        <div>
          <h3 className="m-0 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
            Tu posición en la red
          </h3>
          <p className="m-0 text-[10px] font-light" style={{ color: "var(--vp-muted)" }}>
            Datos reales del árbol binario
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Rango actual" value={rank || "Sin Rango"} />
        <StatBox label="Profundidad" value={depth} />
        <StatBox label="Tu Pierna" value={side} />
        <StatBox label="Patrocinador" value={sponsor || "—"} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LegRow label="Pierna Izquierda" occupant={leftLeg} />
        <LegRow label="Pierna Derecha" occupant={rightLeg} />
      </div>
    </section>
  );
}
