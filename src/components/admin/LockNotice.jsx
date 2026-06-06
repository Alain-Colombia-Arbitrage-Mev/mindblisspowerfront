import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertTriangle } from 'lucide-react';

/**
 * Lock Notice Component
 * Displays when entity is locked by another admin
 * Allows viewing but prevents editing
 */

export default function LockNotice({ isLocked, lockStatus, canEdit }) {
  if (!isLocked || !lockStatus) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="flex items-start gap-3 p-4 rounded-lg"
        style={{
          background: 'rgba(251,146,60,0.12)',
          border: '1px solid rgba(251,146,60,0.3)',
        }}
      >
        <Lock size={16} style={{ color: '#f59e0b', marginTop: 2, flexShrink: 0 }} />
        <div className="flex-1">
          <p style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, margin: '0 0 2px 0' }}>
            Read-Only Mode
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>
            This item is being edited by <strong>{lockStatus.lockedBy}</strong>. You can view but cannot edit until they finish.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}