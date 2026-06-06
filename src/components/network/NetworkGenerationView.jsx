/**
 * NetworkGenerationView — groups members by generation depth
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';

const GEN_COLORS = ['#fbbf24','#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ec4899','#84cc16'];

export default function NetworkGenerationView({ dataset, onSelect }) {
  const byGeneration = useMemo(() => {
    const map = {};
    dataset.members.forEach(m => {
      const g = m.generation_depth || 1;
      if (!map[g]) map[g] = [];
      map[g].push(m);
    });
    return Object.entries(map).sort(([a], [b]) => Number(a) - Number(b));
  }, [dataset]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {byGeneration.map(([gen, members], gi) => {
          const color = GEN_COLORS[gi % GEN_COLORS.length];
          const activeCount = members.filter(m => m.status === 'activo').length;
          const totalInv = members.reduce((s, m) => s + (m.investment_amount || 0), 0);
          return (
            <div key={gen}>
              {/* Gen header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${color}18`, border: `1.5px solid ${color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color, fontSize: 13, fontWeight: 900,
                }}>G{gen}</div>
                <div>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: 13, margin: 0 }}>
                    Generación {gen}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0 }}>
                    {members.length} miembros · {activeCount} activos · ${totalInv.toLocaleString()} invertido
                  </p>
                </div>
                <div style={{
                  marginLeft: 'auto', padding: '4px 12px', borderRadius: 20,
                  background: `${color}12`, border: `1px solid ${color}25`,
                  color, fontSize: 10, fontWeight: 800,
                }}>
                  {Math.round((activeCount / members.length) * 100)}% activo
                </div>
              </div>

              {/* Members grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                {members.map((m, i) => (
                  <motion.div
                    key={m.user_id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={() => onSelect(m)}
                    style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${m.status === 'activo' ? color + '22' : 'rgba(255,255,255,0.06)'}`,
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: m.binary_side === 'left' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                      border: `1.5px solid ${m.binary_side === 'left' ? '#3b82f660' : '#8b5cf660'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 900,
                      color: m.binary_side === 'left' ? '#3b82f6' : '#8b5cf6',
                    }}>
                      {(m.full_name || '').split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(m.full_name || '').split(' ').slice(0, 2).join(' ')}
                      </p>
                      <p style={{ color: color, fontSize: 9, fontWeight: 700, margin: 0 }}>
                        ${(m.investment_amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div style={{
                      marginLeft: 'auto', width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: m.status === 'activo' ? '#10b981' : '#374151',
                    }} />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}