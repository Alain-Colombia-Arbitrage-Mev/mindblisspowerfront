import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Download, Eye, FileText, CreditCard, CheckCircle, Flag, Network, AlertTriangle } from 'lucide-react';
import platformDataCore from '@/lib/platformDataCore';

const STATUS_CFG = {
  activo: { color: '#10b981', label: 'Activo' },
  pendiente: { color: '#fb923c', label: 'Pendiente' },
  inactivo: { color: '#6b7280', label: 'Inactivo' },
  bloqueado: { color: '#ef4444', label: 'Bloqueado' },
};

const getInvestmentTier = (amount) => {
  if (amount >= 25000) return { tier: 'elite', label: 'Elite', color: '#fbbf24' };
  if (amount >= 10000) return { tier: 'strategic', label: 'Estratégico', color: '#a855f7' };
  if (amount >= 5000) return { tier: 'high', label: 'Alto', color: '#8b5cf6' };
  if (amount >= 1000) return { tier: 'mid', label: 'Medio', color: '#3b82f6' };
  return { tier: 'low', label: 'Bajo', color: '#6b7280' };
};

export default function ParticipantsOptimized() {
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all',
    rank: 'all',
    country: 'all',
    investmentTier: 'all',
    activity: 'all',
    verification: 'all',
  });
  const [selected, setSelected] = useState(null);

  const participants = useMemo(() => {
    return (platformDataCore.users || []).filter(u => u.role !== 'admin' && u.role !== 'leader');
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return participants.filter(p => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.phone?.includes(q);
      const matchStatus = selectedFilters.status === 'all' || p.status === selectedFilters.status;
      const matchCountry = selectedFilters.country === 'all' || p.country === selectedFilters.country;
      const matchActivity = selectedFilters.activity === 'all' || p.activity === selectedFilters.activity;
      const investmentTier = getInvestmentTier(p.investment || 0).tier;
      const matchTier = selectedFilters.investmentTier === 'all' || investmentTier === selectedFilters.investmentTier;
      return matchQ && matchStatus && matchCountry && matchActivity && matchTier;
    });
  }, [participants, search, selectedFilters]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return { ungrouped: filtered };
    const groups = {};
    filtered.forEach(p => {
      let key = 'other';
      if (groupBy === 'rank') key = p.rank || 'Sin Rango';
      else if (groupBy === 'status') key = STATUS_CFG[p.status]?.label || p.status;
      else if (groupBy === 'country') key = p.country;
      else if (groupBy === 'investmentTier') key = getInvestmentTier(p.investment).label;
      else if (groupBy === 'activity') key = p.activity ? (p.activity.charAt(0).toUpperCase() + p.activity.slice(1)) : 'Desconocida';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filtered, groupBy]);

  const countries = [...new Set(participants.map(p => p.country))].sort();
  const ranks = [...new Set(participants.map(p => p.rank).filter(Boolean))].sort();

  const stats = {
    total: participants.length,
    active: participants.filter(p => p.status === 'activo').length,
    pendingVerification: participants.filter(p => p.status === 'pendiente').length,
    priority: participants.filter(p => getInvestmentTier(p.investment).tier === 'elite' || getInvestmentTier(p.investment).tier === 'strategic').length,
    highValue: participants.filter(p => (p.investment || 0) >= 10000).length,
  };

  const handleAction = (participant, action) => {
    console.log(`Acción: ${action} en ${participant.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 3, margin: '0 0 6px 0' }}>PARTICIPANTES · GESTIÓN OPERACIONAL</p>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>Participantes</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
          {filtered.length} de {stats.total} · {stats.active} activos · {stats.pendingVerification} en verificación
        </p>
      </motion.div>

      {/* Operations Summary Strip */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: '#3b82f6', icon: '👥' },
          { label: 'Activos', value: stats.active, color: '#10b981', icon: '🟢' },
          { label: 'En Verificación', value: stats.pendingVerification, color: '#fb923c', icon: '⏳' },
          { label: 'Casos Prioritarios', value: stats.priority, color: '#a855f7', icon: '⭐' },
          { label: 'Alto Valor', value: stats.highValue, color: '#fbbf24', icon: '👑' },
        ].map((s, i) => (
          <div key={i} className="p-3 rounded-lg" style={{ background: `${s.color}0d`, border: `1px solid ${s.color}22` }}>
            <div className="flex items-center justify-between mb-1">
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: 0 }}>{s.label}</p>
              <span style={{ fontSize: 12 }}>{s.icon}</span>
            </div>
            <p style={{ color: s.color, fontSize: 18, fontWeight: 900, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Filters & Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-56 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, teléfono..."
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <select value={selectedFilters.status} onChange={e => setSelectedFilters({ ...selectedFilters, status: e.target.value })} className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>Estado: Todos</option>
          {Object.entries(STATUS_CFG).map(([s, cfg]) => <option key={s} value={s} style={{ background: '#0d1f3c' }}>{cfg.label}</option>)}
        </select>

        <select value={selectedFilters.investmentTier} onChange={e => setSelectedFilters({ ...selectedFilters, investmentTier: e.target.value })} className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>Inversión: Todos</option>
          <option value="low" style={{ background: '#0d1f3c' }}>Bajo</option>
          <option value="mid" style={{ background: '#0d1f3c' }}>Medio</option>
          <option value="high" style={{ background: '#0d1f3c' }}>Alto</option>
          <option value="strategic" style={{ background: '#0d1f3c' }}>Estratégico</option>
          <option value="elite" style={{ background: '#0d1f3c' }}>Elite</option>
        </select>

        <select value={selectedFilters.activity} onChange={e => setSelectedFilters({ ...selectedFilters, activity: e.target.value })} className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>Actividad: Todos</option>
          <option value="high" style={{ background: '#0d1f3c' }}>Alta</option>
          <option value="medium" style={{ background: '#0d1f3c' }}>Media</option>
          <option value="low" style={{ background: '#0d1f3c' }}>Baja</option>
        </select>

        <select value={selectedFilters.country} onChange={e => setSelectedFilters({ ...selectedFilters, country: e.target.value })} className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>País: Todos</option>
          {countries.map(c => <option key={c} value={c} style={{ background: '#0d1f3c' }}>{c}</option>)}
        </select>

        <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none cursor-pointer" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
          <option value="none" style={{ background: '#0d1f3c' }}>Sin Agrupar</option>
          <option value="rank" style={{ background: '#0d1f3c' }}>Por Rango</option>
          <option value="status" style={{ background: '#0d1f3c' }}>Por Estado</option>
          <option value="investmentTier" style={{ background: '#0d1f3c' }}>Por Inversión</option>
          <option value="country" style={{ background: '#0d1f3c' }}>Por País</option>
          <option value="activity" style={{ background: '#0d1f3c' }}>Por Actividad</option>
        </select>

        <button className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold" style={{ background: '#3b82f6', color: 'white' }}>
          <Download size={14} /> Exportar
        </button>
      </motion.div>

      {/* Grouped/Ungrouped Table */}
      {Object.entries(grouped).map(([groupKey, groupParticipants]) => (
        <div key={groupKey}>
          {groupBy !== 'none' && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: '12px 0 8px 0', textTransform: 'uppercase' }}>
              {groupKey} · {groupParticipants.length}
            </p>
          )}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,31,60,0.5)' }}>
            <table className="w-full text-xs">
              <thead style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <tr>
                  {['ID', 'Nombre', 'Email', 'Teléfono', 'País', 'Rango', 'Plan', 'Inversión', 'Estado', 'Verificación', 'Actividad', 'Rama', 'Generación', 'Acciones'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupParticipants.map((p, i) => {
                  const sc = STATUS_CFG[p.status] || { color: '#888', label: p.status };
                  const invTier = getInvestmentTier(p.investment || 0);
                  const isSelected = selected?.id === p.id;
                  return (
                    <tr key={i} onClick={() => setSelected(p)} className="cursor-pointer hover:bg-white/5 transition-all" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isSelected ? 'rgba(16,185,129,0.08)' : 'transparent' }}>
                      <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontSize: 9 }}>{p.id?.slice(0, 6)}</td>
                      <td className="px-3 py-2.5" style={{ color: 'white', fontWeight: 600 }}>{p.name}</td>
                      <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9 }}>{p.email}</td>
                      <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>{p.phone || '-'}</td>
                      <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', fontSize: 9 }}>{p.country}</span></td>
                      <td className="px-3 py-2.5" style={{ color: '#3b82f6', fontWeight: 700, fontSize: 9 }}>{p.rank || '-'}</td>
                      <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>{p.plan || '-'}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: `${invTier.color}15`, color: invTier.color, border: `1px solid ${invTier.color}25` }}>
                          ${(p.investment || 0) / 1000 < 1 ? '<1K' : `${Math.round(p.investment / 1000)}K`}
                        </span>
                      </td>
                      <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: `${sc.color}15`, color: sc.color }}>{sc.label}</span></td>
                      <td className="px-3 py-2.5"><span style={{ color: p.verified ? '#10b981' : '#fb923c' }}>{'✓' || '○'}</span></td>
                      <td className="px-3 py-2.5">
                        <span style={{ color: p.activity === 'high' ? '#10b981' : p.activity === 'medium' ? '#fb923c' : '#6b7280' }}>
                          {p.activity === 'high' ? '🟢' : p.activity === 'medium' ? '🟡' : '⚫'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5" style={{ color: p.binary_side === 'left' ? '#3b82f6' : p.binary_side === 'right' ? '#8b5cf6' : 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600 }}>{p.binary_side === 'left' ? '◀' : p.binary_side === 'right' ? '▶' : '·'}</td>
                      <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>{p.generation_depth || '-'}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-0.5">
                          <button onClick={e => { e.stopPropagation(); handleAction(p, 'detail'); }} className="p-1 rounded hover:bg-white/10" title="Ver Detalle" style={{ color: '#3b82f6' }}><Eye size={11} /></button>
                          <button onClick={e => { e.stopPropagation(); handleAction(p, 'payments'); }} className="p-1 rounded hover:bg-white/10" title="Pagos" style={{ color: '#06b6d4' }}><CreditCard size={11} /></button>
                          <button onClick={e => { e.stopPropagation(); handleAction(p, 'docs'); }} className="p-1 rounded hover:bg-white/10" title="Docs" style={{ color: '#8b5cf6' }}><FileText size={11} /></button>
                          <button onClick={e => { e.stopPropagation(); handleAction(p, 'network'); }} className="p-1 rounded hover:bg-white/10" title="Red" style={{ color: '#10b981' }}><Network size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        </div>
      ))}

      {/* Detail Panel */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="rounded-xl overflow-y-auto" style={{ border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(9,21,42,0.95)', padding: 24, maxHeight: 700 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p style={{ color: '#10b981', fontSize: 9, fontWeight: 700, letterSpacing: 2, margin: '0 0 4px 0' }}>PARTICIPANTE DETALLE</p>
                <p style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: 0 }}>{selected.name}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: 'rgba(255,255,255,0.4)' }}><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, margin: '0 0 4px 0' }}>EMAIL</p>
                  <p style={{ color: 'white', fontWeight: 600, margin: 0, fontSize: 11 }}>{selected.email}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, margin: '0 0 4px 0' }}>TELÉFONO</p>
                  <p style={{ color: 'white', fontWeight: 600, margin: 0, fontSize: 11 }}>{selected.phone || '-'}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, margin: '0 0 4px 0' }}>PAÍS</p>
                  <p style={{ color: 'white', fontWeight: 600, margin: 0, fontSize: 11 }}>{selected.country}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, margin: '0 0 4px 0' }}>RANGO</p>
                  <p style={{ color: '#3b82f6', fontWeight: 600, margin: 0, fontSize: 11 }}>{selected.rank || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Estado', value: STATUS_CFG[selected.status]?.label, color: STATUS_CFG[selected.status]?.color },
                  { label: 'Plan', value: selected.plan || '-', color: '#3b82f6' },
                  { label: 'Inversión', value: `$${(selected.investment || 0).toLocaleString()}`, color: getInvestmentTier(selected.investment).color },
                  { label: 'Actividad', value: selected.activity, color: selected.activity === 'high' ? '#10b981' : '#fb923c' },
                  { label: 'Verificado', value: selected.verified ? 'Sí' : 'No', color: selected.verified ? '#10b981' : '#ef4444' },
                  { label: 'Rama', value: selected.binary_side ? (selected.binary_side === 'left' ? 'Izquierda' : 'Derecha') : '-', color: selected.binary_side === 'left' ? '#3b82f6' : '#8b5cf6' },
                ].map((f, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: `${f.color}10`, border: `1px solid ${f.color}20` }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 700, margin: '0 0 3px 0' }}>{f.label}</p>
                    <p style={{ color: f.color, fontWeight: 700, margin: 0, fontSize: 11 }}>{f.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: 1 }}>Acciones Rápidas</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Ver Detalle', action: 'detail', icon: Eye },
                    { label: 'Pagos', action: 'payments', icon: CreditCard },
                    { label: 'Documentos', action: 'docs', icon: FileText },
                    { label: 'Marcar Prioridad', action: 'priority', icon: Flag },
                    { label: 'Crear Seguimiento', action: 'follow', icon: AlertTriangle },
                    { label: 'Ver Red', action: 'network', icon: Network },
                  ].map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <button key={i} onClick={() => handleAction(selected, a.action)} className="px-2 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>
                        <Icon size={11} /> {a.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}