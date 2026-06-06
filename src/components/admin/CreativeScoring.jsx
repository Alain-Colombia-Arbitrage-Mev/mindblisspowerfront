import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Star, Zap } from 'lucide-react';
import ContentScoreCard from './ContentScoreCard';

export default function CreativeScoring() {
  const [contentItems] = useState([
    {
      id: 1,
      headline: 'Transform Your Growth Today',
      hook: 'Revolutionary approach to exponential scaling',
      cta: 'Get Started Now',
      format: 'Hero Copy',
      platform: 'Landing Page',
      campaign: 'Spring Growth Push',
      engagementScore: 94,
      conversionScore: 88,
      retentionScore: 82,
      viralityScore: 91,
      overallScore: 88.75
    },
    {
      id: 2,
      headline: 'Join 50,000+ Success Stories',
      hook: 'Proven system for consistent results',
      cta: 'Claim Your Spot',
      format: 'Social Proof',
      platform: 'Email',
      campaign: 'Referral Blitz',
      engagementScore: 89,
      conversionScore: 85,
      retentionScore: 78,
      viralityScore: 87,
      overallScore: 84.75
    },
    {
      id: 3,
      headline: 'Limited Time Opportunity',
      hook: 'Exclusive access for founding members',
      cta: 'Reserve Access',
      format: 'Urgency',
      platform: 'Facebook Ads',
      campaign: 'Q2 Expansion',
      engagementScore: 76,
      conversionScore: 82,
      retentionScore: 71,
      viralityScore: 79,
      overallScore: 77
    },
    {
      id: 4,
      headline: 'Ready to Scale?',
      hook: 'Everything you need in one platform',
      cta: 'Learn More',
      format: 'Feature',
      platform: 'Website Banner',
      campaign: 'Brand Awareness',
      engagementScore: 68,
      conversionScore: 71,
      retentionScore: 64,
      viralityScore: 65,
      overallScore: 67
    },
    {
      id: 5,
      headline: 'Start Your Journey',
      hook: 'Beginner-friendly setup',
      cta: 'Sign Up Free',
      format: 'Generic',
      platform: 'Sidebar Widget',
      campaign: 'Legacy Q1',
      engagementScore: 42,
      conversionScore: 38,
      retentionScore: 35,
      viralityScore: 40,
      overallScore: 38.75
    },
    {
      id: 6,
      headline: 'Click Here',
      hook: 'Generic call to action',
      cta: 'Click',
      format: 'Placeholder',
      platform: 'Old Landing',
      campaign: 'Archive',
      engagementScore: 18,
      conversionScore: 12,
      retentionScore: 15,
      viralityScore: 22,
      overallScore: 16.75
    }
  ]);

  const topPerformers = contentItems.filter(c => c.overallScore >= 80);
  const midPerformers = contentItems.filter(c => c.overallScore >= 50 && c.overallScore < 80);
  const lowPerformers = contentItems.filter(c => c.overallScore < 50);

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
          <Star size={24} style={{ color: '#fbbf24' }} />
          <div>
            <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0', fontFamily: 'Montserrat' }}>
              CREATIVE SCORING SYSTEM
            </p>
            <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 8px 0' }}>
              Content Performance Ranking
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
              Evaluate creative effectiveness across engagement, conversion, retention, and virality metrics
            </p>
          </div>
        </div>
      </motion.div>

      {/* Scoring Breakdown Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-3"
      >
        {[
          { label: 'Engagement Score', description: 'Clicks, interactions, time spent', color: '#3b82f6' },
          { label: 'Conversion Score', description: 'Form submissions, sign-ups, sales', color: '#10b981' },
          { label: 'Retention Score', description: 'User return rate, session length', color: '#a855f7' },
          { label: 'Virality Score', description: 'Shares, referrals, word-of-mouth', color: '#fb923c' }
        ].map((metric, i) => (
          <div
            key={i}
            className="p-4 rounded-lg"
            style={{ background: `${metric.color}15`, border: `1px solid ${metric.color}30` }}
          >
            <p style={{ color: metric.color, fontSize: 11, fontWeight: 700, margin: '0 0 4px 0' }}>
              {metric.label}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>
              {metric.description}
            </p>
          </div>
        ))}
      </motion.div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} style={{ color: '#10b981' }} />
            <p style={{ color: '#10b981', fontSize: 12, fontWeight: 700, margin: 0 }}>
              TOP PERFORMERS ({topPerformers.length})
            </p>
          </div>
          <div className="space-y-3">
            {topPerformers.map((item, i) => (
              <ContentScoreCard key={item.id} item={item} rank={i + 1} tier="top" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Mid Performers */}
      {midPerformers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} style={{ color: '#fb923c' }} />
            <p style={{ color: '#fb923c', fontSize: 12, fontWeight: 700, margin: 0 }}>
              MID PERFORMERS ({midPerformers.length})
            </p>
          </div>
          <div className="space-y-3">
            {midPerformers.map((item, i) => (
              <ContentScoreCard key={item.id} item={item} rank={i + topPerformers.length + 1} tier="mid" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Low Performers */}
      {lowPerformers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <p style={{ color: '#ef4444', fontSize: 12, fontWeight: 700, margin: 0 }}>
              LOW PERFORMERS ({lowPerformers.length})
            </p>
          </div>
          <div className="space-y-3">
            {lowPerformers.map((item, i) => (
              <ContentScoreCard key={item.id} item={item} rank={i + topPerformers.length + midPerformers.length + 1} tier="low" />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}