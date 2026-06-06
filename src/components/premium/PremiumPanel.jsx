import { motion } from 'framer-motion';

export default function PremiumPanel({ title, children, icon, live = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-lg"
      style={{
        background: 'var(--vp-surface)',
        border: '1px solid var(--vp-border)',
        boxShadow: 'var(--vp-shadow)',
      }}
      whileHover={{ borderColor: 'var(--vp-border-strong)' }}
    >
      {title && (
        <motion.div
          className="flex items-center justify-between mb-6 pb-4"
          style={{ borderBottom: '1px solid var(--vp-border)' }}
        >
          <div className="flex items-center gap-3">
            {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
            <h3 style={{ color: 'var(--vp-text)', fontSize: 13, fontWeight: 700, margin: 0 }}>
              {title}
            </h3>
          </div>
          {live && (
            <div className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--vp-accent)' }}
              />
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--vp-accent)' }}>LIVE</span>
            </div>
          )}
        </motion.div>
      )}
      {children}
    </motion.div>
  );
}
