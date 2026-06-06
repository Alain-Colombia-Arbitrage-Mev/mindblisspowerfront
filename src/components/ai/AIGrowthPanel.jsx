/**
 * AIGrowthPanel
 * Premium AI-driven growth recommendation panel for the member dashboard.
 * Shows top 3 actionable recommendations with priority, actions, and live feel.
 */
import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { analyzeGrowth, PRIORITY } from '@/lib/aiGrowthEngine';
import { Sparkles, ArrowRight, RefreshCw, ChevronRight } from 'lucide-react';

const ACTION_ICONS = {
  'Invitar':   '+',
  'Contactar': '@',
  'Expandir':  '>',
};

function Ticker({ items }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 3200);
    return () => clearInterval(t);
  }, [items.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.span key={idx}
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
        style={{ color: 'var(--vp-accent)', fontSize: 10, fontWeight: 700 }}>
        {items[idx]}
      </motion.span>
    </AnimatePresence>
  );
}

export default function AIGrowthPanel({ userId }) {
  const navigate = useNavigate();
  const [pulse, setPulse] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const { recommendations: recs, snapshot, PRIORITY: P } = useMemo(
    () => analyzeGrowth(userId),
    [userId, lastRefresh]
  );

  const top3 = recs.slice(0, 3);
  const hasHigh = top3.some(r => r.priority === 'high');

  // Simulate live update pulse every 18s
  useEffect(() => {
    const t = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    }, 18000);
    return () => clearInterval(t);
  }, []);

  if (!top3.length) return null;

  const tickerItems = [
    `${snapshot.totalMembers} miembros en tu red`,
    `${snapshot.activityRate}% de actividad`,
    `${snapshot.emptySlots} posiciones libres`,
    snapshot.diff > 0 ? `Diferencia: ${snapshot.diff} miembros` : 'Estructura balanceada',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        borderRadius: 16,
        background: 'var(--vp-surface)',
        border: `1px solid ${hasHigh ? 'var(--vp-danger-border)' : 'var(--vp-border)'}`,
        overflow: 'hidden',
        boxShadow: 'none',
      }}
    >
      {/* ── HEADER ── */}
      <div style={{
        padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--vp-border)',
        background: 'var(--vp-surface-raised)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--vp-accent-muted)', border: '1px solid var(--vp-accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={14} style={{ color: 'var(--vp-accent)' }} />
          </div>
          <div>
            <p style={{ color: 'var(--vp-text)', fontWeight: 900, fontSize: 13, margin: 0, letterSpacing: '-0.2px' }}>IA Crecimiento</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--vp-accent)', flexShrink: 0 }} />
              <Ticker items={tickerItems} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasHigh && (
            <div style={{ padding: '3px 8px', borderRadius: 20, background: 'var(--vp-danger-muted)', border: '1px solid var(--vp-danger-border)', color: 'var(--vp-danger)', fontSize: 9, fontWeight: 800 }}>
              ● ATENCIÓN
            </div>
          )}
          <button onClick={() => { setPulse(true); setLastRefresh(Date.now()); setTimeout(() => setPulse(false), 600); }}
            style={{ background: 'var(--vp-surface)', border: '1px solid var(--vp-border)', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: 'var(--vp-muted)', display: 'flex', alignItems: 'center' }}>
            <motion.div animate={pulse ? { rotate: 360 } : {}} transition={{ duration: 0.5 }}>
              <RefreshCw size={11} />
            </motion.div>
          </button>
        </div>
      </div>

      {/* ── SNAPSHOT BAR ── */}
      <div style={{ padding: '10px 18px', display: 'flex', gap: 16, borderBottom: '1px solid var(--vp-border)', overflowX: 'auto' }}>
        {[
          { label: 'Miembros', value: snapshot.totalMembers, color: 'var(--vp-accent)' },
          { label: 'Activos', value: `${snapshot.activityRate}%`, color: 'var(--vp-accent)' },
          { label: 'IZQ', value: snapshot.leftCount, color: 'var(--vp-accent)' },
          { label: 'DER', value: snapshot.rightCount, color: 'var(--vp-amber)' },
          { label: 'Inactivos', value: snapshot.inactiveCount, color: snapshot.inactiveCount > 3 ? 'var(--vp-danger)' : 'var(--vp-subtle)' },
        ].map((stat, i) => (
          <div key={i} style={{ flexShrink: 0, textAlign: 'center' }}>
            <p style={{ color: stat.color, fontSize: 14, fontWeight: 900, margin: 0, fontFamily: 'Montserrat,sans-serif' }}>{stat.value}</p>
            <p style={{ color: 'var(--vp-muted)', fontSize: 8, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── RECOMMENDATIONS ── */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ color: 'var(--vp-subtle)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 4px 4px' }}>
          Top recomendaciones · {top3.length} acciones
        </p>

        {top3.map((rec, i) => {
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                borderRadius: 12,
                background: 'var(--vp-surface-raised)',
                border: `1px solid ${rec.priority === 'high' ? 'var(--vp-danger-border)' : 'var(--vp-border)'}`,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                {/* Icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: rec.priority === 'high' ? 'var(--vp-danger-muted)' : 'var(--vp-accent-muted)',
                  border: rec.priority === 'high' ? '1px solid var(--vp-danger-border)' : '1px solid var(--vp-accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  <Sparkles size={15} style={{ color: rec.priority === 'high' ? 'var(--vp-danger)' : 'var(--vp-accent)' }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <p style={{ color: 'var(--vp-text)', fontWeight: 800, fontSize: 12, margin: 0 }}>{rec.title}</p>
                    <span style={{
                      padding: '1px 6px', borderRadius: 20, fontSize: 8, fontWeight: 800,
                      background: rec.priority === 'high' ? 'var(--vp-danger-muted)' : 'var(--vp-accent-muted)',
                      color: rec.priority === 'high' ? 'var(--vp-danger)' : 'var(--vp-accent)',
                      flexShrink: 0,
                    }}>{rec.tag}</span>
                  </div>
                  <p style={{ color: 'var(--vp-muted)', fontSize: 10, margin: 0, lineHeight: 1.5 }}>{rec.detail}</p>
                </div>

                {/* Priority dot */}
                <motion.div
                  style={{ width: 8, height: 8, borderRadius: '50%', background: rec.priority === 'high' ? 'var(--vp-danger)' : 'var(--vp-accent)', flexShrink: 0, marginTop: 4 }}
                />
              </div>

              {/* Action button row */}
              <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6 }}>
                <motion.button
                  whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(rec.actionRoute)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--vp-accent-border)',
                    background: 'var(--vp-accent-muted)', color: 'var(--vp-accent)',
                    fontWeight: 800, fontSize: 11, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}>
                  <span>{ACTION_ICONS[rec.action] || '→'}</span>
                  {rec.action}
                  <ChevronRight size={11} />
                </motion.button>

                {rec.action !== 'Contactar' && (
                  <motion.button
                    whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/dashboard/team')}
                    style={{
                      padding: '8px 12px', borderRadius: 8,
                      border: '1px solid var(--vp-border)',
                      background: 'var(--vp-surface)', color: 'var(--vp-muted)',
                      fontWeight: 700, fontSize: 11, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                    Contactar
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── FOOTER CTA ── */}
      <motion.button
        whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}
        onClick={() => navigate('/dashboard/network')}
        style={{
          width: '100%', padding: '12px', border: 'none',
          borderTop: '1px solid var(--vp-border)',
          background: 'var(--vp-accent-muted)',
          color: 'var(--vp-accent)', fontWeight: 800, fontSize: 11, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
        Ver análisis completo de red <ArrowRight size={12} />
      </motion.button>
    </motion.div>
  );
}
