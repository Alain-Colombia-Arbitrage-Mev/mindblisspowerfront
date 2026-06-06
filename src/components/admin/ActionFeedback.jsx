import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, Loader } from 'lucide-react';

/**
 * Action Feedback Component
 * Displays success/error messages and loading states
 */

export default function ActionFeedback({ loading, error, success }) {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-center gap-2.5 p-4 rounded-lg"
          style={{
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.3)',
          }}
        >
          <Loader size={16} className="animate-spin" style={{ color: '#3b82f6' }} />
          <p style={{ color: '#3b82f6', fontSize: 12, fontWeight: 600, margin: 0 }}>
            Processing action...
          </p>
        </motion.div>
      )}

      {success && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-start gap-3 p-4 rounded-lg"
          style={{
            background: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
          }}
        >
          <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ color: '#10b981', fontSize: 12, fontWeight: 700, margin: '0 0 2px 0' }}>
              Success
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>
              {success.message}
            </p>
            {success.timestamp && (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: '2px 0 0 0' }}>
                {new Date(success.timestamp).toLocaleTimeString()}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-start gap-3 p-4 rounded-lg"
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, margin: '0 0 2px 0' }}>
              Error
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>
              {error}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}