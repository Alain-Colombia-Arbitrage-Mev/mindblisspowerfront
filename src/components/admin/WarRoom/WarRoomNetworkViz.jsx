import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { ChevronUp, Home, ChevronDown, ChevronRight } from 'lucide-react';
import { getRootLeader, getWarRoomLeaders, getWarRoomLeaderById } from '@/lib/warRoomDataAdapter';

/**
 * ZONE 3: CENTER STRATEGIC CANVAS
 * Binary network visualization with RANK VISIBILITY & ORCHESTRATION
 */

const statusMap = {
  activo: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  inactivo: { color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.04)' },
};

const rankColorMap = {
  'E. Corona': { color: '#ffd700', bg: 'rgba(255,215,0,0.15)', border: '2px solid #ffd700' },
  'Diamante Negro': { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)', border: '2px solid #a78bfa' },
  'Diamante Azul': { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)', border: '2px solid #60a5fa' },
  'Diamante': { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', border: '2px solid #06b6d4' },
  'Platino': { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: '2px solid #f59e0b' },
  'Oro': { color: '#eab308', bg: 'rgba(234,179,8,0.15)', border: '2px solid #eab308' },
  'default': { color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: '2px solid #94a3b8' },
};

export default function WarRoomNetworkViz({ sim, selectedNode, onNodeSelect, navigation, onNavigate }) {
  const [rankFilter, setRankFilter] = useState('all');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  
  // Get descendants recursively
  const getNodeDescendants = (nodeId) => {
    const node = getWarRoomLeaderById(nodeId);
    if (!node) return { left: [], right: [] };
    
    const allDescendants = getWarRoomLeaders().filter(l => l.id !== nodeId);
    const left = allDescendants.filter(l => l.left_count > 0).slice(0, 4);
    const right = allDescendants.filter(l => l.right_count > 0).slice(0, 4);
    
    return { left, right };
  };

  // GET ROOT NODE + CONTEXT LEADER
  const root = getRootLeader();
  const contextLeader = selectedNode ? getWarRoomLeaderById(selectedNode.id) : root;
  const currentContextId = contextLeader?.id || root?.id;
  
  // GET DESCENDANTS OF CURRENT CONTEXT (LEFT/RIGHT BRANCHES)
  const descendants = useMemo(() => {
    return getNodeDescendants(currentContextId);
  }, [currentContextId]);
  
  // VISIBLE LEADERS = context leader + their descendants
  const allLeaders = getWarRoomLeaders();
  let visibleLeaders = [contextLeader, ...descendants.left, ...descendants.right].filter(Boolean);
  
  // RANK FILTER
  const applyRankFilter = (leaders) => {
    switch(rankFilter) {
      case 'high':
        return leaders.filter(l => ['E. Corona', 'Diamante Negro', 'Diamante Azul', 'Diamante', 'Platino'].includes(l.rank));
      case 'critical':
        return leaders.filter(l => l.criticality === 'high');
      case 'growth':
        return leaders.filter(l => l.members > 0 && l.members < 50);
      default:
        return leaders;
    }
  };
  
  visibleLeaders = applyRankFilter(visibleLeaders);
  
  const totalMembers = visibleLeaders.reduce((sum, l) => sum + (l.members || 0), 0);
  const criticalCount = visibleLeaders.filter(l => l.criticality === 'high').length;

  // Guard: validate that root leader exists
  if (!root) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 rounded-xl flex items-center justify-center"
        style={{
          background: 'rgba(4,10,22,0.7)',
          border: '1px solid rgba(239,68,68,0.15)',
        }}
      >
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <p style={{ fontSize: 12, fontWeight: 700 }}>⚠ Network data unavailable</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Check data adapter initialization</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 rounded-xl flex flex-col overflow-hidden relative"
      style={{
        background: 'rgba(4,10,22,0.7)',
        border: '1px solid rgba(59,130,246,0.15)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* HEADER WITH BREADCRUMB & RANK FILTER */}
      <div className="flex-shrink-0 px-6 py-4 border-b flex flex-col gap-3" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 900, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
              Red Binaria {rankFilter !== 'all' && `(${rankFilter})`}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0 0', fontWeight: 600 }}>
              {visibleLeaders.length} líderes · {criticalCount} críticos · {totalMembers} participantes
            </p>
          </div>
          
          {/* RANK FILTER BUTTONS */}
          <div className="flex items-center gap-2">
            {['all', 'high', 'critical', 'growth'].map(filter => (
              <button
                key={filter}
                onClick={() => setRankFilter(filter)}
                className="px-2 py-1 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: rankFilter === filter ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.04)',
                  border: rankFilter === filter ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                  color: rankFilter === filter ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                }}
              >
                {filter === 'all' ? 'Todas' : filter === 'high' ? 'Altos' : filter === 'critical' ? 'Críticos' : 'Crecimiento'}
              </button>
            ))}
          </div>
        </div>
        
        {/* NAVIGATION BUTTONS */}
        <div className="flex items-center gap-2" style={{ justifyContent: 'flex-end' }}>
          {navigation?.canGoUp && (
            <button
              onClick={() => {
                if (navigation) {
                  navigation.goUp();
                  onNavigate({...navigation});
                  onNodeSelect(null);
                }
              }}
              className="p-1.5 rounded-lg transition-all hover:bg-white/10"
              title="Subir un nivel"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              <ChevronUp size={14} />
            </button>
          )}
          {!navigation?.isRoot && (
            <button
              onClick={() => {
                if (navigation) {
                  navigation.returnToRoot();
                  onNavigate({...navigation});
                  onNodeSelect(null);
                }
              }}
              className="p-1.5 rounded-lg transition-all hover:bg-white/10"
              title="Volver a raíz"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              <Home size={14} />
            </button>
          )}
        </div>
        
        {/* BREADCRUMB TRAIL */}
        {navigation && navigation.getBreadcrumb && navigation.getBreadcrumb().length > 0 && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {navigation.getBreadcrumb().map((node, idx, arr) => (
              <div key={node.id} className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const targetIdx = arr.indexOf(node);
                    while (navigation.navigationStack.length > targetIdx + 1) {
                      navigation.goUp();
                    }
                    onNavigate({...navigation});
                    onNodeSelect(null);
                  }}
                  className="hover:text-white transition-colors"
                >
                  {node.name}
                </button>
                {idx < arr.length - 1 && <span>/</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CANVAS */}
      <div className="flex-1 relative overflow-hidden">
        {/* SVG CONNECTIONS — ROOT TO DESCENDANTS */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          {contextLeader && visibleLeaders.length > 1 && visibleLeaders.slice(1).map((child, i) => {
            const isLeft = descendants.left.includes(child);
            return (
              <g key={`branch-${i}`}>
                <line
                  x1="50%"
                  y1="15%"
                  x2={isLeft ? "30%" : "70%"}
                  y2="40%"
                  stroke={isLeft ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.4)'}
                  strokeWidth="2"
                  opacity="0.5"
                  strokeDasharray="5,5"
                />
                <line
                  x1={isLeft ? "30%" : "70%"}
                  y1="40%"
                  x2={isLeft ? `${20 + Math.random() * 20}%` : `${50 + Math.random() * 30}%`}
                  y2={`${45 + Math.random() * 35}%`}
                  stroke={rankColorMap[child.rank]?.color || rankColorMap.default.color}
                  strokeWidth="1.5"
                  opacity={child.status === 'critical' ? 0.7 : 0.3}
                  strokeDasharray={child.status === 'critical' ? '0' : '3,3'}
                />
              </g>
            );
          })}
        </svg>

        {/* CONTEXT NODE (root or selected leader at top center) */}
        {contextLeader && (
          <motion.button
            onClick={() => onNodeSelect(contextLeader)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.08 }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '12%',
              transform: 'translate(-50%, -50%)',
            }}
            className="focus:outline-none"
          >
            <motion.div
              animate={contextLeader.id === root.id ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer relative"
              style={{
                background: rankColorMap[contextLeader.rank]?.bg || rankColorMap.default.bg,
                border: selectedNode?.id === contextLeader.id ? '3px solid white' : (rankColorMap[contextLeader.rank]?.border || rankColorMap.default.border),
                boxShadow: selectedNode?.id === contextLeader.id ? `0 0 30px ${rankColorMap[contextLeader.rank]?.color}` : `0 0 15px ${rankColorMap[contextLeader.rank]?.color}40`,
                color: 'white',
              }}
            >
              <span style={{ fontSize: 12 }}>{contextLeader.rank_icon}</span>
              <span style={{ fontSize: 8, marginTop: 2, color: 'rgba(255,255,255,0.8)' }}>{Math.floor((contextLeader.members || 0) / 10)}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full mt-3 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg whitespace-nowrap z-20 text-center"
              style={{ background: 'rgba(0,0,0,0.9)', border: `1px solid ${rankColorMap[contextLeader.rank]?.color || rankColorMap.default.color}60` }}
            >
              <p style={{ color: rankColorMap[contextLeader.rank]?.color || 'white', fontSize: 11, fontWeight: 700, margin: 0 }}>{contextLeader.rank}</p>
              <p style={{ color: 'white', fontSize: 10, fontWeight: 600, margin: '2px 0 0 0' }}>{contextLeader.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, margin: '1px 0 0 0' }}>{contextLeader.members} miembros</p>
            </motion.div>
          </motion.button>
        )}

        {/* DESCENDANT NODES — LEFT & RIGHT BRANCHES */}
        {visibleLeaders.slice(1).map((leader, idx) => {
          const isSelected = selectedNode?.id === leader.id;
          const isLeft = descendants.left.includes(leader);
          const xPos = isLeft ? 20 + (idx % 2) * 10 : 60 + (idx % 2) * 15;
          const yPos = 45 + Math.floor(idx / 2) * 20;

          const handleNodeClick = () => {
            // 1. Select node in DNA panel
            onNodeSelect(leader);
            
            // 2. Recenter graph if has descendants
            if (leader.descendant_count > 0) {
              if (navigation && typeof navigation.drillDown === 'function') {
                navigation.drillDown({ id: leader.id, name: leader.name }, currentContextId);
                onNavigate({...navigation});
              }
            }
          };

          return (
            <motion.button
              key={leader.id}
              onClick={handleNodeClick}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.08 }}
              style={{
                position: 'absolute',
                left: `${xPos}%`,
                top: `${yPos}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="focus:outline-none"
            >
              {/* NODE */}
              <motion.div
                animate={leader.status === 'critical' ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer relative"
                  style={{
                    background: rankColorMap[leader.rank]?.bg || rankColorMap.default.bg,
                    border: isSelected ? `2px solid white` : (rankColorMap[leader.rank]?.border || rankColorMap.default.border),
                    boxShadow: isSelected ? `0 0 15px ${rankColorMap[leader.rank]?.color}` : `0 0 8px ${rankColorMap[leader.rank]?.color}30`,
                    color: 'white',
                    opacity: 0.9,
                  }}
                >
                  <span style={{ fontSize: 10 }}>{leader.rank_icon}</span>
                  <span style={{ fontSize: 8, opacity: 0.7 }}>{Math.floor(leader.members / 10)}</span>
                </div>
              </motion.div>

              {/* EXPAND/DRILL INDICATOR */}
              {leader.descendant_count > 0 && (
                <div
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs cursor-pointer transition-all hover:scale-110"
                  style={{ background: rankColorMap[leader.rank]?.color || '#94a3b8' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (navigation && typeof navigation.drillDown === 'function') {
                      navigation.drillDown({ id: leader.id, name: leader.name }, currentContextId);
                      onNavigate({...navigation});
                    }
                  }}
                  title="Expandir red"
                >
                  <ChevronRight size={12} color="white" strokeWidth={3} />
                </div>
              )}

              {/* LABEL ON HOVER */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1.5 rounded text-center z-20"
                  style={{
                    background: 'rgba(0,0,0,0.95)',
                    border: `1px solid ${rankColorMap[leader.rank]?.color || rankColorMap.default.color}50`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <p style={{ color: 'white', fontSize: 9, fontWeight: 700, margin: 0 }}>{leader.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8, margin: '1px 0 0 0' }}>{leader.members} miembros</p>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* RANK LEGEND */}
      <div className="flex-shrink-0 px-6 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-4 text-xs overflow-x-auto">
          {Object.entries(rankColorMap).map(([rank, style]) => rank !== 'default' && (
            <div key={rank} className="flex items-center gap-2 whitespace-nowrap">
              <div className="w-3 h-3 rounded" style={{ background: style.color }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{rank}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}