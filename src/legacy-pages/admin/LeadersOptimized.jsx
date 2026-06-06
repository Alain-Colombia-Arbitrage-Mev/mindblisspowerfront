import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Download, Eye, FileText, CreditCard, Network, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { LEADERS_DATA } from '@/lib/simulatedData';

const STATUS_CFG = {
  active: { color: '#10b981', label: 'Activo' },
  certified: { color: '#8b5cf6', label: 'Certificado' },
  under_review: { color: '#06b6d4', label: 'En Revisión' },
  paused: { color: '#fb923c', label: 'Pausado' },
  suspended: { color: '#ef4444', label: 'Suspendido' },
  pending_certification: { color: '#3b82f6', label: 'Pendiente Cert.' },
};

const getNetworkSizeTier = (size) => {
  if (size >= 500) return { tier: 'strategic', label: 'Estratégico', color: '#a855f7' };
  if (size >= 200) return { tier: 'high', label: 'Alto', color: '#8b5cf6' };
  if (size >= 50) return { tier: 'mid', label: 'Medio', color: '#3b82f6' };
  return { tier: 'low', label: 'Bajo', color: '#6b7280' };
};

const getAlertLevel = (violations) => {
  if (violations > 2) return { level: 'critical', label: 'Crítico', color: '#ef4444', icon: '🔴' };
  if (violations > 0) return { level: 'warning', label: 'Atención', color: '#fb923c', icon: '🟡' };
  return { level: 'stable', label: 'Estable', color: '#10b981', icon: '🟢' };
};

