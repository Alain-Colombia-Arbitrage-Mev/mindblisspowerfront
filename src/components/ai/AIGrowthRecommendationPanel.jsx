/**
 * AI GROWTH RECOMMENDATION PANEL
 * Premium AI-driven card showing top growth actions for the member dashboard home.
 */
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { generateGrowthRecommendations, getNetworkStats } from '@/lib/aiGrowthEngine';
import { Zap, RefreshCw, ChevronRight } from 'lucide-react';

const PRIORITY_CONFIG = {
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   dot: '#ef4444' },
  medium: { color: '#fb923c', bg: 'rgba(251,146,60,0.08)',  border: 'rgba(251,146,60,0.25)',  dot: '#fb923c' },
  low:    { color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  dot: '#10b981' },
};

function HealthBar({ score }) {
  const color = score >= 75 ? '#10b981' : score >= 45 ? '#fb923c' : '#ef4444';
  const label = score >= 75 ? 'Saludable' : score >= 45 ? 'Mejorable' : 'Crítico';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: 4, background: color }}
        />
      </div>
      <span style={{ color, fontSize: 10, fontWeight: 800, minWidth: 52 }}>{score}% · {label}</span>
    </div>
  );
}

function ActionButton({ action, onNavigate }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
      onClick={() => onNavigate(action.route)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: 700,
      }}
    >
      <span>{action.icon}</span> {action.label}
    </motion.button>
  );
}

function RecCard({ rec, index, onNavigate }) {
  const cfg = PRIORITY_CONFIG[rec.priority] || PRIORITY_CONFIG.low;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      style={{ padding: '14px 16px', borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, position: 'relative', overflow: 'hidden' }}
    >
      {/* Priority glow on left edge */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '12px 0 0 12px', background: cfg.dot }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, paddingLeft: 6 }}>
        <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>{rec.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
            <p style={{ color: 'white', fontWeight: 800, fontSize: 12, margin: 0 }}>{rec.title}</p>
            <span style={{
              padding: '1px 7px', borderRadius: 20, fontSize: 8, fontWeight: 900,
              background: `${rec.tagColor}22`, color: rec.tagColor, letterSpacing: '0.5px',
            }}>{rec.tag}</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 10px 0', lineHeight: 1.5 }}>{rec.desc}</p>

          {/* Inactive member names pill list */}
          {rec.members?.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
              {rec.members.map((name, i) => (
                <span key={i} style={{ padding: '2px 8px', borderRadius: 20, background: 'rgba(251,146,60,0.15)', color: '#fb923c', fontSize: 9, fontWeight: 700 }}>{name}</span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {rec.actions.map((action, i) => (
              <ActionButton key={i} action={action} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AIGrowthRecommendationPanel({ userId }) {
  const navigate   = useNavigate();
  const [tick, setTick]         = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const recs  = useMemo(() => generateGrowthRecommendations(userId), [userId, tick]);
  const stats = useMemo(() => getNetworkStats(userId), [userId, tick]);

  // Simulate dynamic refresh every 45s
  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setLastUpdated(new Date());
    }, 45000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setTick(t => t + 1);
      setLastUpdated(new Date());
      setRefreshing(false);
    }, 900);
  };

  const highCount = recs.filter(r => r.priority === 'high').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(13,31,60,0.95), rgba(8,18,40,0.98))',
        border: '1px solid rgba(59,130,246,0.2)',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #1d6ef5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} style={{ color: 'white' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <p style={{ color: 'white', fontWeight: 900, fontSize: 13, margin: 0 }}>IA · Guía de Crecimiento</p>
              {highCount > 0 && (
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ padding: '1px 7px', borderRadius: 20, background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 8, fontWeight: 900 }}>
                  {highCount} URGENTE{highCount !== 1 ? 'S' : ''}
                </motion.span>
              )}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>
              Actualizado {lastUpdated.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={handleRefresh}
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}
        >
          <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={{ duration: 0.8, ease: 'linear' }}>
            <RefreshCw size={12} />
          </motion.div>
        </motion.button>
      </div>

      {/* ── HEALTH SCORE ── */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 5px 0' }}>Salud de red</p>
          <HealthBar score={stats.healthScore} />
        </div>
        <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
          {[
            { label: 'Total', value: stats.total, color: '#3b82f6' },
            { label: 'Vacíos', value: stats.emptySlots, color: '#fb923c' },
            { label: 'Inactivos', value: stats.inactives, color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <p style={{ color: s.color, fontWeight: 900, fontSize: 16, margin: 0, fontFamily: 'Montserrat,sans-serif' }}>{s.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: 0, fontWeight: 700 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECOMMENDATIONS ── */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AnimatePresence mode="popLayout">
          {refreshing ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6' }} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Analizando tu red...</p>
            </motion.div>
          ) : recs.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: '20px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>🎉</p>
              <p style={{ color: 'white', fontWeight: 800, fontSize: 13, margin: '0 0 4px 0' }}>Todo optimizado</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>Tu red está en excelente estado.</p>
            </motion.div>
          ) : (
            recs.map((rec, i) => (
              <RecCard key={rec.id} rec={rec} index={i} onNavigate={navigate} />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER CTA ── */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/dashboard/network')}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(29,110,245,0.2), rgba(124,58,237,0.2))',
            border: '1px solid rgba(59,130,246,0.25)',
            color: '#60a5fa', fontWeight: 800, fontSize: 11,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          Ver análisis completo de red <ChevronRight size={12} />
        </motion.button>
      </div>
    </motion.div>
  );
}