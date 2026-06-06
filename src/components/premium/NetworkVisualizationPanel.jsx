import { useState, useMemo } from 'react';
import { ChevronRight, MessageSquare, Phone, Mail, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import NetworkGraphEngine from './NetworkGraphEngine';
import { getRankColor, getInvestmentStatusColor } from './LiveIndicator';

export default function NetworkVisualizationPanel({ members, networkNodes, binaryMetrics, userId, onContactMember, onMessageMember }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedBranch, setExpandedBranch] = useState('all');

  const graphData = useMemo(() => {
    return {
      nodes: NetworkGraphEngine.generateNodes(members, networkNodes, binaryMetrics),
      branchStrength: NetworkGraphEngine.getBranchStrengthData(binaryMetrics),
      highValue: NetworkGraphEngine.getHighValueNodes(members),
    };
  }, [members, networkNodes, binaryMetrics]);

  const selectedMemberData = useMemo(() => {
    if (!selectedNode) return null;
    return members.find(m => m.user_id === selectedNode);
  }, [selectedNode, members]);

  return (
    <div className="space-y-6">
      {/* BRANCH STRENGTH VISUALIZATION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg"
        style={{
          background: '#121821',
          border: '1px solid #1F2A37',
        }}
      >
        <h3 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 16px 0' }}>
          Branch Strength
        </h3>
        
        <div className="grid grid-cols-2 gap-6">
          {/* LEFT BRANCH */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>
                LEFT BRANCH
              </span>
              <span style={{ color: '#06b6d4', fontSize: 12, fontWeight: 700 }}>
                ${graphData.branchStrength.left.total.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(graphData.branchStrength.left.total / (graphData.branchStrength.left.total + graphData.branchStrength.right.total)) * 100}%`,
                }}
                transition={{ duration: 0.8 }}
                style={{ height: '100%', background: '#06b6d4' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              <span>{graphData.branchStrength.left.count} members</span>
              <span>${graphData.branchStrength.left.average}/avg</span>
            </div>
          </div>

          {/* RIGHT BRANCH */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>
                RIGHT BRANCH
              </span>
              <span style={{ color: '#ec4899', fontSize: 12, fontWeight: 700 }}>
                ${graphData.branchStrength.right.total.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(graphData.branchStrength.right.total / (graphData.branchStrength.left.total + graphData.branchStrength.right.total)) * 100}%`,
                }}
                transition={{ duration: 0.8 }}
                style={{ height: '100%', background: '#ec4899' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              <span>{graphData.branchStrength.right.count} members</span>
              <span>${graphData.branchStrength.right.average}/avg</span>
            </div>
          </div>
        </div>

        {/* BALANCE STATUS */}
        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center justify-between">
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>
              Balance Status
            </span>
            <span
              style={{
                color: graphData.branchStrength.isBalanced ? '#10b981' : '#fb923c',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {graphData.branchStrength.isBalanced ? '✓ Balanced' : `⚠ ${graphData.branchStrength.balance}% difference`}
            </span>
          </div>
        </div>
      </motion.div>

      {/* HIGH-VALUE NODES */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-lg"
        style={{
          background: '#121821',
          border: '1px solid #1F2A37',
        }}
      >
        <h3 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>💎</span>
          Top 10 High-Value Members
        </h3>
        
        <div className="space-y-2">
          {graphData.highValue.map((member, idx) => (
            <motion.div
              key={member.user_id}
              whileHover={{ translateX: 4 }}
              className="p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                borderLeft: `3px solid ${getRankColor(member.rank)}`,
              }}
              onClick={() => setSelectedNode(member.user_id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, minWidth: 20 }}>
                  #{idx + 1}
                </span>
                <div>
                  <p style={{ color: 'white', fontSize: 11, fontWeight: 600, margin: 0 }}>
                    {member.name}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0 }}>
                    {member.rank}
                  </p>
                </div>
              </div>
              <span style={{ color: '#10b981', fontSize: 11, fontWeight: 700 }}>
                ${member.investment.toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* MEMBER DETAIL PANEL */}
      {selectedMemberData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-lg"
          style={{
            background: '#121821',
            border: `1px solid ${getInvestmentStatusColor(selectedMemberData.investment_amount)}`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: getInvestmentStatusColor(selectedMemberData.investment_amount),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                {NetworkGraphEngine.getRankIcon(selectedMemberData.rank)}
              </div>
              <div>
                <h4 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0 }}>
                  {selectedMemberData.full_name}
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0 0' }}>
                  {selectedMemberData.rank} • {selectedMemberData.country}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6B7280',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              ✕
            </button>
          </div>

          {/* MEMBER INFO GRID */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Investment', value: `$${selectedMemberData.investment_amount.toLocaleString()}`, icon: '💰' },
              { label: 'Status', value: selectedMemberData.status, icon: '⚡' },
              { label: 'Branch', value: selectedMemberData.binary_side.toUpperCase(), icon: '🌳' },
              { label: 'Email', value: selectedMemberData.email?.split('@')[0] || '-', icon: '📧' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '0 0 4px 0', fontWeight: 600 }}>
                  {item.icon} {item.label}
                </p>
                <p style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: 0 }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-2">
            {selectedMemberData.email && (
              <button
                onClick={() => onMessageMember?.(selectedMemberData)}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: '#1F2A37',
                  color: '#93C5FD',
                  border: '1px solid #2D3E4E',
                }}
              >
                <MessageSquare size={12} />
                Message
              </button>
            )}
            {selectedMemberData.phone && (
              <button
                onClick={() => onContactMember?.(selectedMemberData)}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: '#1F2A37',
                  color: '#10b981',
                  border: '1px solid #2D3E4E',
                }}
              >
                <Phone size={12} />
                Contact
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}