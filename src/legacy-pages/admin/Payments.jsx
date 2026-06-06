import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, XCircle, Eye, X, MessageSquare, RefreshCw, ShieldAlert } from 'lucide-react';
import { PAYMENTS_DATA } from '@/lib/simulatedData';
import FinancialControlDashboard from '@/components/admin/FinancialControlDashboard';

const STATUS_CFG = {
  verified: { color: '#10b981', label: 'Verified' },
  pending: { color: '#fb923c', label: 'Pending' },
  under_review: { color: '#06b6d4', label: 'Under Review' },
  flagged: { color: '#ef4444', label: 'Flagged — AML' },
  rejected: { color: '#6b7280', label: 'Rejected' },
  reversed: { color: '#a855f7', label: 'Reversed' },
};

const METHOD_COLORS = { Card: '#3b82f6', Transfer: '#10b981', Cash: '#fb923c', Crypto: '#8b5cf6', 'Bank Draft': '#06b6d4' };

export default function Payments() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(PAYMENTS_DATA);
  const [note, setNote] = useState('');

  const filtered = useMemo(() => data.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.participant.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.participantId.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchMethod = methodFilter === 'all' || t.method === methodFilter;
    return matchQ && matchStatus && matchMethod;
  }), [data, search, statusFilter, methodFilter]);

  const updateStatus = (id, status) => {
    setData(d => d.map(t => t.id === id ? { ...t, status, reviewedBy: 'Admin' } : t));
    if (selected?.id === id) setSelected(prev => ({ ...prev, status, reviewedBy: 'Admin' }));
  };

  const addNote = (id) => {
    if (!note.trim()) return;
    const ts = new Date().toLocaleString('en-GB');
    const entry = `[${ts}] ${note}`;
    setData(d => d.map(t => t.id === id ? { ...t, notes: entry + '\n' + t.notes } : t));
    if (selected?.id === id) setSelected(prev => ({ ...prev, notes: entry + '\n' + prev.notes }));
    setNote('');
  };

  const flaggedCount = data.filter(t => t.status === 'flagged').length;
  const pendingCount = data.filter(t => ['pending', 'under_review'].includes(t.status)).length;
  const totalVerified = data.filter(t => t.status === 'verified').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 3, margin: '0 0 6px 0' }}>PAYMENTS · FINANCIAL CONTROL</p>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>Transaction Supervision Center</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Verify · Flag · Reject · Reverse · AML screening · Risk scoring · Full audit trail</p>
      </motion.div>

      {/* Financial Control Summary */}
      <FinancialControlDashboard />

      {flaggedCount > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.35)' }}>
          <ShieldAlert size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div className="flex-1">
            <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 12, margin: 0 }}>{flaggedCount} TRANSACTION{flaggedCount > 1 ? 'S' : ''} FLAGGED BY AML ENGINE — IMMEDIATE REVIEW REQUIRED</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '2px 0 0 0' }}>Possible third-party funding, suspicious origin, or identity mismatch detected.</p>
          </div>
          <button onClick={() => setStatusFilter('flagged')} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' }}>Review Flagged</button>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Transactions', value: data.length, color: '#3b82f6' },
          { label: 'Verified Volume', value: `$${totalVerified.toLocaleString()}`, color: '#10b981' },
          { label: 'Pending + Review', value: pendingCount, color: '#fb923c' },
          { label: 'AML Flagged', value: flaggedCount, color: '#ef4444' },
          { label: 'Avg Risk Score', value: Math.round(data.reduce((s, t) => s + t.riskScore, 0) / data.length), color: '#8b5cf6' },
        ].map((kpi, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: `${kpi.color}10`, border: `1px solid ${kpi.color}25` }}>
            <p style={{ color: kpi.color, fontSize: 20, fontWeight: 900, margin: '0 0 2px 0' }}>{kpi.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: 0 }}>{kpi.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-56 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transaction ID, participant..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>All Statuses</option>
          {Object.entries(STATUS_CFG).map(([s, cfg]) => <option key={s} value={s} style={{ background: '#0d1f3c' }}>{cfg.label} ({data.filter(t => t.status === s).length})</option>)}
        </select>
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>All Methods</option>
          {Object.keys(METHOD_COLORS).map(m => <option key={m} value={m} style={{ background: '#0d1f3c' }}>{m}</option>)}
        </select>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, alignSelf: 'center' }}>{filtered.length} transactions</span>
      </motion.div>

      <div className="flex gap-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 min-w-0 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,31,60,0.5)' }}>
          <table className="w-full text-xs">
            <thead style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <tr>
                {['TXN ID', 'Participant', 'Country', 'Amount', 'Method', 'Origin', 'Risk', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const cfg = STATUS_CFG[t.status] || { color: '#888', label: t.status };
                const isSelected = selected?.id === t.id;
                return (
                  <tr key={i} onClick={() => setSelected(t)} className="cursor-pointer hover:bg-white/5 transition-all"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isSelected ? 'rgba(16,185,129,0.07)' : t.status === 'flagged' ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                    <td className="px-3 py-3" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', fontSize: 10 }}>{t.id}</td>
                    <td className="px-3 py-3">
                      <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{t.participant}</p>
                      <p style={{ color: 'rgba(255,255,255,0.35)', margin: 0, fontSize: 10 }}>{t.participantId}</p>
                    </td>
                    <td className="px-3 py-3"><span className="px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{t.country}</span></td>
                    <td className="px-3 py-3" style={{ color: '#10b981', fontWeight: 800 }}>${t.amount.toLocaleString()}</td>
                    <td className="px-3 py-3"><span style={{ color: METHOD_COLORS[t.method] || '#888', fontWeight: 600 }}>{t.method}</span></td>
                    <td className="px-3 py-3" style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.origin}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                          <div className="h-full rounded-full" style={{ width: `${t.riskScore}%`, background: t.riskScore > 70 ? '#ef4444' : t.riskScore > 40 ? '#fb923c' : '#10b981' }} />
                        </div>
                        <span style={{ color: t.riskScore > 70 ? '#ef4444' : t.riskScore > 40 ? '#fb923c' : '#10b981', fontWeight: 700 }}>{t.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}25` }}>{cfg.label}</span>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{t.date}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        {['pending', 'under_review', 'flagged'].includes(t.status) && (
                          <>
                            <button onClick={e => { e.stopPropagation(); updateStatus(t.id, 'verified'); }} className="p-1.5 rounded hover:bg-white/10" title="Verify" style={{ color: '#10b981' }}><CheckCircle size={13} /></button>
                            <button onClick={e => { e.stopPropagation(); updateStatus(t.id, 'rejected'); }} className="p-1.5 rounded hover:bg-white/10" title="Reject" style={{ color: '#ef4444' }}><XCircle size={13} /></button>
                          </>
                        )}
                        {t.status === 'verified' && <button onClick={e => { e.stopPropagation(); updateStatus(t.id, 'reversed'); }} className="p-1.5 rounded hover:bg-white/10" title="Reverse" style={{ color: '#a855f7' }}><RefreshCw size={13} /></button>}
                        <button onClick={e => { e.stopPropagation(); setSelected(t); }} className="p-1.5 rounded hover:bg-white/10" title="Inspect" style={{ color: '#3b82f6' }}><Eye size={13} /></button>
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
              style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(9,21,42,0.95)', maxHeight: 660 }}>
              <div className="p-4 border-b border-white/8 sticky top-0 flex items-center justify-between" style={{ background: 'rgba(9,21,42,0.98)' }}>
                <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0 }}>TXN — {selected.id}</p>
                <button onClick={() => setSelected(null)} style={{ color: 'rgba(255,255,255,0.4)' }}><X size={15} /></button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: '0 0 2px 0' }}>${selected.amount.toLocaleString()} {selected.currency}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{selected.participant} · {selected.country}</p>
                </div>

                <div className="p-3 rounded-lg" style={{ background: selected.riskScore > 70 ? 'rgba(239,68,68,0.1)' : selected.riskScore > 40 ? 'rgba(251,146,60,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${selected.riskScore > 70 ? 'rgba(239,68,68,0.3)' : selected.riskScore > 40 ? 'rgba(251,146,60,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px 0' }}>AML RISK SCORE</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full" style={{ width: `${selected.riskScore}%`, background: selected.riskScore > 70 ? '#ef4444' : selected.riskScore > 40 ? '#fb923c' : '#10b981' }} />
                    </div>
                    <span style={{ color: 'white', fontSize: 16, fontWeight: 900 }}>{selected.riskScore}/100</span>
                  </div>
                  <p style={{ color: selected.riskScore > 70 ? '#ef4444' : selected.riskScore > 40 ? '#fb923c' : '#10b981', fontSize: 10, fontWeight: 700, margin: '4px 0 0 0' }}>
                    {selected.riskScore > 70 ? 'HIGH RISK — REVIEW REQUIRED' : selected.riskScore > 40 ? 'MEDIUM RISK — MONITOR' : 'LOW RISK — CLEAN'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { l: 'METHOD', v: selected.method, c: METHOD_COLORS[selected.method] || '#888' },
                    { l: 'PURPOSE', v: selected.purpose, c: '#3b82f6' },
                    { l: 'DATE', v: selected.date, c: '#06b6d4' },
                    { l: 'REVIEWED BY', v: selected.reviewedBy, c: '#8b5cf6' },
                  ].map((f, i) => (
                    <div key={i} className="p-2 rounded" style={{ background: `${f.c}10`, border: `1px solid ${f.c}20` }}>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: '0 0 2px 0' }}>{f.l}</p>
                      <p style={{ color: f.c, fontWeight: 600, margin: 0, wordBreak: 'break-word' }}>{f.v}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, margin: '0 0 4px 0' }}>ORIGIN</p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>{selected.origin}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, margin: '0 0 4px 0' }}>DESTINATION</p>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>{selected.destination}</p>
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: 1, margin: '0 0 8px 0' }}>REVIEW DECISION</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { s: 'verified', label: '✓ Verify', color: '#10b981' },
                      { s: 'under_review', label: '◉ Hold', color: '#06b6d4' },
                      { s: 'flagged', label: '⚑ Flag AML', color: '#ef4444' },
                      { s: 'reversed', label: '↩ Reverse', color: '#a855f7' },
                    ].map(item => (
                      <button key={item.s} onClick={() => updateStatus(selected.id, item.s)}
                        className="px-2 py-2 rounded-lg text-xs font-bold transition-all"
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
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add review note..."
                      onKeyDown={e => e.key === 'Enter' && addNote(selected.id)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button onClick={() => addNote(selected.id)} className="px-3 py-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
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