import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export default function AchievementBadge({ achievement, index = 0 }) {
  const { unlocked, icon, label, desc, color, xp } = achievement;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        padding: '12px 14px',
        borderRadius: 12,
        background: unlocked ? `${color}10` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${unlocked ? color + '35' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: unlocked ? `0 4px 16px ${color}20` : 'none',
        position: 'relative',
        overflow: 'hidden',
        opacity: unlocked ? 1 : 0.5,
      }}
    >
      {/* glow shimmer when unlocked */}
      {unlocked && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.5, delay: index * 0.1 + 0.5, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 0, bottom: 0, width: '40%',
            background: `linear-gradient(90deg, transparent, ${color}20, transparent)`,
            pointerEvents: 'none',
          }}
        />
      )}

      <div className="flex items-center gap-2 mb-1">
        <motion.span
          style={{ fontSize: 18, lineHeight: 1 }}
          animate={unlocked ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.3 }}
        >
          {unlocked ? icon : '🔒'}
        </motion.span>
        {unlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: color,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
        )}
      </div>

      <p style={{
        color: unlocked ? 'white' : 'rgba(255,255,255,0.35)',
        fontSize: 11, fontWeight: 700, margin: '0 0 2px 0',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {label}
      </p>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0, lineHeight: 1.3 }}>
        {unlocked ? desc : '???'}
      </p>

      {unlocked && (
        <div style={{ marginTop: 6 }}>
          <span style={{ color: '#fbbf24', fontSize: 8, fontWeight: 800 }}>+{xp} XP</span>
        </div>
      )}
    </motion.div>
  );
}