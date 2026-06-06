import { motion } from 'framer-motion';

export default function HoverCard({ children, style = {}, className = '', onClick, glowColor = 'rgba(59,130,246,0.15)' }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, boxShadow: `0 16px 48px ${glowColor}, 0 4px 16px rgba(0,0,0,0.3)` }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 200ms ease',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}