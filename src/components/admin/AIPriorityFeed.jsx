/**
 * AI Priority Feed — Top 3–5 live AI recommendations
 * Admin-only. Updates with simulation ticks.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight } from 'lucide-react';
import { useSimulation } from '@/lib/SimulationEngine';
import { generateActionQueue } from '@/lib/aiBrain';
import { Link } from 'react-router-dom';

const SEV_COLOR = { critical: '#ef4444', high: '#fb923c', medium: '#f59e0b', low: '#6b7280' };

export default function AIPriorityFeed({ limit = 5 }) {
  const sim = useSimulation();
  const [actions, setActions] = useState(() => generateActionQueue().slice(0, limit));

  useEffect(() => {
    if (sim.tick % 4 === 0 && sim.tick > 0) {
      setActions(generateActionQueue().slice(0, limit));
    }
  }, [sim.tick, limit]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(59,130,246,0.18)', background: 'rgba(8,16,36,0.7)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(59,130,246,0.06)' }}>
        <div className="flex items-center gap-2">
          <Brain size={13} style={{ color: '#3b82f6' }} />
          <span style={{ color: '#3b82f6', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em' }}>AI PRIORITY FEED</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-1" />
        </div>
        <Link to="/admin-dashboard/ai-brain" style={{ textDecoration: 'none' }}>
          <span className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}>
            Full view <ChevronRight size={10} />
          </span>
        </Link>
      </div>

      {/* Feed */}
      <AnimatePresence initial={false}>
        {actions.map((action, i) => {
          const c = SEV_COLOR[action.priority] || '#888';
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="flex items-start gap-3 px-4 py-3"
              style={{ borderBottom: i < actions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              {/* Priority badge */}
              <div className="flex-shrink-0 mt-0.5">
                <span className="px-1.5 py-0.5 rounded text-xs font-black" style={{ background: `${c}18`, color: c, fontSize: 9 }}>
                  {action.priority.toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>{action.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10, margin: '2px 0 0', lineHeight: 1.4 }}>{action.reason}</p>
              </div>

              {/* Module tag */}
              <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: 9, whiteSpace: 'nowrap' }}>
                {action.module}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}