import { motion } from 'framer-motion';
import { Award, TrendingUp, Users, Zap } from 'lucide-react';

const RANK_DATA = {
  'Platinum': { icon: Award, color: '#a78bfa', bg: 'rgba(168,139,250,0.1)', border: 'rgba(168,139,250,0.3)' },
  'Gold': { icon: TrendingUp, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' },
  'Silver': { icon: Users, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)' },
  'Bronze': { icon: Zap, color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
  'Starter': { icon: Users, color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)' }
};

export default function RankAndIconLayer({ rank = 'Silver', networkSize = 45, qualified = true, growth = 'strong' }) {
  const rankInfo = RANK_DATA[rank] || RANK_DATA['Starter'];
  const Icon = rankInfo.icon;

  const growthColor = growth === 'strong' ? '#10b981' : growth === 'moderate' ? '#f59e0b' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 rounded-2xl"
      style={{
        background: rankInfo.bg,
        border: `2px solid ${rankInfo.border}`
      }}>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <motion.div
            animate={{ boxShadow: `0 0 20px ${rankInfo.color}` }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-xl flex items-center justify-center"
            style={{ background: rankInfo.bg, border: `2px solid ${rankInfo.color}` }}>
            <Icon size={28} style={{ color: rankInfo.color }} />
          </motion.div>
        </div>

        <div>
          <h3 className="text-2xl font-black" style={{ color: rankInfo.color }}>
            {rank}
          </h3>
          <p className="text-xs text-gray-400">Current Achievement Level</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Network Size */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Network</p>
          <p className="text-lg font-black text-white">{networkSize}</p>
          <p className="text-xs text-gray-500 mt-1">members</p>
        </motion.div>

        {/* Qualified */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Status</p>
          <p className="text-sm font-bold" style={{ color: qualified ? '#10b981' : '#ef4444' }}>
            {qualified ? 'Qualified' : 'Review'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{qualified ? '✓' : '⚠'}</p>
        </motion.div>

        {/* Growth */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Growth</p>
          <p className="text-sm font-bold" style={{ color: growthColor }}>
            {growth === 'strong' ? '↑' : growth === 'moderate' ? '→' : '↓'} {growth}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}