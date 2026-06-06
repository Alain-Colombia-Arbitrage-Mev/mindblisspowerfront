/**
 * GRID TREE VIEW — Simplified hierarchical network
 * Recursive expansion with progressive node loading
 * PHASES 1-8, 11
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home } from 'lucide-react';
import ExpandableTreeNode from './ExpandableTreeNode';

const RANK_COLORS = {
  'Embajador': '#fbbf24', 'Diamante Negro': '#c084fc', 'Diamante Azul': '#60a5fa',
  'Diamante': '#a78bfa', 'Platino': '#e2e8f0', 'Oro': '#f59e0b',
  'Plata': '#94a3b8', 'Bronce': '#d97706', 'Principiante': '#6b7280',
};

const SIDE_COLORS = {
  left: 'var(--vp-accent)',
  right: 'var(--vp-amber)',
  root: 'var(--vp-amber)',
};

function getRankColor(rank) { return RANK_COLORS[rank] || '#6b7280'; }
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}

// PHASE 9: Limit visible elements
const MAX_DIRECT_NODES = 30;
const GROUPING_THRESHOLD = 8;

export default function GridTreeView({
  rootMember,
  selectedMember,
  onSelect,
  dataset,
  currentFocusId = null,
  onNavigateFocus,
}) {
  // PHASE 1: Track expanded nodes per member
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [breadcrumb, setBreadcrumb] = useState([]);

  // PHASE 11: Limit active expanded nodes to maintain performance
  const MAX_EXPANDED = 50;

  // PHASE 7: Toggle expansion for any node
  const handleToggleExpanded = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        // PHASE 11: Auto-collapse if too many expanded
        if (next.size >= MAX_EXPANDED) {
          const firstNode = next.values().next().value;
          next.delete(firstNode);
        }
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleNavigate = (member) => {
    onSelect?.(member);
    setBreadcrumb(prev => {
      const idx = prev.findIndex(m => m.user_id === member.user_id);
      if (idx >= 0) return prev.slice(0, idx + 1);
      return [...prev, member];
    });
  };

  const handleBackToRoot = () => {
    setBreadcrumb([]);
    setExpandedNodes(new Set());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--vp-bg)', overflow: 'hidden' }}>
      {/* HEADER */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--vp-border)',
        background: 'var(--vp-shell)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        {breadcrumb.length > 0 && (
          <motion.button
            whileHover={{ x: -2 }}
            onClick={handleBackToRoot}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 7,
              background: 'var(--vp-surface)', border: '1px solid var(--vp-border)',
              color: 'var(--vp-muted)', fontSize: 9, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--vp-surface-raised)'; e.currentTarget.style.color = 'var(--vp-accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--vp-surface)'; e.currentTarget.style.color = 'var(--vp-muted)'; }}
          >
            <Home size={10} /> Raíz
          </motion.button>
        )}

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: 'var(--vp-muted)' }}>
          {breadcrumb.slice(-3).map((m, i) => (
            <span key={i}>
              {i > 0 && ' › '}
              <button onClick={() => handleNavigate(m)} style={{
                background: 'none', border: 'none', color: 'var(--vp-accent)', cursor: 'pointer', fontWeight: 700,
              }}>
                {m.full_name.split(' ')[0]}
              </button>
            </span>
          ))}
        </div>

        {/* Status */}
        <div style={{ marginLeft: 'auto', fontSize: 8, color: 'var(--vp-subtle)' }}>
          {expandedNodes.size} nodos expandidos
        </div>
      </div>

      {/* EXPANDABLE TREE */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'var(--vp-bg)' }}>
        <ExpandableTreeNode
          member={rootMember}
          dataset={dataset}
          depth={0}
          selectedMember={selectedMember}
          onSelect={handleNavigate}
          expandedNodes={expandedNodes}
          onToggleExpanded={handleToggleExpanded}
        />
      </div>
    </div>
  );
}
