import { ArrowRight, MapPin, Network, ShieldCheck } from "lucide-react";

function sideLabel(side) {
  if (side === "L") return "Izquierda";
  if (side === "R") return "Derecha";
  return "Raíz";
}

function MiniStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border px-3 py-2" style={{ background: "var(--vp-bg)", borderColor: "var(--vp-border)" }}>
      <p className="m-0 text-[10px] font-semibold" style={{ color: "var(--vp-muted)" }}>
        {label}
      </p>
      <p className="m-0 truncate text-xs font-bold" style={{ color: "var(--vp-text)" }} title={String(value)}>
        {value}
      </p>
    </div>
  );
}

export default function PositionSnapshotCard({ network }) {
  const positioned = Boolean(network?.positioned && network?.me);
  const me = network?.me || {};
  const nodes = positioned && Array.isArray(network?.tree) ? network.tree : [];
  const leftCount = nodes.filter((node) => node.rootSide === "L").length;
  const rightCount = nodes.filter((node) => node.rootSide === "R").length;

  return (
    <section
      className="flex flex-col overflow-hidden rounded-3xl"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: "var(--vp-border)" }}>
        <div className="flex min-w-0 items-center gap-2.5">
          <MapPin size={18} style={{ color: "var(--vp-accent)" }} />
          <h2 className="m-0 text-base font-semibold" style={{ color: "var(--vp-text)" }}>
            Mi ubicación
          </h2>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold"
          style={{
            color: me.activePackage ? "var(--vp-success)" : "var(--vp-muted)",
            background: me.activePackage ? "var(--vp-success-muted)" : "var(--vp-surface-raised)",
            borderColor: me.activePackage ? "var(--vp-success-border)" : "var(--vp-border)",
          }}
        >
          <ShieldCheck size={11} />
          {me.activePackage ? "Activo" : "Pendiente"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 py-4">
        {positioned ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Nodo" value={me.affiliateId ? `#${me.affiliateId}` : "—"} />
              <MiniStat label="Nivel" value={me.depth ?? "—"} />
              <MiniStat label="Pierna" value={sideLabel(me.side)} />
              <MiniStat label="Rango" value={me.rank?.name || "Sin rango"} />
            </div>
            <div className="rounded-xl border p-3" style={{ background: "var(--vp-bg)", borderColor: "var(--vp-border)" }}>
              <p className="m-0 text-[10px] font-semibold" style={{ color: "var(--vp-muted)" }}>
                Padre binario
              </p>
              <p className="m-0 mt-1 truncate text-xs font-bold" style={{ color: "var(--vp-text)" }} title={me.parent || "Raíz"}>
                {me.parent || "Raíz"}
              </p>
              <p className="m-0 mt-2 text-[11px]" style={{ color: "var(--vp-muted)" }}>
                Rama visible: {leftCount} izquierda / {rightCount} derecha
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-sm" style={{ borderColor: "var(--vp-border-strong)", color: "var(--vp-muted)" }}>
            Tu posición se mostrará aquí cuando el pago quede activado y el backend cree el nodo del árbol.
          </div>
        )}
      </div>

      <a
        className="flex items-center justify-center gap-2 border-t p-4 text-xs font-semibold uppercase no-underline"
        href="/dashboard/network"
        style={{ borderColor: "var(--vp-border)", color: "var(--vp-accent)", letterSpacing: "0.08em" }}
      >
        <Network size={13} />
        Ver árbol
        <ArrowRight size={12} />
      </a>
    </section>
  );
}