export default function LeadersOptimized() {
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [selectedFilters, setSelectedFilters] = useState({
    status: 'all',
    alertLevel: 'all',
    networkSize: 'all',
    country: 'all',
    balance: 'all',
  });
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(LEADERS_DATA);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(l => {
      const matchQ = !q || l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q);
      const matchStatus = selectedFilters.status === 'all' || l.status === selectedFilters.status;
      const matchCountry = selectedFilters.country === 'all' || l.country === selectedFilters.country;
      const alertLevel = getAlertLevel(l.violations).level;
      const matchAlert = selectedFilters.alertLevel === 'all' || alertLevel === selectedFilters.alertLevel;
      const networkTier = getNetworkSizeTier(l.network).tier;
      const matchNetwork = selectedFilters.networkSize === 'all' || networkTier === selectedFilters.networkSize;
      return matchQ && matchStatus && matchCountry && matchAlert && matchNetwork;
    });
  }, [data, search, selectedFilters]);

  const grouped = useMemo(() => {
    if (groupBy === 'none') return { ungrouped: filtered };
    const groups = {};
    filtered.forEach(l => {
      let key = 'other';
      if (groupBy === 'rank') key = l.rank || 'Sin Rango';
      else if (groupBy === 'status') key = STATUS_CFG[l.status]?.label || l.status;
      else if (groupBy === 'networkSize') key = getNetworkSizeTier(l.network).label;
      else if (groupBy === 'alertLevel') key = getAlertLevel(l.violations).label;
      else if (groupBy === 'country') key = l.country;
      else if (groupBy === 'balance') key = (l.left_volume > l.right_volume ? 'Izquierda Fuerte' : l.right_volume > l.left_volume ? 'Derecha Fuerte' : 'Equilibrada');
      if (!groups[key]) groups[key] = [];
      groups[key].push(l);
    });
    return groups;
  }, [filtered, groupBy]);

  const countries = [...new Set(LEADERS_DATA.map(l => l.country))].sort();
  const stats = {
    total: data.length,
    active: data.filter(l => l.status === 'active').length,
    imbalanced: data.filter(l => Math.abs(l.left_volume - l.right_volume) / Math.max(l.left_volume, l.right_volume) > 0.4).length,
    highValue: data.filter(l => (l.volume.replace(/[^0-9]/g, '') || 0) >= 100000).length,
    needsIntervention: data.filter(l => l.violations > 0).length,
  };

  const handleAction = (leader, action) => {
    console.log(`Acción: ${action} en ${leader.name}`);
  };

  const updateStatus = (id, status) => {
    setData(d => d.map(l => l.id === id ? { ...l, status } : l));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 700, letterSpacing: 3, margin: '0 0 6px 0' }}>LÍDERES · CONTROL ESTRATÉGICO</p>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>Líderes</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
          {filtered.length} de {stats.total} · {stats.active} activos · {stats.needsIntervention} requieren intervención
        </p>
      </motion.div>

      {/* Operations Summary Strip */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total Líderes', value: stats.total, color: '#3b82f6', icon: '👥' },
          { label: 'Activos', value: stats.active, color: '#10b981', icon: '🟢' },
          { label: 'Desequilibrados', value: stats.imbalanced, color: '#fb923c', icon: '⚖️' },
          { label: 'Alto Valor', value: stats.highValue, color: '#fbbf24', icon: '👑' },
          { label: 'Intervención Requerida', value: stats.needsIntervention, color: '#ef4444', icon: '⚠️' },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, ID, país..." className="w-full pl-9 pr-4 py-2 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>

        <select value={selectedFilters.status} onChange={e => setSelectedFilters({ ...selectedFilters, status: e.target.value })} className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>Estado: Todos</option>
          {Object.entries(STATUS_CFG).map(([s, cfg]) => <option key={s} value={s} style={{ background: '#0d1f3c' }}>{cfg.label}</option>)}
        </select>

        <select value={selectedFilters.alertLevel} onChange={e => setSelectedFilters({ ...selectedFilters, alertLevel: e.target.value })} className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>Alerta: Todos</option>
          <option value="stable" style={{ background: '#0d1f3c' }}>Estable</option>
          <option value="warning" style={{ background: '#0d1f3c' }}>Atención</option>
          <option value="critical" style={{ background: '#0d1f3c' }}>Crítico</option>
        </select>

        <select value={selectedFilters.networkSize} onChange={e => setSelectedFilters({ ...selectedFilters, networkSize: e.target.value })} className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>Red: Todos</option>
          <option value="low" style={{ background: '#0d1f3c' }}>Baja</option>
          <option value="mid" style={{ background: '#0d1f3c' }}>Media</option>
          <option value="high" style={{ background: '#0d1f3c' }}>Alta</option>
          <option value="strategic" style={{ background: '#0d1f3c' }}>Estratégica</option>
        </select>

        <select value={selectedFilters.country} onChange={e => setSelectedFilters({ ...selectedFilters, country: e.target.value })} className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>País: Todos</option>
          {countries.map(c => <option key={c} value={c} style={{ background: '#0d1f3c' }}>{c}</option>)}
        </select>

        <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="px-3 py-2 rounded-lg text-sm text-white focus:outline-none cursor-pointer" style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)' }}>
          <option value="none" style={{ background: '#0d1f3c' }}>Sin Agrupar</option>
          <option value="rank" style={{ background: '#0d1f3c' }}>Por Rango</option>
          <option value="status" style={{ background: '#0d1f3c' }}>Por Estado</option>
          <option value="networkSize" style={{ background: '#0d1f3c' }}>Por Tamaño Red</option>
          <option value="alertLevel" style={{ background: '#0d1f3c' }}>Por Alerta</option>
          <option value="country" style={{ background: '#0d1f3c' }}>Por País</option>
          <option value="balance" style={{ background: '#0d1f3c' }}>Por Balance</option>
        </select>

        <button className="px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold" style={{ background: '#3b82f6', color: 'white' }}>
          <Download size={14} /> Exportar
        </button>
      </motion.div>

      {/* Grouped/Ungrouped Table */}
      {Object.entries(grouped).map(([groupKey, groupLeaders]) => (
        <div key={groupKey}>
          {groupBy !== 'none' && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: '12px 0 8px 0', textTransform: 'uppercase' }}>
              {groupKey} · {groupLeaders.length}
            </p>
          )}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,31,60,0.5)' }}>
            <table className="w-full text-xs">
              <thead style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <tr>
                  {['ID', 'Nombre', 'País', 'Rango', 'Red Total', 'Directos', 'Activos', 'Izq', 'Der', 'Inversión Total', 'Actividad', 'Alerta', 'Cumplimiento', 'Acciones'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupLeaders.map((l, i) => {
                  const sc = STATUS_CFG[l.status] || { color: '#888', label: l.status };
                  const alert = getAlertLevel(l.violations);
                  const networkTier = getNetworkSizeTier(l.network);
                  const isSelected = selected?.id === l.id;
                  return (
                    <tr key={i} onClick={() => setSelected(l)} className="cursor-pointer hover:bg-white/5 transition-all" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isSelected ? 'rgba(139,92,246,0.08)' : 'transparent' }}>
                      <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontSize: 9 }}>{l.id}</td>
                      <td className="px-3 py-2.5" style={{ color: 'white', fontWeight: 600 }}>{l.name}</td>
                      <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', fontSize: 9 }}>{l.country}</span></td>
                      <td className="px-3 py-2.5" style={{ color: '#8b5cf6', fontWeight: 700, fontSize: 9 }}>{l.rank}</td>
                      <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: `${networkTier.color}15`, color: networkTier.color }}>{l.network}</span></td>
                      <td className="px-3 py-2.5" style={{ color: '#3b82f6', fontWeight: 700 }}>{l.directs}</td>
                      <td className="px-3 py-2.5" style={{ color: '#10b981', fontWeight: 700 }}>{l.network}</td>
                      <td className="px-3 py-2.5" style={{ color: '#3b82f6', fontWeight: 700, fontSize: 9 }}>◀ ${(l.left_volume / 1000).toFixed(0)}K</td>
                      <td className="px-3 py-2.5" style={{ color: '#8b5cf6', fontWeight: 700, fontSize: 9 }}>${(l.right_volume / 1000).toFixed(0)}K ▶</td>
                      <td className="px-3 py-2.5" style={{ color: '#06b6d4', fontWeight: 700, fontSize: 9 }}>{l.volume}</td>
                      <td className="px-3 py-2.5">
                        <span style={{ color: l.growth?.includes('+') ? '#10b981' : '#ef4444', fontSize: 10, fontWeight: 700 }}>
                          {l.growth?.includes('+') ? '📈' : '📉'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5"><span style={{ color: alert.color, fontWeight: 700, fontSize: 10 }}>{alert.icon}</span></td>
                      <td className="px-3 py-2.5">
                        <div className="h-1 w-12 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div className="h-full rounded-full" style={{ width: `${l.compliance}%`, background: l.compliance > 80 ? '#10b981' : l.compliance > 60 ? '#fb923c' : '#ef4444' }} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-0.5">
                          <button onClick={e => { e.stopPropagation(); handleAction(l, 'dna'); }} className="p-1 rounded hover:bg-white/10" title="ADN" style={{ color: '#8b5cf6' }}><Network size={11} /></button>
                          <button onClick={e => { e.stopPropagation(); handleAction(l, 'payments'); }} className="p-1 rounded hover:bg-white/10" title="Pagos" style={{ color: '#06b6d4' }}><CreditCard size={11} /></button>
                          <button onClick={e => { e.stopPropagation(); handleAction(l, 'docs'); }} className="p-1 rounded hover:bg-white/10" title="Docs" style={{ color: '#8b5cf6' }}><FileText size={11} /></button>
                          <button onClick={e => { e.stopPropagation(); handleAction(l, 'intervene'); }} className="p-1 rounded hover:bg-white/10" title="Intervenir" style={{ color: '#ef4444' }}><AlertTriangle size={11} /></button>
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
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="rounded-xl overflow-y-auto" style={{ border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(9,21,42,0.95)', padding: 24, maxHeight: 750 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p style={{ color: '#8b5cf6', fontSize: 9, fontWeight: 700, letterSpacing: 2, margin: '0 0 4px 0' }}>LÍDER CONTROL EJECUTIVO</p>
                <p style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: 0 }}>{selected.name}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ color: 'rgba(255,255,255,0.4)' }}><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, margin: '0 0 4px 0' }}>PAÍS</p>
                  <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{selected.country}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, margin: '0 0 4px 0' }}>RANGO</p>
                  <p style={{ color: '#8b5cf6', fontWeight: 600, margin: 0 }}>{selected.rank}</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, margin: '0 0 4px 0' }}>RED TOTAL</p>
                  <p style={{ color: '#10b981', fontWeight: 600, margin: 0 }}>{selected.network} miembros</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, margin: '0 0 4px 0' }}>DIRECTOS</p>
                  <p style={{ color: '#3b82f6', fontWeight: 600, margin: 0 }}>{selected.directs}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { label: 'Estado', value: STATUS_CFG[selected.status]?.label, color: STATUS_CFG[selected.status]?.color },
                  { label: 'Alerta', value: getAlertLevel(selected.violations).label, color: getAlertLevel(selected.violations).color },
                  { label: 'Cumplimiento', value: `${selected.compliance}%`, color: selected.compliance > 80 ? '#10b981' : selected.compliance > 60 ? '#fb923c' : '#ef4444' },
                  { label: 'Volumen Total', value: selected.volume, color: '#06b6d4' },
                  { label: 'Crecimiento', value: selected.growth, color: selected.growth?.includes('+') ? '#10b981' : '#ef4444' },
                  { label: 'Ganancia Ciclo', value: selected.cycleEarnings, color: '#fb923c' },
                ].map((f, i) => (
                  <div key={i} className="p-3 rounded-lg" style={{ background: `${f.color}10`, border: `1px solid ${f.color}20` }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8, fontWeight: 700, margin: '0 0 3px 0' }}>{f.label}</p>
                    <p style={{ color: f.color, fontWeight: 700, margin: 0 }}>{f.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, margin: '0 0 4px 0' }}>RAMA IZQUIERDA</p>
                  <p style={{ color: '#3b82f6', fontWeight: 700, margin: 0 }}>${(selected.left_volume / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: 700, margin: '0 0 4px 0' }}>RAMA DERECHA</p>
                  <p style={{ color: '#8b5cf6', fontWeight: 700, margin: 0 }}>${(selected.right_volume / 1000).toFixed(0)}K</p>
                </div>
              </div>

              {selected.violations > 0 && (
                <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                  <p style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, margin: '0 0 2px 0' }}>⚠️ {selected.violations} Violación{selected.violations > 1 ? 'es' : ''} de Comunicación</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, margin: 0 }}>Requiere revisión supervisor e intervención</p>
                </div>
              )}

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: 1 }}>Acciones Ejecutivas</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'ADN Red', action: 'dna', icon: Network },
                    { label: 'Árbol', action: 'tree', icon: Eye },
                    { label: 'Pagos', action: 'payments', icon: CreditCard },
                    { label: 'Documentos', action: 'docs', icon: FileText },
                    { label: 'Intervención', action: 'intervene', icon: AlertTriangle },
                    { label: 'Historial', action: 'history', icon: TrendingUp },
                  ].map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <button key={i} onClick={() => handleAction(selected, a.action)} className="px-2 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)' }}>
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