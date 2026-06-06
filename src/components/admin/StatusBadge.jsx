import { motion } from 'framer-motion';

/**
 * StatusBadge
 * Visual indicator for resource status with animations
 */

const STATUS_CONFIG = {
  available: {
    color: '#10b981',
    label: 'Available',
    pulse: true,
  },
  editing: {
    color: '#f59e0b',
    label: 'Editing',
    pulse: true,
  },
  locked: {
    color: '#ef5350',
    label: 'Locked',
    pulse: false,
  },
  pending: {
    color: '#3b82f6',
    label: 'Pending',
    pulse: true,
  },
  completed: {
    color: '#10b981',
    label: 'Completed',
    pulse: false,
  },
  conflict: {
    color: '#ef5350',
    label: 'Conflict',
    pulse: true,
  },
};

export default function StatusBadge({ status = 'available', size = 'md', showLabel = true }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.available;
  const sizeMap = { sm: 8, md: 10, lg: 12 };
  const dotSize = sizeMap[size] || 10;

  return (
    <div className="flex items-center gap-2">
      {/* Animated Dot */}
      <motion.div
        className="rounded-full flex-shrink-0"
        style={{
          width: dotSize,
          height: dotSize,
          background: config.color,
          boxShadow: `0 0 8px ${config.color}60`,
        }}
        animate={
          config.pulse
            ? {
                boxShadow: [
                  `0 0 8px ${config.color}60`,
                  `0 0 16px ${config.color}80`,
                  `0 0 8px ${config.color}60`,
                ],
              }
            : {}
        }
        transition={config.pulse ? { duration: 2, repeat: Infinity } : {}}
      />

      {/* Label */}
      {showLabel && (
        <span
          style={{
            color: config.color,
            fontSize: size === 'sm' ? '10px' : size === 'lg' ? '13px' : '11px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}