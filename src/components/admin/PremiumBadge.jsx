export default function PremiumBadge({ status, label }) {
  const config = {
    critical: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', pulse: true },
    warning: { bg: 'rgba(251,146,60,0.12)', color: '#fb923c', pulse: false },
    success: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', pulse: false },
    info: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', pulse: false },
    pending: { bg: 'rgba(168,85,247,0.12)', color: '#a855f7', pulse: true },
  };

  const cfg = config[status] || config.info;

  return (
    <span
      className={cfg.pulse ? 'status-critical' : ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 6,
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 700,
        border: `1px solid ${cfg.color}20`,
      }}>
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: cfg.color,
          animation: cfg.pulse ? 'pulse 2s infinite' : 'none',
        }}
      />
      {label}
    </span>
  );
}