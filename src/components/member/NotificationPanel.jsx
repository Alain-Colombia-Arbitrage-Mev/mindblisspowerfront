import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Bell } from 'lucide-react';
import { getPriorityColor } from '@/lib/notificationEngine';

export default function NotificationPanel({ notifications, onClose }) {
  const navigate = useNavigate();
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleClick = (route) => {
    onClose();
    navigate(route);
  };

  const highCount = notifications.filter(n => n.priority === 'high').length;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        width: 340,
        maxHeight: 480,
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(10,22,48,0.98) 0%, rgba(5,12,26,0.98) 100%)',
        border: '1px solid rgba(59,130,246,0.2)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(59,130,246,0.1)',
        backdropFilter: 'blur(20px)',
        zIndex: 9999,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* HEADER */}
      <div style={{
        padding: '14px 18px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div className="flex items-center gap-2">
          <Bell size={14} style={{ color: '#3b82f6' }} />
          <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>Notificaciones</span>
          {highCount > 0 && (
            <span style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444', fontSize: 9, fontWeight: 800, padding: '1px 7px', borderRadius: 20 }}>
              {highCount} urgente{highCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4, borderRadius: 6, display: 'flex' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* LIST */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: 28 }}>✅</span>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '8px 0 0 0' }}>Todo al día</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((n, i) => (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleClick(n.route)}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 18px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left',
                  borderBottom: i < notifications.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 150ms ease',
                }}
                whileHover={{ background: 'rgba(59,130,246,0.06)' }}
              >
                {/* PRIORITY DOT */}
                <div style={{ flexShrink: 0, paddingTop: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <motion.div
                    animate={n.priority === 'high' ? { boxShadow: [`0 0 0 0 ${n.color}60`, `0 0 0 5px ${n.color}00`] } : {}}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0 }}
                  />
                </div>

                {/* CONTENT */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 14 }}>{n.icon}</span>
                    <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>{n.title}</p>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: '0 0 4px 0', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 600 }}>{n.timeLabel}</span>
                </div>

                {/* ARROW */}
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, flexShrink: 0, paddingTop: 2 }}>›</span>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}