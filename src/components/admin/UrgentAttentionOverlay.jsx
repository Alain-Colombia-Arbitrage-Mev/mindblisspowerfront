import { motion } from 'framer-motion';
import { AlertTriangle, Clock, DollarSign, CheckCircle, Eye, Zap } from 'lucide-react';

const ALERT_LEVELS = {
  critical: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.5)', icon: AlertTriangle, color: '#ef4444', label: 'Critical' },
  urgent: { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.5)', icon: Clock, color: '#f97316', label: 'Urgent' },
  warning: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.5)', icon: AlertTriangle, color: '#fbbf24', label: 'Warning' },
  info: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.5)', icon: Eye, color: '#3b82f6', label: 'Monitor' },
  success: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.5)', icon: CheckCircle, color: '#10b981', label: 'Healthy' }
};

export default function UrgentAttentionOverlay({ alerts = [] }) {
  const defaultAlerts = [
    { id: 1, level: 'urgent', title: 'Payment Due in 3 Days', description: 'John Participant - Invoice #2024-001', icon: DollarSign },
    { id: 2, level: 'critical', title: 'Overdue Payment', description: 'Mike Lead - 15 days overdue', icon: AlertTriangle },
    { id: 3, level: 'warning', title: 'Pending Verification', description: 'Sarah Johnson - KYC review needed', icon: Eye },
    { id: 4, level: 'info', title: 'AI Insight', description: 'Binary imbalance detected in Team A', icon: Zap }
  ];

  const displayAlerts = alerts.length > 0 ? alerts : defaultAlerts;

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
        <AlertTriangle size={20} className="text-orange-400" />
        Urgent Attention Required
      </h3>

      <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
        {displayAlerts.map((alert, idx) => {
          const alertInfo = ALERT_LEVELS[alert.level];
          const AlertIcon = alert.icon || alertInfo.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 rounded-xl transition-all hover:scale-102 cursor-pointer group"
              style={{
                background: alertInfo.bg,
                border: `2px solid ${alertInfo.border}`,
                boxShadow: `0 0 12px ${alertInfo.color}25`
              }}>
              <div className="flex items-start gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ color: alertInfo.color }}>
                  <AlertIcon size={18} />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-sm text-white">{alert.title}</p>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap" style={{
                      background: alertInfo.color + '20',
                      color: alertInfo.color
                    }}>
                      {alertInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{alert.description}</p>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs font-semibold px-2 py-1 rounded whitespace-nowrap"
                  style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                  View
                </motion.div>
              </div>

              {/* Progress bar for time-based alerts */}
              {alert.level === 'urgent' && (
                <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: '80%' }}
                    animate={{ width: '20%' }}
                    transition={{ duration: alert.daysLeft * 10, ease: 'linear' }}
                    className="h-full rounded-full"
                    style={{ background: alertInfo.color }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4 p-3 rounded-lg text-xs text-gray-400"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p>📊 {displayAlerts.length} items require attention · {displayAlerts.filter(a => a.level === 'critical').length} critical</p>
      </motion.div>
    </div>
  );
}