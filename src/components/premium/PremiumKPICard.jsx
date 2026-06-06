import { motion } from 'framer-motion';
import AnimatedNumber from './AnimatedNumber';
import LiveIndicator from './LiveIndicator';

export default function PremiumKPICard({
  icon,
  label,
  value,
  unit = '',
  change = null,
  prefix = '$',
  color = '#93C5FD',
  live = false,
  decimals = 0,
}) {
  const isPositive = change > 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="p-5 rounded-lg transition-all"
      style={{
        background: '#121821',
        border: '1px solid #1F2A37',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background glow on hover */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, ${color}10, transparent)`,
          opacity: 0,
        }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
            <span style={{ color: '#6B7280', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
              {label}
            </span>
          </div>
          {live && <LiveIndicator />}
        </div>

        {/* Value */}
        <p style={{ color: color, fontSize: 20, fontWeight: 900, margin: '6px 0' }}>
          <AnimatedNumber
            value={value}
            prefix={prefix}
            suffix={unit}
            decimals={decimals}
            color={color}
          />
        </p>

        {/* Change indicator */}
        {change !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: isPositive ? '#10b981' : '#ef4444',
              marginTop: 6,
            }}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% vs last period
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}