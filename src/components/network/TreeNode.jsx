/**
 * TREE NODE — FASES B + D + E
 * Stable recursive renderer. Each node independently checks isSelected.
 * Symmetric connectors. Progressive depth. Subtle premium motion only.
 */
import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RANK_COLORS = {
  'Embajador':      '#fbbf24',
  'Diamante Negro': '#c084fc',
  'Diamante Azul':  '#60a5fa',
  'Diamante':       '#a78bfa',
  'Platino':        '#e2e8f0',
  'Oro':            '#f59e0b',
  'Plata':          '#94a3b8',
  'Bronce':         '#d97706',
  'Principiante':   '#6b7280',
};

const SIDE_STYLE = {
  left:  { node: '#2563eb', glow: 'rgba(37,99,235,0.3)',  line: 'rgba(59,130,246,0.4)',  bg: 'rgba(37,99,235,0.08)' },
  right: { node: '#7c3aed', glow: 'rgba(124,58,237,0.3)', line: 'rgba(139,92,246,0.4)',  bg: 'rgba(124,58,237,0.08)' },
  root:  { node: '#d97706', glow: 'rgba(217,119,6,0.4)',  line: 'rgba(251,191,36,0.35)', bg: 'rgba(217,119,6,0.08)' },
};

function getRankColor(rank) { return RANK_COLORS[rank] || '#6b7280'; }
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}
function getActivityDot(level, status) {
  if (status === 'inactivo') return '#374151';
  if (level === 'high')   return '#10b981';
  if (level === 'medium') return '#f59e0b';
  return '#6b7280';
}

// ── PHASE 1-3: LAYOUT STRUCTURE & SPACING ─────────────────────────
// Horizontal spread — perfectly balanced left/right (Phase 11)
function hSpread(depth) {
  if (depth === 0) return 0;      // Root — no horizontal spread
  if (depth === 1) return 200;    // Direct children — wide spread
  if (depth === 2) return 140;    // Consistent spacing
  if (depth === 3) return 100;    // Gradual reduction
  if (depth === 4) return 70;
  return 50;
}

// ── PHASE 7: NODE SIZE HIERARCHY ───────────────────────────────────
function nodeSize(depth) {
  if (depth === 0) return 72;    // Root — slightly more dominant (Phase 6)
  if (depth === 1) return 58;
  if (depth === 2) return 50;
  if (depth === 3) return 42;
  if (depth === 4) return 36;
  return 32;
}

// ── PHASE 2: VERTICAL SPACING ─────────────────────────────────────
function vSpacing(depth) {
  if (depth === 0) return 0;
  if (depth === 1) return 90;
  if (depth === 2) return 80;
  if (depth === 3) return 70;
  return 60;
}

function labelFontSize(depth) {
  return depth === 0 ? 10 : depth <= 2 ? 8 : 7;
}

// Delay cap so deep nodes don't have absurd wait
function entryDelay(depth) {
  return Math.min(depth * 0.04, 0.28);
}

