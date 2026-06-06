import { useState } from 'react';
import { useSimulation } from '@/lib/SimulationEngine';
import { motion } from 'framer-motion';
import WarRoomKPIs from '@/components/admin/WarRoomKPIs';
import WarRoomActivityFeed from '@/components/admin/WarRoomActivityFeed';
import WarRoomAlerts from '@/components/admin/WarRoomAlerts';
import WarRoomActionPanel from '@/components/admin/WarRoomActionPanel';
import WarRoomFocusView from '@/components/admin/WarRoomFocusView';
import { Activity, AlertTriangle, Zap } from 'lucide-react';

export default function WarRoom() {
  const sim = useSimulation();
  const [focusItem, setFocusItem] = useState(null);
  const [focusType, setFocusType] = useState(null);

  const criticalAlertCount = 8 + 3; // Payments + Leaders
  const autoModeActive = sim.tick > 0;

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 50%, #030408 100%)' }}>
      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 px-8 py-4 border-b glass"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(4,10,22,0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <AlertTriangle size={18} style={{ color: '#ef4444' }} />
              </div>
              <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0 }}>War Room</h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>Real-time operations control — Critical signals · Action-driven</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>ACTIVE ALERTS</p>
              <p style={{ color: '#ef4444', fontSize: 18, fontWeight: 900, margin: 0 }}>{criticalAlertCount}</p>
            </div>
            <div className="h-8 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: autoModeActive ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: autoModeActive ? '#10b981' : '#6b7280' }} />
              <span style={{ color: autoModeActive ? '#10b981' : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}>
                {autoModeActive ? 'AUTO MODE ACTIVE' : 'MANUAL'}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ZONE 1 — KPI STRIP */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-shrink-0 px-8 py-4 border-b overflow-x-auto"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <WarRoomKPIs kpis={sim.kpis} />
      </motion.div>

      {/* ZONES 2-4 — 3-COLUMN LAYOUT */}
      <div className="flex-1 overflow-hidden px-8 py-5 gap-6 flex">
        {/* ZONE 2 — LEFT (Activity Feed) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="w-80 min-w-80 flex flex-col">
          <WarRoomActivityFeed />
        </motion.div>

        {/* ZONE 3 — CENTER (Alerts + AI) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex-1 min-w-0 flex flex-col">
          <WarRoomAlerts onAlertClick={(alert) => { setFocusItem(alert); setFocusType('alert'); }} />
        </motion.div>

        {/* ZONE 4 — RIGHT (Action Panel) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="w-72 min-w-72 flex flex-col">
          <WarRoomActionPanel onActionClick={(action) => { setFocusItem(action); setFocusType('action'); }} />
        </motion.div>
      </div>

      {/* Focus View Modal */}
      <WarRoomFocusView
        isOpen={!!focusItem}
        onClose={() => { setFocusItem(null); setFocusType(null); }}
        item={focusItem}
        type={focusType}
      />
    </div>
  );
}