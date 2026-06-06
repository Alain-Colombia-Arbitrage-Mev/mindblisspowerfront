import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification, notificationConfig } from '@/hooks/useNotification';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
  const { notifications, markAsRead } = useNotification();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifs = notifications.slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg transition-all hover:bg-white/5"
      >
        <Bell size={20} className="text-white/80" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: '#ef6b67' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-96 rounded-xl shadow-2xl z-50"
            style={{
              background: 'rgba(13,31,60,0.95)',
              border: '1px solid rgba(59,130,246,0.2)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-semibold text-white">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(239,107,103,0.2)', color: '#ef6b67' }}>
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {recentNotifs.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">Sin notificaciones</p>
                </div>
              ) : (
                recentNotifs.map((notif) => {
                  const config = notificationConfig[notif.type] || notificationConfig.SISTEMA;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.link) {
                          window.location.href = notif.link;
                        }
                      }}
                      className="w-full px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-all text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-lg flex-shrink-0">{config.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm ${notif.read ? 'text-white/50' : 'text-white font-semibold'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-white/40 mt-1 line-clamp-2">{notif.description}</p>
                          <p className="text-xs text-white/25 mt-2">
                            {formatTime(notif.timestamp)}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: config.color }} />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <Link
                to="/notificaciones"
                onClick={() => setOpen(false)}
                className="block w-full p-3 text-center text-sm font-medium text-blue-400 border-t border-white/10 hover:bg-white/5 transition-all"
              >
                Ver todas las notificaciones →
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'hace unos segundos';
  if (minutes < 60) return `hace ${minutes}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7) return `hace ${days}d`;

  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}