/**
 * Premium Page Transition
 * Fade container → staggered slide-in cards
 */
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: 'easeOut',
    },
  },
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

export function PageContainer({ children }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCard({ children, className = '' }) {
  return (
    <motion.div
      variants={cardVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}