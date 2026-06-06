import { motion } from 'framer-motion';
import { Compass, Zap, LineChart, Shield, Star, Crown } from 'lucide-react';

const iconMap = {
  compass: Compass,
  zap: Zap,
  line: LineChart,
  shield: Shield,
  star: Star,
  crown: Crown,
};

export default function StatusBadge({ status, size = 'medium', interactive = false, showLabel = true }) {
  if (!status) return null;

  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-14 h-14',
    large: 'w-20 h-20',
    xlarge: 'w-28 h-28',
  };

  const iconSizeMap = {
    small: 16,
    medium: 24,
    large: 36,
    xlarge: 48,
  };

  const Icon = iconMap[status.icon] || Star;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center gap-2 ${interactive ? 'cursor-pointer' : ''}`}
    >
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center relative overflow-hidden group`}
        style={{
          background: `linear-gradient(135deg, ${status.color}, ${status.color}dd)`,
          boxShadow: `0 0 20px ${status.color}40, 0 0 40px ${status.color}20`,
        }}
      >
        {/* Shine effect */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }}
        />

        {/* Icon */}
        <Icon
          size={iconSizeMap[size]}
          className="text-white relative z-10"
          strokeWidth={1.5}
        />

        {/* Glow on hover */}
        {interactive && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
            style={{ background: `radial-gradient(circle, ${status.color}, transparent)` }}
          />
        )}
      </div>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center"
        >
          <div className="font-montserrat font-bold text-sm text-white">{status.name}</div>
          {size === 'large' || size === 'xlarge' ? (
            <div className="text-white/50 text-xs mt-1 max-w-xs">{status.meaning}</div>
          ) : null}
        </motion.div>
      )}
    </motion.div>
  );
}