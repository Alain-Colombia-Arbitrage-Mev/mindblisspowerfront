/**
 * NetworkExpansionIntelligence
 * Full expansion analysis panel — used inside MemberNetwork analytics tab
 */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { analyzeExpansion } from '@/lib/networkExpansionEngine';
import { Users, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

const PRIORITY_STYLES = {
  critical: { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  color: '#ef4444' },
  danger:   { bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)',  color: '#ef4444' },
  warning:  { bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.3)', color: '#fb923c' },
  action:   { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', color: '#3b82f6' },
  success:  { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#10b981' },
  info:     { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', color: '#818cf8' },
};

export default function NetworkExpansionIntelligence({ userId }) {
  const navigate = useNavigate();
  const [showSlots, setShowSlots] = useState(false);
  const data = useMemo(() => analyzeExpansion(userId), [userId]);

  const { leftCount, rightCount, total, diff, balancePct, weakSide, status, statusConfig, recommendations, prioritySlots, allSlots } = data;

  const leftPct  = total > 0 ? Math.round((leftCount / total) * 100) : 50;
  const rightPct = 100 - leftPct;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* HEADER STATUS */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '20px 22px', borderRadius: 14, background: `${statusConfig.color}0D`, border: `1px solid ${statusConfig.color}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Estado de Expansión</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <motion.div
                animate={status !== 'balanced' && status !== 'empty' ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 10, height: 10, borderRadius: '50%', background: statusConfig.color, boxShadow: `0 0 8px ${statusConfig.color}` }}
              />
              <h3 style={{ color: 'white', fontWeight: 900, fontSize: 18, margin: 0 }}>{statusConfig.label}</h3>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: '0 0 2px 0' }}>Balance</p>
            <p style={{ color: statusConfig.color, fontSize: 28, fontWeight: 900, margin: 0, fontFamily: 'Montserrat,sans-serif' }}>{balancePct}%</p>
          </div>
        </div>

        {/* BINARY BAR */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
            <motion.div initial={{ flex: 0 }} animate={{ flex: leftCount || 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '6px 0 0 6px', minWidth: 4,
                boxShadow: weakSide === 'right' ? '2px 0 12px rgba(59,130,246,0.5)' : 'none' }} />
            <motion.div initial={{ flex: 0 }} animate={{ flex: rightCount || 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, #7c3aed, #8b5cf6)', borderRadius: '0 6px 6px 0', minWidth: 4,
                boxShadow: weakSide === 'left' ? '0 0 12px rgba(139,92,246,0.5)' : 'none' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ color: '#60a5fa', fontSize: 10, fontWeight: 800 }}>
              ◀ IZQ — {leftCount} miembros ({leftPct}%)
            </span>
            <span style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 800 }}>
              DER — {rightCount} miembros ({rightPct}%) ▶
            </span>
          </div>
        </div>

        {diff > 0 && (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Diferencia actual</span>
            <span style={{ color: statusConfig.color, fontWeight: 800, fontSize: 12 }}>
              {diff} miembro{diff !== 1 ? 's' : ''} en lado {weakSide === 'left' ? 'izquierdo' : 'derecho'}
            </span>
          </div>
        )}
      </motion.div>

      {/* PULSE ALERT — weak side highlight */}
      {(status === 'moderate' || status === 'heavy') && (
        <motion.div
          animate={{ opacity: [1, 0.6, 1], scale: [1, 1.01, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ padding: '14px 18px', borderRadius: 12, border: `1px dashed ${weakSide === 'left' ? 'rgba(59,130,246,0.5)' : 'rgba(139,92,246,0.5)'}`, background: weakSide === 'left' ? 'rgba(59,130,246,0.06)' : 'rgba(139,92,246,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
            style={{ width: 36, height: 36, borderRadius: '50%', background: weakSide === 'left' ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            {weakSide === 'left' ? '◀' : '▶'}
          </motion.div>
          <div>
            <p style={{ color: 'white', fontWeight: 800, fontSize: 12, margin: '0 0 2px 0' }}>
              Enfoca crecimiento en lado {weakSide === 'left' ? 'izquierdo' : 'derecho'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>
              Este lado necesita {diff} miembro{diff !== 1 ? 's' : ''} más para equilibrar
            </p>
          </div>
        </motion.div>
      )}

      {/* RECOMMENDATIONS */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>Recomendaciones</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recommendations.map((rec, i) => {
            const s = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.info;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                style={{ padding: '12px 14px', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{rec.icon}</span>
                <div>
                  <p style={{ color: s.color, fontWeight: 800, fontSize: 11, margin: '0 0 2px 0' }}>{rec.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0, lineHeight: 1.5 }}>{rec.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* EXPANSION POINTS */}
      <div>
        <button onClick={() => setShowSlots(!showSlots)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'white', fontSize: 11, fontWeight: 700 }}>
          <span>📍 Puntos de expansión disponibles ({allSlots.length})</span>
          {showSlots ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        <AnimatePresence>
          {showSlots && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
              style={{ overflow: 'hidden' }}>
              <div style={{ paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allSlots.map((slot, i) => {
                  const sideColor = slot.side === 'left' ? '#3b82f6' : '#8b5cf6';
                  const isPriority = prioritySlots.some(p => p.parentId === slot.parentId && p.side === slot.side);
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: isPriority ? `${sideColor}10` : 'rgba(255,255,255,0.03)', border: `1px ${isPriority ? 'solid' : 'dashed'} ${sideColor}${isPriority ? '35' : '20'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px dashed ${sideColor}50`, background: `${sideColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>+</div>
                        <div>
                          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: 700, margin: 0 }}>
                            Bajo <span style={{ color: sideColor }}>{slot.parentName}</span>
                          </p>
                          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: 0 }}>
                            Lado {slot.side === 'left' ? 'izquierdo' : 'derecho'} {isPriority ? '⭐ PRIORITARIO' : ''}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/dashboard/communications')}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 7, border: `1px solid ${sideColor}40`, background: `${sideColor}15`, color: sideColor, fontSize: 9, fontWeight: 800, cursor: 'pointer' }}>
                        <Users size={10} /> Invitar aquí
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/dashboard/network')}
        style={{ width: '100%', padding: '13px 0', borderRadius: 11, background: 'linear-gradient(135deg, #1d6ef5, #7c3aed)', color: 'white', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 24px rgba(59,130,246,0.25)' }}>
        Ver árbol completo <ArrowRight size={14} />
      </motion.button>
    </div>
  );
}