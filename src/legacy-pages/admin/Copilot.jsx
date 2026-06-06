/**
 * VICION AI Copilot — Operational Action Engine
 * Admin-only. Generates, prepares, and assists execution of structured operational actions.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '@/lib/SimulationEngine';
import { generateCopilotActions } from '@/lib/copilotEngine';
import CopilotActionCard from '@/components/admin/CopilotActionCard';
import CopilotExecutionPanel from '@/components/admin/CopilotExecutionPanel';
import { Brain, Zap, CheckCircle2, Clock, Filter, RotateCcw, History } from 'lucide-react';

const MODULES = ['All', 'Payments', 'Leaders', 'Support', 'Participants', 'CRM', 'Marketing'];
const PRIORITIES = ['All', 'critical', 'high', 'medium', 'low'];
const SEV_COLOR = { critical: '#ef4444', high: '#fb923c', medium: '#f59e0b', low: '#6b7280' };

export default function Copilot() {
  const sim = useSimulation();
  const [actions, setActions] = useState(() => generateCopilotActions());
  const [statuses, setStatuses] = useState({});
  const [history, setHistory] = useState([]);
  const [executing, setExecuting] = useState(null);
  const [moduleFilter, setModuleFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('queue');

  // Refresh on sim ticks
  useEffect(() => {
    if (sim.tick % 4 === 0 && sim.tick > 0) {
      setActions(generateCopilotActions());
    }
  }, [sim.tick]);

  const handleStatusChange = (id, newStatus) => {
    setStatuses(prev => ({ ...prev, [id]: newStatus }));
    if (newStatus === 'executed') {
      const action = actions.find(a => a.id === id);
      if (action) {
        setHistory(prev => [{ ...action, executedAt: new Date().toLocaleTimeString('en-GB'), executedBy: 'Super Admin', result: 'Logged & routed to module' }, ...prev]);
      }
    }
  };

  const handleConfirm = (id) => handleStatusChange(id, 'executed');

  const enriched = actions.map(a => ({ ...a, status: statuses[a.id] || a.status }));

  const filtered = enriched.filter(a => {
    if (a.status === 'dismissed') return false;
    if (moduleFilter !== 'All' && a.module !== moduleFilter) return false;
    if (priorityFilter !== 'All' && a.priority !== priorityFilter) return false;
    return true;
  });

  const critCount = filtered.filter(a => a.priority === 'critical' && a.status !== 'executed').length;
  const executedCount = enriched.filter(a => a.status === 'executed').length;
  const inProgressCount = enriched.filter(a => a.status === 'in_progress').length;

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', margin: '0 0 6px' }}>INTERNAL OPERATIONS ENGINE · ADMIN ONLY</p>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, margin: '0 0 4px', letterSpacing: -0.5 }}>AI Copilot</h1>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, margin: 0 }}>Detects situations · Prepares actions · Assists execution · Never auto-executes destructive changes</p>
        </div>
        <div className="flex items-center gap-2">
          {critCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Zap size={11} style={{ color: '#ef4444' }} />
              <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 700 }}>{critCount} critical actions</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span style={{ color: '#10b981', fontSize: 10, fontWeight: 600 }}>LIVE · Sim tick {sim.tick}</span>
          </div>
        </div>
      </motion.div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Actions', value: enriched.filter(a => a.status !== 'dismissed').length, color: '#3b82f6', icon: Brain },
          { label: 'Critical', value: critCount, color: '#ef4444', icon: Zap },
          { label: 'In Progress', value: inProgressCount, color: '#f59e0b', icon: Clock },
          { label: 'Executed', value: executedCount, color: '#10b981', icon: CheckCircle2 },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="p-4 rounded-xl" style={{ background: `${s.color}0a`, border: `1px solid ${s.color}20` }}>
              <div className="flex items-center justify-between mb-2">
                <Icon size={14} style={{ color: s.color }} />
              </div>
              <p style={{ color: s.color, fontSize: 22, fontWeight: 900, margin: '0 0 2px' }}>{s.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: 0 }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {[
          { id: 'queue', label: 'Action Queue', icon: Zap },
          { id: 'history', label: 'Execution History', icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2"
              style={{ borderColor: activeTab === tab.id ? '#3b82f6' : 'transparent', color: activeTab === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}>
              <Icon size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'queue' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <div className="flex gap-1 flex-wrap">
              {MODULES.map(m => (
                <button key={m} onClick={() => setModuleFilter(m)}
                  className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
                  style={{ background: moduleFilter === m ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', color: moduleFilter === m ? '#3b82f6' : 'rgba(255,255,255,0.45)', border: `1px solid ${moduleFilter === m ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                  {m}
                </button>
              ))}
            </div>
            <div className="flex gap-1 ml-2 flex-wrap">
              {PRIORITIES.map(p => (
                <button key={p} onClick={() => setPriorityFilter(p)}
                  className="px-2.5 py-1 rounded text-xs font-semibold transition-all capitalize"
                  style={{ background: priorityFilter === p ? `${SEV_COLOR[p] || 'rgba(59,130,246,0.2)'}20` : 'rgba(255,255,255,0.04)', color: priorityFilter === p ? (SEV_COLOR[p] || '#3b82f6') : 'rgba(255,255,255,0.4)', border: `1px solid ${priorityFilter === p ? (SEV_COLOR[p] || '#3b82f6') + '30' : 'rgba(255,255,255,0.06)'}` }}>
                  {p === 'All' ? 'All' : p}
                </button>
              ))}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginLeft: 'auto' }}>{filtered.length} actions</span>
          </div>

          {/* Action cards */}
          <AnimatePresence>
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 size={32} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} />
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No actions match the current filters.</p>
              </div>
            ) : (
              filtered.map(action => (
                <CopilotActionCard
                  key={action.id}
                  action={action}
                  onStatusChange={handleStatusChange}
                  onPrepare={setExecuting}
                />
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-16">
              <History size={32} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No actions executed yet this session.</p>
            </div>
          ) : (
            history.map((item, i) => {
              const c = SEV_COLOR[item.priority] || '#888';
              return (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: 0 }}>{item.title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0' }}>{item.module} · {item.affectedCount} affected · Executed by {item.executedBy}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700 }}>{item.executedAt}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{item.result}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded font-black flex-shrink-0" style={{ background: `${c}18`, color: c, fontSize: 8 }}>{item.priority.toUpperCase()}</span>
                </div>
              );
            })
          )}
        </motion.div>
      )}

      {/* Execution panel overlay */}
      <AnimatePresence>
        {executing && (
          <CopilotExecutionPanel
            action={executing}
            onClose={() => setExecuting(null)}
            onConfirm={(id) => { handleConfirm(id); setExecuting(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}