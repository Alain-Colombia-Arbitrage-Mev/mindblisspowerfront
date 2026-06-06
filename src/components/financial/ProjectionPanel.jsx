import { motion } from 'framer-motion';

export default function ProjectionPanel({ bonusData, selectedScenario, setSelectedScenario, projection }) {
  const annualProjections = {
    conservative: Math.round(bonusData.monthlyTotal * Math.pow(1.05, 12)),
    stable: Math.round(bonusData.monthlyTotal * Math.pow(1.12, 12)),
    expansion: Math.round(bonusData.monthlyTotal * Math.pow(1.25, 12)),
  };

  const scenarios = [
    { key: 'conservative', label: 'Conservador', icon: '○', growth: '+5%/mes', color: 'var(--vp-muted)', bg: 'var(--vp-surface-raised)', border: 'var(--vp-border)', desc: 'Sin cambios estructurales' },
    { key: 'stable', label: 'Estable', icon: '◎', growth: '+12%/mes', color: 'var(--vp-accent)', bg: 'var(--vp-accent-muted)', border: 'var(--vp-accent-border)', desc: '~3 nuevos/mes', recommended: true },
    { key: 'expansion', label: 'Expansión', icon: '◆', growth: '+25%/mes', color: 'var(--vp-amber)', bg: 'var(--vp-amber-muted)', border: 'var(--vp-amber-border)', desc: '~8 nuevos/mes' },
  ];

  const finalMonth = projection[projection.length - 1];

  return (
    <div style={{
      padding: '24px',
      borderRadius: 14,
      background: 'var(--vp-surface)',
      border: '1px solid var(--vp-border)',
      boxShadow: 'var(--vp-shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <p style={{ color: 'var(--vp-subtle)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', margin: 0 }}>
          Proyección 12 Meses
        </p>
        {finalMonth && (
          <span style={{ color: 'var(--vp-amber)', fontSize: 12, fontWeight: 800 }}>
            Acum: ${finalMonth.cumulative?.toLocaleString()}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {scenarios.map((sc) => (
          <motion.button
            key={sc.key}
            onClick={() => setSelectedScenario(sc.key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '16px 12px',
              borderRadius: 12,
              border: `1px solid ${selectedScenario === sc.key ? sc.border : 'var(--vp-border)'}`,
              background: selectedScenario === sc.key ? sc.bg : 'var(--vp-surface-raised)',
              cursor: 'pointer',
              textAlign: 'left',
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            {sc.recommended && (
              <div style={{ position: 'absolute', top: -8, right: 8, background: 'var(--vp-accent)', color: '#06110f', fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 20 }}>
                RECOMENDADO
              </div>
            )}
            <p style={{ fontSize: 18, margin: '0 0 6px 0' }}>{sc.icon}</p>
            <p style={{ color: 'var(--vp-text)', fontSize: 11, fontWeight: 700, margin: '0 0 2px 0' }}>{sc.label}</p>
            <p style={{ color: sc.color, fontSize: 9, fontWeight: 700, margin: '0 0 8px 0' }}>{sc.growth}</p>
            <p style={{ color: sc.color, fontSize: 16, fontWeight: 900, margin: '0 0 3px 0', fontFamily: 'Montserrat, sans-serif' }}>
              ${annualProjections[sc.key].toLocaleString()}
            </p>
            <p style={{ color: 'var(--vp-muted)', fontSize: 8, margin: 0 }}>{sc.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
