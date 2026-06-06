/**
 * AUTO MODE CONSOLE
 * Professional operations automation console — admin only.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '@/lib/SimulationEngine';
import {
  DEFAULT_RULES, RISK_TIER, MODULE_COLORS,
  generateExecutionQueue, generateApprovalQueue,
  generateEscalationQueue, generateExecutionLog,
  safetyGuardCheck
} from '@/lib/AutoModeEngine';
import {
  Zap, Shield, AlertTriangle, CheckCircle2, Clock, Play, Pause,
  XCircle, ChevronRight, Activity, Settings, ListChecks, BarChart3,
  Eye, RefreshCw, Lock, Unlock, ChevronDown, ChevronUp, Info
} from 'lucide-react';

// ── MICRO COMPONENTS ──────────────────────────────────────────────────────────

function TierBadge({ tier }) {
  const t = RISK_TIER[tier] || RISK_TIER.T1;
  return (
    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: t.bgColor, color: t.color }}>
      {t.label} · {t.name}
    </span>
  );
}

function ConfidenceBadge({ score, label }) {
  const c = label === 'high' ? '#10b981' : label === 'medium' ? '#fb923c' : '#6b7280';
  return (
    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${c}18`, color: c }}>
      {score}% {label}
    </span>
  );
}

function ModTag({ mod }) {
  const c = MODULE_COLORS[mod] || '#6b7280';
  return (
    <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: `${c}15`, color: c }}>
      {mod}
    </span>
  );
}

function SectionHeader({ children }) {
  return (
    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>
      {children}
    </p>
  );
}

// ── STATUS CARD ───────────────────────────────────────────────────────────────

function AutoModeStatusCard({ enabled, paused, intensity, safetyMode, onToggle, onPause, onIntensityChange, onSafetyChange, stats }) {
  const statusColor = !enabled ? '#6b7280' : paused ? '#fb923c' : '#10b981';
  const statusLabel = !enabled ? 'DISABLED' : paused ? 'PAUSED' : 'ACTIVE';

  return (
    <div className="p-5 rounded-2xl" style={{ background: 'rgba(8,16,36,0.8)', border: `1px solid ${statusColor}30` }}>
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${statusColor}18` }}>
            <Zap size={22} style={{ color: statusColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 style={{ color: 'white', fontSize: 18, fontWeight: 900, margin: 0 }}>Auto Mode</h2>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: `${statusColor}18` }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusColor }} />
                <span style={{ color: statusColor, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em' }}>{statusLabel}</span>
              </div>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
              Supervised operations engine · Admin-only · Safety guard active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Intensity */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {['conservative', 'balanced', 'accelerated'].map(m => (
              <button key={m} onClick={() => onIntensityChange(m)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize"
                style={{ background: intensity === m ? 'rgba(59,130,246,0.25)' : 'transparent', color: intensity === m ? '#3b82f6' : 'rgba(255,255,255,0.35)' }}>
                {m}
              </button>
            ))}
          </div>

          {/* Safety mode */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {['strict', 'standard'].map(m => (
              <button key={m} onClick={() => onSafetyChange(m)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all capitalize"
                style={{ background: safetyMode === m ? 'rgba(239,68,68,0.2)' : 'transparent', color: safetyMode === m ? '#ef4444' : 'rgba(255,255,255,0.35)' }}>
                <Shield size={10} className="inline mr-1" />{m}
              </button>
            ))}
          </div>

          {enabled && (
            <button onClick={onPause}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: paused ? 'rgba(16,185,129,0.15)' : 'rgba(251,146,60,0.15)', color: paused ? '#10b981' : '#fb923c', border: `1px solid ${paused ? 'rgba(16,185,129,0.3)' : 'rgba(251,146,60,0.3)'}` }}>
              {paused ? <><Play size={11} /> Resume</> : <><Pause size={11} /> Pause All</>}
            </button>
          )}

          <button onClick={onToggle}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
            style={{ background: enabled ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: enabled ? '#ef4444' : '#10b981', border: `1px solid ${enabled ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
            {enabled ? <><XCircle size={11} /> Disable</> : <><Play size={11} /> Enable</>}
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
        {[
          { label: 'Auto Executed', value: stats.executed, color: '#10b981' },
          { label: 'Pending Approval', value: stats.pending, color: '#fb923c' },
          { label: 'Escalated', value: stats.escalated, color: '#ef4444' },
          { label: 'Active Rules', value: stats.activeRules, color: '#3b82f6' },
          { label: 'Today\'s Actions', value: stats.todayTotal, color: '#8b5cf6' },
        ].map((s, i) => (
          <div key={i} className="text-center p-3 rounded-xl" style={{ background: `${s.color}0a`, border: `1px solid ${s.color}18` }}>
            <p style={{ color: s.color, fontSize: 20, fontWeight: 900, margin: '0 0 2px' }}>{s.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SAFETY GUARD PANEL ────────────────────────────────────────────────────────

function SafetyGuardPanel() {
  const BLOCKED = [
    'Block/reactivate accounts', 'Permission & role changes', 'Financial verification',
    'Plan reassignment', 'Leader hierarchy changes', 'Investment amount edits',
    'Compliance-critical actions', 'Any irreversible operation',
  ];
  return (
    <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} style={{ color: '#ef4444' }} />
        <span style={{ color: '#ef4444', fontSize: 12, fontWeight: 800 }}>Safety Guard — Active</span>
        <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>All checks passing</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {BLOCKED.map((b, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.07)' }}>
            <Lock size={9} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, lineHeight: 1.3 }}>{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EXECUTION QUEUE ───────────────────────────────────────────────────────────

function ExecutionQueue({ items, onRollback }) {
  return (
    <div>
      <SectionHeader>TIER 1 — AUTO-EXECUTED ACTIONS</SectionHeader>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,16,36,0.5)' }}>
        <table className="w-full text-xs">
          <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
            <tr>{['Action', 'Module', 'Trigger', 'Affected', 'Confidence', 'Time', 'Status', ''].map(h => (
              <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-3 py-2.5">
                  <p style={{ color: 'white', fontWeight: 600, fontSize: 11, margin: 0 }}>{item.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>{item.id}</p>
                </td>
                <td className="px-3 py-2.5"><ModTag mod={item.module} /></td>
                <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{item.trigger}</td>
                <td className="px-3 py-2.5" style={{ color: '#3b82f6', fontWeight: 700 }}>{item.affected}</td>
                <td className="px-3 py-2.5"><ConfidenceBadge score={item.confidence} label={item.confidence >= 75 ? 'high' : 'medium'} /></td>
                <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{item.executedAt}</td>
                <td className="px-3 py-2.5">
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{
                    background: item.status === 'executed' ? 'rgba(16,185,129,0.15)' : item.status === 'scheduled' ? 'rgba(59,130,246,0.15)' : 'rgba(251,146,60,0.15)',
                    color: item.status === 'executed' ? '#10b981' : item.status === 'scheduled' ? '#3b82f6' : '#fb923c'
                  }}>{item.status}</span>
                </td>
                <td className="px-3 py-2.5">
                  {item.rollbackAvailable && (
                    <button onClick={() => onRollback(item.id)} className="px-2 py-1 rounded text-xs transition-all hover:bg-white/10"
                      style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      Rollback
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── APPROVAL QUEUE ────────────────────────────────────────────────────────────

function ApprovalQueue({ items, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div>
      <SectionHeader>TIER 2 — PENDING APPROVAL</SectionHeader>
      <div className="space-y-2">
        {items.filter(i => i.status === 'pending').map(item => (
          <div key={item.id} className="rounded-xl overflow-hidden" style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.2)' }}>
            <div className="flex items-start gap-3 p-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,146,60,0.15)' }}>
                <Clock size={13} style={{ color: '#fb923c' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <TierBadge tier="T2" />
                  <ModTag mod={item.module} />
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{item.id}</span>
                </div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: '0 0 3px' }}>{item.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', lineHeight: 1.5 }}>{item.reason}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Owner: <span style={{ color: '#fb923c' }}>{item.suggestedOwner}</span></span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Affected: <span style={{ color: '#3b82f6', fontWeight: 700 }}>{item.affected} record{item.affected > 1 ? 's' : ''}</span></span>
                  <ConfidenceBadge score={item.confidence} label={item.confidence >= 75 ? 'high' : 'medium'} />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  className="p-1.5 rounded transition-all hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {expanded === item.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button onClick={() => onReject(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                  Reject
                </button>
                <button onClick={() => onApprove(item.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid rgba(16,185,129,0.35)' }}>
                  Approve
                </button>
              </div>
            </div>
            {expanded === item.id && (
              <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', margin: '12px 0 8px' }}>AFFECTED RECORDS</p>
                <div className="space-y-1.5">
                  {item.affectedRecords.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 10 }}>{r.id}</span>
                      <span style={{ color: 'white', fontWeight: 600, fontSize: 11 }}>{r.name}</span>
                      {r.country && <span className="px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', fontSize: 9 }}>{r.country}</span>}
                      {r.plan && <span style={{ color: '#8b5cf6', fontSize: 10 }}>{r.plan}</span>}
                      {r.amount && <span style={{ color: '#10b981', fontWeight: 700, fontSize: 10 }}>{r.amount}</span>}
                      {r.compliance && <span style={{ color: '#ef4444', fontSize: 10 }}>Compliance: {r.compliance}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {items.filter(i => i.status === 'pending').length === 0 && (
          <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>No pending approvals</div>
        )}
      </div>
    </div>
  );
}

// ── ESCALATION QUEUE ──────────────────────────────────────────────────────────

function EscalationQueue({ items }) {
  return (
    <div>
      <SectionHeader>TIER 3 — MANUAL ESCALATIONS (NEVER AUTO-EXECUTED)</SectionHeader>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                <AlertTriangle size={13} style={{ color: '#ef4444' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <TierBadge tier="T3" />
                  <ModTag mod={item.module} />
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: item.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(251,146,60,0.15)', color: item.severity === 'critical' ? '#ef4444' : '#fb923c' }}>
                    {item.severity.toUpperCase()}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>Escalated at {item.escalatedAt}</span>
                </div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 12, margin: '0 0 3px' }}>{item.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 6px', lineHeight: 1.5 }}>{item.reason}</p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <Lock size={10} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 600 }}>{item.manualAction}</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Module: <span style={{ color: 'rgba(255,255,255,0.6)' }}>{item.affectedModule}</span></span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Affected: <span style={{ color: '#ef4444', fontWeight: 700 }}>{item.affectedCount}</span></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── RULES LIST ────────────────────────────────────────────────────────────────

function RulesList({ rules, onToggle }) {
  const [filter, setFilter] = useState('all');
  const tiers = ['all', 'T1', 'T2'];
  const filtered = filter === 'all' ? rules : rules.filter(r => r.riskTier === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <SectionHeader>AUTO RULES ENGINE — {rules.filter(r => r.enabled).length} ACTIVE RULES</SectionHeader>
        <div className="flex gap-1">
          {tiers.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
              style={{ background: filter === t ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)', color: filter === t ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}>
              {t === 'all' ? 'All' : RISK_TIER[t]?.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,16,36,0.5)' }}>
        <table className="w-full text-xs">
          <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
            <tr>{['ID', 'Module', 'Trigger', 'Condition', 'Action', 'Risk', 'Owner', 'Status'].map(h => (
              <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map((rule, i) => (
              <tr key={rule.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', opacity: rule.enabled ? 1 : 0.45 }}>
                <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 10 }}>{rule.id}</td>
                <td className="px-3 py-2.5"><ModTag mod={rule.module} /></td>
                <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 160 }}>{rule.trigger}</td>
                <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.45)', maxWidth: 160 }}>{rule.condition}</td>
                <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 180 }}>{rule.action}</td>
                <td className="px-3 py-2.5"><TierBadge tier={rule.riskTier} /></td>
                <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{rule.owner}</td>
                <td className="px-3 py-2.5">
                  <button onClick={() => onToggle(rule.id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all"
                    style={{ background: rule.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: rule.enabled ? '#10b981' : 'rgba(255,255,255,0.35)' }}>
                    {rule.enabled ? <><CheckCircle2 size={9} /> Active</> : <><XCircle size={9} /> Disabled</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── EXECUTION LOG ─────────────────────────────────────────────────────────────

function ExecutionLogPanel({ log }) {
  return (
    <div>
      <SectionHeader>EXECUTION LOG — LAST {log.length} ENTRIES</SectionHeader>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,16,36,0.5)' }}>
        <table className="w-full text-xs">
          <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
            <tr>{['ID', 'Action', 'Module', 'Trigger', 'Risk', 'Confidence', 'Approved By', 'Time', 'Result'].map(h => (
              <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {log.map((entry, i) => (
              <tr key={entry.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-3 py-2" style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', fontSize: 9 }}>{entry.id}</td>
                <td className="px-3 py-2" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 500 }}>{entry.action}</td>
                <td className="px-3 py-2"><ModTag mod={entry.module} /></td>
                <td className="px-3 py-2" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{entry.trigger}</td>
                <td className="px-3 py-2"><TierBadge tier={entry.riskTier} /></td>
                <td className="px-3 py-2"><ConfidenceBadge score={entry.confidence} label={entry.confidence >= 75 ? 'high' : 'medium'} /></td>
                <td className="px-3 py-2">
                  <span style={{ color: entry.approvedBy === 'AUTO' ? '#10b981' : '#3b82f6', fontWeight: 700, fontSize: 10 }}>{entry.approvedBy}</span>
                </td>
                <td className="px-3 py-2" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{entry.ts}</td>
                <td className="px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                    {entry.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── MAIN CONSOLE ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'queues', label: 'Action Queues', icon: ListChecks },
  { id: 'rules', label: 'Rules Engine', icon: Activity },
  { id: 'log', label: 'Execution Log', icon: BarChart3 },
  { id: 'safety', label: 'Safety Guard', icon: Shield },
];

export default function AutoModeConsole({ compact = false }) {
  const [enabled, setEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [intensity, setIntensity] = useState('balanced');
  const [safetyMode, setSafetyMode] = useState('strict');
  const [activeTab, setActiveTab] = useState('queues');
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [approvalQueue, setApprovalQueue] = useState(generateApprovalQueue);
  const [execQueue, setExecQueue] = useState(() => generateExecutionQueue(0));
  const [execLog, setExecLog] = useState(() => generateExecutionLog(0));
  const sim = useSimulation();

  useEffect(() => {
    if (sim.tick % 6 === 0 && sim.tick > 0 && enabled && !paused) {
      setExecQueue(generateExecutionQueue(sim.tick));
      setExecLog(generateExecutionLog(sim.tick));
    }
  }, [sim.tick, enabled, paused]);

  const escalationQueue = generateEscalationQueue();

  const handleApprove = (id) => {
    setApprovalQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'approved' } : i));
    setExecLog(prev => [{
      id: `LOG-${String(prev.length + 1).padStart(3, '0')}`,
      action: approvalQueue.find(i => i.id === id)?.title || 'Action approved',
      module: approvalQueue.find(i => i.id === id)?.module || 'Unknown',
      trigger: id, riskTier: 'T2', confidence: 72,
      approvedBy: 'Admin', result: 'success', ts: new Date().toLocaleTimeString('en-GB'),
    }, ...prev]);
  };

  const handleReject = (id) => {
    setApprovalQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'rejected' } : i));
  };

  const handleRollback = (id) => {
    setExecQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'paused' } : i));
  };

  const handleToggleRule = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const stats = {
    executed: execQueue.filter(e => e.status === 'executed').length,
    pending: approvalQueue.filter(a => a.status === 'pending').length,
    escalated: escalationQueue.length,
    activeRules: rules.filter(r => r.enabled).length,
    todayTotal: execLog.length,
  };

  return (
    <div className="space-y-5">
      {!compact && (
        <div>
          <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', margin: '0 0 6px' }}>SUPERVISED OPERATIONS ENGINE — ADMIN ONLY</p>
          <h2 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: '0 0 3px', letterSpacing: -0.5 }}>Auto Mode</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0 }}>Rule-based controlled automation · Safety guard enforced · Full audit trail</p>
        </div>
      )}

      <AutoModeStatusCard
        enabled={enabled} paused={paused} intensity={intensity} safetyMode={safetyMode}
        onToggle={() => setEnabled(v => !v)}
        onPause={() => setPaused(v => !v)}
        onIntensityChange={setIntensity}
        onSafetyChange={setSafetyMode}
        stats={stats}
      />

      {!enabled && (
        <div className="text-center py-10 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <XCircle size={28} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 10px' }} />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 600 }}>Auto Mode is disabled</p>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Enable Auto Mode to activate the automation engine</p>
        </div>
      )}

      {enabled && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all"
                  style={{ borderColor: activeTab === t.id ? '#3b82f6' : 'transparent', color: activeTab === t.id ? '#3b82f6' : 'rgba(255,255,255,0.38)' }}>
                  <Icon size={12} /> {t.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
              className="space-y-6">
              {activeTab === 'queues' && (
                <>
                  <ExecutionQueue items={execQueue} onRollback={handleRollback} />
                  <ApprovalQueue items={approvalQueue} onApprove={handleApprove} onReject={handleReject} />
                  <EscalationQueue items={escalationQueue} />
                </>
              )}
              {activeTab === 'rules' && (
                <RulesList rules={rules} onToggle={handleToggleRule} />
              )}
              {activeTab === 'log' && (
                <ExecutionLogPanel log={execLog} />
              )}
              {activeTab === 'safety' && (
                <div className="space-y-4">
                  <SafetyGuardPanel />
                  <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(8,16,36,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 800, letterSpacing: '0.2em' }}>CONFIDENCE SCORING RULES</p>
                    {[
                      ['Risk Tier T1 required', 'Only Tier 1 actions may auto-execute'],
                      ['Confidence ≥ 75%', 'Minimum confidence threshold for auto-execution'],
                      ['Safety Guard approval', 'Action type must not be in blocked list'],
                      ['Data completeness check', 'All required fields must be present'],
                      ['Trigger clarity', 'Clear unambiguous trigger condition required'],
                    ].map(([title, desc], i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.05)' }}>
                        <CheckCircle2 size={12} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <p style={{ color: 'white', fontWeight: 600, fontSize: 11, margin: 0 }}>{title}</p>
                          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
