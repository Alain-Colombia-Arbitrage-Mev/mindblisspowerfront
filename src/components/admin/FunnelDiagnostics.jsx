import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import FunnelStageCard from './FunnelStageCard';

export default function FunnelDiagnostics() {
  const [funnelData] = useState({
    stages: [
      {
        id: 1,
        name: 'Landing',
        entries: 10500,
        progression: 100,
        dropoff: 0,
        dropoffRate: 0,
        conversionRate: 68.5,
        color: '#3b82f6',
        details: 'Initial page views and session starts'
      },
      {
        id: 2,
        name: 'Engagement',
        entries: 7192,
        progression: 68.5,
        dropoff: 3308,
        dropoffRate: 31.5,
        conversionRate: 62.3,
        color: '#10b981',
        details: 'Scroll depth, time on page, interactions',
        bottleneck: false
      },
      {
        id: 3,
        name: 'Action',
        entries: 4477,
        progression: 42.6,
        dropoff: 2715,
        dropoffRate: 37.7,
        conversionRate: 71.8,
        color: '#a855f7',
        details: 'Form starts, button clicks, feature access',
        bottleneck: true
      },
      {
        id: 4,
        name: 'Conversion',
        entries: 3215,
        progression: 30.6,
        dropoff: 1262,
        dropoffRate: 28.2,
        conversionRate: null,
        color: '#fb923c',
        details: 'Completed purchases or signups'
      }
    ]
  });

  const totalEntries = funnelData.stages[0].entries;
  const totalConversions = funnelData.stages[3].entries;
  const overallConversionRate = ((totalConversions / totalEntries) * 100).toFixed(1);

  // Identify critical bottlenecks
  const bottlenecks = funnelData.stages
    .filter(stage => stage.dropoffRate && stage.dropoffRate > 30)
    .sort((a, b) => b.dropoffRate - a.dropoffRate);

  // Stage width proportions for visual funnel
  const stageWidths = funnelData.stages.map(stage => (stage.entries / totalEntries) * 100);

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
          <TrendingDown size={24} style={{ color: '#fb923c' }} />
          <div className="flex-1">
            <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0', fontFamily: 'Montserrat' }}>
              FUNNEL DIAGNOSTICS
            </p>
            <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
              Conversion Flow Analysis
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
              Track user progression through landing → engagement → action → conversion
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p style={{ color: '#3b82f6', fontSize: 28, fontWeight: 900, margin: '0 0 2px 0' }}>
              {overallConversionRate}%
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>
              OVERALL CONVERSION
            </p>
          </div>
        </div>
      </motion.div>

      {/* Visual Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="p-8 rounded-2xl space-y-6"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, margin: 0 }}>
          CONVERSION FUNNEL VISUALIZATION
        </p>

        <div className="space-y-4">
          {funnelData.stages.map((stage, idx) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
            >
              <div
                className="relative overflow-hidden rounded-lg p-6 transition-all"
                style={{
                  background: `linear-gradient(90deg, ${stage.color}15 0%, ${stage.color}08 100%)`,
                  border: `1px solid ${stage.color}30`,
                  width: `${stageWidths[idx]}%`
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ color: stage.color, fontSize: 13, fontWeight: 700, margin: 0 }}>
                      {stage.name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
                      {stage.entries.toLocaleString()} users
                    </p>
                  </div>
                  <p style={{ color: stage.color, fontSize: 16, fontWeight: 900, margin: 0 }}>
                    {stage.progression}%
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stage Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700, margin: 0 }}>
          DETAILED STAGE METRICS
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {funnelData.stages.map((stage, idx) => (
            <FunnelStageCard
              key={stage.id}
              stage={stage}
              isBottleneck={stage.bottleneck}
              index={idx}
            />
          ))}
        </div>
      </motion.div>

      {/* Bottleneck Analysis */}
      {bottlenecks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-8 rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}
        >
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            <div>
              <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, margin: '0 0 4px 0' }}>
                CRITICAL BOTTLENECKS DETECTED
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
                {bottlenecks.length} stage{bottlenecks.length > 1 ? 's' : ''} with high drop-off rates
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {bottlenecks.map((bottleneck, idx) => (
              <motion.div
                key={bottleneck.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                className="p-4 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-start justify-between mb-2">
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0 }}>
                    {bottleneck.name} Stage
                  </p>
                  <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 900, margin: 0 }}>
                    {bottleneck.dropoffRate.toFixed(1)}% drop
                  </p>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 8px 0' }}>
                  {bottleneck.dropoff.toLocaleString()} users lost: {bottleneck.details}
                </p>
                <div style={{ height: 4, background: 'rgba(239,68,68,0.3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${bottleneck.dropoffRate}%`,
                      background: '#ef4444',
                      transition: 'width 0.6s ease'
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="p-6 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
            TOTAL ENTRIES
          </p>
          <p style={{ color: '#3b82f6', fontSize: 22, fontWeight: 900, margin: 0 }}>
            {totalEntries.toLocaleString()}
          </p>
        </div>
        <div className="p-6 rounded-lg" style={{ background: 'rgba(10,185,129,0.08)', border: '1px solid rgba(10,185,129,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
            TOTAL CONVERSIONS
          </p>
          <p style={{ color: '#10b981', fontSize: 22, fontWeight: 900, margin: 0 }}>
            {totalConversions.toLocaleString()}
          </p>
        </div>
        <div className="p-6 rounded-lg" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
            TOTAL DROP-OFF
          </p>
          <p style={{ color: '#a855f7', fontSize: 22, fontWeight: 900, margin: 0 }}>
            {(totalEntries - totalConversions).toLocaleString()}
          </p>
        </div>
        <div className="p-6 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
            LOSS RATE
          </p>
          <p style={{ color: '#fb923c', fontSize: 22, fontWeight: 900, margin: 0 }}>
            {(100 - overallConversionRate)}%
          </p>
        </div>
      </motion.div>
    </div>
  );
}