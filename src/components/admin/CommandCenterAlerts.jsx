import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Zap, X } from 'lucide-react';
import { useState } from 'react';

export default function CommandCenterAlerts() {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'conversion',
      severity: 'critical',
      title: 'Conversion Drop Detected',
      description: 'Conversion rate dropped 2.3% in last 24h. Investigate landing page performance.',
      timestamp: '2 hours ago',
      action: 'Review Funnel'
    },
    {
      id: 2,
      type: 'dropoff',
      severity: 'high',
      title: 'High Drop-off on Step 2',
      description: 'Onboarding flow showing 34% drop-off at payment section.',
      timestamp: '4 hours ago',
      action: 'A/B Test CTA'
    },
    {
      id: 3,
      type: 'campaign',
      severity: 'medium',
      title: 'Inactive Campaign',
      description: 'Q1 Legacy Campaign still running with 0% engagement. Recommend pause.',
      timestamp: '12 hours ago',
      action: 'Pause Campaign'
    },
    {
      id: 4,
      type: 'conflict',
      severity: 'medium',
      title: 'Experiment Conflict',
      description: 'Landing Page Test A and Content Variation Test B targeting same audience segment.',
      timestamp: '18 hours ago',
      action: 'Review Targeting'
    },
    {
      id: 5,
      type: 'activation',
      severity: 'high',
      title: 'Low Activation Rate',
      description: 'New user activation rate 15% below baseline. Check onboarding content.',
      timestamp: '1 day ago',
      action: 'Review Content'
    }
  ]);

  const dismissAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#fb923c';
      case 'medium':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const getAlertIcon = (type) => {
    return type === 'critical' ? AlertTriangle : AlertCircle;
  };

  return (
    <div>
      <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
        ALERTS & ACTIONS
      </p>

      {alerts.length === 0 ? (
        <div
          className="p-8 rounded-lg text-center"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <p style={{ color: '#10b981', fontSize: 13, fontWeight: 600, margin: 0 }}>
            ✓ All Systems Operational
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0 0' }}>
            No active alerts. Performance metrics nominal.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => {
            const Icon = getAlertIcon(alert.type);
            const color = getSeverityColor(alert.severity);
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg flex items-start gap-4"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}
              >
                <Icon size={18} style={{ color, flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1">
                  <p style={{ color: color, fontSize: 12, fontWeight: 700, margin: '0 0 4px 0' }}>
                    {alert.title}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    {alert.description}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>
                    {alert.timestamp}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {}}
                    style={{
                      background: `${color}20`,
                      border: `1px solid ${color}40`,
                      color: color,
                      padding: '6px 10px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {alert.action}
                  </button>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      width: 28,
                      height: 28,
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}