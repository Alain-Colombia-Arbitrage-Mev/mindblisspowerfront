import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export default function WarRoomFocusView({ isOpen, onClose, item, type }) {
  if (!item) return null;

  const isAlert = type === 'alert';
  const color = item.color || '#3b82f6';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
            style={{ backdropFilter: 'blur(8px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50 glass rounded-2xl"
            style={{ background: 'rgba(8,18,40,0.95)', border: `2px solid ${color}40`, boxShadow: `0 0 40px ${color}30` }}>
            {/* Header */}
            <div className="px-8 py-6 border-b flex items-center justify-between" style={{ borderColor: `${color}20` }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                  {isAlert ? (
                    <AlertTriangle size={20} style={{ color }} />
                  ) : (
                    <Clock size={20} style={{ color }} />
                  )}
                </div>
                <div>
                  <h2 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>
                    {isAlert ? 'Alert Details' : 'Action Details'}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0' }}>
                    {isAlert ? item.severity?.toUpperCase() : 'PENDING APPROVAL'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-all hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.5)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-6">
              {/* Title & Description */}
              <div>
                <p style={{ color: color, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 8px', textTransform: 'uppercase' }}>
                  {isAlert ? item.severity : 'Action'} · {item.id || 'ID-001'}
                </p>
                <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
                  {item.title}
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  {isAlert ? 'This alert requires your attention and immediate action to prevent potential issues.' : 'This action has been queued and is awaiting your approval or intervention.'}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {isAlert ? (
                  <>
                    <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: '0 0 4px', fontWeight: 700 }}>SEVERITY</p>
                      <p style={{ color, fontSize: 14, fontWeight: 800, margin: 0 }}>
                        {item.severity?.toUpperCase()}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: '0 0 4px', fontWeight: 700 }}>AFFECTED MODULE</p>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, margin: 0 }}>
                        {item.module || 'Operations'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: '0 0 4px', fontWeight: 700 }}>RECORDS AFFECTED</p>
                      <p style={{ color: color, fontSize: 14, fontWeight: 800, margin: 0 }}>
                        {item.affected || 1}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: '0 0 4px', fontWeight: 700 }}>REASON</p>
                      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.reason || 'System action'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Recommended Action */}
              <div className="p-4 rounded-lg border-l-4" style={{ background: `${color}08`, borderColor: color, borderLeftWidth: 4 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 6px', fontWeight: 700, textTransform: 'uppercase' }}>
                  Recommended Action
                </p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  {isAlert ? 'Click "Review Module" to jump directly to the affected area and take action.' : 'Review the details and approve or reject this action from the action panel.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Close
              </button>
              {isAlert && (
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 btn-premium"
                  style={{ background: color, color: 'white' }}>
                  Go to Module <ArrowRight size={14} />
                </button>
              )}
              {!isAlert && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                    Reject
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all btn-premium"
                    style={{ background: '#10b981', color: 'white' }}>
                    Approve
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}