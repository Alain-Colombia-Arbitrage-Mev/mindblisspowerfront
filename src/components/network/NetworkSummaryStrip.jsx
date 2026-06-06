/**
 * NETWORK SUMMARY STRIP
 * Shows key metrics for Embajador Corona's network at the top of the module
 */
import { motion } from 'framer-motion';

export default function NetworkSummaryStrip({ summary = {}, rootName }) {
  const metrics = [
    { label: 'Total',     value: summary.total ?? 0,       color: 'var(--vp-accent)' },
    { label: 'Izquierda', value: summary.leftCount ?? 0,   color: 'var(--vp-accent)' },
    { label: 'Derecha',   value: summary.rightCount ?? 0,  color: 'var(--vp-amber)' },
    { label: 'Activos',   value: summary.activeCount ?? 0, color: 'var(--vp-text-soft)' },
    { label: 'Directos',  value: summary.directCount ?? 0, color: 'var(--vp-muted)' },
    { label: 'Generación Máx.', value: summary.maxDepth ?? 0, color: 'var(--vp-subtle)' },
    { label: 'Invertido', value: `$${((summary.totalInvested ?? 0) / 1000).toFixed(0)}K`, color: 'var(--vp-accent)', isString: true },
    { label: 'Promedio',  value: `$${(summary.avgInvestment ?? 0).toLocaleString()}`,      color: 'var(--vp-amber)', isString: true },
  ];

  return (
    <div style={{
      background: 'var(--vp-shell)',
      borderBottom: '1px solid var(--vp-border)',
      padding: '10px 20px',
      flexShrink: 0,
    }}>
      {/* Root identity row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: 'var(--vp-accent-muted)',
          border: '1px solid var(--vp-accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 900, color: 'var(--vp-accent)', flexShrink: 0,
        }}>
          {(rootName || 'EC').split(' ').slice(0,2).map(w=>w[0]).join('')}
        </div>
        <div>
          <p style={{ color: 'var(--vp-text)', fontSize: 10, fontWeight: 800, margin: 0, letterSpacing: '0.3px' }}>
            {rootName || 'Embajador Corona'}
          </p>
          <p style={{ color: 'var(--vp-subtle)', fontSize: 8, margin: 0 }}>
            {summary.leftCount}L · {summary.rightCount}R · {summary.total} descendientes
          </p>
        </div>
        {/* Validation badge — neutral, not green */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: 'var(--vp-accent-muted)', border: '1px solid var(--vp-accent-border)' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--vp-accent)' }} />
          <span style={{ color: 'var(--vp-accent)', fontSize: 8, fontWeight: 700, letterSpacing: '0.5px' }}>93 / 93 VALIDADO</span>
        </div>
      </div>

      {/* Metric strip — clean, no icons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {metrics.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            style={{
              padding: '4px 10px',
              borderRadius: 7,
              background: 'var(--vp-surface)',
              border: '1px solid var(--vp-border)',
            }}
          >
            <p style={{ color: 'var(--vp-subtle)', fontSize: 6, fontWeight: 700, margin: '0 0 1px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</p>
            <p style={{ color: m.color, fontSize: 11, fontWeight: 900, margin: 0, lineHeight: 1 }}>
              {m.isString ? m.value : typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
