import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateApprovalQueue, generateEscalationQueue } from '@/lib/AutoModeEngine';
import { Clock, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Zap } from 'lucide-react';

export default function WarRoomActionPanel({ onActionClick }) {
  const approvals = generateApprovalQueue().filter(a => a.status === 'pending');
  const escalations = generateEscalationQueue();
  const [expanded, setExpanded] = useState(null);

  const pendingCount = approvals.length;
  const escalatedCount = escalations.length;

  return (
    <div className="flex flex-col h-full gap-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,16,36,0.6)' }}>
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
        <h3 style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>Action Control</h3>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, margin: '2px 0 0' }}>Approvals & escalations</p>
      </div>

      {/* Status Strip */}
      <div className="flex gap-2 px-3">
        <div className="flex-1 p-2 rounded-lg text-center" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
          <p style={{ color: '#fb923c', fontSize: 12, fontWeight: 900, margin: 0 }}>{pendingCount}</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, margin: 0 }}>Pending</p>
        </div>
        <div className="flex-1 p-2 rounded-lg text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 900, margin: 0 }}>{escalatedCount}</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, margin: 0 }}>Critical</p>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 px-2">
        {/* Approvals */}
        <AnimatePresence>
          {approvals.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg overflow-hidden"
              style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
              <button
                onClick={() => {
                  setExpanded(expanded === item.id ? null : item.id);
                  onActionClick?.(item);
                }}
                className="w-full flex items-center justify-between gap-2 p-2.5 text-left transition-all hover:bg-white/5"
                style={{ background: expanded === item.id ? 'rgba(251,146,60,0.1)' : 'transparent' }}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,146,60,0.2)' }}>
                    <Clock size={10} style={{ color: '#fb923c' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: 0 }}>{item.affected} record{item.affected > 1 ? 's' : ''}</p>
                  </div>
                </div>
                {expanded === item.id ? <ChevronUp size={13} style={{ color: '#fb923c' }} /> : <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.25)' }} />}
              </button>
              {expanded === item.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.15 }}
                  className="px-2.5 pb-2.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '8px 0 6px' }}>{item.reason}</p>
                  <div className="flex gap-1.5">
                    <button className="flex-1 px-2 py-1 rounded text-xs font-semibold transition-all" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                      Approve
                    </button>
                    <button className="flex-1 px-2 py-1 rounded text-xs font-semibold transition-all" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                      Reject
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}

          {/* Escalations */}
          {escalations.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-2.5 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="flex items-start gap-2 mb-1">
                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.2)' }}>
                  <AlertTriangle size={10} style={{ color: '#ef4444' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: '1px 0 0' }}>Manual action required</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {pendingCount === 0 && escalatedCount === 0 && (
          <div className="text-center py-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <CheckCircle2 size={20} className="mx-auto mb-2" />
            <p style={{ fontSize: 10 }}>All clear</p>
          </div>
        )}
      </div>
    </div>
  );
}
