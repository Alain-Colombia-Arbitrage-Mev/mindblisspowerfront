/**
 * NetworkListView — operational list with search, filter, sort
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function NetworkListView({ dataset, onSelect }) {
  const [search,   setSearch]   = useState('');
  const [sideFilter, setSideFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField,  setSortField]  = useState('generation_depth');
  const [sortDir,    setSortDir]    = useState('asc');

  const filtered = useMemo(() => {
    let arr = [...dataset.members];
    if (search) {
      const q = search.toLowerCase();
      arr = arr.filter(m =>
        (m.full_name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.rank  || '').toLowerCase().includes(q)
      );
    }
    if (sideFilter !== 'all')   arr = arr.filter(m => m.binary_side === sideFilter);
    if (statusFilter !== 'all') arr = arr.filter(m => m.status === statusFilter);

    arr.sort((a, b) => {
      let av = a[sortField] ?? 0;
      let bv = b[sortField] ?? 0;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return arr;
  }, [dataset, search, sideFilter, statusFilter, sortField, sortDir]);

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>↕</span>;
    return sortDir === 'asc'
      ? <ChevronUp  size={10} style={{ color: '#3b82f6' }} />
      : <ChevronDown size={10} style={{ color: '#3b82f6' }} />;
  };

  const totalInv = filtered.reduce((s, m) => s + (m.investment_amount || 0), 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar miembro..."
            style={{
              width: '100%', paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
              borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: 11, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {/* Filters */}
        {[
          { label: 'Lado', value: sideFilter, setter: setSideFilter, opts: [['all','Todos'],['left','Izquierda'],['right','Derecha']] },
          { label: 'Estado', value: statusFilter, setter: setStatusFilter, opts: [['all','Todos'],['activo','Activo'],['inactivo','Inactivo']] },
        ].map(({ label, value, setter, opts }) => (
          <select key={label} value={value} onChange={e => setter(e.target.value)} style={{
            padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontSize: 11, outline: 'none',
          }}>
            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        {/* Stats */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}>
            {filtered.length} / {dataset.totalCount} miembros
          </span>
          <span style={{ color: '#fbbf24', fontSize: 10, fontWeight: 800 }}>
            ${totalInv.toLocaleString()} inv.
          </span>
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1fr 0.7fr 0.7fr',
        padding: '8px 20px', background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        {[
          { label: 'Miembro',     field: 'full_name'        },
          { label: 'Rango',       field: 'rank'             },
          { label: 'Lado',        field: 'binary_side'      },
          { label: 'Inversión',   field: 'investment_amount'},
          { label: 'Gen.',        field: 'generation_depth' },
          { label: 'Estado',      field: 'status'           },
        ].map(({ label, field }) => (
          <button key={field} onClick={() => toggleSort(field)} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            color: sortField === field ? '#60a5fa' : 'rgba(255,255,255,0.35)',
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', padding: 0,
          }}>
            {label} <SortIcon field={field} />
          </button>
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map((m, i) => (
          <motion.div
            key={m.user_id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: Math.min(i * 0.008, 0.3) }}
            whileHover={{ background: 'rgba(59,130,246,0.06)' }}
            onClick={() => onSelect(m)}
            style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1fr 0.7fr 0.7fr',
              padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: m.binary_side === 'left' ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                border: `1.5px solid ${m.binary_side === 'left' ? '#3b82f650' : '#8b5cf650'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 900,
                color: m.binary_side === 'left' ? '#3b82f6' : '#8b5cf6',
              }}>
                {(m.full_name || '').split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: 'rgba(255,255,255,0.87)', fontSize: 11, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.full_name}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.email}
                </p>
              </div>
            </div>
            {/* Rank */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{m.rank || '—'}</span>
            </div>
            {/* Side */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{
                color: m.binary_side === 'left' ? '#3b82f6' : '#8b5cf6',
                fontSize: 10, fontWeight: 700,
              }}>
                {m.binary_side === 'left' ? '← Izq' : '→ Der'}
              </span>
            </div>
            {/* Investment */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#fbbf24', fontSize: 10, fontWeight: 700 }}>
                ${(m.investment_amount || 0).toLocaleString()}
              </span>
            </div>
            {/* Generation */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>G{m.generation_depth}</span>
            </div>
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: m.status === 'activo' ? '#10b981' : '#374151',
              }} />
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
            Sin resultados
          </div>
        )}
      </div>
    </div>
  );
}