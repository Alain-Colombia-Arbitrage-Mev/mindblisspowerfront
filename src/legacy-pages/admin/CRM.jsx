import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit2, X, Mail, Phone, Calendar, Tag, MessageSquare, Ban, RefreshCw, Download } from 'lucide-react';
import { CRM_DATA } from '@/lib/simulatedData';

const STATUS_COLORS = {
  active: '#10b981', pending_verification: '#fb923c', paused: '#a855f7',
  blocked: '#ef4444', under_review: '#06b6d4', certified: '#8b5cf6',
  suspended: '#ef4444', inactive: '#6b7280',
};

const SOURCE_COLORS = {
  Direct: '#3b82f6', Referral: '#8b5cf6', Campaign: '#06b6d4',
  Organic: '#10b981', Partner: '#fb923c', Social: '#f59e0b',
};

const Badge = ({ label, color }) => (
  <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
    {label}
  </span>
);

export default function CRM() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [note, setNote] = useState('');
  const [data, setData] = useState(CRM_DATA);

  const filtered = useMemo(() => data.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchSource = sourceFilter === 'all' || p.source === sourceFilter;
    const matchCountry = countryFilter === 'all' || p.country === countryFilter;
    return matchSearch && matchStatus && matchSource && matchCountry;
  }), [data, search, statusFilter, sourceFilter, countryFilter]);

  const updateStatus = (id, newStatus) => {
    setData(d => d.map(p => p.id === id ? { ...p, status: newStatus } : p));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status: newStatus }));
  };

  const addNote = (id) => {
    if (!note.trim()) return;
    const ts = new Date().toLocaleString('en-GB');
    setData(d => d.map(p => p.id === id ? { ...p, notes: `[${ts}] ${note}\n` + p.notes } : p));
    if (selected?.id === id) setSelected(prev => ({ ...prev, notes: `[${ts}] ${note}\n` + prev.notes }));
    setNote('');
  };

  const countries = [...new Set(CRM_DATA.map(p => p.country))].sort();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 3, margin: '0 0 6px 0' }}>CRM · INTELIGENCIA DE USUARIOS</p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>Registro de Participantes</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Control de usuarios global · Búsqueda · Inspección · Edición · Bloqueo · Reactivación · Anotaciones</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Download size={13} /> Exportar CSV
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: data.length, color: '#3b82f6', filter: 'all' },
          { label: 'Activo', value: data.filter(p => p.status === 'active' || p.status === 'certified').length, color: '#10b981', filter: 'active' },
          { label: 'KYC Pendiente', value: data.filter(p => p.status === 'pending_verification').length, color: '#fb923c', filter: 'pending_verification' },
          { label: 'En Revisión', value: data.filter(p => p.status === 'under_review').length, color: '#06b6d4', filter: 'under_review' },
          { label: 'Pausado', value: data.filter(p => p.status === 'paused').length, color: '#a855f7', filter: 'paused' },
          { label: 'Bloqueado', value: data.filter(p => p.status === 'blocked' || p.status === 'suspended').length, color: '#ef4444', filter: 'blocked' },
        ].map((s, i) => (
          <button key={i} onClick={() => setStatusFilter(s.filter)}
            className="p-3 rounded-lg text-left transition-all hover:opacity-80"
            style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
            <p style={{ color: s.color, fontSize: 22, fontWeight: 900, margin: '0 0 2px 0' }}>{s.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0 }}>{s.label}</p>
          </button>
        ))}
      </motion.div>

      {/* Search + Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-64 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, correo, ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        {[
          { label: 'Estado', value: statusFilter, set: setStatusFilter, opts: ['all', 'active', 'certified', 'pending_verification', 'under_review', 'paused', 'blocked', 'suspended', 'inactive'] },
          { label: 'Origen', value: sourceFilter, set: setSourceFilter, opts: ['all', 'Organic', 'Referral', 'Campaign', 'Social'] },
          { label: 'País', value: countryFilter, set: setCountryFilter, opts: ['all', ...countries] },
        ].map(f => (
          <select key={f.label} value={f.value} onChange={e => f.set(e.target.value)}
            className="px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {f.opts.map(o => <option key={o} value={o} style={{ background: '#0d1f3c' }}>{o === 'all' ? `Todos los ${f.label}` : o.replace(/_/g, ' ')}</option>)}
          </select>
        ))}
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, alignSelf: 'center' }}>{filtered.length} resultados</span>
      </motion.div>

      {/* Table + Detail */}
      <div className="flex gap-5" style={{ minHeight: 500 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex-1 min-w-0 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,31,60,0.5)' }}>
          <table className="w-full text-xs">
            <thead style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <tr>
                {['ID', 'Nombre / Correo', 'País', 'Origen', 'Plan', 'Asesor', 'Seguimiento', 'Estado', 'Última Actividad', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const sc = STATUS_COLORS[p.status] || '#6b7280';
                const isSelected = selected?.id === p.id;
                return (
                  <tr key={i} onClick={() => { setSelected(p); setEditMode(false); }}
                    className="cursor-pointer transition-all hover:bg-white/5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent' }}>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{p.id}</td>
                    <td className="px-4 py-3">
                      <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{p.name}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0 }}>{p.email}</p>
                    </td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>{p.country}</span></td>
                    <td className="px-4 py-3"><span style={{ color: SOURCE_COLORS[p.source] || '#888', fontSize: 11, fontWeight: 600 }}>{p.source}</span></td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.plan}</td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{p.advisor}</td>
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{
                        background: p.followUp === 'converted' ? 'rgba(16,185,129,0.15)' : p.followUp === 'inactive' ? 'rgba(107,114,128,0.15)' : 'rgba(251,146,60,0.15)',
                        color: p.followUp === 'converted' ? '#10b981' : p.followUp === 'inactive' ? '#6b7280' : '#fb923c'
                      }}>{p.followUp?.replace(/_/g,' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${sc}15`, color: sc, border: `1px solid ${sc}25` }}>
                        {p.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{p.lastActivity}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); setSelected(p); setEditMode(true); }} className="p-1.5 rounded hover:bg-white/10 transition-all" style={{ color: '#3b82f6' }}><Edit2 size={13} /></button>
                        {(p.status === 'blocked' || p.status === 'suspended') ? (
                          <button onClick={e => { e.stopPropagation(); updateStatus(p.id, 'active'); }} className="p-1.5 rounded hover:bg-white/10 transition-all" style={{ color: '#10b981' }}><RefreshCw size={13} /></button>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); updateStatus(p.id, 'blocked'); }} className="p-1.5 rounded hover:bg-white/10 transition-all" style={{ color: '#ef4444' }}><Ban size={13} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>

        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="w-80 flex-shrink-0 rounded-xl overflow-y-auto"
              style={{ border: '1px solid rgba(59,130,246,0.25)', background: 'rgba(9,21,42,0.9)', maxHeight: 680 }}>
              <div className="p-4 border-b border-white/8 flex items-center justify-between sticky top-0" style={{ background: 'rgba(9,21,42,0.95)' }}>
                <div>
                  <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0 }}>REGISTRO</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0 0' }}>{selected.id}</p>
                </div>
                <button onClick={() => setSelected(null)} style={{ color: 'rgba(255,255,255,0.4)' }}><X size={16} /></button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p style={{ color: 'white', fontSize: 16, fontWeight: 800, margin: '0 0 6px 0' }}>{selected.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {(selected.tags || []).map((t, i) => <Badge key={i} label={t} color={t.includes('Block') || t.includes('Fraud') ? '#ef4444' : t === 'VIP' || t === 'Elite' ? '#fb923c' : '#3b82f6'} />)}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { icon: Mail, label: selected.email },
                    { icon: Calendar, label: `Registrado: ${selected.registration}` },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <item.icon size={12} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                      <span style={{ color: 'rgba(255,255,255,0.65)' }}>{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Plan', value: selected.plan, color: '#3b82f6' },
                    { label: 'Total', value: selected.investmentTotal, color: '#10b981' },
                    { label: 'País', value: selected.country, color: '#8b5cf6' },
                    { label: 'KYC', value: selected.kyc, color: selected.kyc === 'verified' ? '#10b981' : '#fb923c' },
                    { label: 'Asesor', value: selected.advisor, color: '#06b6d4' },
                    { label: 'Ciclo', value: selected.cycle, color: selected.cycle === 'Eligible' ? '#10b981' : '#fb923c' },
                  ].map((f, i) => (
                    <div key={i} className="p-2 rounded-lg" style={{ background: `${f.color}10`, border: `1px solid ${f.color}20` }}>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '0 0 2px 0' }}>{f.label.toUpperCase()}</p>
                      <p style={{ color: f.color, fontSize: 11, fontWeight: 700, margin: 0, wordBreak: 'break-word' }}>{f.value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px 0' }}>CONTROL DE ESTADO</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['active', 'paused', 'under_review', 'blocked'].map(s => {
                      const c = STATUS_COLORS[s] || '#888';
                      return (
                        <button key={s} onClick={() => updateStatus(selected.id, s)}
                          className="px-2 py-1.5 rounded text-xs font-semibold transition-all"
                          style={{ background: selected.status === s ? `${c}25` : 'rgba(255,255,255,0.04)', color: selected.status === s ? c : 'rgba(255,255,255,0.5)', border: `1px solid ${selected.status === s ? c + '40' : 'rgba(255,255,255,0.08)'}` }}>
                          {s.replace(/_/g, ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px 0' }}>ANOTACIONES</p>
                  <div className="p-3 rounded-lg mb-2 text-xs" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.6)', maxHeight: 80, overflow: 'auto' }}>
                    {selected.notes}
                  </div>
                  <div className="flex gap-2">
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Agregar anotación..."
                      className="flex-1 px-3 py-2 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                      onKeyDown={e => e.key === 'Enter' && addNote(selected.id)} />
                    <button onClick={() => addNote(selected.id)} className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: 'rgba(59,130,246,0.2)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                      <MessageSquare size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}