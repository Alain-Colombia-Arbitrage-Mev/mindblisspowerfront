import { motion } from 'framer-motion';

export default function BinaryBalanceBar({ leftTotal, rightTotal, leftLabel = 'Left', rightLabel = 'Right', showValues = true }) {
  const total = leftTotal + rightTotal || 1;
  const leftPercent = (leftTotal / total) * 100;
  const rightPercent = (rightTotal / total) * 100;
  const isBalanced = Math.abs(leftPercent - rightPercent) < 10;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* BALANCE INDICATOR */}
      <div className="flex items-center justify-between">
        <div>
          <p style={{ color: 'var(--vp-muted)', fontSize: 11, fontWeight: 600, margin: 0 }}>
            Binary Balance
          </p>
          <p style={{ color: isBalanced ? 'var(--vp-accent)' : 'var(--vp-amber)', fontSize: 13, fontWeight: 700, margin: '2px 0 0 0' }}>
            {isBalanced ? 'Balanced' : `${Math.abs(leftPercent - rightPercent).toFixed(0)}% difference`}
          </p>
        </div>
      </div>

      {/* VISUAL BAR */}
      <div style={{ height: 12, background: 'var(--vp-shell)', borderRadius: 6, overflow: 'hidden', display: 'flex', border: '1px solid var(--vp-border)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${leftPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            background: 'var(--vp-accent)',
          }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${rightPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          style={{
            background: 'var(--vp-amber)',
          }}
        />
      </div>

      {/* LABELS */}
      {showValues && (
        <div className="flex items-center justify-between text-xs">
          <div>
            <p style={{ color: 'var(--vp-muted)', fontSize: 9, margin: 0 }}>{leftLabel}</p>
            <p style={{ color: 'var(--vp-text)', fontSize: 12, fontWeight: 700, margin: '2px 0 0 0' }}>
              ${leftTotal.toLocaleString()}
            </p>
            </div>
            <p style={{ color: 'var(--vp-subtle)', fontSize: 11, fontWeight: 600 }}>
            {leftPercent.toFixed(0)}% / {rightPercent.toFixed(0)}%
            </p>
            <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--vp-muted)', fontSize: 9, margin: 0 }}>{rightLabel}</p>
            <p style={{ color: 'var(--vp-text)', fontSize: 12, fontWeight: 700, margin: '2px 0 0 0' }}>
              ${rightTotal.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
