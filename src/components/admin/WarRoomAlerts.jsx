import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, TrendingDown, Clock, Users } from 'lucide-react';
import AIPriorityFeed from './AIPriorityFeed';

const CRITICAL_ALERTS = [
  { id: 'a1', severity: 'critical', title: '8 Payments Awaiting Manual Review', icon: AlertTriangle, color: '#ef4444', action: 'Review Now' },
  { id: 'a2', severity: 'critical', title: '3 Leader Compliance Violations', icon: ShieldAlert, color: '#ef4444', action: 'Inspect' },
  { id: 'a3', severity: 'warning', title: 'Conversion Rate Down 5% (Last 24h)', icon: TrendingDown, color: '#fb923c', action: 'Analyze' },
  { id: 'a4', severity: 'warning', title: '5 Support Cases Aging >3 Days', icon: Clock, color: '#fb923c', action: 'Reassign' },
];

export default function WarRoomAlerts({ onAlertClick }) {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Critical Alerts */}
      <div className="flex-1 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,16,36,0.6)' }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          <h3 style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>Critical Alerts</h3>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, margin: '2px 0 0' }}>Requires immediate action</p>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 p-2">
          <AnimatePresence>
            {CRITICAL_ALERTS.map((alert, i) => {
              const Icon = alert.icon;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => onAlertClick?.(alert)}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all hover:bg-white/5 alert-critical-pulse"
                  style={{ background: `${alert.color}08`, borderLeft: `2px solid ${alert.color}` }}>
                  <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${alert.color}15` }}>
                    <Icon size={13} style={{ color: alert.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'white', fontSize: 10, fontWeight: 600, margin: 0 }}>{alert.title}</p>
                    <button style={{ color: alert.color, fontSize: 9, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>
                      → {alert.action}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Priority Feed */}
      <div className="flex-1 overflow-hidden">
        <div style={{ height: '100%' }}>
          <AIPriorityFeed limit={3} />
        </div>
      </div>
    </div>
  );
}