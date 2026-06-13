"use client";

import { useEffect, useState } from "react";
import { Award, GitBranch, Loader2, Network, ShieldCheck, UserCheck, Users } from "lucide-react";

/**
 * Posición real del miembro en el árbol binario (RDS).
 * Directiva árbol 2.0: muestra posición y rango — nunca volumen.
 */
export default function MyPositionPanel() {
  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/member/tree")
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) {
          setState({ loading: false, error: payload.error || "No se pudo cargar tu posición.", data: null });
          return;
        }
        setState({ loading: false, error: "", data: payload });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, error: "Sin conexión con el árbol.", data: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <Card>
        <div className="flex items-center gap-3 text-sm font-semibold" style={{ color: "var(--vp-muted)" }}>
          <Loader2 className="animate-spin" size={16} />
          Cargando tu posición en la red…
        </div>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Card>
        <div className="text-sm font-semibold" style={{ color: "var(--vp-muted)" }}>
          {state.error === "tree-unavailable"
            ? "El árbol estará disponible cuando finalice la migración."
            : state.error}
        </div>
      </Card>
    );
  }

  if (!state.data?.positioned) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <Network size={18} style={{ color: "var(--vp-amber)" }} />
          <div>
            <div className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>
              Aún no tienes posición en el árbol
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--vp-muted)" }}>
              Tu posición se asigna al activar tu primer paquete.
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const { me, tree } = state.data;
  const directs = tree.filter((node) => node.level === 1);
  const left = directs.find((node) => node.side === "L");
  const right = directs.find((node) => node.side === "R");

  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg"
            style={{ background: "var(--vp-amber-muted)", border: "1px solid var(--vp-amber-border)", color: "var(--vp-amber)" }}
          >
            <GitBranch size={20} />
          </span>
          <div>
            <h2 className="vp-display text-xl" style={{ color: "var(--vp-text)" }}>
              Tu posición en la red
            </h2>
            <p className="text-xs font-semibold" style={{ color: "var(--vp-muted)" }}>
              Datos reales del árbol binario migrado
            </p>
          </div>
        </div>
        {me.rank && (
          <span
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wide"
            style={{ background: "var(--vp-amber-muted)", border: "1px solid var(--vp-amber-border)", color: "var(--vp-amber)" }}
          >
            <Award size={14} />
            {me.rank.name}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={ShieldCheck} label="Rango actual" value={me.rank ? me.rank.name : "Sin rango"} accent />
        <Stat icon={Network} label="Profundidad" value={`Nivel ${me.depth}`} accent />
        <Stat icon={GitBranch} label="Tu pierna" value={me.side === "L" ? "Izquierda" : me.side === "R" ? "Derecha" : "Raíz"} accent />
        <Stat icon={UserCheck} label="Patrocinador" value={me.sponsor || "—"} accent />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <LegCard title="Pierna izquierda" node={left} />
        <LegCard title="Pierna derecha" node={right} />
      </div>

      {tree.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
            <Users size={13} />
            Tu equipo cercano ({tree.length}{tree.length === 500 ? "+" : ""} en 3 niveles)
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {tree.slice(0, 12).map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2"
                style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}
              >
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold" style={{ color: "var(--vp-text)" }}>
                    {node.name}
                  </div>
                  <div className="text-[10px] font-semibold uppercase" style={{ color: "var(--vp-subtle)" }}>
                    N{node.level} · {node.side === "L" ? "Izq" : node.side === "R" ? "Der" : "—"}
                  </div>
                </div>
                {node.rank && (
                  <span className="shrink-0 text-[10px] font-black uppercase" style={{ color: "var(--vp-amber)" }}>
                    {node.rank.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function Card({ children }) {
  return (
    <section
      className="rounded-xl p-5 sm:p-6"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", boxShadow: "var(--vp-shadow)" }}
    >
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-lg p-3" style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}>
      <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
        <Icon size={12} />
        {label}
      </div>
      <div className="vp-display truncate text-lg" style={{ color: accent ? "var(--vp-amber)" : "var(--vp-text)" }}>
        {value}
      </div>
    </div>
  );
}

function LegCard({ title, node }) {
  return (
    <div className="rounded-lg p-4" style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}>
      <div className="mb-1 text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
        {title}
      </div>
      {node ? (
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold" style={{ color: "var(--vp-text)" }}>
            {node.name}
          </span>
          {node.rank && (
            <span className="shrink-0 text-[10px] font-black uppercase" style={{ color: "var(--vp-amber)" }}>
              {node.rank.name}
            </span>
          )}
        </div>
      ) : (
        <span className="text-base font-bold" style={{ color: "var(--vp-green, var(--vp-accent))" }}>
          Disponible
        </span>
      )}
    </div>
  );
}
