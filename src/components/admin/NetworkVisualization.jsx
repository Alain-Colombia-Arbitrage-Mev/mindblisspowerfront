import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import UserManagementEngine from '@/lib/UserManagementEngine';

export default function NetworkVisualization({ leaderId, onNodeSelect }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set([leaderId]));
  const network = UserManagementEngine.getNetworkByLeader(leaderId);

  if (!network) return null;

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) newExpanded.delete(nodeId);
    else newExpanded.add(nodeId);
    setExpandedNodes(newExpanded);
  };

  const getNodeColor = (node) => {
    if (node.status === 'blocked') return '#ef4444';
    if (node.status === 'pending_verification') return '#fb923c';
    if (node.status === 'inactive') return '#6b7280';
    return '#10b981';
  };

  const renderNode = (node, level = 0, side = null) => {
    const isExpanded = expandedNodes.has(node.id);
    const children = network.members?.filter(m => m.parent_id === node.id) || [];
    const hasChildren = children.length > 0;
    const color = getNodeColor(node);

    return (
      <motion.div key={node.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ marginLeft: level * 24 }}>
        <div className="flex items-center gap-1 mb-1">
          {hasChildren && (
            <button onClick={() => toggleNode(node.id)} className="p-0.5 hover:bg-white/10 rounded transition-all">
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          )}
          {!hasChildren && <div style={{ width: 20 }} />}

          <motion.button
            onClick={() => onNodeSelect(node)}
            whileHover={{ scale: 1.03 }}
            className="px-2 py-1 rounded text-xs font-semibold transition-all text-left"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}40`,
              color: color,
              flex: 1,
              maxWidth: 200,
            }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>{node.name}</p>
            <p style={{ margin: '2px 0 0 0', fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>
              {node.rank} • {node.status.replace(/_/g, ' ')}
            </p>
          </motion.button>

          {side && (
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
              {side === 'left' ? '◄' : '►'}
            </span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {children.map(child => renderNode(child, level + 1, null))}
          </div>
        )}
      </motion.div>
    );
  };

  const leader = UserManagementEngine.getUser(leaderId);
  const leftBranch = network.members?.filter(m => m.position === 'left' && m.parent_id === leaderId) || [];
  const rightBranch = network.members?.filter(m => m.position === 'right' && m.parent_id === leaderId) || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-lg" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 800, letterSpacing: 1, margin: '0 0 16px 0', textTransform: 'uppercase' }}>
        Árbol de Red Binaria
      </p>

      {/* Leader root */}
      <motion.div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.15)', border: '2px solid rgba(139,92,246,0.4)' }}>
        <button onClick={() => onNodeSelect(leader)} className="w-full text-left">
          <p style={{ color: '#8b5cf6', fontWeight: 900, fontSize: 13, margin: '0 0 2px 0' }}>
            👑 {leader?.name || 'Líder'}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>
            {leader?.rank} • {network.totalMembers} miembros
          </p>
        </button>
      </motion.div>

      {/* Binary branches */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        {/* Left branch */}
        <div className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 700, margin: '0 0 8px 0' }}>◄ RAMA IZQUIERDA ({leftBranch.length})</p>
          <div className="space-y-1">
            {leftBranch.map(child => renderNode(child, 0, 'left'))}
          </div>
        </div>

        {/* Right branch */}
        <div className="p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p style={{ color: '#10b981', fontSize: 9, fontWeight: 700, margin: '0 0 8px 0' }}>RAMA DERECHA ► ({rightBranch.length})</p>
          <div className="space-y-1">
            {rightBranch.map(child => renderNode(child, 0, 'right'))}
          </div>
        </div>
      </div>

      {/* Balance info */}
      <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'rgba(255,255,255,0.5)' }}>Balance: {leftBranch.length} ⟷ {rightBranch.length}</span>
          <span style={{ color: leftBranch.length === rightBranch.length ? '#10b981' : '#fb923c', fontWeight: 700 }}>
            {Math.abs(leftBranch.length - rightBranch.length) === 0 ? '✓ EQUILIBRADO' : `⚠ DESBALANCE: ${Math.abs(leftBranch.length - rightBranch.length)}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}