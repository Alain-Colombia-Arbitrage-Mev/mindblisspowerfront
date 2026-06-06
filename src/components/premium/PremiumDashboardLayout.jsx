import { motion } from 'framer-motion';

export default function PremiumDashboardLayout({ children, title, subtitle = null, headerAction = null }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--vp-bg)' }}>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-10 px-8 py-6 border-b"
        style={{
          background: 'var(--vp-shell)',
          borderColor: 'var(--vp-border)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 style={{ color: 'var(--vp-text)', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ color: 'var(--vp-muted)', fontSize: 12, margin: 0, fontWeight: 500 }}>
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      </motion.div>

      {/* CONTENT */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-8 max-w-7xl mx-auto"
      >
        {children}
      </motion.div>
    </div>
  );
}
