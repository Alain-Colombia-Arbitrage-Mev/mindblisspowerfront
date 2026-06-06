import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, AlertCircle, CheckCircle, Clock, Settings } from 'lucide-react';
import AutoModeEngineV2 from '@/lib/AutoModeEngineV2';

export default function AutoModoWidget({ compact = false }) {
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    setStats(AutoModeEngineV2.getStats());
    setConfig(AutoModeEngineV2.getConfig());
  };

  if (!stats || !config) return null;

  const statusColor = config.enabled ? (config.paused ? '#fb923c' : '#8b5cf6') : '#6b7280';
  const statusLabel = config.enabled ? (config.paused ? '⏸ PAUSADO' : '▶ ACTIVO') : '⊘ INACTIVO';
  const statusBg = config.enabled ? (config.paused ? 'rgba(251,146,60,0.1)' : 'rgba(139,92,246,0.1)') : 'rgba(107,114,128,0.1)';

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 rounded-lg"
        style={{ background: statusBg, border: `1px solid ${statusColor}22` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap size={12} style={{ color: statusColor }} />
            <p style={{ color: statusColor, fontSize: 9, fontWeight: 800, letterSpacing: 0.5, margin: 0, textTransform: 'uppercase' }}>
              Modo Automático
            </p>
          </div>
          <p style={{ color: statusColor, fontSize: 11, fontWeight: 900, margin: 0 }}>
            {statusLabel}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: CheckCircle, value: stats.executed_today, label: 'Hoy', color: '#10b981' },
            { icon: Clock, value: stats.pending_approval, label: 'Aprobación', color: '#fb923c' },
            { icon: AlertCircle, value: stats.escalated, label: 'Críticas', color: '#ef4444' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="text-center p-2 rounded" style={{ background: `${item.color}0a` }}>
                <Icon size={10} style={{ color: item.color, margin: '0 auto 2px' }} />
                <p style={{ color: item.color, fontSize: 12, fontWeight: 900, margin: '0 0 1px 0' }}>
                  {item.value}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: 0 }}>
                  {item.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Full widget
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${statusColor}22`, background: 'rgba(8,18,40,0.7)' }}>
      {/* Header */}
      <div className="p-4 border-b border-white/8" style={{ background: statusBg }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: config.enabled && !config.paused ? 360 : 0 }}
              transition={{ duration: 3, repeat: config.enabled && !config.paused ? Infinity : 0, ease: 'linear' }}>
              <Zap size={16} style={{ color: statusColor }} />
            </motion.div>
            <div>
              <p style={{ color: statusColor, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, margin: 0, textTransform: 'uppercase' }}>
                Modo Automático
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '2px 0 0 0' }}>
                {config.operating_mode === 'balanced' && '⚙️ Balanceado'}
                {config.operating_mode === 'conservative' && '🛡️ Conservador'}
                {config.operating_mode === 'aggressive' && '🚀 Agresivo'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <motion.p
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ color: statusColor, fontSize: 13, fontWeight: 900, margin: '0 0 2px 0' }}>
              {statusLabel}
            </motion.p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: 0 }}>
              Seguridad: {config.safety_mode === 'strict' ? '🔒 Estricto' : '🔓 Flexible'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: CheckCircle, value: stats.executed_today, label: 'Ejecutadas Hoy', color: '#10b981' },
            { icon: Clock, value: stats.pending_approval, label: 'En Aprobación', color: '#fb923c' },
            { icon: AlertCircle, value: stats.escalated, label: 'Escalaciones', color: '#ef4444' },
            { icon: Zap, value: `${stats.success_rate}%`, label: 'Tasa Éxito', color: '#8b5cf6' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-3 rounded-lg"
                style={{ background: `${item.color}0d`, border: `1px solid ${item.color}22` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} style={{ color: item.color }} />
                </div>
                <p style={{ color: item.color, fontSize: 18, fontWeight: 900, margin: '0 0 2px 0' }}>
                  {item.value}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>
                  {item.label}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Warning if critical actions escalated */}
        <AnimatePresence>
          {stats.escalated > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 rounded-lg flex items-start gap-2"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, margin: '0 0 1px 0' }}>
                  {stats.escalated} Acciones Críticas
                </p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, margin: 0 }}>
                  Requieren revisión manual inmediata
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info */}
        <div className="pt-2 border-t border-white/8 flex items-center justify-between">
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>
            Sistema Autónomo
          </p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, margin: 0 }}>
            📊 {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}