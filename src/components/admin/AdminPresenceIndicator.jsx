import { useEffect, useState } from 'react';
import useAdminSession from '@/hooks/useAdminSession';
import { motion } from 'framer-motion';

/**
 * AdminPresenceIndicator
 * Shows live admin avatars with status indicators
 */

export default function AdminPresenceIndicator() {
  const { activeSessions } = useAdminSession();
  const [displaySessions, setDisplaySessions] = useState([]);

  useEffect(() => {
    setDisplaySessions(activeSessions.slice(0, 5)); // Show max 5
  }, [activeSessions]);

  return (
    <div className="flex items-center gap-1">
      {displaySessions.map((session, i) => {
        const initials = session.admin?.name
          ?.split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase() || '?';

        return (
          <motion.div
            key={session.admin_id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative group"
            title={`${session.admin?.name} - ${session.current_module || 'idle'}`}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative border"
              style={{
                background: `linear-gradient(135deg, #3b82f6, #8b5cf6)`,
                color: 'white',
                borderColor: 'rgba(59,130,246,0.3)',
              }}
            >
              {initials}

              {/* Live Indicator */}
              <motion.div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border"
                style={{
                  background: '#10b981',
                  borderColor: 'rgba(4,10,22,0.8)',
                }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>

            {/* Hover Tooltip */}
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
              style={{
                background: 'rgba(8,16,36,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '2px' }}>{session.admin?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
                {session.current_module || 'idle'}
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Count badge if more than 5 */}
      {activeSessions.length > 5 && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          title={`+${activeSessions.length - 5} more admin(s)`}
        >
          +{activeSessions.length - 5}
        </div>
      )}
    </div>
  );
}