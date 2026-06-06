import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

/**
 * Auto Mode Status Display
 * Real-time metrics and activity tracking
 */

export default function AutoModeStatusDisplay({ enabled, stats }) {
  const {
    executedToday = 0,
    pendingApprovals = 0,
    escalations = 0,
    successRate = 0,
  } = stats || {};

  const statusCards = [
    {
      icon: CheckCircle,
      label: 'Executed Today',
      value: executedToday,
      color: '#10b981',
      desc: 'Autonomous actions completed',
    },
    {
      icon: Clock,
      label: 'Pending Approvals',
      value: pendingApprovals,
      color: '#fb923c',
      desc: 'Medium-risk awaiting review',
    },
    {
      icon: AlertTriangle,
      label: 'Escalations',
      value: escalations,
      color: '#ef4444',
      desc: 'High-risk requiring intervention',
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: `${successRate}%`,
      color: '#3b82f6',
      desc: 'Actions completed without error',
    },
  ];

  if (!enabled) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 rounded-xl text-center"
        style={{
          background: 'rgba(6,182,212,0.08)',
          border: '1px solid rgba(6,182,212,0.2)',
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
          Auto Mode is disabled — enable it to see real-time automation metrics
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, margin: '0 0 12px 0' }}>
        REAL-TIME STATUS
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-lg"
              style={{
                background: `${card.color}08`,
                border: `1px solid ${card.color}20`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${card.color}18` }}
                >
                  <Icon size={16} style={{ color: card.color }} />
                </div>
                <span style={{ color: card.color, fontSize: 18, fontWeight: 900 }}>{card.value}</span>
              </div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: '0 0 2px 0' }}>{card.label}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0 }}>{card.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}