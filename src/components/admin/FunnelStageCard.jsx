import { motion } from 'framer-motion';

export default function FunnelStageCard({ stage, isBottleneck, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="p-6 rounded-xl"
      style={{
        background: isBottleneck ? 'rgba(239,68,68,0.08)' : 'rgba(13,31,60,0.6)',
        border: isBottleneck ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(59,130,246,0.15)'
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p style={{ color: stage.color, fontSize: 14, fontWeight: 700, margin: '0 0 2px 0' }}>
            {stage.name}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            {stage.details}
          </p>
        </div>
        {isBottleneck && (
          <div
            style={{
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.3)',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              color: '#ef4444'
            }}
          >
            BOTTLENECK
          </div>
        )}
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 6px 0' }}>
            ENTRIES
          </p>
          <p style={{ color: stage.color, fontSize: 18, fontWeight: 900, margin: 0 }}>
            {stage.entries.toLocaleString()}
          </p>
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 6px 0' }}>
            PROGRESSION
          </p>
          <p style={{ color: stage.color, fontSize: 18, fontWeight: 900, margin: 0 }}>
            {stage.progression}%
          </p>
        </div>
      </div>

      {/* Drop-off Metrics */}
      {stage.dropoffRate !== undefined && stage.dropoffRate > 0 && (
        <div className="p-3 rounded-lg mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, margin: 0 }}>
              Drop-off Rate
            </p>
            <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 900, margin: 0 }}>
              {stage.dropoffRate.toFixed(1)}%
            </p>
          </div>
          <div style={{ height: 4, background: 'rgba(239,68,68,0.2)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(stage.dropoffRate, 100)}%`,
                background: '#ef4444',
                transition: 'width 0.6s ease'
              }}
            />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '6px 0 0 0' }}>
            {stage.dropoff.toLocaleString()} users lost
          </p>
        </div>
      )}

      {/* Conversion Rate (if applicable) */}
      {stage.conversionRate !== null && (
        <div className="p-3 rounded-lg" style={{ background: `${stage.color}15` }}>
          <div className="flex items-center justify-between mb-2">
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, margin: 0 }}>
              Conversion Rate
            </p>
            <p style={{ color: stage.color, fontSize: 14, fontWeight: 900, margin: 0 }}>
              {stage.conversionRate}%
            </p>
          </div>
          <div style={{ height: 4, background: `${stage.color}20`, borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${stage.conversionRate}%`,
                background: stage.color,
                transition: 'width 0.6s ease'
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}