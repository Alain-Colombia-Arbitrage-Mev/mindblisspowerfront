import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CampaignHeatmap() {
  const [selectedZone, setSelectedZone] = useState(null);

  // Campaign data: engagement (x-axis), conversion (y-axis), performance (size/color)
  const campaigns = [
    { id: 1, name: 'Spring Growth Push', engagement: 8.7, conversion: 2.8, performance: 95, color: '#10b981' },
    { id: 2, name: 'Referral Blitz', engagement: 9.6, conversion: 3.2, performance: 98, color: '#10b981' },
    { id: 3, name: 'Q2 Expansion', engagement: 8.4, conversion: 2.1, performance: 84, color: '#10b981' },
    { id: 4, name: 'Limited Offer', engagement: 7.7, conversion: 3.8, performance: 92, color: '#10b981' },
    { id: 5, name: 'Problem Awareness', engagement: 7.1, conversion: 1.8, performance: 68, color: '#fb923c' },
    { id: 6, name: 'Brand Building', engagement: 6.3, conversion: 1.2, performance: 54, color: '#fb923c' },
    { id: 7, name: 'Legacy Test', engagement: 3.8, conversion: 0.5, performance: 28, color: '#ef4444' },
    { id: 8, name: 'Summer Activation', engagement: 5.4, conversion: 2.3, performance: 62, color: '#fb923c' },
    { id: 9, name: 'Community Spotlight', engagement: 7.9, conversion: 2.6, performance: 81, color: '#fb923c' },
    { id: 10, name: 'Partner Rollout', engagement: 4.2, conversion: 1.1, performance: 38, color: '#ef4444' }
  ];

  // Calculate zone distribution
  const highPerforming = campaigns.filter(c => c.performance >= 85);
  const midPerforming = campaigns.filter(c => c.performance >= 60 && c.performance < 85);
  const lowPerforming = campaigns.filter(c => c.performance < 60);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <Flame size={24} style={{ color: '#ef4444' }} />
          <div className="flex-1">
            <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0', fontFamily: 'Montserrat' }}>
              PERFORMANCE INTENSITY
            </p>
            <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
              Campaign Heatmap
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
              Visualize campaign intensity across engagement and conversion metrics
            </p>
          </div>
        </div>
      </motion.div>

      {/* Zone Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div
          className="p-6 rounded-lg cursor-pointer transition-all"
          style={{
            background: selectedZone === 'high' ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.08)',
            border: selectedZone === 'high' ? '2px solid #10b981' : '1px solid rgba(16,185,129,0.25)'
          }}
          onClick={() => setSelectedZone(selectedZone === 'high' ? null : 'high')}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap size={18} style={{ color: '#10b981' }} />
            <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, margin: 0 }}>
              HIGH PERFORMING
            </p>
          </div>
          <p style={{ color: '#10b981', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>
            {highPerforming.length}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            Campaigns with 85+ score
          </p>
        </div>

        <div
          className="p-6 rounded-lg cursor-pointer transition-all"
          style={{
            background: selectedZone === 'mid' ? 'rgba(251,146,60,0.2)' : 'rgba(251,146,60,0.08)',
            border: selectedZone === 'mid' ? '2px solid #fb923c' : '1px solid rgba(251,146,60,0.25)'
          }}
          onClick={() => setSelectedZone(selectedZone === 'mid' ? null : 'mid')}
        >
          <p style={{ color: '#fb923c', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
            MID PERFORMING
          </p>
          <p style={{ color: '#fb923c', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>
            {midPerforming.length}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            Campaigns with 60-85 score
          </p>
        </div>

        <div
          className="p-6 rounded-lg cursor-pointer transition-all"
          style={{
            background: selectedZone === 'low' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.08)',
            border: selectedZone === 'low' ? '2px solid #ef4444' : '1px solid rgba(239,68,68,0.25)'
          }}
          onClick={() => setSelectedZone(selectedZone === 'low' ? null : 'low')}
        >
          <p style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>
            LOW PERFORMING
          </p>
          <p style={{ color: '#ef4444', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>
            {lowPerforming.length}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            Campaigns below 60 score
          </p>
        </div>
      </motion.div>

      {/* Heatmap Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 24px 0' }}>
          Campaign Intensity Matrix
        </p>

        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
            <XAxis
              type="number"
              dataKey="engagement"
              name="Engagement Rate (%)"
              stroke="rgba(255,255,255,0.3)"
              label={{ value: 'Engagement Rate (%)', position: 'insideBottomRight', offset: -10, fill: 'rgba(255,255,255,0.5)' }}
            />
            <YAxis
              type="number"
              dataKey="conversion"
              name="Conversion Rate (%)"
              stroke="rgba(255,255,255,0.3)"
              label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)' }}
            />
            <Tooltip
              contentStyle={{
                background: '#0a1628',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 8
              }}
              labelStyle={{ color: 'white' }}
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{ padding: '8px 12px' }}>
                      <p style={{ color: 'white', margin: '0 0 4px 0', fontSize: 12, fontWeight: 600 }}>
                        {data.name}
                      </p>
                      <p style={{ color: '#3b82f6', fontSize: 11, margin: '0 0 2px 0' }}>
                        Engagement: {data.engagement}%
                      </p>
                      <p style={{ color: '#10b981', fontSize: 11, margin: '0 0 2px 0' }}>
                        Conversion: {data.conversion}%
                      </p>
                      <p style={{ color: data.color, fontSize: 11, fontWeight: 700 }}>
                        Performance: {data.performance}/100
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter
              name="Campaigns"
              data={campaigns}
              fill="#3b82f6"
              shape={(props) => {
                const { cx, cy, payload } = props;
                const size = Math.max(payload.performance / 2, 10);
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={size}
                    fill={payload.color}
                    opacity={0.7}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '16px 0 0 0' }}>
          Bubble size = Performance Score | Color: Green (High) / Orange (Mid) / Red (Low)
        </p>
      </motion.div>

      {/* Detailed Performance Grid */}
      {selectedZone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0', textTransform: 'capitalize' }}>
            {selectedZone === 'high' ? '🔥 High Performing Campaigns' : selectedZone === 'mid' ? '⚠️ Mid Performing Campaigns' : '📉 Low Performing Campaigns'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(selectedZone === 'high' ? highPerforming : selectedZone === 'mid' ? midPerforming : lowPerforming).map(campaign => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-lg"
                style={{
                  background: `${campaign.color}08`,
                  border: `1px solid ${campaign.color}30`
                }}
              >
                <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 8px 0' }}>
                  {campaign.name}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 4px 0' }}>
                      Engagement
                    </p>
                    <p style={{ color: '#3b82f6', fontSize: 16, fontWeight: 900, margin: 0 }}>
                      {campaign.engagement}%
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 4px 0' }}>
                      Conversion
                    </p>
                    <p style={{ color: '#10b981', fontSize: 16, fontWeight: 900, margin: 0 }}>
                      {campaign.conversion}%
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 4px 0' }}>
                      Performance
                    </p>
                    <p style={{ color: campaign.color, fontSize: 16, fontWeight: 900, margin: 0 }}>
                      {campaign.performance}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="p-6 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            BEST ENGAGEMENT
          </p>
          <p style={{ color: '#10b981', fontSize: 14, fontWeight: 700, margin: '0 0 4px 0' }}>
            Referral Blitz
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            9.6% engagement rate
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            BEST CONVERSION
          </p>
          <p style={{ color: '#a855f7', fontSize: 14, fontWeight: 700, margin: '0 0 4px 0' }}>
            Limited Offer
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            3.8% conversion rate
          </p>
        </div>

        <div className="p-6 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 8px 0' }}>
            BIGGEST OPPORTUNITY
          </p>
          <p style={{ color: '#3b82f6', fontSize: 14, fontWeight: 700, margin: '0 0 4px 0' }}>
            Legacy Test → Optimize
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            28/100 score, needs revision
          </p>
        </div>
      </motion.div>
    </div>
  );
}