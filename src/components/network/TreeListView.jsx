/**
 * LIST VIEW — Operational list of all members, sortable, searchable
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const SIDE_COLORS = { left: 'var(--vp-accent)', right: 'var(--vp-amber)' };

export default function TreeListView({ dataset, onSelect }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('generation_depth');
  const [filterSide, setFilterSide] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = useMemo(() => {
    let list = dataset.members;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.country.toLowerCase().includes(q) ||
        m.rank.toLowerCase().includes(q)
      );
    }
    if (filterSide !== 'all') {
      // Determine root side by checking first ancestor
      list = list.filter(m => {
        // Walk up to find root-level ancestor
        let cur = m;
        while (cur && cur.generation_depth > 1) {
          const parent = dataset.getMember(cur.upline_id);
          if (!parent) break;
          cur = parent;
        }
        return cur && cur.binary_side === filterSide;
      });
    }
    if (filterStatus !== 'all') list = list.filter(m => m.status === filterStatus);
    return [...list].sort((a,b) => {
      if (sortBy === 'investment_amount') return b.investment_amount - a.investment_amount;
      if (sortBy === 'generation_depth') return a.generation_depth - b.generation_depth;
      if (sortBy === 'full_name') return a.full_name.localeCompare(b.full_name);
      return 0;
    });
  }, [dataset, search, sortBy, filterSide, filterStatus]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Controls */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--vp-border)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={11} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--vp-subtle)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar miembro..."
            style={{ width: '100%', paddingLeft: 28, paddingRight: 8, paddingTop: 6, paddingBottom: 6, borderRadius: 7, border: '1px solid var(--vp-border)', background: 'var(--vp-surface)', color: 'var(--vp-text)', fontSize: 10, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid var(--vp-border)', background: 'var(--vp-surface)', color: 'var(--vp-text-soft)', fontSize: 10, cursor: 'pointer' }}
        >
          <option value="generation_depth">Por Generación</option>
          <option value="investment_amount">Por Inversión</option>
          <option value="full_name">Por Nombre</option>
        </select>

        {/* Side filter */}
        {['all','left','right'].map(s => (
          <button key={s} onClick={() => setFilterSide(s)}
            style={{ padding: '5px 10px', borderRadius: 7, border: 'none', fontSize: 9, fontWeight: 800, cursor: 'pointer',
              background: filterSide === s ? (s === 'left' ? 'var(--vp-accent-muted)' : s === 'right' ? 'var(--vp-amber-muted)' : 'var(--vp-surface-raised)') : 'var(--vp-surface)',
              color: filterSide === s ? (s === 'left' ? 'var(--vp-accent)' : s === 'right' ? 'var(--vp-amber)' : 'var(--vp-text)') : 'var(--vp-muted)',
              border: '1px solid var(--vp-border)',
            }}>
            {s === 'all' ? 'Todos' : s === 'left' ? '◀ Izq' : '▶ Der'}
          </button>
        ))}

        {/* Status filter */}
        {['all','activo','inactivo'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{ padding: '5px 10px', borderRadius: 7, border: 'none', fontSize: 9, fontWeight: 800, cursor: 'pointer',
              background: filterStatus === s ? 'var(--vp-accent-muted)' : 'var(--vp-surface)',
              color: filterStatus === s ? 'var(--vp-accent)' : 'var(--vp-muted)',
              border: '1px solid var(--vp-border)',
            }}>
            {s === 'all' ? 'Todos' : s === 'activo' ? '🟢 Activos' : '⚫ Inactivos'}
          </button>
        ))}

        <span style={{ color: 'var(--vp-subtle)', fontSize: 9, marginLeft: 'auto' }}>{filtered.length} resultados</span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {filtered.map((m, i) => {
          const sc = SIDE_COLORS[m.binary_side] || '#fbbf24';
          const isInactive = m.status === 'inactivo';
          return (
            <motion.div
              key={m.user_id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.008, 0.3) }}
              whileHover={{ x: 3 }}
              onClick={() => onSelect(m)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                borderRadius: 9,
                marginBottom: 4,
                background: 'var(--vp-surface)',
                border: '1px solid var(--vp-border)',
                cursor: 'pointer',
                opacity: isInactive ? 0.6 : 1,
                transition: 'opacity 0.15s',
                borderLeft: `3px solid ${sc}`,
              }}
            >
              {/* Initials */}
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${sc}12`, border: `1px solid ${sc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: sc, fontSize: 9, fontWeight: 900 }}>
                  {m.full_name.split(' ').slice(0,2).map(w=>w[0]).join('')}
                </span>
              </div>

              {/* Name + info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'var(--vp-text)', fontSize: 10, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.full_name}
                </p>
                <p style={{ color: 'var(--vp-muted)', fontSize: 8, margin: 0 }}>
                  {m.rank} · Gen.{m.generation_depth} · {m.country}
                </p>
              </div>

              {/* Investment */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ color: sc, fontSize: 10, fontWeight: 800, margin: 0 }}>${m.investment_amount.toLocaleString()}</p>
                <p style={{ color: 'var(--vp-subtle)', fontSize: 7, margin: 0 }}>
                  {m.binary_side === 'left' ? '◀ Izq' : '▶ Der'}
                </p>
              </div>

              {/* Activity */}
              <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: isInactive ? 'var(--vp-subtle)' : m.activity_level === 'high' ? 'var(--vp-accent)' : m.activity_level === 'medium' ? 'var(--vp-amber)' : 'var(--vp-muted)' }} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
