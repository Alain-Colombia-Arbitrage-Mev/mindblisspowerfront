import { motion } from 'framer-motion';

export default function GlassCard({ children, borderColor = 'var(--vp-border)', hoverLift = true, glowColor = null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverLift ? { y: -1 } : undefined}
      className="p-6 rounded-lg transition-all"
      style={{
        background: 'var(--vp-surface)',
        border: `1px solid ${borderColor}`,
        boxShadow: glowColor ? 'var(--vp-shadow)' : 'none',
      }}
    >
      {children}
    </motion.div>
  );
}
