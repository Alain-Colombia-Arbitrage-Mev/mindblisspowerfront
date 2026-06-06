import { motion } from 'framer-motion';
import { AlertTriangle, Zap, TrendingDown } from 'lucide-react';

const CRITICAL_TYPES = {
  inactive_nodes: { icon: TrendingDown, label: 'Nodos Inactivos', color: '#fb923c' },
  broken_branches: { icon: AlertTriangle, label: 'Ramas Caídas', color: '#ef4444' },
  payment_critical: { icon: Zap, label: 'Pagos Críticos', color: '#ef4444' },
  network_risk: { icon: AlertTriangle, label: 'Riesgo de Pérdida', color: '#fb923c' },
};

export default function CriticalDetectionEngine({ network, onInterventionNeeded }) {
  if (!network) return null;

  // Simulated critical detection
  const criticals = [
    { type: 'inactive_nodes', count: 5, detail: '5 usuarios sin actividad >30 días' },
    { type: 'broken_branches', count: 2, detail: 'Rama derecha nivel 3 sin crecimiento' },
    { type: 'payment_critical', count: 3, detail: '3 pagos vencidos desde hace >7 días' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} style={{ color: '#ef4444' }} />
        <p style={{ color: '#ef4444', fontSize: 10, fontWeight: 800, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
          Detección Crítica Automática
        </p>
      </div>

      <div className="space-y-2">
        {criticals.map((critical, i) => {
          const config = CRITICAL_TYPES[critical.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2 p-2.5 rounded-lg"
              style={{ background: `${config.color}15`, border: `1px solid ${config.color}30` }}>
              <Icon size={12} style={{ color: config.color, marginTop: 3, flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p style={{ color: config.color, fontSize: 10, fontWeight: 700, margin: 0 }}>
                  {config.label} <span style={{ color: 'rgba(255,255,255,0.4)' }}>({critical.count})</span>
                </p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: '1px 0 0 0' }}>
                  {critical.detail}
                </p>
              </div>
              <button
                onClick={() => onInterventionNeeded(critical.type)}
                className="px-2 py-1 rounded text-xs font-bold flex-shrink-0 transition-all hover:bg-white/10"
                style={{ background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}40` }}>
                Actuar
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}