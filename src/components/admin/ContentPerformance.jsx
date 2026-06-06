import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Trophy, TrendingUp } from 'lucide-react';

export default function ContentPerformance({ variations }) {
  const [compareMode, setCompareMode] = useState(false);

  // Sort by CTR for ranking
  const sortedByPerformance = [...variations].sort((a, b) => b.performance.ctr - a.performance.ctr);

  // Sample timeline data for selected variation
  const timelineData = [
    { day: 'Mon', impressions: 1200, clicks: 82, ctr: 6.8 },
    { day: 'Tue', impressions: 1450, clicks: 119, ctr: 8.2 },
    { day: 'Wed', impressions: 1680, clicks: 138, ctr: 8.2 },
    { day: 'Thu', impressions: 1920, clicks: 168, ctr: 8.8 },
    { day: 'Fri', impressions: 2100, clicks: 194, ctr: 9.2 },
    { day: 'Sat', impressions: 1850, clicks: 155, ctr: 8.4 },
    { day: 'Sun', impressions: 1230, clicks: 98, ctr: 8.0 },
  ];

  return (
    <div className="space-y-8">
      {/* Winner Badge */}
      {sortedByPerformance.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl flex items-start gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(251,146,60,0.1) 100%)', border: '1px solid rgba(251,146,60,0.3)' }}
        >
          <Trophy size={24} style={{ color: '#fb923c', flexShrink: 0 }} />
          <div>
            <p style={{ color: '#fb923c', fontSize: 13, fontWeight: 700, margin: '0 0 4px 0' }}>
              🏆 Top Performer
            </p>
            <p className="text-white text-sm font-medium mb-1">{sortedByPerformance[0].name}</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
              {sortedByPerformance[0].performance.ctr}% CTR • {sortedByPerformance[0].performance.clicks} clicks
            </p>
          </div>
        </motion.div>
      )}

      {/* Performance Ranking Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <h3 style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>
          PERFORMANCE RANKING
        </h3>

        <div className="space-y-3">
          {sortedByPerformance.map((var_, idx) => (
            <div key={var_.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(168,85,247,0.2)',
                    color: '#a855f7',
                    fontSize: 12,
                    fontWeight: 700
                  }}>
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-white text-sm font-semibold">{var_.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{var_.type.toUpperCase()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p style={{ color: '#3b82f6', fontSize: 14, fontWeight: 700 }}>{var_.performance.ctr}%</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>CTR</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: '#10b981', fontSize: 14, fontWeight: 700 }}>{var_.performance.clicks}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Clicks</p>
                  </div>
                  <div className="text-right">
                    <p style={{ color: '#a855f7', fontSize: 14, fontWeight: 700 }}>{var_.performance.impressions}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Views</p>
                  </div>
                </div>
              </div>

              {/* CTR Progress bar */}
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${var_.performance.ctr * 10}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Timeline Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>
          WEEKLY PERFORMANCE TREND
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" yAxisId="left" />
            <YAxis stroke="rgba(255,255,255,0.3)" yAxisId="right" orientation="right" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="ctr" stroke="#fb923c" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Comparison Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="p-6 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
            TOTAL IMPRESSIONS
          </p>
          <p style={{ color: '#3b82f6', fontSize: 22, fontWeight: 900 }}>
            {variations.reduce((sum, v) => sum + v.performance.impressions, 0).toLocaleString()}
          </p>
        </div>

        <div className="p-6 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
            TOTAL CLICKS
          </p>
          <p style={{ color: '#10b981', fontSize: 22, fontWeight: 900 }}>
            {variations.reduce((sum, v) => sum + v.performance.clicks, 0).toLocaleString()}
          </p>
        </div>

        <div className="p-6 rounded-xl" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
            AVG CTR
          </p>
          <p style={{ color: '#a855f7', fontSize: 22, fontWeight: 900 }}>
            {(variations.reduce((sum, v) => sum + v.performance.ctr, 0) / variations.length).toFixed(1)}%
          </p>
        </div>

        <div className="p-6 rounded-xl" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
            ACTIVE VARIATIONS
          </p>
          <p style={{ color: '#fb923c', fontSize: 22, fontWeight: 900 }}>
            {variations.filter(v => v.status === 'active').length}
          </p>
        </div>
      </motion.div>
    </div>
  );
}