/**
 * NetworkRankView — groups members by rank with visual hierarchy
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';

const RANK_ORDER = ['E. Corona','Embajador','Diamante Negro','Diamante Azul','Diamante','Platino','Oro','Plata','Bronce','Principiante'];
const RANK_COLORS = {
  'E. Corona':      '#ffd700',
  'Embajador':      '#ff6b6b',
  'Diamante Negro': '#a0aec0',
  'Diamante Azul':  '#60a5fa',
  'Diamante':       '#a78bfa',
  'Platino':        '#e2e8f0',
  'Oro':            '#fbbf24',
  'Plata':          '#94a3b8',
  'Bronce':         '#d97706',
  'Principiante':   '#6b7280',
};
const RANK_ICONS = {
  'E. Corona':'👑','Embajador':'🏆','Diamante Negro':'🖤','Diamante Azul':'💙',
  'Diamante':'💎','Platino':'⭐','Oro':'🥇','Plata':'🥈','Bronce':'🥉','Principiante':'🌱',
};

export default function NetworkRankView({ dataset, onSelect }) {
  const byRank = useMemo(() => {
    const map = {};
    dataset.members.forEach(m => {
      const r = m.rank || 'Principiante';
      if (!map[r]) map[r] = [];
      map[r].push(m);
    });
    // Sort by canonical rank order
    return RANK_ORDER
      .filter(r => map[r] && map[r].length > 0)
      .map(r => [r, map[r]]);
  }, [dataset]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {byRank.map(([rank, members], ri) => {
          const color    = RANK_COLORS[rank] || '#6b7280';
          const icon     = RANK_ICONS[rank]  || '⭐';
          const totalInv = members.reduce((s, m) => s + (m.investment_amount || 0), 0);
          return (
            <div key={rank}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div>
                  <p style={{ color, fontWeight: 900, fontSize: 14, margin: 0 }}>{rank}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>
                    {members.length} miembros · ${totalInv.toLocaleString()} total
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20,
                    background: `${color}12`, border: `1px solid ${color}28`,
                    color, fontSize: 10, fontWeight: 800,
                  }}>{members.length}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {members.map((m, i) => (
                  <motion.div
                    key={m.user_id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.015 }}
                    whileHover={{ y: -3 }}
                    onClick={() => onSelect(m)}
                    style={{
                      padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${color}18`,
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: `${color}15`,
                      border: `2px solid ${color}35`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 900, color,
                    }}>
                      {(m.full_name || '').split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: 'rgba(255,255,255,0.87)', fontSize: 11, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(m.full_name || '').split(' ').slice(0, 2).join(' ')}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: 0 }}>
                        {m.binary_side === 'left' ? '← Izq' : '→ Der'} · G{m.generation_depth}
                      </p>
                      <p style={{ color, fontSize: 9, fontWeight: 800, margin: '2px 0 0 0' }}>
                        ${(m.investment_amount || 0).toLocaleString()}
                      </p>
                    </div>
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