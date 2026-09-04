"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, ChevronDown, Layers, Minus, Package, Plus, RefreshCw, Search, Users } from "lucide-react";

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

function sideLabel(side, short = false) {
  if (side === "L") return short ? "Izq" : "Izquierda";
  if (side === "R") return short ? "Der" : "Derecha";
  return "Raíz";
}

function compactNumber(value) {
  return Number(value ?? 0).toLocaleString("es-CO");
}

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

function nodeMatches(node, query) {
  if (!query) return false;
  return [node.name, node.id, node.rank?.name, node.rank?.code, node.sponsor, node.sponsorId, node.side, node.rootSide]
    .some((value) => normalized(value).includes(query));
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

function TreeButton({ children, active, disabled, onClick, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border px-3 text-[11px] font-bold disabled:opacity-55"
      style={{
        background: active ? "var(--vp-accent)" : "var(--vp-surface-raised)",
        borderColor: active ? "var(--vp-accent-strong)" : "var(--vp-border)",
        color: active ? "#000000" : "var(--vp-text-soft)",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function NodeCard({ node, root, side, collapsedCount, onToggle, highlighted }) {
  const active = node.status === "active";
  const hasPackage = Boolean(node.activePackage);
  const online = root || hasPackage || active;
  const ringColor = root || highlighted ? "var(--vp-accent)" : "transparent";
  const avatarText = root ? "var(--vp-accent)" : online ? "var(--vp-text)" : "var(--vp-muted)";
  const stateLabel = root ? "Tu cuenta" : hasPackage ? "Paquete activo" : active ? "Nodo activo" : "Inactivo";
  const packageLabel = node.rank?.name || (hasPackage ? "Pack activo" : "Sin rango");

  return (
    <div
      id={`member-tree-node-${node.id}`}
      className="vp-node relative flex min-h-[138px] flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center"
      style={{
        width: 120,
        background: highlighted ? "color-mix(in srgb, var(--vp-accent) 11%, var(--vp-surface-raised))" : "var(--vp-surface-raised)",
        borderColor: root || highlighted ? "var(--vp-accent)" : "var(--vp-border)",
        borderWidth: root ? 2 : 1,
        boxShadow: highlighted ? "0 0 0 2px color-mix(in srgb, var(--vp-accent) 18%, transparent)" : "none",
      }}
    >
      <div className="relative h-12 w-12 shrink-0">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold"
          style={{
            background: "linear-gradient(135deg, #1f2937 0%, #374151 100%)",
            color: avatarText,
            boxShadow: ringColor === "transparent" ? "none" : `0 0 0 2px ${ringColor}`,
          }}
        >
          {initialsOf(node.name) || "MB"}
        </span>
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2"
          style={{
            background: online ? "var(--vp-accent)" : "#6b7280",
            borderColor: "var(--vp-surface-raised)",
          }}
          title={stateLabel}
        />
      </div>

      <p
        className="m-0 min-h-[26px] w-full text-[11px] font-semibold leading-tight"
        style={{
          color: "var(--vp-text)",
          display: "-webkit-box",
          overflow: "hidden",
          textAlign: "center",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
        }}
        title={node.name}
      >
        {node.name}
      </p>

      <div className="flex w-full justify-center">
        <span
          className="inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold"
          style={{ color: "var(--vp-text)", background: "var(--vp-bg)", borderColor: "var(--vp-border)" }}
          title={packageLabel}
        >
          <Package size={10} style={{ color: "var(--vp-accent)" }} />
          <span className="truncate">{packageLabel}</span>
        </span>
      </div>

      <p className="m-0 text-[9px] font-medium" style={{ color: "var(--vp-muted)" }}>
        {root ? `Nodo #${node.id}` : `G${node.level} · ${sideLabel(side, true)}`}
      </p>

      <div className="mt-auto flex min-h-6 items-center justify-center">
        {!onToggle ? (
          <span className="inline-flex items-center gap-1 text-[9px] font-semibold" style={{ color: online ? "var(--vp-accent)" : "var(--vp-muted)" }}>
            <CheckCircle2 size={10} />
            {online ? "Activo" : "Inactivo"}
          </span>
        ) : null}

        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsedCount ? "Expandir rama" : "Colapsar rama"}
            className="flex h-6 shrink-0 items-center gap-0.5 rounded-full border px-1.5 text-[9px] font-bold transition-colors"
            style={{ color: collapsedCount ? "var(--vp-muted)" : "var(--vp-accent)", background: "var(--vp-surface)", borderColor: collapsedCount ? "var(--vp-border)" : "var(--vp-accent)" }}
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
      className="flex min-h-[118px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-3 text-center"
      style={{ width: 120, borderColor: "var(--vp-border)", background: "transparent" }}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed"
        style={{ borderColor: "var(--vp-border)", color: "var(--vp-subtle)" }}
      >
        <Plus size={15} />
      </span>
      <span className="text-[9px] font-semibold" style={{ color: "var(--vp-subtle)" }}>
        Disponible
      </span>
      <span className="text-[8px] font-medium uppercase" style={{ color: "var(--vp-subtle)" }}>
        {sideLabel(side)}
      </span>
    </div>
  );
}

function TreeSubtree({ node, side, root, index, collapsed, onToggle, searchQuery, highlightId }) {
  const { bySide, countDescendants } = index;
  const kids = bySide.get(node.id) || {};
  const realKids = [kids.L, kids.R].filter(Boolean);
  const showBranches = (root || realKids.length > 0) && !collapsed.has(node.id);
  const isCollapsed = collapsed.has(node.id);
  const hiddenCount = realKids.length > 0 && isCollapsed ? countDescendants(node.id) : 0;
  const highlighted = String(highlightId || "") === String(node.id) || nodeMatches(node, searchQuery);

  return (
    <li className="vp-branch">
      <div className="vp-branch-node">
        <NodeCard
          node={node}
          root={root}
          side={side}
          collapsedCount={hiddenCount}
          highlighted={highlighted}
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
                      searchQuery={searchQuery}
                      highlightId={highlightId}
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
    <div className="mb-5 space-y-2">
      <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase">
        <span style={{ color: "var(--vp-text-soft)" }}>Izquierda · {leftCount}</span>
        <span style={{ color: "var(--vp-muted)" }}>
          {total ? (balanced === 0 ? "Equilibrado" : `Diferencia ${balanced}`) : "Sin descendientes"}
        </span>
        <span style={{ color: "var(--vp-text-soft)" }}>{rightCount} · Derecha</span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--vp-surface-raised)" }}>
        <div style={{ width: `${total ? leftPct : 50}%`, background: "var(--vp-accent)" }} />
        <div style={{ width: `${total ? rightPct : 50}%`, background: "var(--vp-success)", opacity: 0.72 }} />
      </div>
    </div>
  );
}

function TreeSearchResults({ matches, onOpen }) {
  const visibleMatches = matches.slice(0, 10);

  return (
    <div
      className="mb-4 rounded-xl border p-3"
      style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
    >
      {matches.length === 0 ? (
        <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "var(--vp-muted)" }}>
          <Search size={14} />
          No hay coincidencias en la rama cargada.
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {visibleMatches.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onOpen(node)}
              className="flex min-w-0 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left"
              style={{ background: "var(--vp-bg)", borderColor: "var(--vp-border)", color: "var(--vp-text)" }}
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold">{node.name || `Nodo #${node.id}`}</span>
                <span className="block truncate text-[10px]" style={{ color: "var(--vp-muted)" }}>
                  #{node.id} · {node.rank?.name || "Sin rango"} · {node.sponsor ? `Sponsor ${node.sponsor}` : "Raíz"}
                </span>
              </span>
              <ArrowUpRight size={14} className="shrink-0" style={{ color: "var(--vp-accent)" }} />
            </button>
          ))}
        </div>
      )}
      {matches.length > visibleMatches.length ? (
        <p className="m-0 mt-2 text-[10px]" style={{ color: "var(--vp-subtle)" }}>
          Mostrando 10 de {matches.length} coincidencias. Afina la búsqueda para abrir una ruta específica.
        </p>
      ) : null}
    </div>
  );
}

