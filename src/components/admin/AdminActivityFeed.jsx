import { motion, AnimatePresence } from 'framer-motion';
import useActivityLog from '@/hooks/useActivityLog';
import { Activity, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

/**
 * Admin Activity Feed
 * Live real-time display of all admin actions
 */

const STATUS_COLORS = {
  success: '#10b981',
  warning: '#fb923c',
  error: '#ef4444',
};

const ENTITY_COLORS = {
  payment: '#3b82f6',
  participant: '#8b5cf6',
  user: '#06b6d4',
  support_case: '#f59e0b',
  ai_action: '#ec4899',
  auto_mode: '#10b981',
};

const STATUS_ICONS = {
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
};

function formatTime(timestamp) {
  const now = new Date();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return timestamp.toLocaleDateString();
}

export default function AdminActivityFeed({ limit = 30, showHeader = true, compact = false }) {
  const activities = useActivityLog(limit);

  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="flex-shrink-0 pb-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Activity size={16} style={{ color: '#3b82f6' }} />
            <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>
              Live Activity Feed
            </h3>
            <span
              style={{
                background: 'rgba(16,185,129,0.2)',
                color: '#10b981',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {activities.length} events
            </span>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>No activity yet</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {activities.map((activity, index) => {
              const StatusIcon = STATUS_ICONS[activity.status];
              const statusColor = STATUS_COLORS[activity.status];
              const entityColor = ENTITY_COLORS[activity.entityType];

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`border-b last:border-0 overflow-hidden ${
                    compact ? 'py-2' : 'py-3'
                  }`}
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <div className="flex gap-3 px-4">
                    {/* Status Indicator */}
                    {!compact && StatusIcon && (
                      <div className="flex-shrink-0 mt-1">
                        <StatusIcon size={14} style={{ color: statusColor }} />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Action Text */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p
                          style={{
                            color: 'white',
                            fontSize: compact ? 11 : 12,
                            fontWeight: 600,
                            margin: 0,
                          }}
                        >
                          <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                            {activity.adminName}
                          </span>{' '}
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {activity.action}
                          </span>
                        </p>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, flexShrink: 0 }}>
                          {formatTime(activity.timestamp)}
                        </span>
                      </div>

                      {/* Entity Badge + Details */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            background: `${entityColor}18`,
                            color: entityColor,
                          }}
                        >
                          {activity.entityName}
                        </span>
                        {activity.details && (
                          <span
                            style={{
                              color: 'rgba(255,255,255,0.35)',
                              fontSize: 10,
                            }}
                          >
                            {activity.details}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}