/**
 * Copilot Action Card — single executable action unit
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Play, CheckCircle2, Clock, X, Users, AlertTriangle } from 'lucide-react';

const SEV_COLOR = { critical: '#ef4444', high: '#fb923c', medium: '#f59e0b', low: '#6b7280' };
const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#6b7280', icon: Clock },
  ready: { label: 'Ready', color: '#3b82f6', icon: Play },
  in_progress: { label: 'In Progress', color: '#f59e0b', icon: Clock },
  executed: { label: 'Executed', color: '#10b981', icon: CheckCircle2 },
  dismissed: { label: 'Dismissed', color: '#374151', icon: X },
};

export default function CopilotActionCard({ action, onStatusChange, onPrepare }) {
  const [expanded, setExpanded] = useState(false);
  const pc = SEV_COLOR[action.priority] || '#888';
  const sc = STATUS_CONFIG[action.status] || STATUS_CONFIG.pending;
  const StatusIcon = sc.icon;

  if (action.status === 'dismissed') return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${pc}22`, background: `${pc}06` }}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        {/* Priority + ID */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
          <span className="px-1.5 py-0.5 rounded font-black" style={{ background: `${pc}20`, color: pc, fontSize: 8 }}>
            {action.priority.toUpperCase()}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontFamily: 'monospace' }}>{action.id}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <p style={{ color: 'white', fontWeight: 800, fontSize: 13, margin: 0, lineHeight: 1.35 }}>{action.title}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: `${sc.color}15`, color: sc.color, fontSize: 9, fontWeight: 700 }}>
                <StatusIcon size={9} /> {sc.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }}>{action.module}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
              <Users size={9} className="inline mr-1" style={{ color: 'rgba(255,255,255,0.3)' }} />
              {action.affectedCount} affected
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Operator: {action.operator}</span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0, lineHeight: 1.5 }}>{action.context}</p>
        </div>
      </div>

      {/* Expandable detail */}
      <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/3 transition-all"
        >
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600 }}>
            {expanded ? 'Hide detail' : 'Show context & steps'}
          </span>
          {expanded ? <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.3)' }} /> : <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                {/* Reason */}
                <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', margin: '0 0 4px' }}>REASON</p>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0, lineHeight: 1.5 }}>{action.reason}</p>
                </div>

                {/* Steps */}
                {action.steps && (
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', margin: '0 0 8px' }}>EXECUTION STEPS</p>
                    <div className="space-y-1.5">
                      {action.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 font-black" style={{ background: `${pc}20`, color: pc, fontSize: 8 }}>{i + 1}</div>
                          <div>
                            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: 600, margin: 0 }}>{step.label}</p>
                            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0 }}>{step.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Affected entities preview */}
                {action.entities && action.entities.length > 0 && (
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', margin: '0 0 8px' }}>AFFECTED ENTITIES ({action.entities.length})</p>
                    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                      {action.entities.slice(0, 5).map((e, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2" style={{ borderBottom: i < Math.min(action.entities.length, 5) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: 'rgba(0,0,0,0.2)' }}>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'monospace', minWidth: 60 }}>{e.id}</span>
                          <span style={{ color: 'white', fontSize: 11, fontWeight: 600, flex: 1 }}>{e.name || e.title}</span>
                          {e.country && <span className="px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', fontSize: 9 }}>{e.country}</span>}
                          {e.amount && <span style={{ color: '#10b981', fontSize: 10, fontWeight: 700 }}>${e.amount.toLocaleString()}</span>}
                          {e.violations && <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 700 }}>{e.violations} violations</span>}
                          {e.stage && <span style={{ color: '#fb923c', fontSize: 9, fontWeight: 600 }}>{e.stage}</span>}
                        </div>
                      ))}
                      {action.entities.length > 5 && (
                        <div className="px-3 py-1.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
                          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>+{action.entities.length - 5} more entities in execution panel</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      {action.status !== 'executed' && (
        <div className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
          <button
            onClick={() => onPrepare(action)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90"
            style={{ background: `${pc}20`, color: pc, border: `1px solid ${pc}30` }}
          >
            <Play size={10} /> Prepare Execution
          </button>
          {action.status === 'pending' && (
            <button onClick={() => onStatusChange(action.id, 'in_progress')} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/10" style={{ color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
              Mark In Progress
            </button>
          )}
          {action.status === 'in_progress' && (
            <button onClick={() => onStatusChange(action.id, 'executed')} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/10" style={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
              Mark Executed
            </button>
          )}
          <button onClick={() => onStatusChange(action.id, 'dismissed')} className="ml-auto p-1.5 rounded transition-all hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <X size={12} />
          </button>
        </div>
      )}
    </motion.div>
  );
}