import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Clock, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AlertCenter() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const result = await base44.entities.AlertHistory.filter(
        { status: 'active' },
        '-triggered_at',
        20
      );
      setAlerts(result);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      await base44.entities.AlertHistory.update(alertId, {
        status: 'resolved',
        resolved_at: new Date().toISOString()
      });
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getAlertConfig = (type) => {
    const configs = {
      conversion_low: {
        icon: AlertTriangle,
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.1)',
        border: 'rgba(239,68,68,0.3)',
        label: 'Conversión'
      },
      payments_drop: {
        icon: AlertTriangle,
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.1)',
        border: 'rgba(239,68,68,0.3)',
        label: 'Pagos'
      },
      registrations_drop: {
        icon: AlertTriangle,
        color: '#fb923c',
        bg: 'rgba(251,146,60,0.1)',
        border: 'rgba(251,146,60,0.3)',
        label: 'Registros'
      },
    };
    return configs[type] || configs.conversion_low;
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="p-8 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <CheckCircle size={24} style={{ color: '#10b981', margin: '0 auto 8px' }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
            ✓ Sin alertas activas
          </p>
        </div>
      ) : (
        <AnimatePresence>
          {alerts.map((alert) => {
            const config = getAlertConfig(alert.alert_type);
            const Icon = config.icon;
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-xl"
                style={{ background: config.bg, border: `1px solid ${config.border}` }}
              >
                <div className="flex items-start gap-4">
                  <div style={{ position: 'relative' }}>
                    <Icon size={18} style={{ color: config.color }} />
                    {alert.severity === 'critical' && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: config.color,
                          animation: 'pulse 2s infinite'
                        }}
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p style={{ color: config.color, fontSize: 12, fontWeight: 700, margin: 0 }}>
                        {alert.severity === 'critical' ? '🚨 CRÍTICO' : '⚠️ ADVERTENCIA'}
                      </p>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, flexShrink: 0 }}>
                        {new Date(alert.triggered_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 4px 0' }}>
                      {alert.title}
                    </p>

                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 8px 0', lineHeight: 1.4 }}>
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>Valor:</span>
                        <span style={{ color: 'white', fontWeight: 600 }}>
                          {alert.metric_value}
                          {alert.percentage_change ? '%' : ''}
                        </span>
                      </div>
                      
                      {alert.email_sent && (
                        <div className="flex items-center gap-1" style={{ color: '#3b82f6' }}>
                          <Mail size={12} />
                          <span>Email enviado</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = 'rgba(255,255,255,0.15)';
                      e.target.style.color = 'rgba(255,255,255,0.7)';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = 'rgba(255,255,255,0.1)';
                      e.target.style.color = 'rgba(255,255,255,0.5)';
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}