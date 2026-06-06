/**
 * RANK VIEW — Shows all members grouped by rank
 */
import { motion } from 'framer-motion';

const RANK_COLORS = {
  'Embajador': '#fbbf24', 'Diamante Negro': '#c084fc', 'Diamante Azul': '#60a5fa',
  'Diamante': '#a78bfa', 'Platino': '#e2e8f0', 'Oro': '#f59e0b',
  'Plata': '#94a3b8', 'Bronce': '#d97706', 'Principiante': '#6b7280',
};
const RANK_ORDER = ['Embajador','Diamante Negro','Diamante Azul','Diamante','Platino','Oro','Plata','Bronce','Principiante'];

export default function TreeRankView({ dataset, onSelect }) {
  const members = dataset.members;

  const byRank = {};
  members.forEach(m => {
    if (!byRank[m.rank]) byRank[m.rank] = [];
    byRank[m.rank].push(m);
  });

  const ranks = RANK_ORDER.filter(r => byRank[r]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <p style={{ color: 'var(--vp-subtle)', fontSize: 10, fontWeight: 700, margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Vista por Rango · {members.length} miembros
      </p>
      {ranks.map((rank, ri) => {
        const rc = RANK_COLORS[rank] || '#6b7280';
        const group = byRank[rank];
        return (
          <motion.div
            key={rank}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ri * 0.05 }}
            style={{ marginBottom: 18 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: rc, flexShrink: 0 }} />
              <p style={{ color: rc, fontSize: 10, fontWeight: 800, margin: 0 }}>
                {rank} <span style={{ color: 'var(--vp-muted)', fontWeight: 600 }}>({group.length})</span>
              </p>
              <div style={{ flex: 1, height: 1, background: `${rc}20` }} />
              <p style={{ color: 'var(--vp-subtle)', fontSize: 9, margin: 0 }}>
                ${group.reduce((s,m)=>s+m.investment_amount,0).toLocaleString()} total
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {group.map(m => (
                <motion.div
                  key={m.user_id}
                  whileHover={{ y: -1 }}
                  onClick={() => onSelect(m)}
                  style={{
                    padding: '5px 9px',
                    borderRadius: 7,
                    background: 'var(--vp-surface)',
                    border: '1px solid var(--vp-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span style={{ color: rc, fontSize: 8, fontWeight: 900 }}>
                    {m.full_name.split(' ').slice(0,2).map(w=>w[0]).join('')}
                  </span>
                  <div>
                    <p style={{ color: 'var(--vp-text)', fontSize: 8, fontWeight: 700, margin: 0 }}>
                      {m.full_name.split(' ')[0]}
                    </p>
                    <p style={{ color: 'var(--vp-muted)', fontSize: 7, margin: 0 }}>
                      ${m.investment_amount.toLocaleString()} · {m.country}
                    </p>
                  </div>
                  {m.status === 'inactivo' && <span style={{ color:'#6b7280', fontSize:7 }}>⚫</span>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
