import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function GrowthComparison({ timeframe }) {
  const cohortData = [
    {
      cohort: 'Jan 2026',
      acq: 2145,
      conv: 11.2,
      ret30: 72.5,
      ret60: 58.3,
      ltv: 245,
      change: '+12.3%'
    },
    {
      cohort: 'Feb 2026',
      acq: 2847,
      conv: 12.4,
      ret30: 68.7,
      ret60: 54.2,
      ltv: 268,
      change: '+9.4%'
    },
    {
      cohort: 'Mar 2026',
      acq: 3124,
      conv: 13.8,
      ret30: 65.2,
      ret60: 49.8,
      ltv: 292,
      change: '+8.9%'
    },
    {
      cohort: 'Apr 2026',
      acq: 2934,
      conv: 12.8,
      ret30: 67.1,
      ret60: 52.1,
      ltv: 278,
      change: '-5.2%'
    },
  ];

  const regionData = [
    { region: 'LATAM', users: 8234, conv: 14.2, roi: 2.8, trend: 'up' },
    { region: 'NA', users: 5421, conv: 11.8, roi: 2.4, trend: 'up' },
    { region: 'EU', users: 4128, conv: 10.2, roi: 2.1, trend: 'down' },
    { region: 'ASIA', users: 3847, conv: 12.5, roi: 2.6, trend: 'up' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Cohort Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>
          COHORT RETENTION ANALYSIS
        </p>
        <div className="space-y-3">
          {cohortData.map((cohort, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-sm font-medium">{cohort.cohort}</p>
                <span style={{ color: cohort.change.startsWith('+') ? '#10b981' : '#ef4444', fontSize: 11, fontWeight: 700 }}>
                  {cohort.change}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-xs">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px 0' }}>Acq</p>
                  <p style={{ color: '#3b82f6', fontWeight: 700 }}>{(cohort.acq / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px 0' }}>Conv</p>
                  <p style={{ color: '#10b981', fontWeight: 700 }}>{cohort.conv}%</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px 0' }}>Ret-30</p>
                  <p style={{ color: '#a855f7', fontWeight: 700 }}>{cohort.ret30}%</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px 0' }}>Ret-60</p>
                  <p style={{ color: '#fb923c', fontWeight: 700 }}>{cohort.ret60}%</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px 0' }}>LTV</p>
                  <p style={{ color: '#06b6d4', fontWeight: 700 }}>${cohort.ltv}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Regional Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>
          REGIONAL PERFORMANCE
        </p>
        <div className="space-y-3">
          {regionData.map((region, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-sm font-medium">{region.region}</p>
                <div className="flex items-center gap-1">
                  {region.trend === 'up' ? (
                    <TrendingUp size={14} style={{ color: '#10b981' }} />
                  ) : (
                    <TrendingDown size={14} style={{ color: '#ef4444' }} />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px 0' }}>Users</p>
                  <p style={{ color: '#3b82f6', fontWeight: 700 }}>{(region.users / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px 0' }}>Conv Rate</p>
                  <p style={{ color: '#10b981', fontWeight: 700 }}>{region.conv}%</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0 0 2px 0' }}>ROI</p>
                  <p style={{ color: '#fb923c', fontWeight: 700 }}>{region.roi.toFixed(1)}x</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}