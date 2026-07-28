"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2, Network, Search, Building2, X } from "lucide-react";

// Vista de TODA la red (solo admin). El árbol es binario (≤2 hijos por nodo),
// así que se carga perezosamente: arranca en las raíces y cada nodo pide sus
// hijos al expandirse. El buscador salta a cualquier usuario por handle/email/
// nombre y auto-expande la cadena de ancestros hasta él.
export default function AdminNetworkTree() {
  const [roots, setRoots] = useState(null);
  const [err, setErr] = useState("");
  const [childrenByParent, setChildrenByParent] = useState({});
  const [expanded, setExpanded] = useState(() => new Set());
  const [loadingIds, setLoadingIds] = useState(() => new Set());
  const [highlightId, setHighlightId] = useState(null);
  const cacheRef = useRef({}); // parentId -> children[]  (evita fetches repetidos)

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/tree/roots", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 403) { if (!cancelled) setErr("forbidden"); return null; }
        return r.ok ? r.json() : null;
      })
      .then((d) => { if (!cancelled && d?.roots) setRoots(d.roots); })
      .catch(() => { if (!cancelled) setErr("network"); });
    return () => { cancelled = true; };
  }, []);

  const ensureChildren = useCallback(async (id) => {
    if (cacheRef.current[id]) return cacheRef.current[id];
    setLoadingIds((s) => new Set(s).add(id));
    try {
      const r = await fetch(`/api/admin/tree/children?parent_id=${id}`, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      const kids = r.ok ? d.children || [] : [];
      cacheRef.current[id] = kids;
      setChildrenByParent((m) => ({ ...m, [id]: kids }));
      return kids;
    } finally {
      setLoadingIds((s) => { const n = new Set(s); n.delete(id); return n; });
    }
  }, []);

  const toggle = useCallback(async (node) => {
    if (!node.hasChildren) return;
    if (expanded.has(node.id)) {
      setExpanded((prev) => { const n = new Set(prev); n.delete(node.id); return n; });
      return;
    }
    await ensureChildren(node.id);
    setExpanded((prev) => new Set(prev).add(node.id));
  }, [expanded, ensureChildren]);

  const reveal = useCallback(async (result) => {
    const path = result.path || [];
    for (let i = 0; i < path.length - 1; i++) {
      // eslint-disable-next-line no-await-in-loop
      await ensureChildren(path[i]);
    }
    setExpanded((prev) => {
      const n = new Set(prev);
      for (let i = 0; i < path.length - 1; i++) n.add(path[i]);
      return n;
    });
    setHighlightId(result.id);
    setResults(null);
    setQuery("");
    setTimeout(() => {
      const el = document.getElementById(`treenode-${result.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, [ensureChildren]);

  async function runSearch(e) {
    e?.preventDefault?.();
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const r = await fetch(`/api/admin/tree/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      setResults(r.ok ? d.results || [] : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  function renderNode(node, depth) {
    const isOpen = expanded.has(node.id);
    const kids = childrenByParent[node.id] || [];
    const isLoading = loadingIds.has(node.id);
    const isCompany = node.id === "1";
    const highlighted = highlightId === node.id;
    return (
      <div key={node.id}>
        <div
          id={`treenode-${node.id}`}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5"
          style={{
            paddingLeft: 8 + depth * 18,
            background: highlighted ? "var(--vp-accent-muted)" : "transparent",
            border: highlighted ? "1px solid var(--vp-accent-border)" : "1px solid transparent",
          }}
        >
          <button
            type="button"
            onClick={() => toggle(node)}
            disabled={!node.hasChildren}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded disabled:opacity-25"
            style={{ color: "var(--vp-muted)" }}
            aria-label={isOpen ? "Colapsar" : "Expandir"}
          >
            {isLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : node.hasChildren ? (
              <ChevronRight size={14} style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
            ) : (
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--vp-border)" }} />
            )}
          </button>

          {isCompany ? <Building2 size={14} style={{ color: "var(--vp-accent)", flexShrink: 0 }} /> : null}

          {node.side ? (
            <span
              className="shrink-0 rounded px-1 text-[10px] font-black"
              style={{
                background: node.side === "L" ? "var(--vp-accent-muted)" : "var(--vp-surface-raised)",
                color: node.side === "L" ? "var(--vp-accent)" : "var(--vp-muted)",
              }}
              title={node.side === "L" ? "Pierna izquierda" : "Pierna derecha"}
            >
              {node.side}
            </span>
          ) : null}

          <span className="truncate text-sm font-bold" style={{ color: "var(--vp-text)" }}>
            {node.handle ? `@${node.handle}` : node.name}
          </span>
          {node.handle ? (
            <span className="hidden truncate text-xs sm:inline" style={{ color: "var(--vp-subtle)" }}>
              {node.name}
            </span>
          ) : null}

          {node.rank ? (
            <span className="shrink-0 text-[11px] font-semibold" style={{ color: "var(--vp-accent)" }}>
              {node.rank.name}
            </span>
          ) : null}

          <span className="ml-auto shrink-0 text-[11px] font-bold" style={{
            color: node.banned ? "var(--vp-danger)" : node.status === "active" ? "var(--vp-accent)" : "var(--vp-subtle)",
          }}>
            {isCompany ? "Empresa" : node.banned ? "Baneado" : node.status === "active" ? "Activo" : node.status || "—"}
          </span>
        </div>

        {isOpen && kids.map((k) => renderNode(k, depth + 1))}
        {isOpen && kids.length === 0 && !isLoading ? (
          <div className="px-2 py-1 text-[11px]" style={{ paddingLeft: 8 + (depth + 1) * 18, color: "var(--vp-subtle)" }}>
            Sin descendientes.
          </div>
        ) : null}
      </div>
    );
  }

  if (err === "forbidden") return null;

  return (
    <div className="executive-panel mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="executive-section-title m-0">
          <Network size={18} style={{ color: "var(--vp-accent)" }} /> Red completa
        </h2>
        <form onSubmit={runSearch} className="relative" style={{ width: 300, maxWidth: "100%" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por handle, email o nombre…"
            className="h-10 w-full rounded-lg pl-9 pr-9 text-sm"
            style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }}
          />
          <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--vp-muted)" }} />
          {query ? (
            <button type="button" onClick={() => { setQuery(""); setResults(null); }}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--vp-muted)" }}>
              <X size={15} />
            </button>
          ) : null}
        </form>
      </div>

      {results != null ? (
        <div className="mb-4 rounded-xl" style={{ border: "1px solid var(--vp-border)" }}>
          {searching ? (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--vp-muted)" }}>
              <Loader2 size={14} className="mr-2 inline animate-spin" /> Buscando…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--vp-muted)" }}>Sin coincidencias.</div>
          ) : (
            results.map((res) => (
              <button
                key={res.id}
                type="button"
                onClick={() => reveal(res)}
                className="flex w-full items-center gap-2 border-b px-4 py-2.5 text-left last:border-b-0"
                style={{ borderColor: "var(--vp-border)" }}
              >
                <span className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>
                  {res.handle ? `@${res.handle}` : res.name}
                </span>
                <span className="truncate text-xs" style={{ color: "var(--vp-subtle)" }}>{res.name} · {res.email}</span>
                {res.banned ? <span className="ml-auto text-[11px] font-bold" style={{ color: "var(--vp-danger)" }}>Baneado</span> : null}
                <span className="text-[11px]" style={{ color: "var(--vp-accent)", marginLeft: res.banned ? 8 : "auto" }}>Ver en árbol →</span>
              </button>
            ))
          )}
        </div>
      ) : null}

      <div className="max-h-[560px] overflow-auto rounded-xl p-2" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
        {err === "network" ? (
          <div className="px-2 py-4 text-sm" style={{ color: "var(--vp-danger)" }}>No se pudo cargar la red.</div>
        ) : roots == null ? (
          <div className="px-2 py-4 text-sm" style={{ color: "var(--vp-muted)" }}>
            <Loader2 size={14} className="mr-2 inline animate-spin" /> Cargando la red…
          </div>
        ) : roots.length === 0 ? (
          <div className="px-2 py-4 text-sm" style={{ color: "var(--vp-muted)" }}>Sin raíces.</div>
        ) : (
          roots.map((node) => renderNode(node, 0))
        )}
      </div>
      <p className="mt-3 text-[11px]" style={{ color: "var(--vp-subtle)" }}>
        Clic en ▸ para expandir cada nodo (carga sus 2 piernas al vuelo). La empresa es la raíz principal; las
        demás raíces son cuentas baneadas aisladas.
      </p>
    </div>
  );
}
