import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Target, Zap } from 'lucide-react';

/**
 * ZONE 2: LEFT INTELLIGENCE COLUMN
 * Critical alerts feed, priority intervention list, AI priority feed
 * Elegant stacked cards, premium command lane
 */

const ALERTS = [
  {
    id: 1,
    title: 'Pagos bloqueados',
    desc: '8 transacciones > $1,000 en revisión',
    severity: 'critical',
    module: 'Pagos',
    action: 'Revisar',
    time: 'hace 2m',
  },
  {
    id: 2,
    title: 'Violaciones de líder',
    desc: '3 comunicaciones fuera de guión detectadas',
    severity: 'critical',
    module: 'Líderes',
    action: 'Auditar',
    time: 'hace 5m',
  },
  {
    id: 3,
    title: 'Asignaciones pendientes',
    desc: '15 participantes sin asesor KYC (48h SLA)',
    severity: 'warning',
    module: 'Participantes',
    action: 'Asignar',
    time: 'hace 12m',
  },
];

const AlertCard = ({ alert }) => {
  const severityMap = {
    critical: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)', badge: 'rgba(239,68,68,0.15)', icon: AlertTriangle, color: '#ef4444' },
    warning: { bg: 'rgba(251,146,60,0.06)', border: 'rgba(251,146,60,0.2)', badge: 'rgba(251,146,60,0.15)', icon: Clock, color: '#fb923c' },
    info: { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)', badge: 'rgba(59,130,246,0.15)', icon: Zap, color: '#3b82f6' },
  };

  const style = severityMap[alert.severity];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3 rounded-lg cursor-pointer transition-all hover:bg-white/[0.03]"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      <div className="flex items-start gap-2.5">
      <div className="w-1 h-1 rounded-full flex-shrink-0 mt-2" style={{ background: style.color, boxShadow: `0 0 6px ${style.color}` }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p style={{ color: 'white', fontSize: 11, fontWeight: 700, margin: 0 }}>
            {alert.title}
          </p>
            <span
              className="px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ background: style.badge, color: style.color, fontSize: 8 }}
            >
              {alert.severity.toUpperCase()}
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 2px 0', lineHeight: 1.3 }}>
            {alert.desc}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 600 }}>
              {alert.module} • {alert.time}
            </span>
            <button
              className="px-2 py-0.5 rounded text-xs font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            >
              {alert.action} →
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function WarRoomLeftPanel({ sim }) {
  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-80 flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
      style={{
        background: 'rgba(4,10,22,0.7)',
        border: '1px solid rgba(59,130,246,0.15)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* HEADER */}
      <div className="flex-shrink-0 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <p style={{ color: '#ef4444', fontSize: 9, fontWeight: 900, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
          Alertas Críticas
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0 0', fontWeight: 600 }}>
          {ALERTS.length} alertas activas en el sistema
        </p>
      </div>

      {/* ALERTS FEED */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        <AnimatePresence mode="popLayout">
          {ALERTS.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </AnimatePresence>
      </div>

      {/* DIVIDER */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }} />

      {/* PRIORITY INTERVENTION */}
      <div className="flex-shrink-0 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Target size={13} style={{ color: '#8b5cf6' }} />
          <p style={{ color: '#8b5cf6', fontSize: 9, fontWeight: 900, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
            Intervenciones Prioritarias
          </p>
        </div>
        <div className="space-y-1">
          {[
            { name: 'Rodrigo Díaz (CO)', reason: 'Violación de comunicación', severity: 'critical' },
            { name: 'Ana García (BR)', reason: 'Descenso de activación', severity: 'warning' },
          ].map((item, i) => (
            <div key={i} className="p-2 rounded text-xs" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontWeight: 600 }}>{item.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', margin: '2px 0 0 0', fontSize: 9 }}>{item.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER: AI INSIGHTS */}
      <div className="flex-shrink-0 px-4 py-3" style={{ background: 'rgba(139,92,246,0.05)' }}>
        <div className="flex items-center gap-1.5">
          <Zap size={12} style={{ color: '#8b5cf6' }} />
          <p style={{ color: '#8b5cf6', fontSize: 9, fontWeight: 700, margin: 0 }}>IA sugiere: Capacitación urgente 3 líderes</p>
        </div>
      </div>
    </motion.div>
  );
}