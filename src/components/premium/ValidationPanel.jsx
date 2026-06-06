import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import RankGovernanceEngine from '@/lib/RankGovernanceEngine';

export default function ValidationPanel({ members = [], rootMemberId = null }) {
  const validation = RankGovernanceEngine.validateNetwork(members, rootMemberId);

  const healthPercent = validation.totalMembers > 0
    ? (validation.validMembers / validation.totalMembers) * 100
    : 0;
  const tone = validation.isHealthy
    ? { color: 'var(--vp-accent)', muted: 'var(--vp-accent-muted)', border: 'var(--vp-accent-border)' }
    : validation.errors.length > 0
      ? { color: 'var(--vp-danger)', muted: 'var(--vp-danger-muted)', border: 'var(--vp-danger-border)' }
      : { color: 'var(--vp-amber)', muted: 'var(--vp-amber-muted)', border: 'var(--vp-amber-border)' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg"
      style={{
        background: 'var(--vp-surface)',
        border: `1px solid ${tone.border}`,
        boxShadow: 'var(--vp-shadow)',
      }}
    >
      {/* Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {validation.isHealthy ? (
            <CheckCircle size={16} style={{ color: 'var(--vp-accent)' }} />
          ) : validation.errors.length > 0 ? (
            <AlertCircle size={16} style={{ color: 'var(--vp-danger)' }} />
          ) : (
            <AlertTriangle size={16} style={{ color: 'var(--vp-amber)' }} />
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: tone.color,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {validation.isHealthy ? 'Hierarchy Stable' : 'Validation Issues'}
          </span>
        </div>
        <motion.div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: tone.muted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: tone.color,
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {Math.round(healthPercent)}%
        </motion.div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Members', value: validation.totalMembers, color: 'var(--vp-text-soft)' },
          { label: 'Valid', value: validation.validMembers, color: 'var(--vp-accent)' },
          { label: 'Invalid', value: validation.invalidMembers.length, color: 'var(--vp-danger)' },
          { label: 'Avg Invest', value: `$${validation.averageInvestment.toLocaleString()}`, color: 'var(--vp-amber)' },
        ].map((metric, i) => (
          <div key={i} className="p-2 rounded" style={{ background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)' }}>
            <p style={{ color: 'var(--vp-subtle)', fontSize: 8, margin: '0 0 2px 0', textTransform: 'uppercase' }}>
              {metric.label}
            </p>
            <p style={{ color: metric.color, fontSize: 12, fontWeight: 700, margin: 0 }}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Health Bar */}
      <div className="mb-3">
        <div style={{ height: 4, background: 'var(--vp-shell)', border: '1px solid var(--vp-border)', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${healthPercent}%` }}
            transition={{ duration: 1 }}
            style={{ height: '100%', background: tone.color }}
          />
        </div>
      </div>

      {/* Validation Details */}
      {validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.slice(0, 2).map((error, i) => (
            <p key={i} style={{ color: 'var(--vp-danger)', fontSize: 9, margin: 0, lineHeight: 1.4 }}>
              • {error}
            </p>
          ))}
          {validation.errors.length > 2 && (
            <p style={{ color: 'var(--vp-subtle)', fontSize: 8, margin: '2px 0 0 0' }}>
              +{validation.errors.length - 2} more issues
            </p>
          )}
        </div>
      )}

      {/* Rank Info */}
      {validation.highestRankDetected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 pt-3"
          style={{ borderTop: '1px solid var(--vp-border)' }}
        >
          <p style={{ color: 'var(--vp-subtle)', fontSize: 9, margin: '0 0 4px 0' }}>
            HIERARCHY STATUS
          </p>
          <p style={{ color: 'var(--vp-text)', fontSize: 10, fontWeight: 600, margin: 0 }}>
            Highest: <span style={{ color: 'var(--vp-amber)' }}>{validation.highestRankDetected}</span>
            {validation.rootLeaderValid && (
              <span style={{ color: 'var(--vp-accent)', marginLeft: 6 }}>✓ Root Locked</span>
            )}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
