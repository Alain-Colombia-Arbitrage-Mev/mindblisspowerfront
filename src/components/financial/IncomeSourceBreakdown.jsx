import { motion } from 'framer-motion';

export default function IncomeSourceBreakdown({ bonusData }) {
  const sources = [
    { label: 'Actividad Personal', icon: '○', value: bonusData.monthlyBase, color: 'var(--vp-text-soft)', desc: 'Base mensual personal' },
    { label: 'Bonus Binario',      icon: '◎', value: bonusData.binaryBonus, color: 'var(--vp-accent)', desc: 'Mínimo de ambas ramas' },
    { label: 'Red Profunda',       icon: '◇', value: bonusData.networkBonus, color: 'var(--vp-amber)', desc: '2% de red total' },
    { label: 'Directos',           icon: '◆', value: bonusData.directBonus, color: 'var(--vp-accent-strong)', desc: '$50 por referido' },
  ];

  const total = bonusData.monthlyTotal || 1;

  return (
    <div style={{
      padding: '24px',
      borderRadius: 14,
      background: 'var(--vp-surface)',
      border: '1px solid var(--vp-border)',
      boxShadow: 'var(--vp-shadow)',
    }}>
      <p style={{ color: 'var(--vp-subtle)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 18px 0' }}>
        Fuentes de Ingreso
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {sources.map((src, i) => {
          const pct = Math.round((src.value / total) * 100) || 0;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 + 0.2 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{src.icon}</span>
                  <div>
                    <p style={{ color: 'var(--vp-text-soft)', fontSize: 11, fontWeight: 700, margin: 0 }}>{src.label}</p>
                    <p style={{ color: 'var(--vp-muted)', fontSize: 9, margin: 0 }}>{src.desc}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: src.color, fontSize: 13, fontWeight: 800, margin: 0 }}>
                    ${Math.round(src.value).toLocaleString()}
                  </p>
                  <p style={{ color: 'var(--vp-subtle)', fontSize: 9, margin: 0 }}>{pct}%</p>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 5, background: 'var(--vp-shell)', border: '1px solid var(--vp-border)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: i * 0.08 + 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    background: src.color,
                    boxShadow: 'none',
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Total row */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--vp-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--vp-muted)', fontSize: 11, fontWeight: 600 }}>Total mensual</span>
        <span style={{ color: 'var(--vp-text)', fontSize: 18, fontWeight: 900 }}>
          ${Math.round(total).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
