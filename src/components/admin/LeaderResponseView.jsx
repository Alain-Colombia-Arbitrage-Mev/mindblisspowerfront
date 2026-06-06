import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, AlertCircle, Users, Clock, TrendingUp } from 'lucide-react';

export default function LeaderResponseView() {
  const [selectedLeader, setSelectedLeader] = useState(null);

  const leaders = [
    {
      id: 1,
      name: 'Sarah Johnson',
      rank: 'Platinum',
      teamSize: 284,
      openIncidents: 3,
      pendingPayments: 2,
      lastActivity: '2 hours ago',
      phone: '+971-50-123-4567',
      email: 'sarah@vicion.com',
      priority: 'high',
      statusColor: '#fbbf24'
    },
    {
      id: 2,
      name: 'Mike Lead',
      rank: 'Gold',
      teamSize: 156,
      openIncidents: 1,
      pendingPayments: 0,
      lastActivity: '4 hours ago',
      phone: '+971-50-234-5678',
      email: 'mike@vicion.com',
      priority: 'medium',
      statusColor: '#3b82f6'
    },
    {
      id: 3,
      name: 'Lisa Network',
      rank: 'Silver',
      teamSize: 89,
      openIncidents: 0,
      pendingPayments: 0,
      lastActivity: '1 hour ago',
      phone: '+971-50-345-6789',
      email: 'lisa@vicion.com',
      priority: 'low',
      statusColor: '#10b981'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
        <Phone size={20} className="text-blue-400" />
        Leader Contact & Response
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Leader Cards */}
        <div className="space-y-3 lg:col-span-2">
          {leaders.map((leader, idx) => (
            <motion.button
              key={leader.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedLeader(leader)}
              className="w-full p-4 rounded-xl text-left transition-all hover:scale-102 active:scale-95"
              style={{
                background: selectedLeader?.id === leader.id
                  ? `linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(29,110,245,0.08) 100%)`
                  : 'rgba(255,255,255,0.04)',
                border: selectedLeader?.id === leader.id
                  ? '1px solid rgba(59,130,246,0.4)'
                  : '1px solid rgba(59,130,246,0.15)',
                boxShadow: selectedLeader?.id === leader.id ? `0 0 20px ${leader.statusColor}20` : 'none'
              }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white text-sm">{leader.name}</p>
                  <p className="text-xs text-gray-400">{leader.rank}</p>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ background: leader.statusColor }}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="text-center p-2 rounded bg-white/5">
                  <p className="text-gray-400 text-xs">Team</p>
                  <p className="font-bold text-white">{leader.teamSize}</p>
                </div>
                <div className="text-center p-2 rounded" style={{ background: leader.openIncidents > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)' }}>
                  <p className="text-gray-400 text-xs">Issues</p>
                  <p className="font-bold" style={{ color: leader.openIncidents > 0 ? '#ef4444' : '#10b981' }}>
                    {leader.openIncidents}
                  </p>
                </div>
                <div className="text-center p-2 rounded" style={{ background: leader.pendingPayments > 0 ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.05)' }}>
                  <p className="text-gray-400 text-xs">Payments</p>
                  <p className="font-bold" style={{ color: leader.pendingPayments > 0 ? '#fbbf24' : '#10b981' }}>
                    {leader.pendingPayments}
                  </p>
                </div>
                <div className="text-center p-2 rounded bg-white/5">
                  <p className="text-gray-400 text-xs">Active</p>
                  <p className="font-bold text-white text-xs">Now</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-1 text-xs text-gray-500">
                <Clock size={12} />
                {leader.lastActivity}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Contact Detail Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 rounded-xl"
          style={{
            background: selectedLeader
              ? `linear-gradient(135deg, ${selectedLeader.statusColor}15 0%, ${selectedLeader.statusColor}08 100%)`
              : 'rgba(255,255,255,0.04)',
            border: selectedLeader ? `1px solid ${selectedLeader.statusColor}40` : '1px solid rgba(255,255,255,0.1)'
          }}>
          {selectedLeader ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-2">Direct Contact</p>
                <p className="font-bold text-white text-sm mb-3">{selectedLeader.name}</p>

                <div className="space-y-2">
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    href={`tel:${selectedLeader.phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all text-sm">
                    <Phone size={16} className="text-blue-400" />
                    <span className="text-white font-semibold">{selectedLeader.phone}</span>
                  </motion.a>

                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    href={`mailto:${selectedLeader.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all text-sm">
                    <Mail size={16} className="text-purple-400" />
                    <span className="text-white font-semibold text-xs truncate">{selectedLeader.email}</span>
                  </motion.a>
                </div>
              </div>

              {/* Priority Badge */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2">Contact Priority</p>
                <span className="px-3 py-1 rounded-full text-xs font-bold capitalize" style={{
                  background: selectedLeader.statusColor + '30',
                  color: selectedLeader.statusColor
                }}>
                  {selectedLeader.priority} Priority
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2 rounded-lg font-semibold text-sm transition-all"
                  style={{ background: selectedLeader.statusColor + '30', color: selectedLeader.statusColor }}>
                  Send Message
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2 rounded-lg font-semibold text-sm bg-white/5 border border-white/10 text-white hover:border-white/20 transition-all">
                  View Full Profile
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <p className="text-sm text-gray-400">Select a leader to view contact details</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}