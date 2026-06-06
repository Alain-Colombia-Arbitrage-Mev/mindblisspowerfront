import { motion } from 'framer-motion';

export default function LeftRightComparison({ leftInvestment, rightInvestment, leftCount, rightCount }) {
  const total = leftInvestment + rightInvestment || 1;
  const leftPct = Math.round((leftInvestment / total) * 100);
  const rightPct = 100 - leftPct;
  const minSide = Math.min(leftInvestment, rightInvestment);
  const binaryBonus = minSide * 0.10;
  const isBalanced = Math.abs(leftPct - rightPct) <= 10;

  return (
    <div style={{
      padding: '24px',
      borderRadius: 14,
      background: 'var(--vp-surface)',
      border: '1px solid var(--vp-border)',
      boxShadow: 'var(--vp-shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <p style={{ color: 'var(--vp-subtle)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', margin: 0 }}>
          Balance Izquierda / Derecha
        </p>
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 9, fontWeight: 700,
            background: isBalanced ? 'var(--vp-accent-muted)' : 'var(--vp-amber-muted)',
            color: isBalanced ? 'var(--vp-accent)' : 'var(--vp-amber)',
            border: `1px solid ${isBalanced ? 'var(--vp-accent-border)' : 'var(--vp-amber-border)'}`,
          }}
        >
          {isBalanced ? '✓ BALANCEADO' : '⚠ DESBALANCE'}
        </motion.div>
      </div>

      {/* Side-by-side bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Izquierda', icon: '◀', value: leftInvestment, pct: leftPct, count: leftCount, color: 'var(--vp-accent)', bg: 'var(--vp-accent-muted)', border: 'var(--vp-accent-border)' },
          { label: 'Derecha', icon: '▶', value: rightInvestment, pct: rightPct, count: rightCount, color: 'var(--vp-amber)', bg: 'var(--vp-amber-muted)', border: 'var(--vp-amber-border)' },
        ].map((side, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 + 0.2 }}
            style={{
              padding: '16px',
              borderRadius: 12,
              background: side.bg,
              border: `1px solid ${side.border}`,
              textAlign: 'center',
            }}
          >
            <p style={{ color: side.color, fontSize: 20, margin: '0 0 4px 0' }}>{side.icon}</p>
            <p style={{ color: 'var(--vp-muted)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 8px 0' }}>{side.label}</p>
            <p style={{ color: side.color, fontSize: 22, fontWeight: 900, margin: '0 0 2px 0', fontFamily: 'Montserrat, sans-serif' }}>
              ${(side.value / 1000).toFixed(1)}K
            </p>
            <p style={{ color: 'var(--vp-subtle)', fontSize: 10, margin: '0 0 12px 0' }}>{side.count} miembros</p>

            {/* Vertical fill bar */}
            <div style={{ height: 60, background: 'var(--vp-shell)', border: '1px solid var(--vp-border)', borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${side.pct}%` }}
                transition={{ duration: 1.2, delay: i * 0.1 + 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  background: side.color,
                  boxShadow: 'none',
                  borderRadius: 6,
                }}
              />
            </div>
            <p style={{ color: side.color, fontSize: 14, fontWeight: 800, margin: '8px 0 0 0' }}>{side.pct}%</p>
          </motion.div>
        ))}
      </div>

      {/* Binary Bonus */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 10,
        background: 'var(--vp-amber-muted)',
        border: '1px solid var(--vp-amber-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <p style={{ color: 'var(--vp-muted)', fontSize: 10, margin: 0 }}>Bonus Binario (10% mín.)</p>
          <p style={{ color: 'var(--vp-subtle)', fontSize: 9, margin: 0 }}>
            Lado mínimo: ${minSide.toLocaleString()}
          </p>
        </div>
        <span style={{ color: 'var(--vp-amber)', fontSize: 18, fontWeight: 900 }}>
          ${Math.round(binaryBonus).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
