/**
 * NETWORK SUMMARY STRIP
 * Barra de métricas de la red — estilo Figma "Carlos 93L - 93R"
 */
import { motion } from 'framer-motion';

export default function NetworkSummaryStrip({ summary = {}, rootName }) {
  const metrics = [
    { label: 'Total',          value: summary.total ?? 0,        color: 'var(--vp-accent)' },
    { label: 'Izquierda',      value: summary.leftCount ?? 0,    color: 'var(--vp-accent)' },
    { label: 'Derecha',        value: summary.rightCount ?? 0,   color: 'var(--vp-accent)' },
    { label: 'Activos',        value: summary.activeCount ?? 0,  color: 'var(--vp-accent)' },
    { label: 'Directos',       value: summary.directCount ?? 0,  color: 'var(--vp-accent)' },
    { label: 'Generación Máx.', value: summary.maxDepth ?? 0,    color: 'var(--vp-accent)' },
    { label: 'Invertido', value: `$${((summary.totalInvested ?? 0) / 1000).toFixed(0)}K`, color: 'var(--vp-green, var(--vp-accent))', isString: true },
    { label: 'Promedio',  value: `$${(summary.avgInvestment ?? 0).toLocaleString()}`,      color: 'var(--vp-green, var(--vp-accent))', isString: true },
  ];

  const first = (rootName || 'Carlos').split(' ')[0];

  return (
    <div style={{
      background: 'var(--vp-surface)',
      border: '1px solid var(--vp-border)',
      borderRadius: 16,
      margin: '12px 20px',
      padding: '16px 20px',
      flexShrink: 0,
    }}>
      {/* Identidad — "Carlos 93L - 93R" */}
      <p style={{
        color: 'var(--vp-text)', fontSize: 14, fontWeight: 800, margin: '0 0 12px 0',
        letterSpacing: '0.2px',
      }}>
        {first}{' '}
        <span style={{ color: 'var(--vp-accent)' }}>
          {summary.leftCount ?? 0}L - {summary.rightCount ?? 0}R
        </span>
      </p>

      {/* Chips de métricas */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {metrics.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            style={{
              minWidth: 64,
              padding: '8px 14px',
              borderRadius: 10,
              background: 'var(--vp-surface-raised)',
              border: '1px solid var(--vp-border)',
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--vp-muted)', fontSize: 9, fontWeight: 600, margin: '0 0 4px 0' }}>{m.label}</p>
            <p style={{ color: m.color, fontSize: 14, fontWeight: 900, margin: 0, lineHeight: 1 }}>
              {m.isString ? m.value : typeof m.value === 'number' ? String(m.value).padStart(2, '0') : m.value}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
