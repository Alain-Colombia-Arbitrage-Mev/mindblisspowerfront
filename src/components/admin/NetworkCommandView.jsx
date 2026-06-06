import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Users, TrendingUp, Award } from 'lucide-react';

export default function NetworkCommandView({ selectedPerson }) {
  const [expanded, setExpanded] = useState({});

  // Mock network data
  const mockNetwork = {
    left: { count: 24, active: 18, volume: 125000 },
    right: { count: 31, active: 25, volume: 167500 },
    upline: { name: 'Sarah Johnson', rank: 'Platinum', volume: 500000 },
    directReferrals: 3
  };

  const toggleNode = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6 rounded-2xl" style={{
      background: 'linear-gradient(135deg, rgba(29,110,245,0.08) 0%, rgba(59,130,246,0.04) 100%)',
      border: '1px solid rgba(59,130,246,0.2)'
    }}>
      <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
        <Users size={20} className="text-blue-400" />
        Network Command View
      </h3>

      {/* Network Tree */}
      <div className="space-y-4">
        {/* Upline */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="p-4 rounded-xl" style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(59,130,246,0.15)'
          }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Award size={16} className="text-amber-400" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Upline</p>
                <p className="text-xs text-gray-400">{mockNetwork.upline.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-amber-400">{mockNetwork.upline.rank}</p>
            </div>
          </div>
        </motion.div>

        {/* Binary Branches */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Side */}
          <motion.button
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            onClick={() => toggleNode('left')}
            className="p-4 rounded-xl text-left transition-all hover:scale-105 active:scale-95"
            style={{
              background: expanded.left
                ? 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.08) 100%)'
                : 'rgba(255,255,255,0.04)',
              border: expanded.left ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(59,130,246,0.15)'
            }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">LEFT SIDE</span>
              {expanded.left ? <ChevronUp size={16} className="text-green-400" /> : <ChevronDown size={16} className="text-green-400" />}
            </div>
            <p className="text-2xl font-black text-green-400 mb-1">{mockNetwork.left.count}</p>
            <p className="text-xs text-gray-400">Active: {mockNetwork.left.active}</p>
            <p className="text-xs text-green-400/70 mt-2">Vol: ${mockNetwork.left.volume.toLocaleString()}</p>
          </motion.button>

          {/* Right Side */}
          <motion.button
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            onClick={() => toggleNode('right')}
            className="p-4 rounded-xl text-left transition-all hover:scale-105 active:scale-95"
            style={{
              background: expanded.right
                ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(29,110,245,0.08) 100%)'
                : 'rgba(255,255,255,0.04)',
              border: expanded.right ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(59,130,246,0.15)'
            }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white text-sm">RIGHT SIDE</span>
              {expanded.right ? <ChevronUp size={16} className="text-blue-400" /> : <ChevronDown size={16} className="text-blue-400" />}
            </div>
            <p className="text-2xl font-black text-blue-400 mb-1">{mockNetwork.right.count}</p>
            <p className="text-xs text-gray-400">Active: {mockNetwork.right.active}</p>
            <p className="text-xs text-blue-400/70 mt-2">Vol: ${mockNetwork.right.volume.toLocaleString()}</p>
          </motion.button>
        </div>

        {/* Direct Referrals */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-4 rounded-xl" style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(59,130,246,0.15)'
          }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp size={16} className="text-purple-400" />
              <span className="text-sm font-semibold text-white">Direct Referrals</span>
            </div>
            <p className="text-lg font-black text-purple-400">{mockNetwork.directReferrals}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}