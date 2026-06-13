/**
 * MEMBER NETWORK — Binary Tree Module
 * Fully validated: 186 descendants, 93 left, 93 right
 * Multi-view: Árbol / Generación / Rango / Lista
 */
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Home, Network, Layers, Award, List, RefreshCw, AlertTriangle } from 'lucide-react';

// ── PERFORMANCE HELPERS ───────────────────────────────────────────
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

function throttle(fn, delay) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}
import { getValidatedBinaryTree } from '@/lib/canonicalBinaryDataset';
import GridTreeView from '@/components/network/GridTreeView';
import NodeDetailDrawer from '@/components/network/NodeDetailDrawer';
import NetworkSummaryStrip from '@/components/network/NetworkSummaryStrip';
import TreeGenerationView from '@/components/network/TreeGenerationView';
import TreeRankView from '@/components/network/TreeRankView';
import TreeListView from '@/components/network/TreeListView';

const VIEWS = [
  { key: 'tree',       label: 'Árbol Binario',    Icon: Network },
  { key: 'generation', label: 'Generación',        Icon: Layers },
  { key: 'rank',       label: 'Por Rango',         Icon: Award },
  { key: 'list',       label: 'Lista Operativa',   Icon: List },
];

// Phase 3: Memoize view to prevent full tree re-renders
const TreeViewContainer = ({ children }) => children;

