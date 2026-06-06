import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Zap, Activity, Clock, AlertCircle } from 'lucide-react';
import { simEngine, useSimulation } from '@/lib/SimulationEngine';
import AnimatedNumber from '@/components/admin/AnimatedNumber';

export default function SimulationPanel() {
  const { running, speed, tick, kpis, activityLog, alerts } = useSimulation();

  const SPEED_OPTS = [
    { key: 'low',    label: 'Monitoring', sub: 'Event every ~90s · background mode' },
    { key: 'medium', label: 'Operational', sub: 'Event every ~40s · standard cadence' },
    { key: 'high',   label: 'Accelerated', sub: 'Event every ~18s · demo walkthrough' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.2)' }}>
            <Activity size={15} style={{ color: '#a855f7' }} />
          </div>
          <div>
            <p style={{ color: '#a855f7', fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>INTERNAL — ADMIN ONLY</p>
            <h3 style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: 0 }}>Live Simulation Engine</h3>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: running ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)', border: `1px solid ${running ? 'rgba(16,185,129,0.3)' : 'rgba(107,114,128,0.2)'}` }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: running ? '#10b981' : '#6b7280', animation: running ? 'pulse 1.5s infinite' : 'none' }} />
            <span style={{ color: running ? '#10b981' : '#6b7280', fontSize: 10, fontWeight: 700 }}>
              {running ? 'RUNNING' : 'PAUSED'} · Tick #{tick}
            </span>
          </div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0, lineHeight: 1.6 }}>
          Simulates operational platform activity at a realistic business cadence. Events follow
          lifecycle logic — registrations move through KYC, payment verification, and activation.
          KPIs shift by small, credible deltas. No synthetic bursts.
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>ENGINE CONTROLS</p>
        <div className="flex gap-3 flex-wrap">
          {!running ? (
            <button onClick={() => simEngine.start()} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all"
              style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.35)' }}>
              <Play size={14} /> Activate Engine
            </button>
          ) : (
            <button onClick={() => simEngine.pause()} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all"
              style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.35)' }}>
              <Pause size={14} /> Pause Engine
            </button>
          )}
          <button onClick={() => simEngine.reset()} className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            <RotateCcw size={14} /> Reset to Baseline
          </button>
        </div>
      </motion.div>

      {/* Speed */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>SIMULATION SPEED</p>
        <div className="flex gap-3">
          {SPEED_OPTS.map(opt => (
            <button key={opt.key} onClick={() => simEngine.setSpeed(opt.key)}
              className="flex-1 p-3 rounded-xl text-left transition-all"
              style={{ background: speed === opt.key ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${speed === opt.key ? 'rgba(168,85,247,0.4)' : 'rgba(255,255,255,0.08)'}` }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock size={12} style={{ color: speed === opt.key ? '#a855f7' : 'rgba(255,255,255,0.3)' }} />
                <span style={{ color: speed === opt.key ? '#a855f7' : 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 12 }}>{opt.label}</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0 }}>{opt.sub}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Live KPI Snapshot */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>LIVE KPI SNAPSHOT</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Participants', value: String(kpis.totalParticipants), color: '#3b82f6' },
            { label: 'Active Plans', value: String(kpis.activePlans), color: '#10b981' },
            { label: 'Pending KYC', value: String(kpis.pendingVerifications), color: '#fb923c' },
            { label: 'Payment Vol.', value: `$${kpis.paymentVolume}K`, color: '#06b6d4' },
            { label: 'Conversion', value: `${kpis.conversionRate}%`, color: '#a855f7' },
            { label: 'Support Cases', value: String(kpis.supportIncidents), color: '#ef4444' },
            { label: 'Growth Signal', value: `+${kpis.growthSignal}%`, color: '#fb923c' },
            { label: 'Active Leaders', value: String(kpis.activeLeaders), color: '#8b5cf6' },
          ].map((k, i) => (
            <div key={i} className="p-3 rounded-xl" style={{ background: `${k.color}0d`, border: `1px solid ${k.color}22` }}>
              <AnimatedNumber value={k.value} style={{ color: k.color, fontSize: 20, fontWeight: 900, display: 'block', marginBottom: 2 }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>{k.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>TRIGGERED ALERTS</p>
          <div className="space-y-2">
            {alerts.map((a, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg"
              style={{ background: a.severity === 'critical' ? 'rgba(239,68,68,0.08)' : 'rgba(251,146,60,0.08)', border: `1px solid ${a.severity === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(251,146,60,0.2)'}` }}>
              <Zap size={12} style={{ color: a.severity === 'critical' ? '#ef4444' : '#fb923c', flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, flex: 1 }}>{a.msg}</span>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{a.time}</span>
            </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Activity Log */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>LIVE ACTIVITY LOG</p>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,18,40,0.5)' }}>
          <AnimatePresence initial={false}>
            {activityLog.slice(0, 12).map((item, i) => (
              <motion.div
                key={item.action + item.detail}
                initial={i === 0 ? { opacity: 0, x: -6, backgroundColor: `${item.color}14` } : { opacity: 1, x: 0 }}
                animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(0,0,0,0)' }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="flex items-start gap-3 px-4 py-2.5"
                style={{ borderBottom: i < 11 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: item.color, boxShadow: i === 0 ? `0 0 5px ${item.color}` : 'none' }} />
                <div className="flex-1 min-w-0">
                  <p style={{ color: i === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: i === 0 ? 700 : 500, margin: 0 }}>{item.action}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.detail}</p>
                </div>
                <span style={{ color: i === 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)', fontSize: 9, whiteSpace: 'nowrap', marginTop: 1 }}>{item.time}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}