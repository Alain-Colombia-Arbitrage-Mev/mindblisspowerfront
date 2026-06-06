import { motion } from 'framer-motion';

export default function HookTestCard({ hook, rank, tier }) {
  const getTierColor = (tier) => {
    switch (tier) {
      case 'top':
        return '#10b981';
      case 'mid':
        return '#fb923c';
      case 'low':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  const getTierBg = (tier) => {
    switch (tier) {
      case 'top':
        return 'rgba(16,185,129,0.08)';
      case 'mid':
        return 'rgba(251,146,60,0.08)';
      case 'low':
        return 'rgba(239,68,68,0.08)';
      default:
        return 'rgba(13,31,60,0.6)';
    }
  };

  const color = getTierColor(tier);
  const bgColor = getTierBg(tier);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 rounded-lg"
      style={{ background: bgColor, border: `1px solid ${color}30` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Rank Badge */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}30`, border: `1px solid ${color}50` }}
          >
            <p style={{ color: color, fontSize: 14, fontWeight: 900, margin: 0 }}>
              #{rank}
            </p>
          </div>

          {/* Hook Info */}
          <div className="flex-1">
            <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 6px 0' }}>
              "{hook.text}"
            </p>
            <div className="flex flex-wrap gap-2">
              <span
                style={{
                  background: `${color}20`,
                  color: color,
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600
                }}
              >
                {hook.type.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.4)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600
                }}
              >
                {hook.linkedContent}
              </span>
              <span
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.4)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600
                }}
              >
                {hook.linkedCampaign}
              </span>
            </div>
          </div>
        </div>

        {/* Effectiveness Score */}
        <div className="text-right flex-shrink-0">
          <p style={{ color: color, fontSize: 28, fontWeight: 900, margin: '0 0 2px 0' }}>
            {hook.effectivenessScore}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>
            EFFECTIVENESS
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4 py-4 border-y border-white/10">
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 4px 0' }}>
            IMPRESSIONS
          </p>
          <p style={{ color: '#3b82f6', fontSize: 14, fontWeight: 700, margin: 0 }}>
            {hook.impressions.toLocaleString()}
          </p>
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 4px 0' }}>
            ENGAGEMENT
          </p>
          <p style={{ color: '#ec4899', fontSize: 14, fontWeight: 700, margin: 0 }}>
            {hook.engagement.toLocaleString()}
          </p>
        </div>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 4px 0' }}>
            CONVERSIONS
          </p>
          <p style={{ color: '#10b981', fontSize: 14, fontWeight: 700, margin: 0 }}>
            {hook.conversionTrigger.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg" style={{ background: 'rgba(236,72,153,0.15)' }}>
          <p style={{ color: '#ec4899', fontSize: 11, fontWeight: 700, margin: '0 0 4px 0' }}>
            Engagement Rate
          </p>
          <p style={{ color: '#ec4899', fontSize: 16, fontWeight: 900, margin: '0 0 6px 0' }}>
            {hook.engagementRate}%
          </p>
          <div style={{ height: 3, background: '#ec48993d', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(hook.engagementRate * 10, 100)}%`,
                background: '#ec4899',
                transition: 'width 0.6s ease'
              }}
            />
          </div>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.15)' }}>
          <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700, margin: '0 0 4px 0' }}>
            Conversion Rate
          </p>
          <p style={{ color: '#10b981', fontSize: 16, fontWeight: 900, margin: '0 0 6px 0' }}>
            {hook.conversionRate}%
          </p>
          <div style={{ height: 3, background: '#10b9813d', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(hook.conversionRate * 20, 100)}%`,
                background: '#10b981',
                transition: 'width 0.6s ease'
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}