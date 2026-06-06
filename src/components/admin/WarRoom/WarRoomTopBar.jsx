import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Brain, Zap } from 'lucide-react';

/**
 * ZONE 1: TOP COMMAND STRIP
 * Global platform health, alert counts, AI status, Auto Mode status
 * Premium KPI cards with animated counters
 */

const KPICard = ({ icon: Icon, label, value, state = 'neutral' }) => {
  const stateStyles = {
    neutral: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.7)' },
    active: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)', text: '#3b82f6' },
    warning: { bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)', text: '#fb923c' },
    critical: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#ef4444' },
    success: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', text: '#10b981' },
  };

  const style = stateStyles[state];

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 rounded-lg"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
      }}
    >
      <Icon size={16} style={{ color: style.text, opacity: 0.8 }} />
      <div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0, fontWeight: 700 }}>
          {label}
        </p>
        <motion.p
          key={value}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: '2px 0 0 0' }}
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default function WarRoomTopBar({ sim }) {
  return (
    <motion.div
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      className="flex-shrink-0 flex items-center justify-between px-6 py-4 gap-6 border-b"
      style={{
        background: 'rgba(4,10,22,0.95)',
        borderColor: 'rgba(59,130,246,0.15)',
      }}
    >
      {/* LEFT: BRANDING */}
      <div>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 900, letterSpacing: 2, margin: 0, textTransform: 'uppercase' }}>
          Sala de Control
        </p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '2px 0 0 0' }}>
          Centro de operaciones ejecutivo
        </p>
      </div>

      {/* CENTER: KPI CARDS */}
      <div className="flex items-center gap-3">
        <KPICard icon={Activity} label="Plataforma" value="✓ Operativa" state="success" />
        <KPICard icon={AlertTriangle} label="Alertas Críticas" value={sim.kpis?.criticalAlerts || 3} state={sim.kpis?.criticalAlerts > 0 ? 'critical' : 'neutral'} />
        <KPICard icon={Brain} label="IA" value="Activa" state="active" />
        <KPICard icon={Zap} label="Modo Automático" value="Balanceado" state="active" />
      </div>

      {/* RIGHT: LIVE INDICATOR */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 6px #10b981' }} />
        <span style={{ color: '#10b981', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          En Vivo
        </span>
      </div>
    </motion.div>
  );
}