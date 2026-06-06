import { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, UserPlus, AlertTriangle, Bell } from 'lucide-react';

/**
 * CollaborationNotification
 * Real-time alerts for multi-admin actions, assignments, and conflicts
 */

const NOTIFICATION_ICONS = {
  action: CheckCircle,
  assignment: UserPlus,
  conflict: AlertTriangle,
  alert: AlertCircle,
  default: Bell,
};

const NOTIFICATION_COLORS = {
  action: '#10b981',
  assignment: '#3b82f6',
  conflict: '#ef5350',
  alert: '#fb923c',
  default: '#3b82f6',
};

export default function CollaborationNotification() {
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Mock notification system - can be replaced with real-time events
  useEffect(() => {
    // Example: listen for task assignments
    const interval = setInterval(() => {
      // Check for new activity (integrate with your event system)
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const addNotification = (type, title, message, duration = 4000) => {
    const id = Date.now();
    const notification = { id, type, title, message };

    setNotifications((prev) => [...prev, notification]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  };

  // Expose globally for triggering from other components
  useEffect(() => {
    window.collaborationNotify = addNotification;
  }, []);

  return (
    <div className="fixed top-6 right-6 z-50 space-y-3 pointer-events-none" ref={notifRef}>
      <AnimatePresence>
        {notifications.map((notif) => {
          const Icon = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.default;
          const color = NOTIFICATION_COLORS[notif.type] || NOTIFICATION_COLORS.default;

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 400, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="pointer-events-auto p-4 rounded-lg backdrop-blur-md"
              style={{
                background: `${color}15`,
                border: `1px solid ${color}40`,
                minWidth: '320px',
                boxShadow: `0 4px 20px rgba(0,0,0,0.2)`,
              }}
            >
              <div className="flex items-start gap-3">
                <Icon size={18} style={{ color, marginTop: '2px', flexShrink: 0 }} />

                <div className="flex-1">
                  <p style={{ color, fontSize: '13px', fontWeight: 700, margin: '0 0 4px' }}>
                    {notif.title}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0 }}>
                    {notif.message}
                  </p>
                </div>

                {/* Progress Bar */}
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 4 }}
                  className="absolute bottom-0 left-0 h-1 origin-left"
                  style={{ background: color }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * Notification Type Examples
 *
 * Action Notification:
 * collaborationNotify('action', 'Payment Updated', 'Finance team approved batch #42')
 *
 * Assignment Notification:
 * collaborationNotify('assignment', 'New Task', 'You were assigned: Review participant data')
 *
 * Conflict Warning:
 * collaborationNotify('conflict', 'Edit Conflict', 'Admin John is editing this participant')
 *
 * Alert Notification:
 * collaborationNotify('alert', 'Compliance Issue', 'Leader verification pending approval')
 */

/**
 * Hook for triggering notifications
 */
export function useCollaborationNotify() {
  const notify = (type, title, message, duration = 4000) => {
    if (window.collaborationNotify) {
      window.collaborationNotify(type, title, message, duration);
    }
  };

  return { notify };
}