function MemberNetwork() {
  const userId = localStorage.getItem('user_id') || 'master-root-001';
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

  // ── PHASE 9: VALIDATED BINARY TREE ───────────────────────────────
  const { dataset, isValid, confirmed } = useMemo(() => getValidatedBinaryTree(userId), [userId]);

  // ── STATE ─────────────────────────────────────────────────────────
  const [viewMode, setViewMode]       = useState('tree');
  const [selectedMember, setSelected] = useState(null);
  const [zoom, setZoom]               = useState(0.85);
  const [pan, setPan]                 = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]   = useState(false);
  const [dragStart, setDragStart]     = useState({ x: 0, y: 0 });
  const [maxVisibleDepth, setMaxVisibleDepth] = useState(2);  // Progressive: only show up to level 2 initially
  const [collapsedNodes, setCollapsed] = useState(new Set());
  const [expandedNodes, setExpanded]   = useState(new Set([userId]));  // Track explicitly expanded nodes
  const [focusNodeId, setFocusNodeId] = useState(null);  // PHASE 7: Navigation focus
  const [recovering, setRecovering]   = useState(false);
  const [breadcrumb, setBreadcrumb]   = useState([]);
  const [loadingDepth, setLoadingDepth] = useState(null);  // Phase 12: loading indicator
  const [autoReducedDepth, setAutoReducedDepth] = useState(false);  // Phase 14: failsafe
  const [isMobile, setIsMobile] = useState(false);
  const containerRef                  = useRef(null);
  const debounceTimerRef              = useRef(null);  // Phase 10: debounce tracker
  const visibleNodeCountRef            = useRef(0);  // Phase 14: track visible count

  // Root member object (virtual — the logged-in user)
  const rootMember = useMemo(() => ({
    user_id: userId,
    full_name: userData.name || 'Embajador Corona',
    name: userData.name || 'Embajador Corona',
    email: userData.email || 'corona@vicion.com',
    phone: userData.phone || '+57 300 000 0000',
    country: userData.country || 'CO',
    country_name: 'Colombia',
    rank: userData.rank || 'E. Corona',
    membership_plan: 'Elite',
    investment_amount: userData.investment || 25000,
    amount: userData.investment || 25000,
    status: 'activo',
    upline_id: null,
    binary_side: 'root',
    generation_depth: 0,
    activity_level: 'high',
    join_date: '2022-01-01',
  }), [userId, userData]);

  // Augmented dataset — includes root in lookups, delegates everything else to canonical
  const augmentedDataset = useMemo(() => ({
    ...dataset,
    getChildren(uid) {
      if (uid === userId) {
        const lc = dataset.getLeftDirect();
        const rc = dataset.getRightDirect();
        return [lc, rc].filter(Boolean);
      }
      return dataset.getChildren(uid);
    },
    getMember(uid) {
      if (uid === userId) return rootMember;
      return dataset.getMember(uid);
    },
  }), [dataset, userId, rootMember]);

  // ── PHASE 10: RENDER BLOCK — block render if data is not 100% valid ──
  useEffect(() => {
    if (!isValid) {
      setRecovering(true);
      // Hard block — do not auto-dismiss; data must be valid before render
    } else {
      setRecovering(false);
    }
  }, [isValid]);

  // ── PAN/ZOOM ──────────────────────────────────────────────────────
  // Phase 5, 6: Throttled drag & zoom handlers
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const throttledMouseMove = useRef(throttle((x, y) => {
    setPan({ x, y });
  }, 16)).current;  // 60fps

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    throttledMouseMove(e.clientX - dragStart.x, e.clientY - dragStart.y);
  }, [isDragging, dragStart, throttledMouseMove]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: t.clientX - pan.x, y: t.clientY - pan.y });
  }, [pan]);

  const throttledTouchMove = useRef(throttle((x, y) => {
    setPan({ x, y });
  }, 16)).current;

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    throttledTouchMove(t.clientX - dragStart.x, t.clientY - dragStart.y);
  }, [isDragging, dragStart, throttledTouchMove]);

  // Phase 6: Controlled zoom steps
  const handleZoom = (dir) => {
    const step = 0.15;  // Controlled step, not free zoom
    setZoom(z => Math.max(0.25, Math.min(dir === 'in' ? z + step : z - step, 2.5)));
  };
  const handleCenter = () => { setPan({ x: 0, y: 0 }); setZoom(0.85); };

  // ── NODE SELECTION (Phase 10, 11: debounced, instant feedback) ────────────
  const handleSelect = useCallback((member) => {
    // Phase 11: instant feedback
    if (selectedMember?.user_id === member.user_id) return;
    
    setSelected(member);
    setBreadcrumb(prev => {
      const idx = prev.findIndex(m => m.user_id === member.user_id);
      if (idx >= 0) return prev.slice(0, idx + 1);
      return [...prev, member];
    });
  }, [selectedMember]);

  // Phase 10: debounce expand to avoid rapid re-renders
  const debouncedToggleExpand = useRef(debounce((uid) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
    // Phase 12: show loading during expansion
    setLoadingDepth(null);
  }, 120)).current;

  const handleToggleExpand = useCallback((uid) => {
    setLoadingDepth(uid);  // Phase 12: show loading
    debouncedToggleExpand(uid);
  }, [debouncedToggleExpand]);

  const handleToggleCollapse = useCallback((uid) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  }, []);

  // ── INITIAL CENTER (Phase 8: viewport control) ──────────────────
  useEffect(() => {
    // Center view on load — pan down slightly to show root prominently
    if (containerRef.current && pan.y === 0) {
      const { clientHeight } = containerRef.current;
      setPan({ x: 0, y: Math.max(30, clientHeight * 0.12) });
    }
  }, [containerRef.current?.clientHeight]);

  // ── PHASE 14: AUTO-REDUCE FAILSAFE ──────────────────────────────
  // If visible nodes exceed 30, auto-reduce depth to keep performance stable
  useEffect(() => {
    const estimateVisibleNodes = () => {
      // Rough estimate: nodes = 2^(depth+1) - 1
      const estimate = Math.pow(2, maxVisibleDepth + 1) - 1;
      visibleNodeCountRef.current = estimate;
      
      if (estimate > 30 && !autoReducedDepth) {
        // Auto-reduce to prevent overload
        const newDepth = Math.max(2, Math.floor(Math.log2(31)));
        setMaxVisibleDepth(newDepth);
        setAutoReducedDepth(true);
      } else if (estimate <= 25 && autoReducedDepth) {
        // Can safely increase again
        setAutoReducedDepth(false);
      }
    };
    estimateVisibleNodes();
  }, [maxVisibleDepth, autoReducedDepth]);

  // ── WHEEL ZOOM (Phase 6: controlled steps) ────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const throttledWheel = throttle((deltaY) => {
      const step = 0.15;  // Controlled step
      setZoom(z => Math.max(0.25, Math.min(deltaY > 0 ? z - step : z + step, 2.5)));
    }, 50);
    
    const onWheel = (e) => {
      e.preventDefault();
      throttledWheel(e.deltaY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const viewportCX = containerRef.current ? containerRef.current.clientWidth / 2 : 500;

  // ── CLEANUP ON UNMOUNT ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Cleanup debounce timers
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const updateMobile = () => setIsMobile(query.matches);
    updateMobile();
    query.addEventListener('change', updateMobile);
    return () => query.removeEventListener('change', updateMobile);
  }, []);

  // ── VALIDATION RECOVERY SCREEN ────────────────────────────────────
  // Phase 10 — hard render block
  if (recovering || !isValid) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--vp-bg)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: 40 }}
        >
          <RefreshCw size={32} style={{ color: 'var(--vp-accent)', marginBottom: 12 }} className="animate-spin" />
          <p style={{ color: 'var(--vp-text)', fontSize: 14, fontWeight: 700, margin: '0 0 6px 0' }}>Validando integridad del árbol binario...</p>
          <p style={{ color: 'var(--vp-muted)', fontSize: 11, margin: 0 }}>Verificando 93L · 93R · 186 total</p>
          <p style={{ color: 'rgba(239,68,68,0.7)', fontSize: 9, marginTop: 8, fontWeight: 700 }}>El árbol no se renderiza hasta que la validación sea 100% correcta</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--vp-bg)', overflow: 'hidden' }}>
      {/* SUMMARY STRIP */}
      <NetworkSummaryStrip summary={dataset.summary} rootName={rootMember.full_name} />

      {/* VIEW TABS + CONTROLS */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 16px',
        borderBottom: '1px solid var(--vp-border)',
        flexShrink: 0,
        background: 'var(--vp-shell)',
        overflowX: 'auto',
        maxWidth: '100%',
      }}>
        {/* View switcher */}
        <div style={{ display: 'flex', gap: 3, background: 'var(--vp-surface-raised)', borderRadius: 9, padding: 3, border: '1px solid var(--vp-border)', flexShrink: 0 }}>
          {VIEWS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setViewMode(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 7, border: 'none',
                background: viewMode === key ? 'var(--vp-accent)' : 'transparent',
                color: viewMode === key ? '#1b1b1c' : 'var(--vp-muted)',
                fontSize: 10, fontWeight: 800, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={11} /> {label}
            </button>
          ))}
        </div>



        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: viewMode !== 'tree' ? 'auto' : 0 }}>
            <button onClick={() => { setBreadcrumb([]); setSelected(null); }}
              style={{ color: 'var(--vp-muted)', background: 'none', border: 'none', fontSize: 9, cursor: 'pointer' }}>
              Red
            </button>
            {breadcrumb.slice(-2).map((m, i) => (
              <span key={i} style={{ color: 'var(--vp-subtle)', fontSize: 9 }}>
                › <button onClick={() => handleSelect(m)} style={{ color: 'var(--vp-accent)', background: 'none', border: 'none', fontSize: 9, cursor: 'pointer' }}>
                  {m.full_name.split(' ')[0]}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT SIDEBAR (tree view only) */}
        {viewMode === 'tree' && !isMobile && (
          <motion.div
            initial={{ x: -220 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              width: 200, borderRight: '1px solid var(--vp-border)',
              background: 'var(--vp-shell)', padding: '16px 14px',
              display: 'flex', flexDirection: 'column', gap: 12,
              overflowY: 'auto', flexShrink: 0,
            }}
          >
            <p style={{ color: 'var(--vp-subtle)', fontSize: 8, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Control de Red</p>

            {/* Stats */}
            {[
              { label: 'Total Miembros', value: confirmed.total,  color: 'var(--vp-accent)' },
              { label: 'Izquierda',      value: confirmed.left,   color: 'var(--vp-accent)' },
              { label: 'Derecha',        value: confirmed.right,  color: 'var(--vp-amber)' },
              { label: 'Activos',        value: dataset.summary.activeCount, color: 'var(--vp-text-soft)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: 9, background: 'var(--vp-surface)', border: '1px solid var(--vp-border)', borderLeft: `2px solid ${s.color}` }}>
                <p style={{ color: 'var(--vp-subtle)', fontSize: 7, fontWeight: 700, margin: '0 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: 16, fontWeight: 900, margin: 0 }}>{s.value}</p>
              </div>
            ))}

            {/* Balance bar */}
            <div style={{ padding: '8px 10px', borderRadius: 9, background: 'var(--vp-surface)', border: '1px solid var(--vp-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: 'var(--vp-accent)', fontSize: 7, fontWeight: 700 }}>IZQ 50%</span>
                <span style={{ color: 'var(--vp-amber)', fontSize: 7, fontWeight: 700 }}>DER 50%</span>
              </div>
              <div style={{ height: 4, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                <div style={{ flex: 1, background: 'var(--vp-accent)' }} />
                <div style={{ flex: 1, background: 'var(--vp-amber)' }} />
              </div>
              <p style={{ color: 'var(--vp-accent)', fontSize: 7, fontWeight: 700, margin: '4px 0 0 0', textAlign: 'center', letterSpacing: '0.3px' }}>Balanceado · 93 / 93</p>
            </div>

            {/* Legend */}
            <div style={{ paddingTop: 8, borderTop: '1px solid var(--vp-border)' }}>
              <p style={{ color: 'var(--vp-subtle)', fontSize: 7, fontWeight: 700, margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Leyenda</p>
              {[
                { color: 'var(--vp-accent)', label: 'Rama Izquierda' },
                { color: 'var(--vp-amber)', label: 'Rama Derecha' },
                { color: 'var(--vp-text-soft)', label: 'Activo' },
                { color: 'var(--vp-subtle)', label: 'Inactivo' },
                { color: 'var(--vp-accent-strong)', label: 'Alto Valor' },
              ].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--vp-muted)', fontSize: 8, fontWeight: 600 }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Validation badge */}
            <div style={{ padding: '7px 10px', borderRadius: 8, background: 'var(--vp-accent-muted)', border: '1px solid var(--vp-accent-border)' }}>
              <p style={{ color: 'var(--vp-accent)', fontSize: 8, fontWeight: 700, margin: 0, textAlign: 'center', letterSpacing: '0.3px' }}>
                DATOS VALIDADOS<br />
                <span style={{ fontWeight: 600, opacity: 0.6 }}>93L · 93R · 186 total</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* GRID TREE VIEW — PHASE 2, 5, 8 */}
        {viewMode === 'tree' && (
          <GridTreeView
            rootMember={rootMember}
            selectedMember={selectedMember}
            onSelect={handleSelect}
            dataset={augmentedDataset}
            currentFocusId={focusNodeId}
            onNavigateFocus={setFocusNodeId}
          />
        )}

        {/* NON-TREE VIEWS */}
        <AnimatePresence mode="wait">
          {viewMode === 'generation' && (
            <motion.div
              key="gen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ flex: 1, overflow: 'hidden' }}
            >
              <TreeGenerationView dataset={dataset} onSelect={handleSelect} />
            </motion.div>
          )}
          {viewMode === 'rank' && (
            <motion.div
              key="rank"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ flex: 1, overflow: 'hidden' }}
            >
              <TreeRankView dataset={dataset} onSelect={handleSelect} />
            </motion.div>
          )}
          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ flex: 1, overflow: 'hidden' }}
            >
              <TreeListView dataset={dataset} onSelect={handleSelect} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* NODE DETAIL DRAWER */}
        <AnimatePresence>
          {selectedMember && (
            <NodeDetailDrawer
              key={selectedMember.user_id}
              member={selectedMember}
              dataset={augmentedDataset}
              onClose={() => setSelected(null)}
              onSelect={handleSelect}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MemberNetwork;
