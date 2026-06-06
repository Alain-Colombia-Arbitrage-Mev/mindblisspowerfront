/**
 * AchievementUnlockToast — shows when a new achievement is detected
 * Import and use once in MemberLayout or similar.
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { computeGamification } from '@/lib/gamificationEngine';

export default function AchievementUnlockToast() {
  const [toasts, setToasts] = useState([]);
  const prevUnlockedRef = useRef(null);

  useEffect(() => {
    // Check every 3 seconds for newly unlocked achievements
    const check = () => {
      const g = computeGamification();
      const currentIds = g.achievements.filter(a => a.unlocked).map(a => a.id);

      if (prevUnlockedRef.current === null) {
        prevUnlockedRef.current = currentIds;
        return;
      }

      const newOnes = currentIds.filter(id => !prevUnlockedRef.current.includes(id));
      if (newOnes.length > 0) {
        const newAchievements = g.achievements.filter(a => newOnes.includes(a.id));
        setToasts(prev => [...prev, ...newAchievements.map(a => ({ ...a, toastId: `${a.id}_${Date.now()}` }))]);
        prevUnlockedRef.current = currentIds;
      }
    };

    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = (toastId) => setToasts(prev => prev.filter(t => t.toastId !== toastId));

  return (
    <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <AchievementToast key={toast.toastId} toast={toast} onDismiss={() => dismiss(toast.toastId)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function AchievementToast({ toast, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.9 }}
      transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 22px',
        borderRadius: 16,
        background: `linear-gradient(135deg, ${toast.color}18, rgba(8,18,40,0.96))`,
        border: `1.5px solid ${toast.color}50`,
        boxShadow: `0 8px 40px ${toast.color}30, 0 2px 8px rgba(0,0,0,0.5)`,
        backdropFilter: 'blur(16px)',
        cursor: 'pointer',
        minWidth: 280,
      }}
      onClick={onDismiss}
    >
      {/* particle burst */}
      <motion.div style={{ position: 'relative', flexShrink: 0 }}>
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{ scale: [0, 1, 0], x: Math.cos((i / 6) * Math.PI * 2) * 20, y: Math.sin((i / 6) * Math.PI * 2) * 20, opacity: [1, 1, 0] }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: toast.color, top: '50%', left: '50%' }}
          />
        ))}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${toast.color}20`,
            border: `1.5px solid ${toast.color}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}
        >
          {toast.icon}
        </motion.div>
      </motion.div>

      <div>
        <p style={{ color: toast.color, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 2px 0' }}>
          🎉 Logro Desbloqueado
        </p>
        <p style={{ color: 'white', fontSize: 14, fontWeight: 900, margin: '0 0 2px 0' }}>{toast.label}</p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>
          {toast.desc} · <span style={{ color: '#fbbf24', fontWeight: 700 }}>+{toast.xp} XP</span>
        </p>
      </div>
    </motion.div>
  );
}