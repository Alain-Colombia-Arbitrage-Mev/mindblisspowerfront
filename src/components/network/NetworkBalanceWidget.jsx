/**
 * NetworkBalanceWidget — compact card for home dashboard
 * Shows balance status, quick action, and pulse alert
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { analyzeExpansion } from '@/lib/networkExpansionEngine';
import { ArrowRight } from 'lucide-react';

export default function NetworkBalanceWidget({ userId }) {
  const navigate = useNavigate();
  const data = useMemo(() => analyzeExpansion(userId), [userId]);
  const { leftCount, rightCount, total, status, statusConfig, weakSide, diff, recommendations } = data;

  const leftPct  = total > 0 ? Math.round((leftCount / total) * 100) : 50;
  const rightPct = 100 - leftPct;
  const topRec   = recommendations[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{
        padding: '18px 20px',
        borderRadius: 14,
        background: 'var(--vp-surface)',
        border: '1px solid var(--vp-border)',
        boxShadow: 'var(--vp-shadow)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ color: 'var(--vp-subtle)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Estado de Red</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <motion.div
                animate={status !== 'balanced' && status !== 'empty' ? { opacity: [1, 0.4, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: status === 'balanced' ? 'var(--vp-accent)' : 'var(--vp-amber)' }}
              />
              <span style={{ color: 'var(--vp-text)', fontWeight: 700, fontSize: 13 }}>{statusConfig.label}</span>
            </div>
            </div>
            <span style={{ color: 'var(--vp-accent)', fontSize: 20, fontWeight: 900, fontFamily: 'Montserrat,sans-serif' }}>
          {total > 0 ? `${Math.round(Math.min(leftCount, rightCount) / Math.max(leftCount, rightCount, 1) * 100)}%` : '—'}
        </span>
      </div>

      {/* Binary balance bar */}
      <div style={{ height: 6, borderRadius: 4, overflow: 'hidden', background: 'var(--vp-shell)', border: '1px solid var(--vp-border)', display: 'flex', marginBottom: 8 }}>
        <motion.div
          animate={weakSide === 'left' && status !== 'balanced' ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: `${leftPct}%`, background: 'var(--vp-accent)', borderRadius: '4px 0 0 4px', minWidth: 4 }}
        />
        <motion.div
          animate={weakSide === 'right' && status !== 'balanced' ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: `${rightPct}%`, background: 'var(--vp-amber)', borderRadius: '0 4px 4px 0', minWidth: 4 }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: 'var(--vp-accent)', fontSize: 9, fontWeight: 600 }}>IZQ {leftPct}% · {leftCount}</span>
        <span style={{ color: 'var(--vp-amber)', fontSize: 9, fontWeight: 600 }}>{rightCount} · {rightPct}% DER</span>
      </div>

      {/* Top recommendation */}
      {topRec && (
        <div style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)', marginBottom: 12 }}>
          <p style={{ color: 'var(--vp-text-soft)', fontSize: 10, fontWeight: 600, margin: '0 0 2px 0' }}>
            {topRec.title}
          </p>
          <p style={{ color: 'var(--vp-subtle)', fontSize: 9, margin: 0, lineHeight: 1.4 }}>{topRec.desc}</p>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/dashboard/network')}
        style={{ width: '100%', padding: '9px 0', borderRadius: 8, background: 'var(--vp-accent-muted)', border: '1px solid var(--vp-accent-border)', color: 'var(--vp-accent)', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        Ver expansión <ArrowRight size={11} />
      </motion.button>
    </motion.div>
  );
}
