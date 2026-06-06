import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function SuccessState({ show, message = '¡Guardado exitosamente!', onDone }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          onAnimationComplete={() => { if (onDone) setTimeout(onDone, 1200); }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 20px',
            borderRadius: 12,
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.4)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.2)',
            backdropFilter: 'blur(12px)',
            zIndex: 9999,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <CheckCircle size={20} style={{ color: '#10b981' }} />
          </motion.div>
          <span style={{ color: '#10b981', fontSize: 13, fontWeight: 700 }}>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}