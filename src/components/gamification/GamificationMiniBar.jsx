/**
 * GamificationMiniBar — compact progress strip for top of home pages
 * Shows level, XP bar, next goal — without taking up too much space
 */
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Crown, Trophy } from 'lucide-react';
import { computeGamification } from '@/lib/gamificationEngine';
import GamificationPanel from './GamificationPanel';

export default function GamificationMiniBar() {
  const [expanded, setExpanded] = useState(false);
  const g = useMemo(() => computeGamification(), []);
  const { currentLevel, nextLevel, progressPct, totalXP, recentAchievement } = g;
  const levelColor = currentLevel.id >= 4 ? 'var(--vp-amber)' : currentLevel.id >= 2 ? 'var(--vp-accent)' : 'var(--vp-muted)';
  const levelMuted = currentLevel.id >= 4 ? 'var(--vp-amber-muted)' : currentLevel.id >= 2 ? 'var(--vp-accent-muted)' : 'var(--vp-surface-raised)';
  const levelBorder = currentLevel.id >= 4 ? 'var(--vp-amber-border)' : currentLevel.id >= 2 ? 'var(--vp-accent-border)' : 'var(--vp-border)';
  const LevelIcon = currentLevel.id >= 5 ? Crown : Trophy;

  return (
    <div>
      {/* MINI STRIP */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '10px 20px',
          borderRadius: expanded ? '14px 14px 0 0' : 14,
          background: 'var(--vp-surface)',
          border: '1px solid var(--vp-border)',
          borderBottom: expanded ? '1px solid var(--vp-border)' : undefined,
          boxShadow: 'var(--vp-shadow)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
          transition: 'border-radius 200ms ease',
        }}
      >
        {/* ICON */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            width: 32, height: 32, borderRadius: 9,
            background: levelMuted,
            border: `1px solid ${levelBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <LevelIcon size={15} style={{ color: levelColor }} />
        </motion.div>

        {/* LEVEL */}
        <div style={{ flexShrink: 0 }}>
          <p style={{ color: levelColor, fontSize: 9, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Nivel {currentLevel.id}
          </p>
          <p style={{ color: 'var(--vp-text)', fontSize: 13, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>{currentLevel.name}</p>
        </div>

        {/* PROGRESS BAR */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--vp-muted)', fontSize: 8, fontWeight: 700 }}>
              {totalXP.toLocaleString()} XP · {nextLevel ? `Próximo: ${nextLevel.name}` : 'Nivel máximo'}
            </span>
            <span style={{ color: levelColor, fontSize: 8, fontWeight: 800 }}>
              {nextLevel ? `${progressPct}%` : '100%'}
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 4, background: 'var(--vp-shell)', border: '1px solid var(--vp-border)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${nextLevel ? progressPct : 100}%` }}
              transition={{ duration: 1.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                height: '100%', borderRadius: 4,
                background: levelColor,
                boxShadow: 'none',
              }}
            />
          </div>
        </div>

        {/* RECENT ACHIEVEMENT */}
        {recentAchievement && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'var(--vp-accent-muted)', border: '1px solid var(--vp-accent-border)' }}>
            <span style={{ color: 'var(--vp-accent)', fontSize: 9, fontWeight: 800 }}>{recentAchievement.label}</span>
          </div>
        )}

        {/* EXPAND TOGGLE */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ flexShrink: 0, color: 'var(--vp-subtle)' }}
        >
          <ChevronDown size={14} />
        </motion.div>
      </motion.div>

      {/* EXPANDED PANEL */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '16px',
              borderRadius: '0 0 14px 14px',
              background: 'var(--vp-surface)',
              border: '1px solid var(--vp-border)',
              borderTop: 'none',
            }}>
              <GamificationPanel compact={true} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
