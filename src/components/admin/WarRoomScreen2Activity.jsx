import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

export default function WarRoomScreen2Activity({ sim, presentationMode }) {
  return (
    <div className="h-full w-full flex flex-col p-12" style={{ background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 50%, #030408 100%)' }}>
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 style={{ color: 'white', fontSize: 48, fontWeight: 900, margin: 0, letterSpacing: -1 }}>Live Activity Feed</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, margin: '8px 0 0' }}>Real-time admin actions and platform events</p>
      </motion.div>

      {/* Activity List */}
      <div className="flex-1 overflow-hidden flex flex-col smooth-slide">
        <AnimatePresence initial={false}>
          {sim.activityLog.slice(0, 12).map((item, i) => (
            <motion.div
              key={item.action + item.detail + i}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-6 p-6 rounded-xl mb-3 premium-card transition-all"
              style={{
                background: i === 0 ? `linear-gradient(135deg, ${item.color}15 0%, ${item.color}08 100%)` : 'rgba(255,255,255,0.02)',
                border: `1.5px solid ${i === 0 ? item.color + '50' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: i === 0 ? `inset 0 1px 2px rgba(255,255,255,0.1), 0 8px 32px ${item.color}25` : 'none'
              }}
              whileHover={i === 0 ? { x: 8, boxShadow: `inset 0 1px 2px rgba(255,255,255,0.12), 0 12px 40px ${item.color}35` } : {}}
            >
              <div className="w-3 h-3 rounded-full mt-2 flex-shrink-0" style={{ background: item.color, boxShadow: i === 0 ? `0 0 12px ${item.color}` : 'none' }} />
              <div className="flex-1 min-w-0">
                <p style={{ color: i === 0 ? 'white' : 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>
                  {item.action}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '6px 0 0', lineHeight: 1.6 }}>
                  {item.detail}
                </p>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {item.time}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Growth Metric */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-auto pt-8 flex items-center justify-between p-6 rounded-xl premium-card"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(59,130,246,0.08) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>GROWTH SIGNAL</p>
          <p style={{ color: '#10b981', fontSize: 36, fontWeight: 900, margin: '8px 0 0', letterSpacing: -0.5, textShadow: '0 0 20px rgba(16,185,129,0.3)' }}>+{sim.kpis.growthSignal}%</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, margin: 0, letterSpacing: 0.5 }}>LIVE UPDATES</p>
          <p style={{ color: '#3b82f6', fontSize: 36, fontWeight: 900, margin: '8px 0 0', letterSpacing: -0.5, textShadow: '0 0 20px rgba(59,130,246,0.3)' }}>{sim.activityLog.length}</p>
        </div>
      </motion.div>
    </div>
  );
}