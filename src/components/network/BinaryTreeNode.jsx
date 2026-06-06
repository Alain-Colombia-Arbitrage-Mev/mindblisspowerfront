import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SIDE_COLORS = {
  left: { primary: '#3b82f6', glow: 'rgba(59,130,246,0.4)', bg: 'rgba(59,130,246,0.12)', line: 'rgba(59,130,246,0.5)' },
  right: { primary: '#8b5cf6', glow: 'rgba(139,92,246,0.4)', bg: 'rgba(139,92,246,0.12)', line: 'rgba(139,92,246,0.5)' },
  root: { primary: '#fbbf24', glow: 'rgba(251,191,36,0.5)', bg: 'rgba(251,191,36,0.12)', line: 'rgba(251,191,36,0.3)' },
};

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

export default function BinaryTreeNode({ node, side = 'root', depth = 0, maxDepth, allNodes, onSelect, selectedId, animate = true }) {
  const [hovered, setHovered] = useState(false);

  if (depth > maxDepth) return null;

  const isRoot = depth === 0;
  const isSelected = selectedId === node.user_id;
  const colors = SIDE_COLORS[isRoot ? 'root' : side] || SIDE_COLORS.root;

  // Find left and right children
  const leftChild  = allNodes.find(n => n.upline_id === node.user_id && n.binary_side === 'left');
  const rightChild = allNodes.find(n => n.upline_id === node.user_id && n.binary_side === 'right');

  const nodeSize = isRoot ? 64 : depth === 1 ? 52 : 44;
  const fontSize = isRoot ? 16 : depth === 1 ? 13 : 11;

  const hasChildren = leftChild || rightChild;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* NODE */}
      <motion.div
        initial={animate ? { opacity: 0, scale: 0.5 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: depth * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ position: 'relative', zIndex: 2 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect && onSelect(node)}
      >
        {/* Glow ring */}
        <motion.div
          animate={{ boxShadow: hovered || isSelected ? `0 0 0 4px ${colors.glow}, 0 0 24px ${colors.glow}` : `0 0 0 0px ${colors.glow}` }}
          transition={{ duration: 0.2 }}
          style={{
            width: nodeSize, height: nodeSize, borderRadius: '50%',
            background: isSelected ? colors.bg : 'rgba(8,18,40,0.9)',
            border: `2px solid ${isSelected || hovered ? colors.primary : 'rgba(255,255,255,0.12)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            position: 'relative',
          }}
        >
          <span style={{ color: hovered || isSelected ? colors.primary : 'rgba(255,255,255,0.8)', fontSize, fontWeight: 900, fontFamily: 'Montserrat,sans-serif', userSelect: 'none' }}>
            {getInitials(node.name)}
          </span>

          {/* Status dot */}
          <div style={{
            position: 'absolute', bottom: 2, right: 2, width: 9, height: 9,
            borderRadius: '50%', border: '1.5px solid #060e1c',
            background: node.status === 'activo' ? '#10b981' : '#6b7280',
          }} />
        </motion.div>

        {/* Name + investment below node */}
        <motion.div
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: depth * 0.08 + 0.15 }}
          style={{ textAlign: 'center', marginTop: 6, width: 80 }}
        >
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: 700, margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {node.name?.split(' ')[0]}
          </p>
          <p style={{ color: colors.primary, fontSize: 8, fontWeight: 800, margin: '2px 0 0 0' }}>
            ${node.investment ? node.investment.toLocaleString() : '0'}
          </p>
        </motion.div>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(4,10,22,0.97)', border: `1px solid ${colors.primary}40`,
                borderRadius: 10, padding: '10px 14px', minWidth: 160, zIndex: 100,
                boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 12px ${colors.glow}`,
                pointerEvents: 'none',
              }}
            >
              <p style={{ color: 'white', fontWeight: 800, fontSize: 11, margin: '0 0 4px 0' }}>{node.name}</p>
              <p style={{ color: colors.primary, fontSize: 10, margin: '0 0 2px 0' }}>💰 ${node.investment?.toLocaleString() || 0}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, margin: '0 0 2px 0' }}>📊 {node.rank || 'Principiante'}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0 }}>
                {node.status === 'activo' ? '🟢 Activo' : '⚫ Inactivo'}
              </p>
              {/* Arrow */}
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${colors.primary}40` }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* CONNECTOR + CHILDREN */}
      {hasChildren && depth < maxDepth && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Vertical stem */}
          <motion.div
            initial={animate ? { scaleY: 0 } : false}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.3, delay: depth * 0.08 + 0.2, transformOrigin: 'top' }}
            style={{ width: 2, height: 28, background: `linear-gradient(180deg, ${colors.line}, rgba(255,255,255,0.08))` }}
          />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
            {/* LEFT BRANCH */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Horizontal bar to left */}
              <motion.div
                initial={animate ? { scaleX: 0 } : false}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, delay: depth * 0.08 + 0.25, transformOrigin: 'right' }}
                style={{ width: 60 + (3 - Math.min(depth, 3)) * 40, height: 2, background: SIDE_COLORS.left.line, alignSelf: 'flex-start', marginTop: 0 }}
              />
              <div style={{ width: 2, height: 20, background: SIDE_COLORS.left.line }} />
              {leftChild ? (
                <BinaryTreeNode
                  node={leftChild} side="left" depth={depth + 1} maxDepth={maxDepth}
                  allNodes={allNodes} onSelect={onSelect} selectedId={selectedId} animate={animate}
                />
              ) : (
                <EmptySlot side="left" depth={depth + 1} animate={animate} />
              )}
            </div>

            {/* RIGHT BRANCH */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.div
                initial={animate ? { scaleX: 0 } : false}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, delay: depth * 0.08 + 0.25, transformOrigin: 'left' }}
                style={{ width: 60 + (3 - Math.min(depth, 3)) * 40, height: 2, background: SIDE_COLORS.right.line, alignSelf: 'flex-start', marginTop: 0 }}
              />
              <div style={{ width: 2, height: 20, background: SIDE_COLORS.right.line }} />
              {rightChild ? (
                <BinaryTreeNode
                  node={rightChild} side="right" depth={depth + 1} maxDepth={maxDepth}
                  allNodes={allNodes} onSelect={onSelect} selectedId={selectedId} animate={animate}
                />
              ) : (
                <EmptySlot side="right" depth={depth + 1} animate={animate} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* If no children at all and we can still show more levels */}
      {!hasChildren && depth < maxDepth && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 2, height: 28, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ display: 'flex', gap: 80 }}>
            <EmptySlot side="left" depth={depth + 1} animate={animate} />
            <EmptySlot side="right" depth={depth + 1} animate={animate} />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptySlot({ side, depth, animate }) {
  const colors = SIDE_COLORS[side];
  return (
    <motion.div
      initial={animate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: depth * 0.1 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: `1.5px dashed ${colors.primary}35`,
        background: 'rgba(255,255,255,0.02)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: `${colors.primary}50`, fontSize: 14 }}>+</span>
      </div>
      <p style={{ color: `${colors.primary}40`, fontSize: 7, fontWeight: 700, marginTop: 4, letterSpacing: '0.5px' }}>DISPONIBLE</p>
    </motion.div>
  );
}