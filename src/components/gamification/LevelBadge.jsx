import { motion } from 'framer-motion';

export default function LevelBadge({ level, size = 'md', showName = true }) {
  const s = { sm: { outer: 28, inner: 20, font: 10 }, md: { outer: 40, inner: 28, font: 16 }, lg: { outer: 56, inner: 40, font: 22 } }[size] || { outer: 40, inner: 28, font: 16 };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <motion.div
        animate={{ boxShadow: [`0 0 0px ${level.color}40`, `0 0 16px ${level.color}50`, `0 0 0px ${level.color}40`] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={{
          width: s.outer, height: s.outer,
          borderRadius: s.outer * 0.3,
          background: `linear-gradient(135deg, ${level.color}25, ${level.color}10)`,
          border: `1.5px solid ${level.color}50`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: s.font,
        }}
      >
        {level.icon}
      </motion.div>
      {showName && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: level.color, fontSize: 8, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Nv.{level.id}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, margin: 0, fontWeight: 600 }}>{level.name}</p>
        </div>
      )}
    </div>
  );
}