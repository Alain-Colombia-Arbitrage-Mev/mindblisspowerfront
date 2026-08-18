"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Minus, Plus, Users } from "lucide-react";

import NetworkViewCard from "./NetworkViewCard";

function initialsOf(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/** Índice padre -> { L, R } y contador de descendientes por nodo. */
function useTreeIndex(nodes, rootId) {
  return useMemo(() => {
    const bySide = new Map(); // parentId -> { L?, R? }
    for (const node of nodes) {
      const key = node.parentId ?? rootId;
      if (!bySide.has(key)) bySide.set(key, {});
      bySide.get(key)[node.side] = node;
    }
    const countCache = new Map();
    const countDescendants = (id) => {
      if (countCache.has(id)) return countCache.get(id);
      const kids = bySide.get(id);
      let total = 0;
      if (kids) {
        for (const child of Object.values(kids)) {
          total += 1 + countDescendants(child.id);
        }
      }
      countCache.set(id, total);
      return total;
    };
    return { bySide, countDescendants };
  }, [nodes, rootId]);
}

function NodeCard({ node, root, side, collapsedCount, onToggle }) {
  const active = node.status === "active";
  const ringColor = root ? "var(--vp-accent)" : active ? "var(--vp-success)" : "var(--vp-border-strong)";
  const avatarBg = root ? "var(--vp-accent)" : active ? "var(--vp-success)" : "var(--vp-surface-raised)";
  const avatarText = root || active ? "#000000" : "var(--vp-muted)";

  return (
    <div
      className="vp-node relative flex w-40 flex-col gap-2 rounded-xl border p-3"
      style={{
        background: root ? "var(--vp-accent-muted)" : "var(--vp-surface-raised)",
        borderColor: root ? "var(--vp-accent-border)" : "var(--vp-border)",
        boxShadow: root ? "0 0 20px -6px var(--vp-accent)" : "none",
      }}
    >
      {root ? (
        <span
          className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
          style={{ background: "var(--vp-accent)", color: "#000000" }}
        >
          Tú
        </span>
      ) : (
        <span
          className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full border-2"
          style={{
            background: active ? "var(--vp-success)" : "var(--vp-subtle)",
            borderColor: "var(--vp-surface)",
          }}
          title={active ? "Activo" : "Inactivo"}
        />
      )}

      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-2"
          style={{ background: avatarBg, color: avatarText, boxShadow: `0 0 0 2px ${ringColor}` }}
        >
          {initialsOf(node.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-xs font-bold" style={{ color: "var(--vp-text)" }} title={node.name}>
            {node.name}
          </p>
          <p className="m-0 text-[9px] font-medium" style={{ color: "var(--vp-muted)" }}>
            {root ? "Raíz" : `Nivel ${node.level} · ${side === "L" ? "Izq" : "Der"}`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1">
        {node.rank ? (
          <span
            className="truncate rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase"
            style={{
              color: "var(--vp-accent)",
              background: "var(--vp-accent-muted)",
              borderColor: "var(--vp-accent-border)",
            }}
            title={node.rank.name}
          >
            {node.rank.name}
          </span>
        ) : (
          <span className="text-[9px] font-medium" style={{ color: "var(--vp-subtle)" }}>
            Sin rango
          </span>
        )}

        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsedCount ? "Expandir rama" : "Colapsar rama"}
            className="flex h-5 shrink-0 items-center gap-0.5 rounded-md border px-1 text-[9px] font-bold transition-colors"
            style={{ color: "var(--vp-muted)", background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
          >
            {collapsedCount ? (
              <>
                <Plus size={9} />
                {collapsedCount}
              </>
            ) : (
              <Minus size={9} />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EmptySlot({ side }) {
  return (
    <div
      className="flex w-40 flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-3 text-center"
      style={{ borderColor: "var(--vp-border-strong)", background: "transparent", minHeight: 84 }}
    >
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed"
        style={{ borderColor: "var(--vp-border-strong)", color: "var(--vp-subtle)" }}
      >
        <Plus size={13} />
      </span>
      <span className="text-[9px] font-semibold" style={{ color: "var(--vp-subtle)" }}>
        Disponible
      </span>
      <span className="text-[8px] font-medium uppercase" style={{ color: "var(--vp-subtle)" }}>
        {side === "L" ? "Izquierda" : "Derecha"}
      </span>
    </div>
  );
}

function TreeSubtree({ node, side, root, index, collapsed, onToggle }) {
  const { bySide, countDescendants } = index;
  const kids = bySide.get(node.id) || {};
  const realKids = [kids.L, kids.R].filter(Boolean);
  // Muestra los dos brazos si es la raíz o si ya hay al menos un descendiente,
  // para que la estructura binaria (par izq/der) sea siempre legible.
  const showBranches = (root || realKids.length > 0) && !collapsed.has(node.id);
  const isCollapsed = collapsed.has(node.id);
  const hiddenCount = realKids.length > 0 && isCollapsed ? countDescendants(node.id) : 0;

  return (
    <li className="vp-branch">
      <div className="vp-branch-node">
        <NodeCard
          node={node}
          root={root}
          side={side}
          collapsedCount={hiddenCount}
          onToggle={realKids.length > 0 ? () => onToggle(node.id) : null}
        />
      </div>

      {showBranches ? (
        <ul className="vp-children">
          {["L", "R"].map((childSide) => {
            const child = kids[childSide];
            return (
              <li className="vp-leaf" key={childSide}>
                {child ? (
                  <ul className="vp-children-root">
                    <TreeSubtree
                      node={child}
                      side={childSide}
                      root={false}
                      index={index}
                      collapsed={collapsed}
                      onToggle={onToggle}
                    />
                  </ul>
                ) : (
                  <div className="vp-branch-node">
                    <EmptySlot side={childSide} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </li>
  );
}

function BalanceBar({ leftCount, rightCount }) {
  const total = leftCount + rightCount;
  const leftPct = total ? Math.round((leftCount / total) * 100) : 50;
  const rightPct = 100 - (total ? leftPct : 50);
  const balanced = Math.abs(leftCount - rightCount);

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide">
        <span style={{ color: "var(--vp-text-soft)" }}>Izquierda · {leftCount}</span>
        <span style={{ color: "var(--vp-muted)" }}>
          {total ? (balanced === 0 ? "Equilibrado" : `Δ ${balanced}`) : "Sin descendientes"}
        </span>
        <span style={{ color: "var(--vp-text-soft)" }}>{rightCount} · Derecha</span>
      </div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--vp-surface-raised)" }}
      >
        <div style={{ width: `${total ? leftPct : 50}%`, background: "var(--vp-accent)" }} />
        <div style={{ width: `${total ? rightPct : 50}%`, background: "var(--vp-accent-strong)", opacity: 0.55 }} />
      </div>
    </div>
  );
}

export default function BinaryTreeView({ nodes, me }) {
  const rootId = me?.affiliateId ?? "__root__";
  const index = useTreeIndex(nodes, rootId);
  const [collapsed, setCollapsed] = useState(() => new Set());

  const toggle = (id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const leftCount = nodes.filter((node) => node.side === "L").length;
  const rightCount = nodes.filter((node) => node.side === "R").length;

  const rootNode = me
    ? {
        id: rootId,
        name: me.name || "Mi cuenta",
        level: 0,
        side: me.side,
        status: me.status,
        rank: me.rank ? { code: me.rank.code, name: me.rank.name } : null,
      }
    : null;

  if (!nodes.length && !rootNode) {
    return (
      <NetworkViewCard title="Árbol binario" memberCount={0}>
        <p className="m-0 py-6 text-center text-xs" style={{ color: "var(--vp-muted)" }}>
          Tu árbol aparecerá aquí cuando comiences a construir tu red.
        </p>
      </NetworkViewCard>
    );
  }

  return (
    <NetworkViewCard title="Árbol binario" memberCount={nodes.length + (rootNode ? 1 : 0)}>
      <BalanceBar leftCount={leftCount} rightCount={rightCount} />

      {!nodes.length ? (
        <div
          className="mb-5 flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center"
          style={{ borderColor: "var(--vp-border-strong)" }}
        >
          <Users size={20} style={{ color: "var(--vp-accent)" }} />
          <p className="m-0 text-xs font-bold" style={{ color: "var(--vp-text)" }}>
            Aún no tienes red bajo tu posición
          </p>
          <p className="m-0 text-[11px]" style={{ color: "var(--vp-muted)" }}>
            Comparte tu enlace de invitación para colocar tus primeras piernas.
          </p>
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3 text-[10px] font-medium" style={{ color: "var(--vp-muted)" }}>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--vp-success)" }} /> Activo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--vp-subtle)" }} /> Inactivo
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full border border-dashed"
            style={{ borderColor: "var(--vp-border-strong)" }}
          />{" "}
          Disponible
        </span>
        <span className="ml-auto flex items-center gap-1" style={{ color: "var(--vp-subtle)" }}>
          <ChevronDown size={11} /> Toca +/− para colapsar ramas
        </span>
      </div>

      <div className="vp-tree-scroll">
        <div className="vp-tree">
          <ul className="vp-children-root">
            <TreeSubtree
              node={rootNode ?? { id: rootId, name: "Mi cuenta", level: 0, status: "active", rank: null }}
              side={me?.side}
              root
              index={index}
              collapsed={collapsed}
              onToggle={toggle}
            />
          </ul>
        </div>
      </div>
    </NetworkViewCard>
  );
}
