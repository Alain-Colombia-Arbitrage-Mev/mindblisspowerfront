import { motion, AnimatePresence } from 'framer-motion';
import { useNotification, notificationConfig } from '@/hooks/useNotification';
import { X } from 'lucide-react';
import { useEffect } from 'react';

function NotificationItem({ notif, onDismiss }) {
  const config = notificationConfig[notif.type] || notificationConfig.SISTEMA;

  // Auto-dismiss after 5s
  useEffect(() => {
    const t = setTimeout(() => onDismiss(notif.id), 5000);
    return () => clearTimeout(t);
  }, [notif.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 360, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 360, scale: 0.9 }}
      transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 5, ease: 'linear' }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2, background: config.color + '80',
          transformOrigin: 'left',
        }}
      />
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 12,
          background: 'rgba(8,18,40,0.96)',
          border: `1px solid ${config.color}35`,
          backdropFilter: 'blur(16px)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 24px ${config.color}15`,
          display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: 340,
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}
        >
          {config.icon}
        </motion.div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: '0 0 3px 0' }}>{notif.title}</p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: 0, lineHeight: 1.4 }}>{notif.description}</p>
        </div>
        <motion.button
          onClick={() => onDismiss(notif.id)}
          whileHover={{ scale: 1.2, color: 'rgba(255,255,255,0.8)' }}
          whileTap={{ scale: 0.9 }}
          style={{ flexShrink: 0, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          <X size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function NotificationPopup() {
  const { notifications, deleteNotification } = useNotification();
  const popups = notifications.filter(n => !n.read).slice(0, 3);

  return (
    <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
      <AnimatePresence mode="popLayout">
        {popups.map((notif) => (
          <div key={notif.id} style={{ pointerEvents: 'auto' }}>
            <NotificationItem notif={notif} onDismiss={deleteNotification} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}