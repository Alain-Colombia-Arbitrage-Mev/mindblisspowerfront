import { useState } from 'react';
import { useSimulation } from '@/lib/SimulationEngine';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';
import { AlertTriangle, TrendingUp, Users, Shield, Activity, Clock, CreditCard, Zap, X, Maximize2 } from 'lucide-react';

const GiantScreenMode = () => {
  const [expandedPanel, setExpandedPanel] = useState(null);
  const sim = useSimulation();

  const ZONES = {
    activity: sim.activityLog.slice(0, 6),
    kpis: [
      { icon: Users, label: 'Total Participants', value: sim.kpis.totalParticipants.toLocaleString(), trend: 12, color: '#3b82f6' },
      { icon: Shield, label: 'Active Leaders', value: sim.kpis.activeLeaders, trend: 5, color: '#8b5cf6' },
      { icon: Activity, label: 'Active Plans', value: sim.kpis.activePlans.toLocaleString(), trend: 15, color: '#10b981' },
      { icon: Clock, label: 'Pending Verifications', value: sim.kpis.pendingVerifications, trend: -5, color: '#ef4444' },
      { icon: CreditCard, label: 'Payment Volume', value: `$${sim.kpis.paymentVolume}K`, trend: 9, color: '#06b6d4' },
      { icon: Zap, label: 'Growth Signal', value: `+${sim.kpis.growthSignal}%`, trend: sim.kpis.growthSignal, color: '#a855f7' },
    ],
    alerts: sim.activityLog.filter((a, i) => i < 4 && Math.random() > 0.5).map(a => ({
      title: a.action,
      message: a.detail,
      severity: a.color === '#ef4444' ? 'critical' : 'warning',
      color: a.color,
    })),
  };

  const CriticalAlert = ({ alert, idx }) => (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: idx * 0.15 }}
      className="rounded-3xl p-12 flex items-start gap-8 status-critical"
      style={{
        background: `linear-gradient(135deg, ${alert.color}20 0%, ${alert.color}08 100%)`,
        border: `3px solid ${alert.color}`,
        boxShadow: `inset 0 2px 4px rgba(255,255,255,0.1), 0 0 60px ${alert.color}80, 0 0 120px ${alert.color}40`,
      }}
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${alert.color}30` }}>
        <AlertTriangle size={40} style={{ color: alert.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 style={{ color: alert.color, fontSize: 32, fontWeight: 900, margin: '0 0 12px', letterSpacing: -0.5 }}>{alert.title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, margin: 0, lineHeight: 1.4 }}>{alert.message}</p>
      </div>
    </motion.div>
  );

  const KPIGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
      {ZONES.kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.05, y: -8 }}
            onClick={() => setExpandedPanel(`kpi-${i}`)}
            className="rounded-3xl p-12 flex flex-col gap-8 cursor-pointer premium-card data-glow transition-all"
            style={{
              background: `linear-gradient(135deg, ${kpi.color}12 0%, ${kpi.color}04 100%)`,
              border: `2px solid ${kpi.color}40`,
              minHeight: 320,
              boxShadow: `inset 0 2px 4px rgba(255,255,255,0.1), 0 20px 80px ${kpi.color}30`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: `${kpi.color}20` }}>
                <Icon size={48} style={{ color: kpi.color }} />
              </div>
              {kpi.trend !== undefined && (
                <div className="flex items-center gap-3">
                  <TrendingUp size={28} style={{ color: kpi.trend >= 0 ? '#10b981' : '#ef4444' }} />
                  <span style={{ color: kpi.trend >= 0 ? '#10b981' : '#ef4444', fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>
                    {kpi.trend >= 0 ? '+' : ''}{kpi.trend}%
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: 1 }}>
                {kpi.label.toUpperCase()}
              </p>
              <div style={{ color: kpi.color, fontSize: 56, fontWeight: 900, margin: '16px 0 0', letterSpacing: -1, textShadow: `0 0 40px ${kpi.color}50` }}>
                {kpi.value}
              </div>
            </div>
            <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: `${kpi.color}20` }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600 }}>Click to expand</span>
              <Maximize2 size={18} style={{ color: kpi.color }} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const ActivityZone = () => (
    <div className="space-y-6 h-full flex flex-col">
      {ZONES.activity.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-2xl p-8 flex items-start gap-8 premium-card"
          style={{
            background: i === 0 ? `${item.color}18` : 'rgba(255,255,255,0.03)',
            border: `1.5px solid ${i === 0 ? item.color + '50' : 'rgba(255,255,255,0.1)'}`,
            boxShadow: i === 0 ? `0 12px 48px ${item.color}35` : 'none',
          }}
        >
          <div className="w-4 h-4 rounded-full flex-shrink-0 mt-2" style={{ background: item.color, boxShadow: i === 0 ? `0 0 20px ${item.color}` : 'none' }} />
          <div className="flex-1 min-w-0">
            <p style={{ color: i === 0 ? 'white' : 'rgba(255,255,255,0.85)', fontSize: 20, fontWeight: 700, margin: 0 }}>{item.action}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, margin: '6px 0 0' }}>{item.detail}</p>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, whiteSpace: 'nowrap', fontWeight: 600 }}>{item.time}</span>
        </motion.div>
      ))}
    </div>
  );

  const ExpandedView = () => {
    if (expandedPanel?.startsWith('kpi-')) {
      const idx = parseInt(expandedPanel.split('-')[1]);
      const kpi = ZONES.kpis[idx];
      const Icon = kpi.icon;
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-center p-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-4xl p-24 max-w-2xl w-full premium-card data-glow"
            style={{
              background: `linear-gradient(135deg, ${kpi.color}15 0%, ${kpi.color}05 100%)`,
              border: `3px solid ${kpi.color}50`,
              boxShadow: `inset 0 2px 4px rgba(255,255,255,0.1), 0 40px 120px ${kpi.color}40`,
            }}
          >
            <button
              onClick={() => setExpandedPanel(null)}
              className="absolute top-8 right-8 p-4 rounded-xl hover:bg-white/10"
              style={{ color: kpi.color }}
            >
              <X size={36} />
            </button>
            <div className="flex items-center gap-12 mb-12">
              <div className="w-32 h-32 rounded-3xl flex items-center justify-center" style={{ background: `${kpi.color}25` }}>
                <Icon size={72} style={{ color: kpi.color }} />
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24, fontWeight: 700, margin: '0 0 12px', letterSpacing: 2 }}>
                  {kpi.label.toUpperCase()}
                </p>
                <div style={{ color: kpi.color, fontSize: 96, fontWeight: 900, margin: 0, letterSpacing: -2, textShadow: `0 0 60px ${kpi.color}60` }}>
                  {kpi.value}
                </div>
              </div>
            </div>
            <div className="border-t" style={{ borderColor: `${kpi.color}30` }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 20, margin: '16px 0 0', lineHeight: 1.6 }}>
                Real-time operational metric. Last updated just now. Trend: {kpi.trend >= 0 ? '+' : ''}{kpi.trend}%
              </p>
            </div>
          </motion.div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen p-16" style={{ background: 'linear-gradient(135deg, #060e1c 0%, #0a1628 100%)' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-20">
        <h1 style={{ color: '#3b82f6', fontSize: 64, fontWeight: 900, margin: 0, letterSpacing: -2, textShadow: '0 0 40px rgba(59,130,246,0.4)' }}>
          GIANT SCREEN CONTROL ROOM
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22, margin: '12px 0 0', fontWeight: 500 }}>Enterprise command center for large-screen displays</p>
      </motion.div>

      {/* Three-Zone Layout */}
      <div className="grid grid-cols-12 gap-16 mb-20 h-96">
        {/* Left: Activity Feed */}
        <div className="col-span-3 rounded-3xl p-12 overflow-y-auto premium-card" style={{ background: 'rgba(8,18,40,0.4)', border: '2px solid rgba(255,255,255,0.1)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: 800, letterSpacing: 2, margin: '0 0 16px' }}>LIVE ACTIVITY</p>
          <ActivityZone />
        </div>

        {/* Center: KPI Grid */}
        <div className="col-span-6">
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: 800, letterSpacing: 2, margin: '0 0 16px' }}>PLATFORM KPIs</p>
          <div className="grid grid-cols-3 gap-8">
            {ZONES.kpis.slice(0, 3).map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.08, y: -8 }}
                  onClick={() => setExpandedPanel(`kpi-${i}`)}
                  className="rounded-2xl p-8 cursor-pointer premium-card data-glow"
                  style={{
                    background: `linear-gradient(135deg, ${kpi.color}12 0%, ${kpi.color}04 100%)`,
                    border: `2px solid ${kpi.color}40`,
                    boxShadow: `0 12px 48px ${kpi.color}25`,
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon size={36} style={{ color: kpi.color }} />
                    <span style={{ color: kpi.trend >= 0 ? '#10b981' : '#ef4444', fontSize: 20, fontWeight: 900 }}>
                      {kpi.trend >= 0 ? '+' : ''}{kpi.trend}%
                    </span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: 1 }}>{kpi.label}</p>
                  <div style={{ color: kpi.color, fontSize: 40, fontWeight: 900, margin: '8px 0 0', letterSpacing: -0.5, textShadow: `0 0 30px ${kpi.color}40` }}>
                    {kpi.value}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: AI Actions */}
        <div className="col-span-3 rounded-3xl p-12 overflow-y-auto premium-card" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.06) 0%, rgba(59,130,246,0.06) 100%)', border: '2px solid rgba(168,85,247,0.2)' }}>
          <p style={{ color: '#a855f7', fontSize: 18, fontWeight: 800, letterSpacing: 2, margin: '0 0 16px' }}>AI ACTIONS</p>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="space-y-4">
            {['Funnel Optimization', 'Leader Training Detected', 'Payment Risk Alert', 'Growth Signal +12%'].map((action, i) => (
              <div key={i} className="rounded-xl p-6 flex items-center gap-4" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)' }}>
                <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 600 }}>{action}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Critical Alerts */}
      {ZONES.alerts.length > 0 && (
        <div className="mb-20">
          <p style={{ color: '#ef4444', fontSize: 18, fontWeight: 800, letterSpacing: 2, margin: '0 0 16px' }}>⚠️ CRITICAL ALERTS</p>
          <div className="space-y-8">
            {ZONES.alerts.map((alert, i) => (
              <CriticalAlert key={i} alert={alert} idx={i} />
            ))}
          </div>
        </div>
      )}

      {/* Full KPI Grid */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: 800, letterSpacing: 2, margin: '0 0 16px' }}>DETAILED METRICS</p>
        <KPIGrid />
      </div>

      {/* Expanded Panel Modal */}
      <AnimatePresence>
        {expandedPanel && <ExpandedView />}
      </AnimatePresence>

      {/* Bottom Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 px-16 py-8 flex items-center justify-between"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: '0 0 12px #10b981' }} />
          <span style={{ color: '#10b981', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>SYSTEMS OPERATIONAL</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: 600 }}>Ready for 3–5m viewing distance</span>
      </motion.div>
    </div>
  );
};

export default GiantScreenMode;