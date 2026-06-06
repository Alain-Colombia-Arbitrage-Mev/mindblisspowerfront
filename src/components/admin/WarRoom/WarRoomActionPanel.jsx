import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

/**
 * Reutilizable Action Panel for simulated actions
 */

export default function WarRoomActionPanel({ isOpen, title, message, state = 'executing', onClose }) {
  if (!isOpen) return null;

  const stateConfig = {
    executing: { icon: Loader2, color: '#3b82f6', text: 'Procesando...', spin: true },
    success: { icon: CheckCircle, color: '#10b981', text: 'Completado', spin: false },
    error: { icon: AlertCircle, color: '#ef4444', text: 'Error', spin: false },
  };

  const config = stateConfig[state];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={state !== 'executing' ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-6 rounded-xl max-w-sm w-full"
        style={{
          background: 'rgba(4,10,22,0.95)',
          border: `1px solid ${config.color}30`,
        }}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <motion.div
            animate={config.spin ? { rotate: 360 } : {}}
            transition={config.spin ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
          >
            <Icon size={32} style={{ color: config.color }} />
          </motion.div>

          <div>
            <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 4px 0' }}>
              {title}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>
              {message}
            </p>
          </div>

          <div className="w-full pt-2">
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <motion.div
                animate={state === 'executing' ? { width: ['0%', '100%'] } : { width: '100%' }}
                transition={{ duration: 2, ease: 'easeInOut' }}
                style={{ background: config.color, height: '100%' }}
              />
            </div>
          </div>

          {state !== 'executing' && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 rounded-lg text-sm font-bold transition-all mt-2"
              style={{
                background: `${config.color}20`,
                color: config.color,
                border: `1px solid ${config.color}40`,
              }}
            >
              {state === 'success' ? 'Continuar' : 'Cerrar'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}