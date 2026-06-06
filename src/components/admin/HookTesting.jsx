import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, MessageCircle } from 'lucide-react';
import HookTestCard from './HookTestCard';

export default function HookTesting() {
  const [hooks] = useState([
    {
      id: 1,
      text: 'Transform Your Growth Today',
      type: 'direct_value',
      linkedContent: 'Value Proposition Page',
      linkedCampaign: 'Spring Growth Push',
      impressions: 8540,
      engagement: 742,
      engagementRate: 8.7,
      conversionTrigger: 156,
      conversionRate: 1.83,
      effectivenessScore: 9.2
    },
    {
      id: 2,
      text: 'Join 50K+ Building Wealth Daily',
      type: 'social_proof',
      linkedContent: 'Community Page',
      linkedCampaign: 'Referral Blitz',
      impressions: 7120,
      engagement: 684,
      engagementRate: 9.6,
      conversionTrigger: 142,
      conversionRate: 2.0,
      effectivenessScore: 8.8
    },
    {
      id: 3,
      text: 'What If You Could Scale Without Limits?',
      type: 'curiosity_gap',
      linkedContent: 'Feature Showcase',
      linkedCampaign: 'Q2 Expansion',
      impressions: 6890,
      engagement: 598,
      engagementRate: 8.7,
      conversionTrigger: 124,
      conversionRate: 1.8,
      effectivenessScore: 8.4
    },
    {
      id: 4,
      text: 'Last Spots Available - Founding Member Access',
      type: 'urgency_scarcity',
      linkedContent: 'Membership Page',
      linkedCampaign: 'Limited Offer',
      impressions: 9240,
      engagement: 712,
      engagementRate: 7.7,
      conversionTrigger: 186,
      conversionRate: 2.01,
      effectivenessScore: 8.5
    },
    {
      id: 5,
      text: 'Ready to Stop Leaving Money on the Table?',
      type: 'pain_point',
      linkedContent: 'Problem Solution Page',
      linkedCampaign: 'Problem Awareness',
      impressions: 5620,
      engagement: 401,
      engagementRate: 7.1,
      conversionTrigger: 78,
      conversionRate: 1.39,
      effectivenessScore: 7.2
    },
    {
      id: 6,
      text: 'Discover the Secret Winning Teams Use',
      type: 'intrigue',
      linkedContent: 'Success Stories',
      linkedCampaign: 'Brand Building',
      impressions: 4850,
      engagement: 305,
      engagementRate: 6.3,
      conversionTrigger: 48,
      conversionRate: 0.99,
      effectivenessScore: 5.8
    },
    {
      id: 7,
      text: 'Click Here for More Info',
      type: 'generic',
      linkedContent: 'Generic Landing',
      linkedCampaign: 'Legacy Test',
      impressions: 3120,
      engagement: 118,
      engagementRate: 3.8,
      conversionTrigger: 12,
      conversionRate: 0.38,
      effectivenessScore: 2.1
    }
  ]);

  // Sort by effectiveness
  const sortedHooks = [...hooks].sort((a, b) => b.effectivenessScore - a.effectivenessScore);
  const topHooks = sortedHooks.slice(0, 3);
  const midHooks = sortedHooks.slice(3, 5);
  const lowHooks = sortedHooks.slice(5);

  const totalImpressions = hooks.reduce((sum, h) => sum + h.impressions, 0);
  const totalEngagement = hooks.reduce((sum, h) => sum + h.engagement, 0);
  const totalConversions = hooks.reduce((sum, h) => sum + h.conversionTrigger, 0);
  const avgEffectiveness = (hooks.reduce((sum, h) => sum + h.effectivenessScore, 0) / hooks.length).toFixed(1);

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
          <MessageCircle size={24} style={{ color: '#ec4899' }} />
          <div className="flex-1">
            <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0', fontFamily: 'Montserrat' }}>
              HOOK TESTING SYSTEM
            </p>
            <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
              Opening Message Performance
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
              Test and rank hook effectiveness across engagement, conversion triggers, and overall impact
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="p-6 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
            TOTAL IMPRESSIONS
          </p>
          <p style={{ color: '#3b82f6', fontSize: 22, fontWeight: 900, margin: 0 }}>
            {totalImpressions.toLocaleString()}
          </p>
        </div>
        <div className="p-6 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
            TOTAL ENGAGEMENT
          </p>
          <p style={{ color: '#ec4899', fontSize: 22, fontWeight: 900, margin: 0 }}>
            {totalEngagement.toLocaleString()}
          </p>
        </div>
        <div className="p-6 rounded-lg" style={{ background: 'rgba(10,185,129,0.08)', border: '1px solid rgba(10,185,129,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
            CONVERSION TRIGGERS
          </p>
          <p style={{ color: '#10b981', fontSize: 22, fontWeight: 900, margin: 0 }}>
            {totalConversions.toLocaleString()}
          </p>
        </div>
        <div className="p-6 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>
            AVG EFFECTIVENESS
          </p>
          <p style={{ color: '#fb923c', fontSize: 22, fontWeight: 900, margin: 0 }}>
            {avgEffectiveness}/10
          </p>
        </div>
      </motion.div>

      {/* Top Performing Hooks */}
      {topHooks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} style={{ color: '#10b981' }} />
            <p style={{ color: '#10b981', fontSize: 12, fontWeight: 700, margin: 0 }}>
              TOP PERFORMERS ({topHooks.length})
            </p>
          </div>
          <div className="space-y-3">
            {topHooks.map((hook, i) => (
              <HookTestCard key={hook.id} hook={hook} rank={i + 1} tier="top" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Mid Performing Hooks */}
      {midHooks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <p style={{ color: '#fb923c', fontSize: 12, fontWeight: 700, margin: 0 }}>
              MID PERFORMERS ({midHooks.length})
            </p>
          </div>
          <div className="space-y-3">
            {midHooks.map((hook, i) => (
              <HookTestCard key={hook.id} hook={hook} rank={i + topHooks.length + 1} tier="mid" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Low Performing Hooks */}
      {lowHooks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, margin: 0 }}>
              LOW PERFORMERS ({lowHooks.length})
            </p>
          </div>
          <div className="space-y-3">
            {lowHooks.map((hook, i) => (
              <HookTestCard key={hook.id} hook={hook} rank={i + topHooks.length + midHooks.length + 1} tier="low" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Hook Type Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700, margin: '0 0 6px 0' }}>
          HOOK TYPE INSIGHTS
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { type: 'Direct Value', avg: 9.2, color: '#3b82f6' },
            { type: 'Social Proof', avg: 8.8, color: '#10b981' },
            { type: 'Curiosity Gap', avg: 8.4, color: '#a855f7' },
            { type: 'Urgency/Scarcity', avg: 8.5, color: '#fb923c' },
            { type: 'Pain Point', avg: 7.2, color: '#ef4444' },
            { type: 'Intrigue', avg: 5.8, color: '#64748b' }
          ].map((typeData, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg"
              style={{ background: `${typeData.color}15`, border: `1px solid ${typeData.color}30` }}
            >
              <p style={{ color: typeData.color, fontSize: 11, fontWeight: 700, margin: '0 0 4px 0' }}>
                {typeData.type}
              </p>
              <p style={{ color: typeData.color, fontSize: 18, fontWeight: 900, margin: 0 }}>
                {typeData.avg}/10
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}