/**
 * EXPANDABLE TREE NODE — Recursive node with expansion support
 * PHASES 1-7: Expansion state, child loading, visual stack, collapse option
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

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

export default function ExpandableTreeNode({
  member,
  dataset,
  depth = 0,
  selectedMember,
  onSelect,
  expandedNodes = new Set(),
  onToggleExpanded,
}) {
  const rankColor = getRankColor(member.rank);
  const sideColor = SIDE_COLORS[member.binary_side] || SIDE_COLORS.root;
  const sideBg = member.binary_side === 'left' ? 'var(--vp-accent-muted)' : 'var(--vp-amber-muted)';
  const sideBorder = member.binary_side === 'left' ? 'var(--vp-accent-border)' : 'var(--vp-amber-border)';
  const isSelected = selectedMember?.user_id === member.user_id;
  const isExpanded = expandedNodes.has(member.user_id);

  // PHASE 3: Load children when needed
  const children = dataset.getChildren(member.user_id);
  const hasChildren = children.length > 0;

  // PHASE 9, 10: Only show expand control if has children
  const handleToggleExpand = (e) => {
    e.stopPropagation();
    onToggleExpanded?.(member.user_id);
  };

  // PHASE 6: Visual stack with clear separation per level
  const nodeIndent = depth * 20;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: depth * 0.02 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
    >
      {/* NODE CARD */}
      <motion.div
        whileHover={{ x: 3 }}
        onClick={() => onSelect?.(member)}
        style={{
          marginLeft: nodeIndent,
          padding: '12px 16px',
          borderRadius: 10,
          background: isSelected ? sideBg : 'var(--vp-surface)',
          border: `1.5px solid ${isSelected ? sideBorder : 'var(--vp-border)'}`,
          cursor: 'pointer',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'var(--vp-surface-raised)';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.background = 'var(--vp-surface)';
        }}
      >
        {/* Expand toggle */}
        {hasChildren && (
          <motion.button
            animate={{ rotate: isExpanded ? 180 : 0 }}
            onClick={handleToggleExpand}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 6,
              background: sideBg,
              border: `1px solid ${sideBorder}`,
              color: sideColor,
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <ChevronDown size={14} />
          </motion.button>
        )}

        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: sideBg,
            border: `1.5px solid ${sideBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 900,
            color: sideColor,
            fontFamily: 'Montserrat',
            flexShrink: 0,
          }}
        >
          {getInitials(member.full_name)}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              color: 'var(--vp-text)',
              fontSize: 10,
              fontWeight: 700,
              margin: '0 0 2px 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {member.full_name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 8 }}>
            <span style={{ color: sideColor, fontWeight: 800 }}>
              ${member.investment_amount?.toLocaleString() || '0'}
            </span>
            <span style={{ color: rankColor, fontWeight: 700 }}>
              {member.rank}
            </span>
            {member.status === 'activo' ? (
              <span style={{ color: 'var(--vp-accent)', fontWeight: 700 }}>Activo</span>
            ) : (
              <span style={{ color: 'var(--vp-subtle)', fontWeight: 700 }}>Inactivo</span>
            )}
          </div>
        </div>

        {/* Child count indicator */}
        {hasChildren && (
          <div
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              background: sideBg,
              border: `1px solid ${sideBorder}`,
              fontSize: 8,
              fontWeight: 800,
              color: sideColor,
              flexShrink: 0,
            }}
          >
            +{children.length}
          </div>
        )}
      </motion.div>

      {/* PHASE 2, 3: CHILDREN STACK (only when expanded) */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}
          >
            {/* PHASE 4: Recursive child nodes */}
            {children.map((child) => (
              <ExpandableTreeNode
                key={child.user_id}
                member={child}
                dataset={dataset}
                depth={depth + 1}
                selectedMember={selectedMember}
                onSelect={onSelect}
                expandedNodes={expandedNodes}
                onToggleExpanded={onToggleExpanded}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
