import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, AlertCircle } from 'lucide-react';
import AutoModeEngine from '@/lib/AutoModeEngine';

export default function ApprovalQueue({ onApprove }) {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshQueue = () => {
    const approvalQueue = AutoModeEngine.getApprovalQueue();
    setQueue(approvalQueue);
  };

  const handleApprove = (actionId) => {
    const result = AutoModeEngine.approveAction(actionId);
    if (result.success) {
      refreshQueue();
      onApprove?.();
    }
  };

  const handleReject = (actionId) => {
    AutoModeEngine.rejectAction(actionId);
    refreshQueue();
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p style={{ color: '#fb923c', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
              Cola de Aprobación
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0 0' }}>
              {queue.length} acción{queue.length !== 1 ? 'es' : ''} esperando
            </p>
          </div>
          {queue.length > 0 && (
            <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c' }}>
              {queue.length}
            </span>
          )}
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {queue.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 rounded-lg"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle size={24} style={{ color: '#10b981', margin: '0 auto 8px' }} />
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Sin acciones pendientes</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {queue.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg border"
                style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 4px 0' }}>
                      {action.title}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0 }}>
                      {action.reason}
                    </p>
                    {action.data && (
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '4px 0 0 0' }}>
                        Afectado: {action.user_name}
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-bold flex-shrink-0" style={{
                    background: 'rgba(251,146,60,0.2)',
                    color: '#fb923c',
                  }}>
                    MEDIA
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(action.id)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all"
                    style={{ background: 'rgba(16,185,129,0.25)', color: '#10b981' }}>
                    ✓ Aprobar
                  </button>
                  <button
                    onClick={() => handleReject(action.id)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                    ✗ Rechazar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}