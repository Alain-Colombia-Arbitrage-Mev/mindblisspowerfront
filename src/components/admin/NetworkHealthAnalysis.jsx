import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Users, Clock } from 'lucide-react';

export default function NetworkHealthAnalysis({ network }) {
  if (!network) return null;

  const metrics = [
    {
      icon: TrendingUp,
      label: 'Balance L/R',
      value: `${network.leftCount || 0} ⟷ ${network.rightCount || 0}`,
      status: Math.abs((network.leftCount || 0) - (network.rightCount || 0)) < 5 ? 'good' : 'warning',
      color: Math.abs((network.leftCount || 0) - (network.rightCount || 0)) < 5 ? '#10b981' : '#fb923c',
    },
    {
      icon: Users,
      label: 'Total Miembros',
      value: network.totalMembers || 0,
      status: 'info',
      color: '#3b82f6',
    },
    {
      icon: Clock,
      label: 'Actividad Media',
      value: '67%',
      status: 'warning',
      color: '#fb923c',
    },
    {
      icon: AlertTriangle,
      label: 'Críticos',
      value: network.criticalCount || 0,
      status: network.criticalCount > 0 ? 'critical' : 'good',
      color: network.criticalCount > 0 ? '#ef4444' : '#10b981',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg" style={{ background: 'rgba(8,18,40,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p style={{ color: '#10b981', fontSize: 10, fontWeight: 800, letterSpacing: 1, margin: '0 0 12px 0', textTransform: 'uppercase' }}>
        Análisis de Salud de Red
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-lg"
              style={{ background: `${metric.color}0d`, border: `1px solid ${metric.color}22` }}>
              <Icon size={12} style={{ color: metric.color, marginBottom: 4 }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>
                {metric.label}
              </p>
              <p style={{ color: metric.color, fontSize: 18, fontWeight: 900, margin: '4px 0 0 0' }}>
                {metric.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Issues */}
      <div className="space-y-1">
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700, margin: '0 0 8px 0' }}>PROBLEMAS DETECTADOS</p>
        <div className="space-y-1">
          {[
            { text: 'Desbalance derecha-izquierda detectado', color: '#fb923c' },
            { text: '8 usuarios inactivos en última rama', color: '#ef4444' },
            { text: '3 pagos vencidos en esta red', color: '#ef4444' },
          ].map((issue, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded text-xs" style={{ background: `${issue.color}0d`, border: `1px solid ${issue.color}22` }}>
              <AlertTriangle size={10} style={{ color: issue.color, flexShrink: 0 }} />
              <span style={{ color: issue.color }}>{issue.text}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}