/**
 * GENERATION VIEW — Shows all members grouped by generation depth
 */
import { motion } from 'framer-motion';

const SIDE_COLORS = { left: 'var(--vp-accent)', right: 'var(--vp-amber)' };

export default function TreeGenerationView({ dataset, onSelect }) {
  const members = dataset.members;

  // Group by generation depth
  const byGen = {};
  members.forEach(m => {
    const g = m.generation_depth;
    if (!byGen[g]) byGen[g] = [];
    byGen[g].push(m);
  });

  const gens = Object.keys(byGen).sort((a,b) => a - b);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <p style={{ color: 'var(--vp-subtle)', fontSize: 10, fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Vista por Generación · {members.length} miembros
      </p>
      {gens.map(gen => (
        <motion.div
          key={gen}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Number(gen) * 0.05 }}
          style={{ marginBottom: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--vp-accent-muted)', border: '1px solid var(--vp-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--vp-accent)', fontSize: 11, fontWeight: 900 }}>G{gen}</span>
            </div>
            <p style={{ color: 'var(--vp-muted)', fontSize: 10, fontWeight: 700, margin: 0 }}>
              Generación {gen} · {byGen[gen].length} miembros
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {byGen[gen].map(m => {
              const sc = SIDE_COLORS[m.binary_side] || '#fbbf24';
              return (
                <motion.div
                  key={m.user_id}
                  whileHover={{ y: -2, boxShadow: `0 4px 12px ${sc}20` }}
                  onClick={() => onSelect(m)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: m.binary_side === 'left' ? 'var(--vp-accent-muted)' : 'var(--vp-amber-muted)',
                    border: `1px solid ${m.binary_side === 'left' ? 'var(--vp-accent-border)' : 'var(--vp-amber-border)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--vp-surface)', border: `1px solid ${m.binary_side === 'left' ? 'var(--vp-accent-border)' : 'var(--vp-amber-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: sc, fontSize: 8, fontWeight: 900 }}>
                      {m.full_name.split(' ').slice(0,2).map(w=>w[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p style={{ color: 'var(--vp-text)', fontSize: 9, fontWeight: 700, margin: 0 }}>
                      {m.full_name.split(' ').slice(0,2).join(' ')}
                    </p>
                    <p style={{ color: sc, fontSize: 7, fontWeight: 700, margin: 0 }}>
                      ${m.investment_amount.toLocaleString()} · {m.binary_side === 'left' ? '◀' : '▶'}
                    </p>
                  </div>
                  {m.status === 'inactivo' && (
                    <span style={{ color: '#6b7280', fontSize: 7, fontWeight: 700 }}>⚫</span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
