import { motion } from 'framer-motion';

export default function VisualAlertIndicator({ alert, onClick = null }) {
  const severityConfig = {
    warning: { dot: 'var(--vp-amber)', bg: 'var(--vp-amber-muted)', border: 'var(--vp-amber-border)' },
    critical: { dot: 'var(--vp-danger)', bg: 'var(--vp-danger-muted)', border: 'var(--vp-danger-border)' },
    info: { dot: 'var(--vp-accent)', bg: 'var(--vp-accent-muted)', border: 'var(--vp-accent-border)' },
    success: { dot: 'var(--vp-accent)', bg: 'var(--vp-accent-muted)', border: 'var(--vp-accent-border)' },
  };

  const config = severityConfig[alert.severity] || severityConfig.info;

  return (
    <motion.div
      whileHover={{ x: 2, borderColor: 'var(--vp-border-strong)' }}
      onClick={onClick}
      className="p-3 rounded-lg cursor-pointer transition-all"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderLeft: `3px solid ${config.dot}`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
          style={{ background: config.dot }}
        />
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--vp-text)', fontSize: 12, fontWeight: 600, margin: '0 0 2px 0' }}>
            {alert.title}
          </p>
          <p style={{ color: 'var(--vp-muted)', fontSize: 10, margin: 0 }}>
            {alert.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
