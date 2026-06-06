/**
 * CopilotExecutionPanel — Structured execution interface for a selected Copilot action.
 * Shows: reason, steps, real affected records, module link, confirm/dismiss controls.
 * Designed as an operational panel — not a modal, not a card, not a chat.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getModuleColor } from '@/lib/aiCopilot';
import {
  X, ExternalLink, Check, ChevronRight, AlertTriangle,
  Users, CreditCard, Headphones, Zap, Shield, BookOpen, BarChart3, Lock
} from 'lucide-react';

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

function RecordsTable({ entities }) {
  if (!entities || entities.length === 0) return null;
  const keys = Object.keys(entities[0]).filter(k => k !== 'id');
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <table className="w-full text-xs">
        <thead style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <tr>
            <th className="px-3 py-2 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>#</th>
            {keys.map(k => (
              <th key={k} className="px-3 py-2 text-left font-semibold capitalize" style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entities.slice(0, 8).map((e, i) => (
            <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: i === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
              <td className="px-3 py-2" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>{i + 1}</td>
              {keys.map(k => {
                let val = e[k];
                if (k === 'amount') val = `$${Number(val).toLocaleString()}`;
                else if (k === 'riskScore') val = (
                  <span style={{ color: val > 65 ? '#ef4444' : val > 35 ? '#fb923c' : '#10b981', fontWeight: 700 }}>{val}</span>
                );
                else if (k === 'compliance') val = (
                  <span style={{ color: val < 70 ? '#ef4444' : val < 80 ? '#fb923c' : '#10b981', fontWeight: 700 }}>{val}%</span>
                );
                else if (k === 'violations') val = (
                  <span style={{ color: val >= 3 ? '#ef4444' : val > 0 ? '#fb923c' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>{val}</span>
                );
                else val = String(val ?? '—');
                return (
                  <td key={k} className="px-3 py-2" style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
          {entities.length > 8 && (
            <tr style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
              <td colSpan={keys.length + 1} className="px-3 py-2 text-center" style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>
                + {entities.length - 8} more records in module
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function CopilotExecutionPanel({ action, onExecute, onDismiss, onClose }) {
  const [confirmMode, setConfirmMode] = useState(false);
  const s = SEV[action.priority] || SEV.low;
  const mc = getModuleColor(action.module);
  const Icon = MODULE_ICONS[action.module] || Zap;
  const moduleRoute = MODULE_ROUTES[action.module];

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${s.color}35`, background: 'rgba(6,14,32,0.97)' }}>

      {/* Panel Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)', background: `${s.color}08` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${mc}18`, border: `1px solid ${mc}25` }}>
          <Icon size={15} style={{ color: mc }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 rounded font-black" style={{ background: s.bg, color: s.color, fontSize: 8, border: `1px solid ${s.border}` }}>{s.label}</span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>·</span>
            <span style={{ color: mc, fontSize: 9, fontWeight: 700 }}>{action.module}</span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>·</span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontFamily: 'monospace' }}>{action.id}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>·</span>
            <span style={{ color: s.color, fontSize: 9, fontWeight: 700 }}>{action.affectedCount} records affected</span>
          </div>
          <p style={{ color: 'white', fontSize: 13, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{action.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {moduleRoute && (
            <Link to={moduleRoute} target="_blank">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
                style={{ color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>
                <ExternalLink size={11} /> Open Module
              </button>
            </Link>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="p-5 space-y-5">

        {/* Context + Reason + Suggested Action — 3-col */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: 'CONTEXT', value: action.context },
            { label: 'REASON', value: action.reason },
            { label: 'SUGGESTED ACTION', value: action.suggestedAction },
          ].map(f => (
            <div key={f.label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', margin: '0 0 5px' }}>{f.label}</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, margin: 0, lineHeight: 1.55 }}>{f.value}</p>
            </div>
          ))}
        </div>

        {/* Execution Steps + Meta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Steps — 2/3 */}
          <div className="md:col-span-2">
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', margin: '0 0 8px' }}>EXECUTION SEQUENCE</p>
            <div className="space-y-1.5">
              {action.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-black" style={{ background: `${mc}20`, color: mc, fontSize: 9 }}>{step.step}</div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600, margin: 0 }}>{step.label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: '2px 0 0' }}>{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Meta — 1/3 */}
          <div className="space-y-2">
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', margin: '0 0 8px' }}>TASK METADATA</p>
            {[
              { label: 'Execution Target', value: action.executionTarget, color: '#3b82f6' },
              { label: 'Suggested Operator', value: action.suggestedOperator, color: '#8b5cf6' },
              { label: 'Records Affected', value: `${action.affectedCount} entries`, color: s.color },
              { label: 'Module', value: action.module, color: mc },
            ].map(f => (
              <div key={f.label} className="p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 700, margin: '0 0 2px' }}>{f.label}</p>
                <p style={{ color: f.color, fontSize: 11, fontWeight: 700, margin: 0 }}>{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Affected Records Table */}
        {action.affectedEntities?.length > 0 && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', margin: '0 0 8px' }}>
              AFFECTED RECORDS — {action.affectedEntities.length} TOTAL
            </p>
            <RecordsTable entities={action.affectedEntities} />
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {!confirmMode ? (
            <>
              <div className="flex-1">
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9 }}>
                  ⚠ This action requires explicit confirmation. No changes will be made automatically.
                </p>
              </div>
              <button onClick={() => onDismiss(action.id)}
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Dismiss
              </button>
              <button onClick={() => setConfirmMode(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all"
                style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)`, color: 'white', boxShadow: `0 4px 16px ${s.color}30` }}>
                Prepare Execution <ChevronRight size={12} />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center gap-3 p-4 rounded-xl" style={{ background: `${s.color}10`, border: `1px solid ${s.color}35` }}>
              <AlertTriangle size={14} style={{ color: s.color, flexShrink: 0 }} />
              <div className="flex-1">
                <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>Confirm: <em style={{ fontStyle: 'normal', color: s.color }}>{action.title}</em></p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: '2px 0 0' }}>{action.affectedCount} records · Operator: {action.suggestedOperator}</p>
              </div>
              <button onClick={() => setConfirmMode(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Cancel
              </button>
              <button onClick={() => { onExecute(action); setConfirmMode(false); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
                <Check size={13} /> Confirm & Execute
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}