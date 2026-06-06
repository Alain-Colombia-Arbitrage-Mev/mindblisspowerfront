import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, CheckCircle, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import AutoModeEngine from '@/lib/AutoModeEngine';

export default function AutoModePanel() {
  const [stats, setStats] = useState(null);
  const [actionLog, setActionLog] = useState([]);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const refreshStats = () => {
    const newStats = AutoModeEngine.getStats();
    const newLog = AutoModeEngine.getActionLog();
    setStats(newStats);
    setActionLog(newLog.slice(0, 8));
  };

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Ejecutadas', value: stats.total_executed, icon: CheckCircle, color: '#10b981' },
          { label: 'Hoy', value: stats.executed_today, icon: TrendingUp, color: '#3b82f6' },
          { label: 'En Aprobación', value: stats.pending_approval, icon: Clock, color: '#fb923c' },
          { label: 'Escaladas', value: stats.escalated, icon: AlertCircle, color: '#ef4444' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-3 rounded-lg" style={{ background: `${stat.color}0d`, border: `1px solid ${stat.color}22` }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color: stat.color }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0 }}>{stat.label}</p>
              </div>
              <p style={{ color: stat.color, fontSize: 20, fontWeight: 900, margin: 0 }}>{stat.value}</p>
            </div>
          );
        })}
      </motion.div>

      {/* Activity Log */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden"
        style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="p-3 border-b border-white/8" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: 0 }}>
            ÚLTIMAS ACCIONES AUTOMÁTICAS
          </p>
        </div>
        <div className="space-y-0 divide-y divide-white/5 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {actionLog.length === 0 ? (
              <div className="p-4 text-center">
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>Sin acciones aún</p>
              </div>
            ) : (
              actionLog.map((action, i) => {
                const isExecuted = action.status === 'executed';
                const color = isExecuted ? '#10b981' : action.risk_level === 'high' ? '#ef4444' : '#fb923c';
                const timeAgo = Math.floor((Date.now() - new Date(action.timestamp).getTime()) / 60000);

                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 hover:bg-white/5 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                          <p style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: 0 }}>
                            {action.title.substring(0, 40)}...
                          </p>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: '0 0 2px 0' }}>
                          {action.user_name}
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, margin: 0 }}>
                          Hace {timeAgo}m
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs font-bold flex-shrink-0" style={{
                        background: isExecuted ? 'rgba(16,185,129,0.15)' : 'rgba(251,146,60,0.15)',
                        color: isExecuted ? '#10b981' : '#fb923c',
                      }}>
                        {isExecuted ? '✓' : '⏳'}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}