function TreeStatsStrip({ memberCount, maxGen, withPackage }) {
  const stats = [
    { Icon: Users, label: `${compactNumber(memberCount)} en tu red` },
    { Icon: Layers, label: `Nivel ${compactNumber(maxGen)} alcanzado` },
    { Icon: Package, label: `${compactNumber(withPackage)} con paquete` },
  ];

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      {stats.map(({ Icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium"
          style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)", color: "var(--vp-text)" }}
        >
          <Icon size={14} style={{ color: "var(--vp-accent)" }} />
          {label}
        </span>
      ))}
    </div>
  );
}

export default function BinaryTreeView({ nodes, me, meta, depth, onDepthChange, onRefresh, refreshing }) {
  const rootId = me?.affiliateId ?? "__root__";
  const index = useTreeIndex(nodes, rootId);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [highlightId, setHighlightId] = useState("");
  const searchQuery = normalized(search);

  const rootNode = useMemo(() => (
    me
      ? {
          id: rootId,
          parentId: null,
          name: me.name || "Mi cuenta",
          level: 0,
          side: me.side,
          rootSide: null,
          status: me.status,
          activePackage: me.activePackage,
          rank: me.rank ? { code: me.rank.code, name: me.rank.name } : null,
        }
      : null
  ), [me, rootId]);

  const byId = useMemo(() => {
    const map = new Map();
    if (rootNode) map.set(String(rootNode.id), rootNode);
    for (const node of nodes) map.set(String(node.id), node);
    return map;
  }, [nodes, rootNode]);

  useEffect(() => {
    const next = new Set();
    for (const node of nodes) {
      const kids = index.bySide.get(node.id);
      if ((node.level ?? 0) >= 3 && kids && [kids.L, kids.R].some(Boolean)) {
        next.add(node.id);
      }
    }
    setCollapsed(next);
  }, [nodes, index]);

  const branchIds = useMemo(() => {
    const ids = [];
    const rootKids = index.bySide.get(rootId);
    if (rootKids && [rootKids.L, rootKids.R].some(Boolean)) ids.push(rootId);
    for (const node of nodes) {
      const kids = index.bySide.get(node.id);
      if (kids && [kids.L, kids.R].some(Boolean)) ids.push(node.id);
    }
    return ids;
  }, [index, nodes, rootId]);

  const matches = useMemo(() => {
    if (!searchQuery) return [];
    return [rootNode, ...nodes].filter(Boolean).filter((node) => nodeMatches(node, searchQuery));
  }, [nodes, rootNode, searchQuery]);

  const toggle = (id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandToNode = (node) => {
    if (!node?.id) return;
    const parents = [];
    const seen = new Set();
    let current = byId.get(String(node.id));
    while (current?.parentId && !seen.has(String(current.parentId))) {
      const parentId = String(current.parentId);
      parents.push(parentId);
      seen.add(parentId);
      current = byId.get(parentId);
    }
    setCollapsed((prev) => {
      const next = new Set(prev);
      parents.forEach((id) => next.delete(id));
      return next;
    });
    setHighlightId(String(node.id));
    setTimeout(() => {
      document.getElementById(`member-tree-node-${node.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }, 120);
  };

  const growDepth = () => {
    if (!onDepthChange || depth === "all") return;
    const current = Number(depth || meta?.depth || 8);
    if (!Number.isFinite(current)) {
      onDepthChange("10");
      return;
    }
    onDepthChange(current >= 16 ? "all" : String(Math.min(current + 4, 16)));
  };

  const collapseAll = () => {
    setCollapsed(new Set(branchIds.filter((id) => id !== rootId)));
  };

  const leftCount = nodes.filter((node) => node.rootSide === "L").length;
  const rightCount = nodes.filter((node) => node.rootSide === "R").length;
  const memberCount = nodes.length + (rootNode ? 1 : 0);
  const filterLabel = meta?.depth === "all" ? "Rama completa" : `${meta?.depth ?? depth} niveles`;

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
    <>
      <TreeStatsStrip memberCount={memberCount} maxGen={maxGen} withPackage={withPackage} />
      <NetworkViewCard title="Estructura de tu Red" memberCount={memberCount} filterLabel={filterLabel}>
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[
            ["6", "6 niveles"],
            ["10", "10 niveles"],
            ["all", "Rama completa"],
          ].map(([value, label]) => (
            <TreeButton key={value} active={depth === value} onClick={() => onDepthChange?.(value)}>
              {label}
            </TreeButton>
          ))}
          <TreeButton onClick={onRefresh} disabled={refreshing} title="Actualizar árbol">
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Actualizar
          </TreeButton>
          <TreeButton onClick={() => setCollapsed(new Set())} disabled={!branchIds.length}>
            <Plus size={13} />
            Expandir
          </TreeButton>
          <TreeButton onClick={collapseAll} disabled={!branchIds.length}>
            <Minus size={13} />
            Colapsar
          </TreeButton>
          <TreeButton onClick={growDepth} disabled={depth === "all"} title="Cargar más profundidad del árbol">
            <ChevronDown size={13} />
            Más niveles
          </TreeButton>
        </div>

        <label className="relative w-full xl:w-80">
          <Search size={14} style={{ color: "var(--vp-muted)", left: 12, position: "absolute", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar nombre, nodo, sponsor o rango"
            className="min-h-10 w-full rounded-lg border pl-9 pr-3 text-xs font-semibold outline-none"
            style={{ background: "var(--vp-surface-raised)", borderColor: "var(--vp-border)", color: "var(--vp-text)" }}
          />
        </label>
      </div>

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

      {meta?.truncated ? (
        <div
          className="mb-4 flex items-start gap-2 rounded-xl border p-3 text-[11px]"
          style={{ background: "var(--vp-amber-muted)", borderColor: "var(--vp-amber-border)", color: "var(--vp-amber)" }}
        >
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          La rama tiene más registros que el límite visual actual. Se muestran {meta.returned} de {meta.limit}+ nodos; usa búsqueda o solicita un export operativo para auditoría completa.
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-3 text-[10px] font-medium" style={{ color: "var(--vp-muted)" }}>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--vp-accent)" }} /> Activo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "#6b7280" }} /> Inactivo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--vp-border)" }} /> Disponible
        </span>
        <span className="ml-auto flex items-center gap-1" style={{ color: searchQuery ? "var(--vp-accent)" : "var(--vp-subtle)" }}>
          <ChevronDown size={11} />
          {searchQuery ? `${matches.length} coincidencia${matches.length === 1 ? "" : "s"}` : "Toca +/− para desplegar ramas"}
        </span>
      </div>

      {searchQuery ? <TreeSearchResults matches={matches} onOpen={expandToNode} /> : null}

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
              searchQuery={searchQuery}
              highlightId={highlightId}
            />
          </ul>
        </div>
      </div>
      </NetworkViewCard>
    </>
  );
}
