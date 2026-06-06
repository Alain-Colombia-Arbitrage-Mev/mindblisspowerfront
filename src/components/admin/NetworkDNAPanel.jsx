import { motion } from 'framer-motion';
import { User, Award, DollarSign, Users, Zap, AlertCircle, CheckCircle } from 'lucide-react';

export default function NetworkDNAPanel({ person = {} }) {
  const {
    fullName = 'John Participant',
    role = 'Participant',
    rank = 'Silver',
    investment = 1000,
    binarySide = 'left',
    upline = 'Sarah Johnson',
    referrer = 'Mike Lead',
    teamSize = 45,
    directReferrals = 3,
    paymentStatus = 'current',
    riskStatus = 'low',
    supportStatus = 'none'
  } = person;

  const statusColors = {
    current: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#10b981', label: 'Current' },
    pending: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24', label: 'Pending' },
    overdue: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444', label: 'Overdue' }
  };

  const status = statusColors[paymentStatus] || statusColors.current;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 rounded-2xl space-y-4"
      style={{
        background: 'linear-gradient(135deg, rgba(13,31,60,0.4) 0%, rgba(8,18,40,0.3) 100%)',
        border: '1px solid rgba(59,130,246,0.2)'
      }}>
      <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
        <Zap size={20} className="text-blue-400" />
        Network DNA
      </h3>

      {/* Top Row: Identity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Full Name</p>
          <p className="font-bold text-white text-sm">{fullName}</p>
        </div>
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Role</p>
          <p className="font-bold text-blue-400 text-sm">{role}</p>
        </div>
      </div>

      {/* Rank */}
      <div className="p-4 rounded-lg" style={{ background: 'rgba(168,139,250,0.1)', border: '1px solid rgba(168,139,250,0.3)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">Current Rank</p>
            <p className="font-black text-lg" style={{ color: '#a78bfa' }}>{rank}</p>
          </div>
          <Award size={24} style={{ color: '#a78bfa' }} />
        </div>
      </div>

      {/* Investment & Binary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Investment</p>
          <p className="font-black text-green-400 text-lg">${investment.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Binary Side</p>
          <p className="font-bold text-white text-sm capitalize">{binarySide === 'left' ? '← LEFT' : 'RIGHT →'}</p>
        </div>
      </div>

      {/* Upline & Referrer */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Upline</p>
          <p className="font-semibold text-white text-sm">{upline}</p>
        </div>
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Referrer</p>
          <p className="font-semibold text-white text-sm">{referrer}</p>
        </div>
      </div>

      {/* Network Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Team Size</p>
          <p className="font-black text-purple-400 text-lg">{teamSize}</p>
        </div>
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Direct Referrals</p>
          <p className="font-black text-blue-400 text-lg">{directReferrals}</p>
        </div>
      </div>

      {/* Payment Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-lg"
        style={{ background: status.bg, border: `1px solid ${status.border}` }}>
        <div className="flex items-center gap-2 mb-2">
          {paymentStatus === 'current' ? <CheckCircle size={16} style={{ color: status.text }} /> : <AlertCircle size={16} style={{ color: status.text }} />}
          <p className="text-xs font-bold" style={{ color: status.text }}>Payment Status: {status.label}</p>
        </div>
        <p className="text-xs text-gray-400">Last updated: 2 days ago</p>
      </motion.div>

      {/* Risk Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Risk Status</p>
          <p className="font-semibold text-green-400 text-xs capitalize">{riskStatus}</p>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Support Needed</p>
          <p className="font-semibold text-gray-300 text-xs">{supportStatus === 'none' ? 'No' : supportStatus}</p>
        </div>
      </div>
    </motion.div>
  );
}