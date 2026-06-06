import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import AutoModeEngineV2 from '@/lib/AutoModeEngineV2';

export default function AutoModeStatsPanel() {
  const [stats, setStats] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshStats = () => {
    const newStats = AutoModeEngineV2.getStats();
    const newAudit = AutoModeEngineV2.getAuditLog();
    const newConfig = AutoModeEngineV2.getConfig();
    
    setStats(newStats);
    setAuditLog(newAudit.slice(0, 6));
    setConfig(newConfig);
  };

  if (!stats || !config) return null;

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Ejecutadas', value: stats.total_executed, icon: CheckCircle, color: '#10b981' },
          { label: 'Hoy', value: stats.executed_today, icon: TrendingUp, color: '#3b82f6' },
          { label: 'Fallos', value: stats.failed, icon: AlertCircle, color: '#ef4444' },
          { label: 'Aprobación', value: stats.pending_approval, icon: AlertCircle, color: '#fb923c' },
          { label: 'Tasa Éxito', value: `${stats.success_rate}%`, icon: TrendingUp, color: '#8b5cf6' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-lg"
              style={{ background: `${stat.color}0d`, border: `1px solid ${stat.color}22` }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={12} style={{ color: stat.color }} />
              </div>
              <p style={{ color: stat.color, fontSize: 20, fontWeight: 900, margin: '0 0 4px 0' }}>
                {stat.value}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0 }}>
                {stat.label}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg"
        style={{
          background: config.enabled ? 'rgba(139,92,246,0.1)' : 'rgba(107,114,128,0.1)',
          border: config.enabled ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(107,114,128,0.3)',
        }}>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ color: config.enabled ? '#8b5cf6' : '#6b7280', fontSize: 10, fontWeight: 700, margin: 0 }}>
              ESTADO
            </p>
            <p style={{ color: 'white', fontSize: 13, fontWeight: 900, margin: '4px 0 0 0' }}>
              {config.enabled ? (config.paused ? '⏸ PAUSADO' : '▶ ACTIVO') : '⊘ DESACTIVADO'}
            </p>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
            <p style={{ margin: '0 0 2px 0' }}>Modo: {config.operating_mode}</p>
            <p style={{ margin: 0 }}>Seguridad: {config.safety_mode}</p>
          </div>
        </div>
      </motion.div>

      {/* Audit Trail */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg overflow-hidden"
        style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="p-3 border-b border-white/8" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
            📋 Registro de Auditoría
          </p>
        </div>
        <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
          {auditLog.length === 0 ? (
            <div className="p-4 text-center">
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>Sin actividad aún</p>
            </div>
          ) : (
            auditLog.map((entry, i) => {
              const isSuccess = entry.status === 'executed';
              const color = isSuccess ? '#10b981' : entry.status === 'failed' ? '#ef4444' : '#fb923c';
              const timeAgo = Math.floor((Date.now() - new Date(entry.timestamp).getTime()) / 60000);

              return (
                <motion.div
                  key={`${entry.action_id}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 hover:bg-white/5 transition-all">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <p style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: '0 0 2px 0' }}>
                        {entry.action_type.replace(/_/g, ' ')}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '0 0 1px 0' }}>
                        Usuario: {entry.user_id.substring(0, 10)}...
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, margin: 0 }}>
                        {entry.status === 'executed' && `✓ Ejecutado`}
                        {entry.status === 'failed' && `✗ Error: ${entry.error}`}
                        {entry.status === 'blocked' && `⊘ Bloqueado: ${entry.reason}`}
                        {entry.status === 'rejected' && `⊗ Rechazado`}
                        {' · '} Hace {timeAgo}m
                        {entry.execution_time_ms && ` · ${entry.execution_time_ms}ms`}
                      </p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0" style={{
                      background: `${color}20`,
                      color,
                      fontSize: 8,
                    }}>
                      {entry.status.toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}