import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, AlertTriangle, MessageSquare, ChevronRight } from 'lucide-react';
import { SUPPORT_CASES_DATA } from '@/lib/simulatedData';

const PRIORITY_CFG = {
  critical: { color: '#ef4444', label: 'Critical' },
  high: { color: '#fb923c', label: 'High' },
  medium: { color: '#3b82f6', label: 'Medium' },
  low: { color: '#10b981', label: 'Low' },
};

const STATUS_CFG = {
  new: { color: '#3b82f6', label: 'New' },
  assigned: { color: '#8b5cf6', label: 'Assigned' },
  in_review: { color: '#fb923c', label: 'In Review' },
  awaiting_participant: { color: '#06b6d4', label: 'Awaiting Participant' },
  escalated: { color: '#ef4444', label: 'Escalated' },
  resolved: { color: '#10b981', label: 'Resolved' },
  closed: { color: '#6b7280', label: 'Closed' },
};

const AGENTS = ['J. Smith', 'M. Lee', 'S. Johnson', 'K. Torres', 'A. Reyes'];

export default function Support() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [cases, setCases] = useState(SUPPORT_CASES_DATA);
  const [newMessage, setNewMessage] = useState('');

  const filtered = useMemo(() => cases.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.participant.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    return matchQ && matchStatus && matchPriority;
  }), [cases, search, statusFilter, priorityFilter]);

  const updateCase = (id, updates) => {
    setCases(cs => cs.map(c => c.id === id ? { ...c, ...updates } : c));
    if (selected?.id === id) setSelected(prev => ({ ...prev, ...updates }));
  };

  const addMessage = (id) => {
    if (!newMessage.trim()) return;
    const msg = { from: 'Admin', text: newMessage, time: new Date().toLocaleString('en-GB') };
    setCases(cs => cs.map(c => c.id === id ? { ...c, messages: [...c.messages, msg], lastUpdate: 'Just now' } : c));
    if (selected?.id === id) setSelected(prev => ({ ...prev, messages: [...prev.messages, msg] }));
    setNewMessage('');
  };

  const critCount = cases.filter(c => c.priority === 'critical' && !['resolved', 'closed'].includes(c.status)).length;
  const openCount = cases.filter(c => !['resolved', 'closed'].includes(c.status)).length;
  const breachedCount = cases.filter(c => c.sla === 'BREACHED').length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color: '#06b6d4', fontSize: 10, fontWeight: 700, letterSpacing: 3, margin: '0 0 6px 0' }}>SUPPORT · CASE MANAGEMENT</p>
        <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>Support Operations Center</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Inspect · Assign · Escalate · Reply · Resolve · SLA tracking · Full case history</p>
      </motion.div>

      {breachedCount > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.3)' }}>
          <AlertTriangle size={18} style={{ color: '#ef4444' }} />
          <div className="flex-1">
            <p style={{ color: '#ef4444', fontWeight: 700, fontSize: 12, margin: 0 }}>{breachedCount} SLA BREACH{breachedCount > 1 ? 'ES' : ''} — IMMEDIATE ESCALATION REQUIRED</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '2px 0 0 0' }}>Cases have exceeded resolution SLA threshold. Supervisory intervention required.</p>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Cases', value: cases.length, color: '#3b82f6' },
          { label: 'Open Cases', value: openCount, color: '#fb923c' },
          { label: 'Critical Priority', value: critCount, color: '#ef4444' },
          { label: 'SLA Breached', value: breachedCount, color: '#ef4444' },
          { label: 'Resolved', value: cases.filter(c => c.status === 'resolved').length, color: '#10b981' },
        ].map((kpi, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: `${kpi.color}10`, border: `1px solid ${kpi.color}25` }}>
            <p style={{ color: kpi.color, fontSize: 22, fontWeight: 900, margin: '0 0 2px 0' }}>{kpi.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: 0 }}>{kpi.label}</p>
          </div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-56 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search case ID, title, participant..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>All Statuses</option>
          {Object.entries(STATUS_CFG).map(([s, cfg]) => <option key={s} value={s} style={{ background: '#0d1f3c' }}>{cfg.label} ({cases.filter(c => c.status === s).length})</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <option value="all" style={{ background: '#0d1f3c' }}>All Priorities</option>
          {Object.entries(PRIORITY_CFG).map(([p, cfg]) => <option key={p} value={p} style={{ background: '#0d1f3c' }}>{cfg.label}</option>)}
        </select>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, alignSelf: 'center' }}>{filtered.length} cases</span>
      </motion.div>

      <div className="flex gap-5">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 min-w-0 space-y-2">
          {filtered.map((c, i) => {
            const pCfg = PRIORITY_CFG[c.priority];
            const sCfg = STATUS_CFG[c.status];
            const isSelected = selected?.id === c.id;
            return (
              <div key={i} onClick={() => setSelected(c)}
                className="p-4 rounded-xl cursor-pointer transition-all hover:border-white/15"
                style={{ background: isSelected ? 'rgba(6,182,212,0.08)' : c.sla === 'BREACHED' ? 'rgba(239,68,68,0.05)' : 'rgba(13,31,60,0.5)', border: `1px solid ${isSelected ? 'rgba(6,182,212,0.3)' : c.sla === 'BREACHED' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'monospace' }}>{c.id}</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: `${pCfg.color}20`, color: pCfg.color }}>{pCfg.label}</span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: `${sCfg.color}15`, color: sCfg.color }}>{sCfg.label}</span>
                      {c.sla === 'BREACHED' && <span className="px-1.5 py-0.5 rounded text-xs font-black" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>SLA BREACH</span>}
                      {c.sla === 'At Risk' && <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}>SLA At Risk</span>}
                    </div>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: '0 0 4px 0' }}>{c.title}</p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <span>{c.participant} · {c.country}</span>
                      <span>·</span>
                      <span>Assigned: {c.assigned}</span>
                      <span>·</span>
                      <span>Age: {c.age}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>{c.lastUpdate}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '2px 0 0 0' }}>{c.messages.length} msg{c.messages.length !== 1 ? 's' : ''}</p>
                    <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.2)', marginTop: 4 }} />
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="w-80 flex-shrink-0 rounded-xl flex flex-col"
              style={{ border: '1px solid rgba(6,182,212,0.25)', background: 'rgba(9,21,42,0.95)', maxHeight: 700 }}>
              <div className="p-4 border-b border-white/8 flex items-center justify-between" style={{ background: 'rgba(9,21,42,0.98)', flexShrink: 0 }}>
                <div>
                  <p style={{ color: '#06b6d4', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0 }}>CASE — {selected.id}</p>
                  <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: '2px 0 0 0' }}>{selected.title}</p>
                </div>
                <button onClick={() => setSelected(null)} style={{ color: 'rgba(255,255,255,0.4)' }}><X size={15} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { l: 'PARTICIPANT', v: selected.participant, c: '#3b82f6' },
                    { l: 'COUNTRY', v: selected.country, c: '#8b5cf6' },
                    { l: 'LEADER', v: selected.leader, c: '#fb923c' },
                    { l: 'TYPE', v: selected.type, c: '#06b6d4' },
                    { l: 'CREATED', v: selected.created, c: 'rgba(255,255,255,0.5)' },
                    { l: 'AGE', v: selected.age, c: selected.sla === 'BREACHED' ? '#ef4444' : '#10b981' },
                  ].map((f, i) => (
                    <div key={i} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '0 0 2px 0' }}>{f.l}</p>
                      <p style={{ color: f.c, fontWeight: 600, margin: 0 }}>{f.v}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px 0' }}>STATUS</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(STATUS_CFG).map(([s, cfg]) => (
                        <button key={s} onClick={() => updateCase(selected.id, { status: s })}
                          className="px-2 py-1.5 rounded text-xs font-semibold transition-all"
                          style={{ background: selected.status === s ? `${cfg.color}25` : 'rgba(255,255,255,0.04)', color: selected.status === s ? cfg.color : 'rgba(255,255,255,0.4)', border: `1px solid ${selected.status === s ? cfg.color + '40' : 'rgba(255,255,255,0.07)'}` }}>
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px 0' }}>PRIORITY</p>
                    <div className="flex gap-1.5">
                      {Object.entries(PRIORITY_CFG).map(([p, cfg]) => (
                        <button key={p} onClick={() => updateCase(selected.id, { priority: p })}
                          className="flex-1 py-1.5 rounded text-xs font-semibold transition-all"
                          style={{ background: selected.priority === p ? `${cfg.color}25` : 'rgba(255,255,255,0.04)', color: selected.priority === p ? cfg.color : 'rgba(255,255,255,0.35)', border: `1px solid ${selected.priority === p ? cfg.color + '40' : 'rgba(255,255,255,0.07)'}` }}>
                          {cfg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px 0' }}>ASSIGN TO AGENT</p>
                    <select value={selected.assigned} onChange={e => updateCase(selected.id, { assigned: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <option value="Unassigned" style={{ background: '#0d1f3c' }}>Unassigned</option>
                      {AGENTS.map(a => <option key={a} value={a} style={{ background: '#0d1f3c' }}>{a}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px 0' }}>CASE NOTES</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, margin: 0 }}>{selected.notes}</p>
                </div>

                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px 0' }}>CASE THREAD ({selected.messages.length})</p>
                  <div className="space-y-2 mb-3">
                    {selected.messages.length === 0 && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>No messages yet.</p>}
                    {selected.messages.map((msg, i) => (
                      <div key={i} className="p-2.5 rounded-lg" style={{ background: msg.from === 'Admin' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${msg.from === 'Admin' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ color: msg.from === 'Admin' ? '#3b82f6' : 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700 }}>{msg.from}</span>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{msg.time}</span>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, margin: 0 }}>{msg.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Add internal note or reply..."
                      onKeyDown={e => e.key === 'Enter' && addMessage(selected.id)}
                      className="flex-1 px-3 py-2 rounded-lg text-xs text-white placeholder-white/30 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button onClick={() => addMessage(selected.id)} className="px-3 py-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>
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