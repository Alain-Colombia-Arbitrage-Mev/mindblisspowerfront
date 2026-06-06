import { useState, useRef } from 'react';
import { useSimulation } from '@/lib/SimulationEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, X, Zap, Pause, Play, AlertTriangle, Menu, Settings, TrendingUp } from 'lucide-react';

const TabletControlMode = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [autoModePaused, setAutoModePaused] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const dragRef = useRef(null);
  const sim = useSimulation();

  const SCREENS = [
    { id: 'overview', label: 'Overview', color: '#3b82f6' },
    { id: 'alerts', label: 'Alerts', color: '#ef4444' },
    { id: 'actions', label: 'Actions', color: '#8b5cf6' },
    { id: 'controls', label: 'Controls', color: '#a855f7' },
  ];

  const QUICK_ACTIONS = [
    { icon: Check, label: 'Approve', color: '#10b981', action: () => sim.activityLog.push({ action: 'APPROVED', detail: 'Admin action', time: 'now', color: '#10b981' }) },
    { icon: X, label: 'Reject', color: '#ef4444', action: () => sim.activityLog.push({ action: 'REJECTED', detail: 'Admin action', time: 'now', color: '#ef4444' }) },
    { icon: Zap, label: 'AI Copilot', color: '#a855f7', action: () => console.log('Triggering AI Copilot') },
    { icon: autoModePaused ? Play : Pause, label: autoModePaused ? 'Resume' : 'Pause', color: '#f59e0b', action: () => setAutoModePaused(!autoModePaused) },
  ];

  const handleDragEnd = (e, info) => {
    if (Math.abs(info.offset.x) > 50) {
      if (info.offset.x > 0 && currentScreen > 0) {
        setCurrentScreen(currentScreen - 1);
      } else if (info.offset.x < 0 && currentScreen < SCREENS.length - 1) {
        setCurrentScreen(currentScreen + 1);
      }
    }
    setDragX(0);
  };

  // ── SCREEN 0: OVERVIEW ──
  const OverviewScreen = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {[
          { label: 'Total Members', value: sim.kpis.totalParticipants.toLocaleString(), color: '#3b82f6' },
          { label: 'Active Leaders', value: sim.kpis.activeLeaders, color: '#8b5cf6' },
          { label: 'Payment Vol', value: `$${sim.kpis.paymentVolume}K`, color: '#06b6d4' },
          { label: 'Growth', value: `+${sim.kpis.growthSignal}%`, color: '#10b981' },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-3xl p-8 flex flex-col items-center justify-center premium-card data-glow"
            style={{ background: `linear-gradient(135deg, ${card.color}12 0%, ${card.color}04 100%)`, border: `2px solid ${card.color}40`, minHeight: 200 }}
          >
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 700, margin: 0 }}>{card.label}</p>
            <div style={{ color: card.color, fontSize: 48, fontWeight: 900, margin: '12px 0 0', textShadow: `0 0 30px ${card.color}40` }}>
              {card.value}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-3xl p-8 premium-card"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.04) 100%)', border: '2px solid rgba(16,185,129,0.3)' }}
      >
        <p style={{ color: '#10b981', fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>✓ SYSTEM STATUS</p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, margin: 0, lineHeight: 1.6 }}>All systems operational • Auto Mode {autoModePaused ? 'PAUSED' : 'ACTIVE'} • {sim.activityLog.length} updates</p>
      </motion.div>
    </div>
  );

  // ── SCREEN 1: ALERTS ──
  const AlertsScreen = () => {
    const alerts = sim.activityLog.filter((a, i) => i < 6 && (a.color === '#ef4444' || a.color === '#fb923c'));
    return (
      <div className="space-y-4">
        {alerts.length > 0 ? alerts.map((alert, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedAlert(selectedAlert === i ? null : i)}
            className="rounded-3xl p-8 flex items-start gap-6 cursor-pointer premium-card transition-all"
            style={{
              background: `linear-gradient(135deg, ${alert.color}15 0%, ${alert.color}08 100%)`,
              border: `2px solid ${alert.color}40`,
              boxShadow: selectedAlert === i ? `0 0 60px ${alert.color}60` : 'none',
            }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${alert.color}30` }}>
              <AlertTriangle size={32} style={{ color: alert.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 style={{ color: alert.color, fontSize: 22, fontWeight: 900, margin: 0 }}>{alert.action}</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, margin: '4px 0 0' }}>{alert.detail}</p>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, whiteSpace: 'nowrap' }}>{alert.time}</span>
          </motion.div>
        )) : (
          <div className="text-center py-16">
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, margin: 0 }}>No critical alerts</p>
          </div>
        )}
      </div>
    );
  };

  // ── SCREEN 2: ACTIONS ──
  const ActionsScreen = () => (
    <div className="space-y-6">
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px' }}>PENDING APPROVALS</p>
      <div className="space-y-4">
        {[
          { type: 'Payment', detail: '$1,500 · Bank Transfer', priority: 'HIGH' },
          { type: 'Leader Cert', detail: 'Ana Torres · CO-015', priority: 'NORMAL' },
          { type: 'Plan Activation', detail: 'Diego Ramírez · $500', priority: 'NORMAL' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            className="rounded-2xl p-6 flex items-start justify-between premium-card"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)' }}
          >
            <div>
              <p style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: 0 }}>{item.type}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, margin: '4px 0 0' }}>{item.detail}</p>
              <span className="mt-2 inline-block px-3 py-1 rounded-lg text-sm font-bold" style={{ background: item.priority === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(251,146,60,0.2)', color: item.priority === 'HIGH' ? '#ef4444' : '#fb923c' }}>
                {item.priority}
              </span>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-xl bg-green-500/20 text-green-400 font-bold text-lg" onClick={() => console.log('Approved:', item.type)}>
                ✓
              </button>
              <button className="px-6 py-3 rounded-xl bg-red-500/20 text-red-400 font-bold text-lg" onClick={() => console.log('Rejected:', item.type)}>
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // ── SCREEN 3: CONTROLS ──
  const ControlsScreen = () => (
    <div className="space-y-6">
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px' }}>SYSTEM CONTROLS</p>
      <div className="space-y-4">
        {[
          { label: 'Trigger Full Cycle', color: '#3b82f6', icon: TrendingUp },
          { label: 'AI Optimization', color: '#a855f7', icon: Zap },
          { label: 'Manual Sync', color: '#06b6d4', icon: Play },
          { label: 'Emergency Stop', color: '#ef4444', icon: X },
        ].map((ctrl, i) => {
          const Icon = ctrl.icon;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="w-full rounded-2xl p-8 flex items-center justify-between font-bold text-2xl premium-card transition-all"
              style={{ background: `linear-gradient(135deg, ${ctrl.color}12 0%, ${ctrl.color}04 100%)`, border: `2px solid ${ctrl.color}40` }}
              onClick={() => console.log('Control:', ctrl.label)}
            >
              <span style={{ color: 'white' }}>{ctrl.label}</span>
              <Icon size={36} style={{ color: ctrl.color }} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const screens = [
    { component: OverviewScreen },
    { component: AlertsScreen },
    { component: ActionsScreen },
    { component: ControlsScreen },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #060e1c 0%, #0a1628 100%)' }}>
      {/* Header */}
      <div className="px-8 py-6 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div>
          <h1 style={{ color: '#3b82f6', fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: -1 }}>TABLET CONTROL</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '4px 0 0' }}>Swipe to navigate • Tap to interact</p>
        </div>
        <button className="p-4 rounded-xl hover:bg-white/10">
          <Menu size={32} style={{ color: 'rgba(255,255,255,0.6)' }} />
        </button>
      </div>

      {/* Screen Navigation Tabs */}
      <div className="flex gap-2 px-8 py-4 overflow-x-auto bg-black/20">
        {SCREENS.map((screen, i) => (
          <motion.button
            key={i}
            onClick={() => setCurrentScreen(i)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 rounded-2xl font-bold text-lg flex-shrink-0 transition-all"
            style={{
              background: currentScreen === i ? `${screen.color}30` : 'rgba(255,255,255,0.05)',
              border: currentScreen === i ? `2px solid ${screen.color}` : '2px solid transparent',
              color: currentScreen === i ? screen.color : 'rgba(255,255,255,0.5)',
            }}
          >
            {screen.label}
          </motion.button>
        ))}
      </div>

      {/* Main Content - Swipeable */}
      <motion.div
        ref={dragRef}
        drag="x"
        dragElastic={0.2}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        onDragStart={() => {}}
        animate={{ x: -currentScreen * 100 + '%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 overflow-hidden"
      >
        <div className="flex h-full">
          {screens.map((screen, i) => {
            const Screen = screen.component;
            return (
              <div key={i} className="w-full flex-shrink-0 overflow-y-auto px-8 py-8">
                <AnimatePresence mode="wait">
                  {currentScreen === i && <Screen />}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Action Bar - Fixed Bottom */}
      <div className="px-8 py-6 flex gap-4 border-t bg-black/40" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        {QUICK_ACTIONS.map((qa, i) => {
          const Icon = qa.icon;
          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={qa.action}
              className="flex-1 flex flex-col items-center justify-center gap-3 py-6 rounded-2xl font-bold text-lg premium-card transition-all"
              style={{ background: `${qa.color}18`, border: `2px solid ${qa.color}40` }}
            >
              <Icon size={40} style={{ color: qa.color }} />
              <span style={{ color: qa.color, fontSize: 14, fontWeight: 700 }}>{qa.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Swipe Indicator */}
      {currentScreen > 0 && (
        <motion.button
          onClick={() => setCurrentScreen(currentScreen - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-4 rounded-2xl bg-white/10 hover:bg-white/20"
        >
          <ChevronLeft size={40} style={{ color: 'white' }} />
        </motion.button>
      )}
      {currentScreen < SCREENS.length - 1 && (
        <motion.button
          onClick={() => setCurrentScreen(currentScreen + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-4 rounded-2xl bg-white/10 hover:bg-white/20"
        >
          <ChevronRight size={40} style={{ color: 'white' }} />
        </motion.button>
      )}
    </div>
  );
};

export default TabletControlMode;