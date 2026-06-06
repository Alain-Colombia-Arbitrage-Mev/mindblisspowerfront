import { motion } from 'framer-motion';
import { Users, DollarSign, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

export default function LeaderControlPanel({ leader, network }) {
  if (!leader || !network) return null;

  const stats = [
    { icon: Users, label: 'Tamaño Red', value: network.totalMembers || 0, color: '#3b82f6' },
    { icon: DollarSign, label: 'Inversión Total', value: `$${network.totalInvestment || 0}`, color: '#10b981' },
    { icon: Activity, label: 'Actividad', value: '67%', color: '#fb923c' },
    { icon: AlertTriangle, label: 'Alertas', value: network.alertCount || 0, color: '#ef4444' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
      <div className="mb-4">
        <h3 style={{ color: '#8b5cf6', fontWeight: 900, fontSize: 16, margin: '0 0 2px 0' }}>
          👑 {leader.name}
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
          {leader.rank || 'SIN RANGO'} • {leader.email}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="p-3 rounded-lg"
              style={{ background: `${stat.color}0d`, border: `1px solid ${stat.color}22` }}>
              <Icon size={12} style={{ color: stat.color, marginBottom: 4 }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: 0, fontWeight: 700 }}>
                {stat.label}
              </p>
              <p style={{ color: stat.color, fontSize: 16, fontWeight: 900, margin: '4px 0 0 0' }}>
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="space-y-2">
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700, margin: '0 0 8px 0' }}>ACCIONES RÁPIDAS</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Revisar Red', color: '#3b82f6' },
            { label: 'Seguimiento', color: '#8b5cf6' },
            { label: 'Generar Reporte', color: '#10b981' },
            { label: 'Intervenir', color: '#ef4444' },
          ].map((action, i) => (
            <button
              key={i}
              className="px-3 py-2 rounded text-xs font-semibold transition-all hover:bg-white/10"
              style={{ background: `${action.color}15`, color: action.color, border: `1px solid ${action.color}30` }}>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}