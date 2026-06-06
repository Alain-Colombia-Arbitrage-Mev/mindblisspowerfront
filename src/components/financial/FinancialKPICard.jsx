import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1200 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value, duration]);

  return (
    <span>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

export default function FinancialKPICard({ icon, label, value, prefix = '', suffix = '', unit, color, live = false, delay = 0, subValue, subLabel }) {
  const accentColor = color || 'var(--vp-accent)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -1, transition: { duration: 0.2 } }}
      style={{
        position: 'relative',
        padding: '20px 22px',
        borderRadius: 14,
        background: 'var(--vp-surface)',
        border: '1px solid var(--vp-border)',
        boxShadow: 'var(--vp-shadow)',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Live dot */}
      {live && (
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor }}
          />
          <span style={{ color: accentColor, fontSize: 8, fontWeight: 700, letterSpacing: '0.5px' }}>LIVE</span>
        </div>
      )}

      {/* Label */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ color: 'var(--vp-subtle)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
          {label}
        </span>
      </div>

      {/* Value */}
      <div style={{ color: accentColor, fontSize: 26, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.5px', fontFamily: 'Montserrat, sans-serif' }}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
      </div>

      {/* Unit */}
      {unit && (
        <p style={{ color: 'var(--vp-muted)', fontSize: 10, margin: '6px 0 0 0', fontWeight: 500 }}>{unit}</p>
      )}

      {/* Sub value */}
      {subValue !== undefined && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--vp-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--vp-subtle)', fontSize: 9 }}>{subLabel}</span>
          <span style={{ color: accentColor, fontSize: 11, fontWeight: 700 }}>{prefix}{subValue.toLocaleString()}{suffix}</span>
        </div>
      )}
    </motion.div>
  );
}
