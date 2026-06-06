import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Trash2 } from 'lucide-react';
import { useNotification, notificationConfig } from '@/hooks/useNotification';
import { Link } from 'react-router-dom';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function Notificaciones() {
  const { notifications, markAsRead, deleteNotification, markAllAsRead, clearAll } = useNotification();
  const [filter, setFilter] = useState('todas');

  const filters = ['todas', 'SISTEMA', 'ACTIVACION', 'REVISION', 'FORMACION', 'RED'];

  const filtered = filter === 'todas'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unreadCount = filtered.filter(n => !n.read).length;

  return (
    <div className="min-h-screen py-20 px-4" style={{ background: 'linear-gradient(135deg, #050c1a 0%, #0a1628 100%)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <Bell size={24} style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <h1 className="font-montserrat font-black text-3xl text-white">Centro de notificaciones</h1>
                <p className="text-white/50 text-sm mt-1">{filtered.length} notificaciones</p>
              </div>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
              >
                <Trash2 size={16} />
                Limpiar
              </button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.1 }} className="mb-8 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === f
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/80'
              }`}
              style={{
                background: filter === f ? 'rgba(59,130,246,0.2)' : 'transparent',
                border: filter === f ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {f === 'todas' ? 'Todas' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </motion.div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="p-12 text-center rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <Bell size={48} className="text-white/20 mx-auto mb-4" />
              <p className="text-white/50 text-base">Sin notificaciones en esta categoría</p>
            </motion.div>
          ) : (
            filtered.map((notif, i) => {
              const config = notificationConfig[notif.type] || notificationConfig.SISTEMA;
              return (
                <motion.button
                  key={notif.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  onClick={() => markAsRead(notif.id)}
                  className="w-full text-left p-4 rounded-xl border transition-all hover:border-opacity-100"
                  style={{
                    background: notif.read ? 'rgba(13,31,60,0.4)' : 'rgba(13,31,60,0.8)',
                    border: `1px solid ${config.color}${notif.read ? '15' : '40'}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="text-2xl flex-shrink-0">{config.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-sm font-semibold ${notif.read ? 'text-white/50' : 'text-white'}`}>
                            {notif.title}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: config.bgColor, color: config.color }}>
                            {notif.type.charAt(0) + notif.type.slice(1).toLowerCase()}
                          </span>
                        </div>
                        <p className={`text-sm ${notif.read ? 'text-white/40' : 'text-white/60'}`}>
                          {notif.description}
                        </p>
                        <p className="text-xs text-white/30 mt-3">
                          {formatFullTime(notif.timestamp)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="flex-shrink-0 p-2 text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>

        {/* Back Link */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.3 }} className="mt-12 text-center">
          <Link to="/dashboard" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
            ← Volver al panel
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function formatFullTime(date) {
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}