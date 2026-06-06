import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown, Clock, MapPin } from 'lucide-react';

/**
 * Active Admins Panel
 * Real-time display of who's online, where they are, and what they're doing
 */

export default function ActiveAdminsPanel({ activeSessions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeAgo, setTimeAgo] = useState({});

  // Update "time ago" display
  useEffect(() => {
    const timer = setInterval(() => {
      const updated = {};
      activeSessions.forEach(session => {
        const ago = Math.floor((Date.now() - session.lastActivity) / 1000);
        if (ago < 60) {
          updated[session.adminId] = 'just now';
        } else if (ago < 3600) {
          updated[session.adminId] = `${Math.floor(ago / 60)}m ago`;
        } else {
          updated[session.adminId] = `${Math.floor(ago / 3600)}h ago`;
        }
      });
      setTimeAgo(updated);
    }, 10000);

    return () => clearInterval(timer);
  }, [activeSessions]);

  const getRoleColor = (role) => {
    const colors = {
      admin: '#3b82f6',
      finance: '#10b981',
      support: '#f59e0b',
      operations: '#a855f7',
    };
    return colors[role] || '#3b82f6';
  };

  const getStatusColor = (status) => {
    return status === 'active' ? '#10b981' : '#fb923c';
  };

  return (
    <div className="fixed bottom-6 right-6 z-40" style={{ fontFamily: 'Inter, sans-serif' }}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all"
        style={{
          background: 'rgba(8,18,40,0.95)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'white',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <Users size={14} />
          <span style={{ fontSize: 12, fontWeight: 700 }}>{activeSessions.length}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Online</span>
        </div>
        <ChevronDown
          size={14}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 200ms ease',
          }}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: -8, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full right-0 w-72 mb-3 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(4,10,22,0.98)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5, margin: 0 }}>
                ACTIVE ADMINS
              </p>
            </div>

            {/* Sessions List */}
            <div className="max-h-96 overflow-y-auto">
              {activeSessions.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
                    No other admins online
                  </p>
                </div>
              ) : (
                activeSessions.map((session, idx) => (
                  <motion.div
                    key={session.adminId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="px-4 py-3 border-b hover:bg-white/5 transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: getStatusColor(session.status) }}
                        />
                        <div className="flex-1 min-w-0">
                          <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>
                            {session.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="px-1.5 py-0.5 rounded text-xs font-semibold"
                              style={{
                                background: `${getRoleColor(session.role)}20`,
                                color: getRoleColor(session.role),
                              }}
                            >
                              {session.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Module & Action */}
                    {session.module && (
                      <div className="flex items-start gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <MapPin size={11} style={{ marginTop: 2, flexShrink: 0 }} />
                        <div className="flex-1">
                          <p style={{ margin: 0, fontWeight: 600 }}>{session.module}</p>
                          {session.action && (
                            <p style={{ margin: '2px 0 0 0', opacity: 0.7 }}>
                              {session.action}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Last Activity */}
                    <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      <Clock size={10} />
                      <span>{timeAgo[session.adminId] || 'just now'}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, margin: 0 }}>
                Real-time collaboration enabled
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}