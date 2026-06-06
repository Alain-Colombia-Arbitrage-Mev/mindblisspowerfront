import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, XCircle, Eye, X, MessageSquare, RefreshCw } from 'lucide-react';
import { INVESTMENTS_DATA } from '@/lib/simulatedData';

const STATUS_CFG = {
  approved: { color: '#10b981', label: 'Approved' },
  pending_review: { color: '#fb923c', label: 'Pending Review' },
  under_compliance: { color: '#06b6d4', label: 'Compliance Hold' },
  rejected: { color: '#ef4444', label: 'Rejected' },
  cancelled: { color: '#6b7280', label: 'Cancelled' },
  reversed: { color: '#a855f7', label: 'Reversed' },
};

export default function Investments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(INVESTMENTS_DATA);
  const [note, setNote] = useState('');

  const filtered = useMemo(() => data.filter(p => {
    const q = search.toLowerCase();
    const matchQ = !q || p.participant.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.participantId.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchQ && matchStatus;
  }), [data, search, statusFilter]);

  const updateStatus = (id, status) => {
    setData(d => d.map(p => p.id === id ? { ...p, status, reviewedBy: 'Admin' } : p));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status, reviewedBy: 'Admin' }));
  };

  const addNote = (id) => {
    if (!note.trim()) return;
    const ts = new Date().toLocaleString('en-GB');
    const entry = `[${ts}] ${note}`;
    setData(d => d.map(p => p.id === id ? { ...p, notes: entry + '\n' + p.notes } : p));
    if (selected?.id === id) setSelected(prev => ({ ...prev, notes: entry + '\n' + prev.notes }));
    setNote('');
  };

  const totalVolume = data.filter(p => p.status === 'approved').reduce((s, p) => s + p.amount, 0);
  const pendingVolume = data.filter(p => ['pending_review', 'under_compliance'].includes(p.status)).reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color: '#06b6d4', fontSize: 10, fontWeight: 700, letterSpacing: 3, margin: '0 0 6px 0' }}>INVESTMENTS · PLAN MANAGEMENT</p>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>Plan & Activation Control</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Inspect · Approve · Reject · Compliance Hold · Track volume and eligibility</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Portfolio', value: `$${data.reduce((s, p) => s + p.amount, 0).toLocaleString()}`, color: '#3b82f6' },
          { label: 'Approved Volume', value: `$${totalVolume.toLocaleString()}`, color: '#10b981' },
          { label: 'Pending Review', value: `$${pendingVolume.toLocaleString()}`, color: '#fb923c' },
          { label: 'Cycle Eligible', value: data.filter(p => p.cycleEligible).length, color: '#8b5cf6' },
          { label: 'Rejected / Reversed', value: data.filter(p => ['rejected', 'reversed'].includes(p.status)).length, color: '#ef4444' },
        ].map((kpi, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: `${kpi.color}10`, border: `1px solid ${kpi.color}25` }}>
            <p style={{ color: kpi.color, fontSize: 20, fontWeight: 900, margin: '0 0 4px 0' }}>{kpi.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: 0 }}>{kpi.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-56 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search investment ID, participant..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...Object.keys(STATUS_CFG)].map(s => {
            const cfg = STATUS_CFG[s];
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: statusFilter === s ? `${cfg?.color || '#fff'}20` : 'rgba(255,255,255,0.04)', color: statusFilter === s ? (cfg?.color || 'white') : 'rgba(255,255,255,0.4)', border: `1px solid ${statusFilter === s ? (cfg?.color || '#fff') + '40' : 'rgba(255,255,255,0.08)'}` }}>
                {s === 'all' ? 'All' : cfg.label} {s !== 'all' && `(${data.filter(p => p.status === s).length})`}
              </button>
            );
          })}
        </div>
      </motion.div>

      <div className="flex gap-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 min-w-0 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,31,60,0.5)' }}>
          <table className="w-full text-xs">
            <thead style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <tr>
                {['ID', 'Participant', 'Country', 'Plan', 'Amount', 'Method', 'Points', 'Activation', 'Status', 'Reviewed By', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => {
                const cfg = STATUS_CFG[inv.status] || { color: '#888', label: inv.status };
                const isSelected = selected?.id === inv.id;
                return (
                  <tr key={i} onClick={() => setSelected(inv)} className="cursor-pointer hover:bg-white/5 transition-all"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isSelected ? 'rgba(6,182,212,0.07)' : 'transparent' }}>
                    <td className="px-3 py-3" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontSize: 10 }}>{inv.id}</td>
                    <td className="px-3 py-3">
                      <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{inv.participant}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: 10 }}>{inv.participantId} · {inv.leader}</p>
                    </td>
                    <td className="px-3 py-3"><span className="px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{inv.country}</span></td>
                    <td className="px-3 py-3">
                      <p style={{ color: '#fb923c', fontWeight: 600, margin: 0 }}>{inv.plan}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: 10 }}>{inv.category}</p>
                    </td>
                    <td className="px-3 py-3" style={{ color: '#10b981', fontWeight: 800 }}>${inv.amount.toLocaleString()}</td>
                    <td className="px-3 py-3" style={{ color: 'rgba(255,255,255,0.55)' }}>{inv.paymentMethod}</td>
                    <td className="px-3 py-3" style={{ color: inv.points > 0 ? '#3b82f6' : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{inv.points.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: inv.activation === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)', color: inv.activation === 'active' ? '#10b981' : '#6b7280' }}>
                        {inv.activation}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>{cfg.label}</span>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'rgba(255,255,255,0.4)' }}>{inv.reviewedBy}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        {inv.status === 'pending_review' && (
                          <>
                            <button onClick={e => { e.stopPropagation(); updateStatus(inv.id, 'approved'); }} className="p-1.5 rounded hover:bg-white/10" title="Approve" style={{ color: '#10b981' }}><CheckCircle size={13} /></button>
                            <button onClick={e => { e.stopPropagation(); updateStatus(inv.id, 'rejected'); }} className="p-1.5 rounded hover:bg-white/10" title="Reject" style={{ color: '#ef4444' }}><XCircle size={13} /></button>
                          </>
                        )}
                        {inv.status === 'approved' && <button onClick={e => { e.stopPropagation(); updateStatus(inv.id, 'reversed'); }} className="p-1.5 rounded hover:bg-white/10" title="Reverse" style={{ color: '#a855f7' }}><RefreshCw size={13} /></button>}
                        {inv.status === 'under_compliance' && (
                          <>
                            <button onClick={e => { e.stopPropagation(); updateStatus(inv.id, 'approved'); }} className="p-1.5 rounded hover:bg-white/10" title="Clear & Approve" style={{ color: '#10b981' }}><CheckCircle size={13} /></button>
                            <button onClick={e => { e.stopPropagation(); updateStatus(inv.id, 'rejected'); }} className="p-1.5 rounded hover:bg-white/10" title="Reject" style={{ color: '#ef4444' }}><XCircle size={13} /></button>
                          </>
                        )}
                        <button onClick={e => { e.stopPropagation(); setSelected(inv); }} className="p-1.5 rounded hover:bg-white/10" title="Inspect" style={{ color: '#3b82f6' }}><Eye size={13} /></button>
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
              className="w-72 flex-shrink-0 rounded-xl overflow-y-auto"
              style={{ border: '1px solid rgba(6,182,212,0.2)', background: 'rgba(9,21,42,0.95)', maxHeight: 620 }}>
              <div className="p-4 border-b border-white/8 sticky top-0 flex items-center justify-between" style={{ background: 'rgba(9,21,42,0.98)' }}>
                <p style={{ color: '#06b6d4', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0 }}>INVESTMENT — {selected.id}</p>
                <button onClick={() => setSelected(null)} style={{ color: 'rgba(255,255,255,0.4)' }}><X size={15} /></button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p style={{ color: 'white', fontSize: 15, fontWeight: 800, margin: '0 0 2px 0' }}>{selected.participant}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{selected.participantId} · {selected.leader} · {selected.country}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { l: 'PLAN', v: selected.plan, c: '#fb923c' },
                    { l: 'AMOUNT', v: `$${selected.amount.toLocaleString()}`, c: '#10b981' },
                    { l: 'POINTS', v: selected.points.toLocaleString(), c: '#3b82f6' },
                    { l: 'METHOD', v: selected.paymentMethod, c: '#8b5cf6' },
                    { l: 'DATE', v: selected.date, c: '#06b6d4' },
                    { l: 'CYCLE ELIGIBLE', v: selected.cycleEligible ? 'Yes' : 'No', c: selected.cycleEligible ? '#10b981' : '#ef4444' },
                  ].map((f, i) => (
                    <div key={i} className="p-2 rounded" style={{ background: `${f.c}10`, border: `1px solid ${f.c}20` }}>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: '0 0 2px 0' }}>{f.l}</p>
                      <p style={{ color: f.c, fontWeight: 700, margin: 0 }}>{f.v}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px 0' }}>REVIEW DECISION</p>
                  <div className="space-y-2">
                    {[
                      { s: 'approved', label: '✓ Approve', color: '#10b981' },
                      { s: 'under_compliance', label: '⏸ Compliance Hold', color: '#06b6d4' },
                      { s: 'rejected', label: '✕ Reject', color: '#ef4444' },
                      { s: 'reversed', label: '↩ Reverse', color: '#a855f7' },
                    ].map(item => (
                      <button key={item.s} onClick={() => updateStatus(selected.id, item.s)}
                        className="w-full px-3 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{ background: selected.status === item.s ? `${item.color}25` : 'rgba(255,255,255,0.04)', color: selected.status === item.s ? item.color : 'rgba(255,255,255,0.5)', border: `1px solid ${selected.status === item.s ? item.color + '40' : 'rgba(255,255,255,0.07)'}` }}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px 0' }}>COMPLIANCE NOTES</p>
                  <div className="p-3 rounded-lg text-xs mb-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', whiteSpace: 'pre-wrap', maxHeight: 72, overflow: 'auto' }}>
                    {selected.notes}
                  </div>
                  <div className="flex gap-2">
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add compliance note..."
                      onKeyDown={e => e.key === 'Enter' && addNote(selected.id)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button onClick={() => addNote(selected.id)} className="px-3 py-2 rounded-lg" style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>
                      <MessageSquare size={13} />
                    </button>
                  </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Reviewed by: {selected.reviewedBy}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}