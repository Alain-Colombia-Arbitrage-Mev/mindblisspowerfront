import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Zap, Clock } from 'lucide-react';
import AIBrainEngine from '@/lib/AIBrainEngine';

export default function AIBrainActions() {
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    const actionLog = AIBrainEngine.getActionLog();
    setLogs(actionLog);
  }, []);

  const completedActions = logs.filter(l => l.status === 'completed').length;
  const recentActions = logs.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Action Summary */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-3">
        {[
          { label: 'Acciones Ejecutadas', value: completedActions, color: '#10b981', icon: CheckCircle },
          { label: 'Hoy', value: logs.filter(l => {
            const logDate = new Date(l.timestamp).toDateString();
            const today = new Date().toDateString();
            return logDate === today;
          }).length, color: '#3b82f6', icon: Zap },
          { label: 'Promedio/día', value: Math.ceil(completedActions / 7), color: '#fb923c', icon: Clock },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-3 rounded-lg" style={{ background: `${stat.color}0d`, border: `1px solid ${stat.color}22` }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color: stat.color }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0 }}>
                  {stat.label}
                </p>
              </div>
              <p style={{ color: stat.color, fontSize: 18, fontWeight: 900, margin: 0 }}>
                {stat.value}
              </p>
            </div>
          );
        })}
      </motion.div>

      {/* Tab Selection */}
      <div className="flex gap-2">
        {['recent', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: activeTab === tab ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab ? '#3b82f6' : 'rgba(255,255,255,0.5)',
              border: `1px solid ${activeTab === tab ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            {tab === 'recent' ? 'Acciones Recientes' : 'Historial'}
          </button>
        ))}
      </div>

      {/* Action Log */}
      <div className="space-y-2">
        <AnimatePresence>
          {recentActions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: 12 }}>
                Sin acciones registradas aún
              </p>
            </motion.div>
          ) : (
            recentActions.map((log, i) => {
              const logDate = new Date(log.timestamp);
              const timeAgo = Math.floor((Date.now() - logDate.getTime()) / 60000);
              
              return (
                <motion.div
                  key={`${log.alert_id}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-lg"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div className="flex items-start gap-3">
                    <CheckCircle size={14} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: '0 0 2px 0' }}>
                        Acción: {log.action.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0 }}>
                        Hace {timeAgo} minutos
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold flex-shrink-0" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>
                      ✓ Completada
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}