import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Download } from 'lucide-react';
import GrowthMetricsCards from './GrowthMetricsCards';
import GrowthCharts from './GrowthCharts';
import GrowthComparison from './GrowthComparison';

export default function GrowthAnalytics() {
  const [timeframe, setTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat, sans-serif' }}>
              GROWTH ANALYTICS
            </p>
            <h2 style={{ color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, margin: '0 0 8px 0' }}>
              Performance Dashboard
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
              Real-time growth metrics, conversion funnels, and comparative analysis
            </p>
          </div>
          <button
            style={{
              background: 'rgba(59,130,246,0.2)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#3b82f6',
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Download size={14} /> Export
          </button>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map(period => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: timeframe === period ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: timeframe === period ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                border: timeframe === period ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {period}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/8">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'acquisition', label: 'Acquisition' },
          { id: 'conversion', label: 'Conversion' },
          { id: 'retention', label: 'Retention' },
          { id: 'referral', label: 'Referral' },
          { id: 'roi', label: 'Campaign ROI' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-3 text-sm font-medium transition-all border-b-2"
            style={{
              borderColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.5)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <GrowthMetricsCards timeframe={timeframe} />
          <GrowthCharts timeframe={timeframe} />
          <GrowthComparison timeframe={timeframe} />
        </motion.div>
      )}

      {activeTab === 'acquisition' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GrowthCharts timeframe={timeframe} metric="acquisition" />
        </motion.div>
      )}

      {activeTab === 'conversion' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GrowthCharts timeframe={timeframe} metric="conversion" />
        </motion.div>
      )}

      {activeTab === 'retention' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GrowthCharts timeframe={timeframe} metric="retention" />
        </motion.div>
      )}

      {activeTab === 'referral' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GrowthCharts timeframe={timeframe} metric="referral" />
        </motion.div>
      )}

      {activeTab === 'roi' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GrowthCharts timeframe={timeframe} metric="roi" />
        </motion.div>
      )}
    </div>
  );
}