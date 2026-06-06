import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap, FlaskConical, Users, BarChart3, Settings, Activity, Eye, TrendingUp,
  Megaphone, Target, Radio, Crosshair, Shield
} from 'lucide-react';

const GROWTH_MODULES = [
  { icon: Megaphone, label: 'Campaign Lab', to: '/admin-dashboard/marketing/campaigns', description: 'Create, manage, and track growth campaigns', stats: '3 active', color: '#3b82f6' },
  { icon: FlaskConical, label: 'Experiment Lab', to: '/admin-dashboard/marketing/experiments', description: 'Run controlled A/B tests on funnels and copy', stats: '2 running', color: '#a855f7' },
  { icon: Users, label: 'Audience Lab', to: '/admin-dashboard/marketing/audiences', description: 'Segment users by behavior, source, and value', stats: '8 segments', color: '#10b981' },
  { icon: Zap, label: 'Automation Engine', to: '/admin-dashboard/marketing/automation', description: 'Trigger-based workflows and follow-up automation', stats: '5 flows', color: '#fb923c' },
  { icon: BarChart3, label: 'Growth Analytics', to: '/admin-dashboard/marketing/analytics', description: 'Acquisition, conversion, retention metrics', stats: 'Live', color: '#06b6d4' },
  { icon: Settings, label: 'Command Center', to: '/admin-dashboard/marketing/command-center', description: 'Real-time operational KPIs and growth control', stats: 'Active', color: '#8b5cf6' },
  { icon: Activity, label: 'Content Variations', to: '/admin-dashboard/marketing/content', description: 'Manage A/B content and copy variations', stats: 'Active', color: '#10b981' },
];

export default function Marketing() {
  const [view, setView] = useState('grid');

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 6px 0' }}>GROWTH OPERATIONS HUB</p>
          <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>Marketing & Growth Lab</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>Full admin access to all growth systems — campaigns, experiments, audiences, automation, and analytics</p>
        </div>
        <div style={{ width: 1 }} />
      </motion.div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Campaigns', value: '3', color: '#3b82f6', delta: '+1 this week' },
          { label: 'Running A/B Tests', value: '2', color: '#a855f7', delta: '94% confidence' },
          { label: 'Audience Segments', value: '8', color: '#10b981', delta: '12,420 users mapped' },
          { label: 'Overall Conversion', value: '68.5%', color: '#fb923c', delta: '+4.2% vs last period' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 4px 0' }}>{s.label}</p>
            <p style={{ color: s.color, fontSize: 22, fontWeight: 900, margin: '0 0 2px 0' }}>{s.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Module Grid */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 0 12px 0' }}>Growth Lab Modules</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {GROWTH_MODULES.map((module, i) => {
            const Icon = module.icon;
            return (
              <Link key={i} to={module.to} style={{ textDecoration: 'none' }}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-5 rounded-xl transition-all hover:-translate-y-1 cursor-pointer"
                  style={{ background: 'rgba(8,18,40,0.6)', border: '1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e => e.currentTarget.style.border = `1px solid ${module.color}30`}
                  onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg" style={{ background: `${module.color}18` }}>
                      <Icon size={15} style={{ color: module.color }} />
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${module.color}15`, color: module.color }}>
                      {module.stats}
                    </span>
                  </div>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: '0 0 4px 0' }}>{module.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0, lineHeight: 1.4 }}>{module.description}</p>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}