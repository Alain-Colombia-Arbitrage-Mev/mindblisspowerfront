import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '@/lib/SimulationEngine';
import { UserPlus, CreditCard, Users, AlertTriangle, MessageSquare } from 'lucide-react';

export default function WarRoomActivityFeed() {
  const sim = useSimulation();
  const [feed, setFeed] = useState(sim.activityLog.slice(0, 8));
  const scrollRef = useRef(null);

  useEffect(() => {
    setFeed(sim.activityLog.slice(0, 8));
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }, 50);
  }, [sim.tick]);

  const icons = {
    'Payment APPROVED': CreditCard,
    'Account BLOCKED': AlertTriangle,
    'Leader CERTIFIED': Users,
    'Plan APPROVED': CreditCard,
    'Case ESCALATED': AlertTriangle,
    'Role ASSIGNED': Users,
    'Payout REVERSED': AlertTriangle,
    'KYC VERIFIED': UserPlus,
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,16,36,0.6)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
        <h3 style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>Live Activity</h3>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, margin: '2px 0 0' }}>Real-time platform events</p>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 p-2" style={{ scrollBehavior: 'smooth' }}>
        <AnimatePresence initial={false}>
          {feed.map((item, i) => {
            const Icon = icons[item.action] || MessageSquare;
            return (
              <motion.div
                key={item.action + item.time + i}
                initial={{ opacity: 0, x: -16, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: -16, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                style={{ background: i === 0 ? `${item.color}15` : 'transparent', borderLeft: `2px solid ${item.color}` }}>
                <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}18` }}>
                  <Icon size={12} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: i === 0 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: i === 0 ? 600 : 400, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.action}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.detail}
                  </p>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {item.time}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}