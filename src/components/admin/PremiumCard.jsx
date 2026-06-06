import { motion } from 'framer-motion';

export default function PremiumCard({ children, hover = true, className = '', ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`premium-card ${hover ? 'hover-lift' : ''} ${className}`}
      {...props}>
      {children}
    </motion.div>
  );
}