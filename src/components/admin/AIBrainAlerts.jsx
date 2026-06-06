import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, X, TrendingUp, Zap } from 'lucide-react';
import AIBrainEngine from '@/lib/AIBrainEngine';

export default function AIBrainAlerts({ alerts, onActionExecute }) {
  const [dismissedAlerts, setDismissedAlerts] = useState(AIBrainEngine.getDismissibleAlerts());

  const visibleAlerts = useMemo(
    () => alerts.filter(a => !dismissedAlerts.includes(a.id)),
    [alerts, dismissedAlerts]
  );

  const alertCounts = useMemo(() => ({
    critical: visibleAlerts.filter(a => a.priority === 'critical').length,
    high: visibleAlerts.filter(a => a.priority === 'high').length,
    medium: visibleAlerts.filter(a => a.priority === 'medium').length,
    low: visibleAlerts.filter(a => a.priority === 'low').length,
  }), [visibleAlerts]);

  const handleDismiss = (alertId) => {
    AIBrainEngine.dismissAlert(alertId);
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const handleExecuteAction = (alert) => {
    const result = AIBrainEngine.executeAction(alert.id, alert.suggested_action, alert.user_id);
    AIBrainEngine.logAction(result.log);
    onActionExecute?.(result);
    handleDismiss(alert.id);
  };

  const getAlertIcon = (type) => {
    return AlertTriangle;
  };

  return (
    <div className="space-y-4">
      {/* Alert Summary */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Críticas', count: alertCounts.critical, color: '#ef4444' },
          { label: 'Altas', count: alertCounts.high, color: '#f59e0b' },
          { label: 'Medias', count: alertCounts.medium, color: '#fb923c' },
          { label: 'Bajas', count: alertCounts.low, color: '#10b981' },
        ].map((stat, i) => (
          <div key={i} className="p-3 rounded-lg" style={{ background: `${stat.color}0d`, border: `1px solid ${stat.color}22` }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
              {stat.label}
            </p>
            <p style={{ color: stat.color, fontSize: 20, fontWeight: 900, margin: 0 }}>
              {stat.count}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Alerts List */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
              key="no-alerts">
              <CheckCircle size={24} style={{ color: '#10b981', margin: '0 auto 8px' }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Sin alertas activas</p>
            </motion.div>
          ) : (
            visibleAlerts.map((alert, idx) => {
              const color = AIBrainEngine.getPriorityColor(alert.priority);
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 rounded-lg border transition-all hover:shadow-lg"
                  style={{
                    background: `${color}0a`,
                    border: `1px solid ${color}25`,
                    position: 'relative',
                  }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                        <span style={{ color, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                          {alert.priority}
                        </span>
                        {alert.type === 'network_growth' && (
                          <TrendingUp size={12} style={{ color: '#10b981' }} />
                        )}
                      </div>
                      <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 4px 0' }}>
                        {alert.description}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0 }}>
                        {alert.user_email}
                      </p>
                      {alert.data && (
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0 0' }}>
                          {Object.entries(alert.data).map(([k, v]) => (
                            <span key={k} style={{ display: 'inline-block', marginRight: 12 }}>
                              {k}: {typeof v === 'number' ? v.toLocaleString() : v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleExecuteAction(alert)}
                        className="px-2 py-1 rounded text-xs font-bold transition-all hover:opacity-80"
                        style={{ background: `${color}25`, color }}>
                        {alert.action_label}
                      </button>
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="p-1 rounded hover:bg-white/10 transition-all"
                        style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <X size={14} />
                      </button>
                    </div>
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