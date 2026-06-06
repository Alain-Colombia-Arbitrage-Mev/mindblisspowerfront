import { motion } from 'framer-motion';
import AnimatedNumber from '@/components/ux/AnimatedNumber';

export default function EnhancedKPICard({ icon, label, value, prefix = '', suffix = '', color = 'var(--vp-accent)', change = null, live = false }) {
  const isNumeric = typeof value === 'number';
  const accentColor = color === '#3b82f6' || color === '#60A5FA' || color === '#93C5FD' ? 'var(--vp-accent)' : color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -1,
        borderColor: 'var(--vp-border-strong)',
      }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="p-5 rounded-xl cursor-pointer"
      style={{
        background: 'var(--vp-surface)',
        border: '1px solid var(--vp-border)',
        boxShadow: 'none',
        transition: 'border-color 200ms ease',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        {icon && (() => {
          const IconComp = icon;
          return (
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--vp-accent-muted)', border: '1px solid var(--vp-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconComp size={13} style={{ color: accentColor }} />
            </div>
          );
        })()}
        {live && (
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--vp-accent)' }}
          />
        )}
      </div>
      <p style={{ color: 'var(--vp-muted)', fontSize: 9, fontWeight: 700, margin: '0 0 5px 0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        {label}
      </p>
      <p style={{ color: accentColor, fontSize: 22, fontWeight: 900, margin: '0 0 4px 0', fontVariantNumeric: 'tabular-nums' }}>
        {isNumeric
          ? <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
          : `${prefix}${value}${suffix}`
        }
      </p>
      {change !== null && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ color: change > 0 ? 'var(--vp-accent)' : 'var(--vp-danger)', fontSize: 10, fontWeight: 700, margin: 0 }}
        >
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
        </motion.p>
      )}
    </motion.div>
  );
}
