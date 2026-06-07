import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, ChevronDown } from 'lucide-react';
import SecurityAlertSystem from '@/lib/SecurityAlertSystem';
import { motion, AnimatePresence } from 'framer-motion';

export default function AlertDisplay({ compact = false, maxAlerts = 5 }) {
  const [alerts, setAlerts] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  const ALERT_COLORS = {
    critical: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444', icon: AlertTriangle },
    warning: { bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)', text: '#fb923c', icon: AlertCircle },
    info: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#3b82f6', icon: Info },
  };

  useEffect(() => {
    // Load initial alerts
    const unacknowledged = SecurityAlertSystem.getUnacknowledgedAlerts();
    setAlerts(unacknowledged.slice(0, maxAlerts));

    // Subscribe to updates
    const unsubscribe = SecurityAlertSystem.subscribe((updatedAlerts) => {
      const unacked = updatedAlerts.filter(a => !a.acknowledged);
      setAlerts(unacked.slice(0, maxAlerts));
    });

    return unsubscribe;
  }, [maxAlerts]);

  const handleAcknowledge = (alertId) => {
    SecurityAlertSystem.acknowledgeAlert(alertId, 'admin@mindblisspower.com');
  };

  const formatTime = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (alerts.length === 0) {
    if (compact) return null;
    return (
      <div className="p-6 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <CheckCircle size={28} style={{ color: '#10b981', margin: '0 auto 12px' }} />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600 }}>All Systems Secure</p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '4px 0 0' }}>No active security alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, margin: 0 }}>SECURITY ALERTS</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '3px 0 0' }}>{alerts.length} unacknowledged alert{alerts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
        </div>
      </div>

      <AnimatePresence>
        {alerts.map((alert, idx) => {
          const config = ALERT_COLORS[alert.severity];
          const Icon = config.icon;
          const isExpanded = expandedId === alert.id;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-3 rounded-lg cursor-pointer transition-all"
              onClick={() => setExpandedId(isExpanded ? null : alert.id)}
              style={{ background: config.bg, border: `1px solid ${config.border}` }}
            >
              <div className="flex items-start gap-3">
                <Icon size={16} style={{ color: config.text, flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1 min-w-0">
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: 0 }}>{alert.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '2px 0 0' }}>{alert.message}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: '3px 0 0' }}>{formatTime(alert.timestamp)}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcknowledge(alert.id);
                  }}
                  className="px-2 py-1 rounded text-xs font-semibold transition-all flex-shrink-0"
                  style={{ background: `${config.text}20`, color: config.text, border: `1px solid ${config.text}40` }}
                >
                  Ack
                </button>
              </div>

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t"
                  style={{ borderColor: config.border }}
                >
                  <div className="space-y-2 mb-3">
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: '0 0 3px 0' }}>RECOMMENDED ACTION</p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>{alert.recommendedAction}</p>
                    </div>
                    {alert.details && Object.keys(alert.details).length > 0 && (
                      <div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: '0 0 3px 0' }}>DETAILS</p>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 4, fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
                          {Object.entries(alert.details).map(([key, value]) => (
                            <div key={key} style={{ margin: '2px 0' }}>
                              <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcknowledge(alert.id);
                    }}
                    className="w-full py-2 rounded text-xs font-semibold transition-all"
                    style={{ background: `${config.text}30`, color: config.text }}
                  >
                    Acknowledge Alert
                  </button>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}