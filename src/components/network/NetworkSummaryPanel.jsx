import { motion } from 'framer-motion';

export default function NetworkSummaryPanel({ summary, maxDepth, setMaxDepth, totalNodes }) {
  const stats = [
    { label: 'Total Red', value: summary.network_total > 0 ? `$${summary.network_total.toLocaleString()}` : '$0', color: '#fbbf24', icon: '💰' },
    { label: 'Rama Izq', value: `$${summary.left_total.toLocaleString()}`, color: '#3b82f6', icon: '◀' },
    { label: 'Rama Der', value: `$${summary.right_total.toLocaleString()}`, color: '#8b5cf6', icon: '▶' },
    { label: 'Miembros', value: summary.deep_count, color: '#10b981', icon: '👥' },
  ];

  const levels = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              padding: '10px 12px', borderRadius: 10,
              background: `${s.color}0D`, border: `1px solid ${s.color}25`,
              borderLeft: `3px solid ${s.color}`,
            }}
          >
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: '0 0 3px 0' }}>{s.icon} {s.label}</p>
            <motion.p
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
              style={{ color: s.color, fontSize: 15, fontWeight: 900, margin: 0, fontFamily: 'Montserrat,sans-serif' }}
            >
              {s.value}
            </motion.p>
          </motion.div>
        ))}
      </div>

      {/* Balance indicator */}
      <div style={{ padding: '8px 12px', borderRadius: 8, background: summary.isBalanced ? 'rgba(16,185,129,0.08)' : 'rgba(251,146,60,0.08)', border: `1px solid ${summary.isBalanced ? 'rgba(16,185,129,0.25)' : 'rgba(251,146,60,0.25)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700 }}>BALANCE BINARIO</span>
          <span style={{ color: summary.isBalanced ? '#10b981' : '#fb923c', fontSize: 9, fontWeight: 800 }}>
            {summary.isBalanced ? '✓ Balanceado' : '⚠ Desbalance'}
          </span>
        </div>
        <div style={{ display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
          {summary.network_total > 0 ? (
            <>
              <div style={{ flex: summary.left_total, background: '#3b82f6', borderRadius: '4px 0 0 4px', minWidth: 4 }} />
              <div style={{ flex: summary.right_total, background: '#8b5cf6', borderRadius: '0 4px 4px 0', minWidth: 4 }} />
            </>
          ) : (
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ color: '#3b82f6', fontSize: 8, fontWeight: 700 }}>IZQ {summary.network_total > 0 ? Math.round(summary.left_total / summary.network_total * 100) : 0}%</span>
          <span style={{ color: '#8b5cf6', fontSize: 8, fontWeight: 700 }}>DER {summary.network_total > 0 ? Math.round(summary.right_total / summary.network_total * 100) : 0}%</span>
        </div>
      </div>

      {/* Level selector */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '1px', textTransform: 'uppercase' }}>Profundidad visible</p>
        <div style={{ display: 'flex', gap: 5 }}>
          {levels.map(l => (
            <button
              key={l}
              onClick={() => setMaxDepth(l)}
              style={{
                flex: 1, padding: '6px 0', borderRadius: 7, border: 'none',
                background: maxDepth === l ? (l <= 2 ? 'rgba(59,130,246,0.25)' : l <= 4 ? 'rgba(139,92,246,0.25)' : 'rgba(251,191,36,0.2)') : 'rgba(255,255,255,0.04)',
                color: maxDepth === l ? 'white' : 'rgba(255,255,255,0.3)',
                fontSize: 10, fontWeight: 800, cursor: 'pointer',
                boxShadow: maxDepth === l ? '0 2px 8px rgba(59,130,246,0.2)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              L{l}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, margin: '0 0 8px 0' }}>LEYENDA</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { color: '#3b82f6', label: 'Rama Izquierda' },
            { color: '#8b5cf6', label: 'Rama Derecha' },
            { color: '#10b981', label: 'Activo' },
            { color: '#6b7280', label: 'Inactivo' },
          ].map((l, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: 600 }}>{l.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px dashed rgba(59,130,246,0.4)', background: 'transparent', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, fontWeight: 600 }}>Espacio disponible</span>
          </div>
        </div>
      </div>
    </div>
  );
}