const TreeNode = memo(function TreeNode({
  member,
  side = 'root',
  depth = 0,
  selectedId,
  onSelect,
  dataset,
  maxVisibleDepth,  // Progressive: max depth to render
  expandedNodes,     // Track which nodes are expanded
  onToggleExpand,    // Callback to toggle expansion
  collapsedNodes,
  onToggleCollapse,
}) {
  const [hovered, setHovered] = useState(false);
  if (!member) return null;

  const isRoot      = depth === 0;
  const isSelected  = selectedId === member.user_id;
  const colors      = SIDE_STYLE[isRoot ? 'root' : side];
  const rankColor   = getRankColor(member.rank);
  const isHighValue = member.investment_amount >= 10000;
  const isInactive  = member.status === 'inactivo';
  const isCollapsed = collapsedNodes?.has(member.user_id) ?? false;
  
  // PHASE 1, 5, 10: Only render connections for levels 0-2, auto-collapse deeper
  const shouldRenderConnections = depth <= 2;
  const isExpanded = depth > 2 ? false : (expandedNodes?.has(member.user_id) ?? (depth < maxVisibleDepth));

  const children   = dataset.getChildren(member.user_id);
  const leftChild  = children.find(c => c._local_side === 'left'  || (depth === 0 && c.binary_side === 'left'));
  const rightChild = children.find(c => c._local_side === 'right' || (depth === 0 && c.binary_side === 'right'));
  const hasChildren = !!(leftChild || rightChild);
  
  // PHASE 2, 9: Cluster deeper nodes
  const deepChildrenCount = depth > 2 && children.length > 0 ? children.length : 0;
  const hasHiddenChildren = hasChildren && !isExpanded && depth <= 2;

  const ns   = nodeSize(depth);
  const hs   = hSpread(depth);
  const lfs  = labelFontSize(depth);
  const dly  = entryDelay(depth);

  // Which side to pass to children
  const childSide = isRoot ? undefined : side;  // children inherit root side

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* ── NODE ─────────────────────────────────────────────────── */}
      <div
        style={{ position: 'relative', zIndex: 2, cursor: 'pointer' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(member)}
      >
        {/* Circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.55 }}
          animate={{
            opacity: 1,
            scale: 1,
            boxShadow: isSelected
              ? `0 0 0 3px ${colors.node}, 0 0 18px ${colors.glow}`
              : hovered
                ? `0 0 0 2px ${colors.node}70, 0 0 10px ${colors.glow}`
                : isHighValue
                  ? `0 0 0 1px ${rankColor}50`
                  : '0 0 0 0px transparent',
          }}
          transition={{
            opacity:    { duration: 0.15, delay: dly },
            scale:      { duration: 0.2,  delay: dly, ease: [0.34, 1.2, 0.64, 1] },
            boxShadow:  { duration: 0.12 },
          }}
          style={{
            width:          ns,
            height:         ns,
            borderRadius:   '50%',
            background:     isSelected ? colors.bg : isInactive ? 'rgba(8,18,40,0.65)' : 'rgba(10,22,48,0.9)',
            border:         `${isRoot ? 2.5 : 1.5}px solid ${isSelected || hovered ? colors.node : isHighValue ? rankColor + '70' : 'rgba(255,255,255,0.09)'}`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            position:       'relative',
            opacity:        isInactive ? 0.6 : 1,
            transition:     'border-color 0.18s, background 0.18s',
          }}
        >
          {/* Initials */}
          <span style={{
            color:       isSelected || hovered ? colors.node : isInactive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.82)',
            fontSize:    isRoot ? 18 : depth <= 2 ? 13 : 11,
            fontWeight:  900,
            fontFamily:  'Montserrat, sans-serif',
            userSelect:  'none',
            letterSpacing: '-0.5px',
            transition:  'color 0.15s',
          }}>
            {getInitials(member.full_name)}
          </span>

          {/* Activity dot */}
          <div style={{
            position:     'absolute',
            bottom:       1,
            right:        1,
            width:        isRoot ? 11 : 8,
            height:       isRoot ? 11 : 8,
            borderRadius: '50%',
            border:       '1.5px solid #050d1f',
            background:   getActivityDot(member.activity_level, member.status),
          }} />

          {/* High-value crown */}
          {isHighValue && !isInactive && (
            <div style={{ position: 'absolute', top: -7, left: '50%', transform: 'translateX(-50%)', fontSize: 9, lineHeight: 1 }}>
              👑
            </div>
          )}
        </motion.div>

        {/* Label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, delay: dly + 0.05 }}
          style={{ textAlign: 'center', marginTop: 4, width: Math.max(ns + 18, 68) }}
        >
          <p style={{ color: isInactive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)', fontSize: lfs, fontWeight: 700, margin: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.full_name.split(' ')[0]}
          </p>
          <p style={{ color: isInactive ? 'rgba(255,255,255,0.2)' : colors.node, fontSize: lfs - 1, fontWeight: 800, margin: '1px 0 0 0' }}>
            ${member.investment_amount.toLocaleString()}
          </p>
          {depth <= 3 && (
            <div style={{ display: 'inline-block', marginTop: 2, padding: '1px 4px', borderRadius: 3, background: `${rankColor}12`, border: `1px solid ${rankColor}28` }}>
              <span style={{ color: rankColor, fontSize: 5, fontWeight: 800, letterSpacing: '0.2px' }}>{member.rank}</span>
            </div>
          )}
        </motion.div>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.92 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{    opacity: 0, y: 4,  scale: 0.92 }}
              transition={{ duration: 0.13 }}
              style={{
                position:        'absolute',
                bottom:          '108%',
                left:            '50%',
                transform:       'translateX(-50%)',
                background:      'rgba(3,8,20,0.97)',
                border:          `1px solid ${colors.node}30`,
                borderRadius:    10,
                padding:         '10px 14px',
                minWidth:        172,
                zIndex:          300,
                boxShadow:       `0 8px 28px rgba(0,0,0,0.6)`,
                pointerEvents:   'none',
                backdropFilter:  'blur(8px)',
              }}
            >
              <p style={{ color: 'white', fontWeight: 800, fontSize: 11, margin: '0 0 5px 0', lineHeight: 1.3 }}>{member.full_name}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px' }}>
                {[
                  ['💰', `$${member.investment_amount.toLocaleString()}`],
                  ['📊', member.rank],
                  ['🌍', member.country_name || member.country],
                  ['📋', member.membership_plan],
                  ['⚡', member.activity_level === 'high' ? 'Alta' : member.activity_level === 'medium' ? 'Media' : 'Baja'],
                  ['🔵', member.status === 'activo' ? 'Activo' : 'Inactivo'],
                ].map(([icon, val], i) => (
                  <p key={i} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, margin: 0 }}>{icon} {val}</p>
                ))}
              </div>
              <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: `5px solid ${colors.node}30` }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand/Collapse toggle (Phase 12: loading indicator) */}
         {hasChildren && depth > 0 && (
           <button
             onClick={e => { e.stopPropagation(); onToggleExpand(member.user_id); }}
             style={{
               position: 'absolute', top: '50%', right: -16, transform: 'translateY(-50%)',
               width: 13, height: 13, borderRadius: '50%',
               border: `1px solid ${colors.node}45`,
               background: 'rgba(3,8,20,0.95)',
               color: colors.node, fontSize: 8, fontWeight: 900,
               cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
               zIndex: 10, padding: 0,
               animation: !isExpanded && member.user_id === expandedNodes ? 'spin 0.6s linear' : 'none',
             }}
           >
             {isExpanded ? '−' : '+'}
           </button>
         )}
         {/* Hidden children indicator */}
         {hasHiddenChildren && (
           <div style={{
             position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
             fontSize: 7, color: colors.node, opacity: 0.6, fontWeight: 700,
             pointerEvents: 'none', textAlign: 'center',
           }}>
             expandir
           </div>
         )}
      </div>

      {/* ── CONNECTORS + CHILDREN ────────────────────────────────── */}
        {/* PHASE 1, 7: Only render visible connections for levels 0-2 */}
        <AnimatePresence>
         {shouldRenderConnections && hasChildren && isExpanded && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}
         >
           {/* Vertical stem (Phase 7: only visible) */}
           <motion.div
             initial={{ scaleY: 0 }}
             animate={{ scaleY: 1 }}
             transition={{ duration: 0.12, delay: dly + 0.08, transformOrigin: 'top' }}
             style={{
               width: 1,
               height: vSpacing(depth) / 2 - 8,
               background: colors.line,
               transformOrigin: 'top',
             }}
           />

           {/* Horizontal row (Phase 3: aligned levels) */}
           <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', gap: hs * 2 }}>
            {/* ── LEFT BRANCH (Phase 4: clear separation) ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.1, delay: dly + 0.1, transformOrigin: 'right' }}
                style={{ width: hs, height: 1, background: SIDE_STYLE.left.line, transformOrigin: 'right', alignSelf: 'flex-end' }}
              />
              <div style={{ width: 1, height: 12, background: SIDE_STYLE.left.line }} />
              {leftChild ? (
                <TreeNode
                  member={leftChild}
                  side={isRoot ? 'left' : side}
                  depth={depth + 1}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  dataset={dataset}
                  maxVisibleDepth={maxVisibleDepth}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                  collapsedNodes={collapsedNodes}
                  onToggleCollapse={onToggleCollapse}
                />
              ) : (
                <EmptySlot side={isRoot ? 'left' : side} depth={depth + 1} dly={dly} />
              )}
            </div>

            {/* ── RIGHT BRANCH (Phase 4: clear separation) ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.1, delay: dly + 0.1, transformOrigin: 'left' }}
                style={{ width: hs, height: 1, background: SIDE_STYLE.right.line, transformOrigin: 'left', alignSelf: 'flex-end' }}
              />
              <div style={{ width: 1, height: 12, background: SIDE_STYLE.right.line }} />
              {rightChild ? (
                <TreeNode
                  member={rightChild}
                  side={isRoot ? 'right' : side}
                  depth={depth + 1}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  dataset={dataset}
                  maxVisibleDepth={maxVisibleDepth}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                  collapsedNodes={collapsedNodes}
                  onToggleCollapse={onToggleCollapse}
                />
              ) : (
                <EmptySlot side={isRoot ? 'right' : side} depth={depth + 1} dly={dly} />
              )}
            </div>
          </div>
          </motion.div>
          )}
          </AnimatePresence>

      {/* PHASE 2, 3, 9: Cluster for deep levels (depth > 2) */}
      {deepChildrenCount > 0 && depth > 2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15, delay: dly + 0.1 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(member.user_id);
          }}
          style={{
            marginTop: 12,
            padding: '6px 10px',
            borderRadius: 8,
            background: `${colors.node}15`,
            border: `1px solid ${colors.node}30`,
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${colors.node}25`;
            e.currentTarget.style.borderColor = `${colors.node}50`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${colors.node}15`;
            e.currentTarget.style.borderColor = `${colors.node}30`;
          }}
        >
          <p style={{ color: colors.node, fontSize: 8, fontWeight: 800, margin: 0 }}>
            Cluster: {deepChildrenCount} miembros
          </p>
          <p style={{ color: `${colors.node}60`, fontSize: 7, margin: '2px 0 0 0' }}>clic para expandir</p>
        </motion.div>
      )}
          </div>
          );
          });

function EmptySlot({ side, depth, dly }) {
  const colors = SIDE_STYLE[side] || SIDE_STYLE.left;
  const ns = nodeSize(depth);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1, delay: dly + 0.12 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div style={{
        width: ns, height: ns, borderRadius: '50%',
        border: `1.5px dashed ${colors.node}28`,
        background: 'rgba(255,255,255,0.015)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: `${colors.node}35`, fontSize: 13 }}>+</span>
      </div>
      <p style={{ color: `${colors.node}30`, fontSize: 6, fontWeight: 700, marginTop: 4, letterSpacing: '0.3px' }}>LIBRE</p>
    </motion.div>
  );
}

export default TreeNode;