/**
 * AI Copilot Console — Operations Command Board
 * Designed as a triage + execution interface. Not a chat. Not suggestions.
 * Real data. Real tasks. Real execution structure.
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '@/lib/SimulationEngine';
import { generateCopilotActions, recordActionExecution, getActionHistory, getModuleColor } from '@/lib/aiCopilot';
import CopilotExecutionPanel from './CopilotExecutionPanel';
import {
  RotateCcw, History, ChevronRight, ExternalLink,
  Users, CreditCard, Headphones, Zap, Shield, BookOpen, BarChart3, Lock,
  AlertTriangle, ArrowRight, Clock, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SEV = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', label: 'CRITICAL' },
  high:     { color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)',  label: 'HIGH' },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.18)', label: 'MEDIUM' },
  low:      { color: '#6b7280', bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.15)', label: 'LOW' },
};

const MODULE_ICONS = {
  CRM: BookOpen, Participants: Users, Payments: CreditCard,
  Investments: BarChart3, Leaders: Shield, Support: Headphones,
  Marketing: Zap, Permissions: Lock,
};

const MODULE_ROUTES = {
  CRM: '/admin-dashboard/crm',
  Participants: '/admin-dashboard/participants',
  Payments: '/admin-dashboard/payments',
  Investments: '/admin-dashboard/investments',
  Leaders: '/admin-dashboard/leaders',
  Support: '/admin-dashboard/support',
  Marketing: '/admin-dashboard/marketing',
  Permissions: '/admin-dashboard/permissions',
};

function TaskRow({ action, isSelected, onSelect, status }) {
  const s = SEV[action.priority] || SEV.low;
  const mc = getModuleColor(action.module);
  const Icon = MODULE_ICONS[action.module] || Zap;
  const isDone = status === 'executed';

  return (
    <div
      onClick={() => !isDone && onSelect(action)}
      className="flex items-center gap-3 px-4 py-3 border-b cursor-pointer transition-all"
      style={{
        borderColor: 'rgba(255,255,255,0.05)',
        background: isSelected ? `${s.color}10` : isDone ? 'rgba(16,185,129,0.04)' : 'transparent',
        opacity: isDone ? 0.55 : 1,
        borderLeft: `3px solid ${isSelected ? s.color : isDone ? '#10b981' : 'transparent'}`,
      }}
    >
      {/* Priority indicator */}
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isDone ? '#10b981' : s.color, boxShadow: `0 0 6px ${isDone ? '#10b981' : s.color}` }} />

      {/* Module icon */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${mc}15` }}>
        <Icon size={12} style={{ color: mc }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p style={{ color: isDone ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.title}</p>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.reason}</p>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 600 }}>{action.affectedCount} affected</span>
        <span className="px-1.5 py-0.5 rounded font-black" style={{ background: isDone ? 'rgba(16,185,129,0.15)' : s.bg, color: isDone ? '#10b981' : s.color, fontSize: 8, border: `1px solid ${isDone ? 'rgba(16,185,129,0.3)' : s.border}` }}>
          {isDone ? 'DONE' : s.label}
        </span>
        {!isDone && <ChevronRight size={11} style={{ color: isSelected ? s.color : 'rgba(255,255,255,0.2)' }} />}
        {isDone && <CheckCircle2 size={11} style={{ color: '#10b981' }} />}
      </div>
    </div>
  );
}

function PriorityColumn({ title, color, actions, statuses, selectedId, onSelect }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col rounded-xl overflow-hidden" style={{ border: `1px solid ${color}22`, background: `${color}05` }}>
      <div className="px-4 py-2.5 flex items-center justify-between flex-shrink-0" style={{ background: `${color}0c`, borderBottom: `1px solid ${color}18` }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span style={{ color, fontSize: 9, fontWeight: 800, letterSpacing: '0.15em' }}>{title}</span>
        </div>
        <span style={{ color, fontSize: 11, fontWeight: 900 }}>{actions.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 360 }}>
        {actions.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <CheckCircle2 size={18} style={{ color: 'rgba(255,255,255,0.12)', margin: '0 auto 6px' }} />
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, margin: 0 }}>Clear</p>
          </div>
        ) : (
          actions.map(a => (
            <TaskRow key={a.id} action={a} isSelected={selectedId === a.id} onSelect={onSelect} status={statuses[a.id] || 'pending'} />
          ))
        )}
      </div>
    </div>
  );
}

function HistoryTable({ history }) {
  if (history.length === 0) {
    return (
      <div className="py-16 text-center rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <Clock size={28} style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 10px' }} />
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>No executed actions yet this session</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(8,16,36,0.6)' }}>
      <table className="w-full text-xs">
        <thead style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <tr>
            {['Action', 'Module', 'Priority', 'Affected', 'Operator', 'Timestamp', 'Result'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, letterSpacing: '0.08em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((item, i) => {
            const s = SEV[item.priority] || SEV.low;
            const mc = getModuleColor(item.module);
            return (
              <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded font-semibold" style={{ background: `${mc}15`, color: mc, fontSize: 9 }}>{item.module}</span></td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded font-black" style={{ background: s.bg, color: s.color, fontSize: 8 }}>{s.label}</span></td>
                <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{item.affectedCount}</td>
                <td className="px-4 py-3" style={{ color: '#3b82f6', fontWeight: 600 }}>{item.operator}</td>
                <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 10 }}>{new Date(item.executedAt).toLocaleString('en-GB', { hour12: false, dateStyle: 'short', timeStyle: 'short' })}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: 9 }}>EXECUTED</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AICopilotConsole({ compact = false }) {
  const sim = useSimulation();
  const [actions, setActions] = useState(() => generateCopilotActions());
  const [statuses, setStatuses] = useState({});
  const [dismissed, setDismissed] = useState(new Set());
  const [selectedAction, setSelectedAction] = useState(null);
  const [activeTab, setActiveTab] = useState('triage');
  const [history, setHistory] = useState(() => getActionHistory());
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString('en-GB'));

  useEffect(() => {
    if (sim.tick % 4 === 0 && sim.tick > 0) {
      setActions(generateCopilotActions());
      setLastRefresh(new Date().toLocaleTimeString('en-GB'));
    }
  }, [sim.tick]);

  const visible = useMemo(() =>
    actions.filter(a => !dismissed.has(a.id)),
    [actions, dismissed]
  );

  const byPriority = (p) => visible.filter(a => a.priority === p);

  const handleExecute = (action) => {
    setStatuses(prev => ({ ...prev, [action.id]: 'executed' }));
    recordActionExecution(action, 'Super Admin');
    setHistory(getActionHistory());
    setSelectedAction(null);
  };

  const handleDismiss = (id) => {
    setDismissed(prev => new Set([...prev, id]));
    if (selectedAction?.id === id) setSelectedAction(null);
  };

  const pendingCount = visible.filter(a => statuses[a.id] !== 'executed').length;
  const executedCount = visible.filter(a => statuses[a.id] === 'executed').length;

  return (
    <div className="space-y-4">

      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', margin: '0 0 4px' }}>AI COPILOT — OPERATIONS ENGINE</p>
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: '0 0 2px', letterSpacing: -0.3 }}>Action Triage Board</h2>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>Detect → Prepare → Confirm → Execute. All actions require manual approval.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span style={{ color: '#10b981', fontSize: 10, fontWeight: 600 }}>LIVE · {lastRefresh}</span>
            </div>
            <button onClick={() => { setActions(generateCopilotActions()); setStatuses({}); setDismissed(new Set()); setSelectedAction(null); setLastRefresh(new Date().toLocaleTimeString('en-GB')); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <RotateCcw size={10} /> Refresh
            </button>
          </div>
        </div>
      )}

      {/* Ops KPI Strip */}
      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
        {[
          { label: 'Pending', value: pendingCount, color: '#3b82f6' },
          { label: 'Critical', value: byPriority('critical').filter(a => statuses[a.id] !== 'executed').length, color: '#ef4444' },
          { label: 'High', value: byPriority('high').filter(a => statuses[a.id] !== 'executed').length, color: '#fb923c' },
          { label: 'Medium', value: byPriority('medium').filter(a => statuses[a.id] !== 'executed').length, color: '#f59e0b' },
          { label: 'Executed', value: executedCount + history.length, color: '#10b981' },
          { label: 'Dismissed', value: dismissed.size, color: '#6b7280' },
        ].map((s, i) => (
          <div key={i} className="p-2.5 rounded-lg text-center" style={{ background: `${s.color}09`, border: `1px solid ${s.color}20` }}>
            <p style={{ color: s.color, fontSize: 18, fontWeight: 900, margin: '0 0 1px', lineHeight: 1 }}>{s.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 600, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        {[
          { id: 'triage', label: `Triage Board (${pendingCount})` },
          { id: 'history', label: `Execution Log (${history.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className="px-4 py-2.5 text-xs font-semibold border-b-2 transition-all"
            style={{ borderColor: activeTab === t.id ? '#3b82f6' : 'transparent', color: activeTab === t.id ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* TRIAGE VIEW */}
      {activeTab === 'triage' && (
        <div className="space-y-3">
          {/* 3-column priority board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <PriorityColumn title="CRITICAL" color="#ef4444" actions={byPriority('critical')} statuses={statuses} selectedId={selectedAction?.id} onSelect={setSelectedAction} />
            <PriorityColumn title="HIGH PRIORITY" color="#fb923c" actions={byPriority('high')} statuses={statuses} selectedId={selectedAction?.id} onSelect={setSelectedAction} />
            <PriorityColumn title="MEDIUM PRIORITY" color="#f59e0b" actions={byPriority('medium')} statuses={statuses} selectedId={selectedAction?.id} onSelect={setSelectedAction} />
          </div>

          {/* Execution Panel */}
          <AnimatePresence>
            {selectedAction && statuses[selectedAction.id] !== 'executed' && (
              <motion.div
                key={selectedAction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <CopilotExecutionPanel
                  action={selectedAction}
                  onExecute={handleExecute}
                  onDismiss={handleDismiss}
                  onClose={() => setSelectedAction(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {pendingCount === 0 && (
            <div className="py-12 text-center rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <CheckCircle2 size={28} style={{ color: '#10b981', margin: '0 auto 8px' }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, margin: 0 }}>All actions cleared</p>
            </div>
          )}
        </div>
      )}

      {/* HISTORY VIEW */}
      {activeTab === 'history' && <HistoryTable history={history} />}
    </div>
  );
}