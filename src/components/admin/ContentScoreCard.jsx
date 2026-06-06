import { motion } from 'framer-motion';

export default function ContentScoreCard({ item, rank, tier }) {
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

          {/* Content Info */}
          <div className="flex-1">
            <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 4px 0' }}>
              {item.headline}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 6px 0' }}>
              {item.hook}
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
                {item.format}
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
                {item.platform}
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
                {item.campaign}
              </span>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="text-right flex-shrink-0">
          <p style={{ color: color, fontSize: 28, fontWeight: 900, margin: '0 0 2px 0' }}>
            {item.overallScore}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>
            OVERALL
          </p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, margin: '0 0 4px 0' }}>
            Engagement
          </p>
          <p style={{ color: '#3b82f6', fontSize: 18, fontWeight: 900, margin: 0 }}>
            {item.engagementScore}
          </p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(16,185,129,0.15)' }}>
          <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700, margin: '0 0 4px 0' }}>
            Conversion
          </p>
          <p style={{ color: '#10b981', fontSize: 18, fontWeight: 900, margin: 0 }}>
            {item.conversionScore}
          </p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(168,85,247,0.15)' }}>
          <p style={{ color: '#a855f7', fontSize: 11, fontWeight: 700, margin: '0 0 4px 0' }}>
            Retention
          </p>
          <p style={{ color: '#a855f7', fontSize: 18, fontWeight: 900, margin: 0 }}>
            {item.retentionScore}
          </p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(251,146,60,0.15)' }}>
          <p style={{ color: '#fb923c', fontSize: 11, fontWeight: 700, margin: '0 0 4px 0' }}>
            Virality
          </p>
          <p style={{ color: '#fb923c', fontSize: 18, fontWeight: 900, margin: 0 }}>
            {item.viralityScore}
          </p>
        </div>
      </div>

      {/* CTA Display */}
      <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '0 0 3px 0' }}>
          CALL TO ACTION
        </p>
        <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>
          "{item.cta}"
        </p>
      </div>
    </motion.div>
  );
}