import { motion } from 'framer-motion';

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { duration: 1.8, repeat: Infinity, ease: 'linear' },
  },
};

function SkeletonBlock({ width = '100%', height = 16, rounded = 8, className = '' }) {
  return (
    <motion.div
      variants={shimmer}
      animate="animate"
      className={className}
      style={{
        width,
        height,
        borderRadius: rounded,
        background: 'linear-gradient(90deg, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.14) 50%, rgba(59,130,246,0.06) 100%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
}

export function KPISkeletonGrid({ count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ padding: 16, borderRadius: 12, border: '1px solid rgba(59,130,246,0.1)', background: 'rgba(13,31,60,0.4)' }}>
          <SkeletonBlock height={10} width={60} rounded={4} />
          <div style={{ height: 8 }} />
          <SkeletonBlock height={28} width={90} rounded={6} />
          <div style={{ height: 6 }} />
          <SkeletonBlock height={8} width={50} rounded={4} />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ rows = 4 }) {
  return (
    <div style={{ padding: 20, borderRadius: 12, border: '1px solid rgba(59,130,246,0.1)', background: 'rgba(13,31,60,0.4)' }}>
      <SkeletonBlock height={14} width={120} rounded={4} />
      <div style={{ height: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <SkeletonBlock height={10} width={`${70 + Math.random() * 30}%`} rounded={4} />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div style={{ padding: 32, space: 24 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <SkeletonBlock width={80} height={80} rounded={16} />
        <div className="space-y-2">
          <SkeletonBlock width={200} height={28} rounded={6} />
          <SkeletonBlock width={120} height={14} rounded={4} />
        </div>
      </div>
      <KPISkeletonGrid count={6} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <CardSkeleton rows={5} />
        <CardSkeleton rows={5} />
      </div>
    </div>
  );
}

export default SkeletonBlock;