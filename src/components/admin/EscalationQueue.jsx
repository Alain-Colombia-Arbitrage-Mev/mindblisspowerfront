import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import AutoModeEngine from '@/lib/AutoModeEngine';

export default function EscalationQueue() {
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshQueue = () => {
    const escalationQueue = AutoModeEngine.getEscalationQueue();
    setQueue(escalationQueue);
  };

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
              Cola de Escalación
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0 0' }}>
              {queue.length} caso{queue.length !== 1 ? 's' : ''} crítico{queue.length !== 1 ? 's' : ''}
            </p>
          </div>
          {queue.length > 0 && (
            <div className="relative">
              <span className="absolute inset-0 animate-pulse" style={{
                background: '#ef4444',
                opacity: 0.3,
                borderRadius: '0.5rem',
              }} />
              <span className="relative px-3 py-1 rounded-lg text-xs font-bold" style={{
                background: '#ef4444',
                color: 'white',
              }}>
                {queue.length}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {queue.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>Sin escalaciones críticas</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {queue.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg border relative overflow-hidden"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}>
                
                {/* Pulse animation */}
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'rgba(239,68,68,0.1)' }}
                />

                <div className="relative z-10">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                    <div className="flex-1 min-w-0">
                      <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 800, letterSpacing: 0.5, margin: '0 0 6px 0', textTransform: 'uppercase' }}>
                        CRÍTICO
                      </p>
                      <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '0 0 4px 0' }}>
                        {action.title}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, margin: '0 0 2px 0' }}>
                        {action.reason}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0 }}>
                        Afectado: {action.user_name}
                      </p>
                    </div>
                  </div>

                  <div className="p-2 rounded" style={{ background: 'rgba(239,68,68,0.15)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, margin: '0 0 2px 0' }}>
                      ACCIÓN RECOMENDADA:
                    </p>
                    <p style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, margin: 0 }}>
                      Intervención manual requerida
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}