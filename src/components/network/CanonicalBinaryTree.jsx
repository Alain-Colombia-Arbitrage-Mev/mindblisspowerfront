/**
 * CanonicalBinaryTree
 * Renders the binary tree from canonical dataset.
 * Progressive: shows maxDepth levels only, expandable.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = {
  root:  { primary: '#fbbf24', glow: 'rgba(251,191,36,0.45)', bg: 'rgba(251,191,36,0.1)',  line: 'rgba(251,191,36,0.4)' },
  left:  { primary: '#3b82f6', glow: 'rgba(59,130,246,0.4)',  bg: 'rgba(59,130,246,0.1)',  line: 'rgba(59,130,246,0.35)' },
  right: { primary: '#8b5cf6', glow: 'rgba(139,92,246,0.4)',  bg: 'rgba(139,92,246,0.1)',  line: 'rgba(139,92,246,0.35)' },
};

const ACTIVITY_COLORS = {
  high:   '#10b981',
  medium: '#fbbf24',
  low:    '#ef4444',
};

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}

function TreeNode({ node, side, depth, maxDepth, nodeMap, childrenMap, onSelect, selectedId }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (!node) return null;
  if (depth > maxDepth) return null;

  const isRoot     = depth === 0;
  const isSelected = selectedId === node.user_id;
  const colors     = COLORS[isRoot ? 'root' : side] || COLORS.root;

  const children   = childrenMap[node.user_id] || [];
  const leftChild  = children.find(c => c.binary_side === 'left');
  const rightChild = children.find(c => c.binary_side === 'right');
  const hasReal    = leftChild || rightChild;

  const nodeSize  = isRoot ? 68 : depth === 1 ? 54 : depth === 2 ? 44 : 36;
  const fontSize  = isRoot ? 18 : depth === 1 ? 14 : depth === 2 ? 12 : 10;
  const hBarWidth = isRoot ? 120 : depth === 1 ? 90 : depth === 2 ? 60 : 45;

  const actColor  = ACTIVITY_COLORS[node.activity_level] || '#6b7280';
  const isActive  = node.status === 'activo';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* NODE CIRCLE */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: depth * 0.06 + (side === 'right' ? 0.04 : 0), ease: [0.34, 1.56, 0.64, 1] }}
        style={{ position: 'relative', cursor: 'pointer' }}
        onClick={() => onSelect && onSelect(node)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
      >
        {/* Selected pulse ring */}
        {isSelected && (
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{
              position: 'absolute', inset: -6, borderRadius: '50%',
              border: `2px solid ${colors.primary}`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Circle */}
        <div style={{
          width: nodeSize, height: nodeSize, borderRadius: '50%',
          background: isSelected
            ? `radial-gradient(circle at 35% 35%, ${colors.primary}40, ${colors.bg})`
            : isRoot
              ? 'radial-gradient(circle at 35% 35%, rgba(251,191,36,0.2), rgba(8,18,40,0.95))'
              : 'rgba(8,18,40,0.92)',
          border: `${isRoot ? 3 : 2}px solid ${isSelected ? colors.primary : isRoot ? colors.primary : 'rgba(255,255,255,0.12)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isSelected || isRoot
            ? `0 0 0 ${isRoot ? 4 : 3}px ${colors.glow}, 0 0 ${isRoot ? 32 : 16}px ${colors.glow}`
            : 'none',
          transition: 'all 0.2s',
          position: 'relative',
        }}>
          <span style={{
            color: isSelected || isRoot ? colors.primary : 'rgba(255,255,255,0.85)',
            fontSize, fontWeight: 900,
            fontFamily: 'Montserrat,sans-serif',
            userSelect: 'none',
          }}>
            {getInitials(node.full_name || node.name)}
          </span>

          {/* Status dot */}
          <div style={{
            position: 'absolute', bottom: depth === 0 ? 4 : 2, right: depth === 0 ? 4 : 2,
            width: depth === 0 ? 10 : 7, height: depth === 0 ? 10 : 7,
            borderRadius: '50%', border: '1.5px solid #050c18',
            background: isActive ? '#10b981' : '#374151',
          }} />
        </div>

        {/* Labels below node */}
        <div style={{ textAlign: 'center', marginTop: 5, width: Math.max(nodeSize + 20, 80) }}>
          <p style={{
            color: isSelected ? colors.primary : 'rgba(255,255,255,0.8)',
            fontSize: isRoot ? 10 : 8, fontWeight: 700, margin: 0, lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {(node.full_name || node.name || '').split(' ')[0]}
          </p>
          {depth <= 2 && (
            <p style={{ color: colors.primary, fontSize: 7, fontWeight: 800, margin: '1px 0 0 0' }}>
              ${(node.investment_amount || node.amount || 0).toLocaleString()}
            </p>
          )}
        </div>

        {/* Alert indicators */}
        {!isActive && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 12, height: 12, borderRadius: '50%',
            background: '#ef4444', border: '1.5px solid #050c18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 7, color: 'white', fontWeight: 900,
          }}>!</div>
        )}
        {(node.investment_amount || 0) >= 10000 && (
          <div style={{
            position: 'absolute', top: -4, left: -4,
            width: 12, height: 12, borderRadius: '50%',
            background: '#fbbf24', border: '1.5px solid #050c18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 7, color: '#050c18', fontWeight: 900,
          }}>★</div>
        )}
      </motion.div>

      {/* CHILDREN */}
      {hasReal && depth < maxDepth && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Vertical stem */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.28, delay: depth * 0.06 + 0.18, transformOrigin: 'top' }}
            style={{ width: 1.5, height: 24, background: `linear-gradient(180deg, ${colors.line}, rgba(255,255,255,0.05))` }}
          />

          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            {/* LEFT BRANCH */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.28, delay: depth * 0.06 + 0.22, transformOrigin: 'right' }}
                style={{ width: hBarWidth, height: 1.5, background: COLORS.left.line }}
              />
              <div style={{ width: 1.5, height: 18, background: COLORS.left.line }} />
              {leftChild ? (
                <TreeNode
                  node={leftChild} side="left" depth={depth + 1} maxDepth={maxDepth}
                  nodeMap={nodeMap} childrenMap={childrenMap}
                  onSelect={onSelect} selectedId={selectedId}
                />
              ) : (
                <EmptySlot side="left" depth={depth + 1} />
              )}
            </div>

            {/* RIGHT BRANCH */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.28, delay: depth * 0.06 + 0.22, transformOrigin: 'left' }}
                style={{ width: hBarWidth, height: 1.5, background: COLORS.right.line }}
              />
              <div style={{ width: 1.5, height: 18, background: COLORS.right.line }} />
              {rightChild ? (
                <TreeNode
                  node={rightChild} side="right" depth={depth + 1} maxDepth={maxDepth}
                  nodeMap={nodeMap} childrenMap={childrenMap}
                  onSelect={onSelect} selectedId={selectedId}
                />
              ) : (
                <EmptySlot side="right" depth={depth + 1} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* If node has no children yet but we still want to show depth limit slots */}
      {!hasReal && depth < maxDepth && depth > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 1.5, height: 22, background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ display: 'flex', gap: 40 }}>
            <EmptySlot side="left" depth={depth + 1} />
            <EmptySlot side="right" depth={depth + 1} />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptySlot({ side, depth }) {
  const colors = COLORS[side];
  if (depth > 4) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: depth * 0.08 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: `1.5px dashed ${colors.primary}28`,
        background: 'rgba(255,255,255,0.015)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: `${colors.primary}35`, fontSize: 12, lineHeight: 1 }}>+</span>
      </div>
    </motion.div>
  );
}

export default function CanonicalBinaryTree({ dataset, rootUserId, maxDepth, selectedId, onSelect }) {
  // Build childrenMap for O(1) lookup
  const childrenMap = useMemo(() => {
    const map = {};
    dataset.members.forEach(m => {
      if (!map[m.upline_id]) map[m.upline_id] = [];
      map[m.upline_id].push(m);
    });
    return map;
  }, [dataset]);

  // Root node (the logged-in user)
  const rootNode = useMemo(() => {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    return {
      user_id:          rootUserId,
      full_name:        userData.name || 'Embajador Corona',
      name:             userData.name || 'Embajador Corona',
      email:            userData.email || 'corona@vicion.com',
      phone:            userData.phone || '+57 1 234 5678',
      country:          'CO',
      rank:             userData.rank || 'E. Corona',
      membership_plan:  'Elite',
      investment_amount: 25000,
      status:           'activo',
      upline_id:        null,
      binary_side:      'root',
      generation_depth:  0,
      activity_level:   'high',
    };
  }, [rootUserId]);

  return (
    <TreeNode
      node={rootNode}
      side="root"
      depth={0}
      maxDepth={maxDepth}
      nodeMap={dataset.nodeMap}
      childrenMap={childrenMap}
      onSelect={onSelect}
      selectedId={selectedId}
    />
  );
}