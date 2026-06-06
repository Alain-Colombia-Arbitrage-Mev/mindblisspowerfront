import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function FocusInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  success,
  icon: Icon,
  disabled,
  style = {},
  ...props
}) {
  const [focused, setFocused] = useState(false);

  const borderColor = error ? 'rgba(239,68,68,0.6)'
    : success ? 'rgba(16,185,129,0.5)'
    : focused ? 'rgba(59,130,246,0.6)'
    : 'rgba(255,255,255,0.1)';

  const glowColor = error ? 'rgba(239,68,68,0.12)'
    : success ? 'rgba(16,185,129,0.08)'
    : focused ? 'rgba(59,130,246,0.1)'
    : 'transparent';

  return (
    <div style={{ marginBottom: 16, ...style }}>
      {label && (
        <motion.label
          animate={{ color: focused ? '#93C5FD' : 'rgba(255,255,255,0.5)' }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}
        >
          {label}
        </motion.label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: focused ? '#3b82f6' : 'rgba(255,255,255,0.3)', transition: 'color 200ms ease', pointerEvents: 'none' }} />
        )}
        <motion.input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          animate={{ borderColor, boxShadow: `0 0 0 3px ${glowColor}` }}
          transition={{ duration: 0.2 }}
          style={{
            width: '100%',
            padding: `10px ${(error || success) ? '36px' : '12px'} 10px ${Icon ? '36px' : '12px'}`,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${borderColor}`,
            color: 'white',
            fontSize: 13,
            outline: 'none',
            transition: 'all 200ms ease',
            boxSizing: 'border-box',
          }}
          {...props}
        />
        {error && <AlertCircle size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }} />}
        {success && !error && <CheckCircle size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} />}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ color: '#f87171', fontSize: 10, marginTop: 4, fontWeight: 500 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}