import { motion } from 'framer-motion';

export default function ScrollReveal({ children, delay = 0, direction = 'up', className = '', style = {} }) {
  const initial = {
    up:    { opacity: 0, y: 32 },
    down:  { opacity: 0, y: -20 },
    left:  { opacity: 0, x: 32 },
    right: { opacity: 0, x: -32 },
    fade:  { opacity: 0 },
  }[direction] || { opacity: 0, y: 24 };

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}