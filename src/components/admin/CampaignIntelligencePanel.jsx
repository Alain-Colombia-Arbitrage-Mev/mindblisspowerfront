import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CAMPAIGNS } from '@/lib/acquisitionData';
import { CAMPAIGN_LIFECYCLE, PHASE_CONFIG, ACTION_CONFIG } from '@/lib/campaignIntelligence';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { ChevronDown, ChevronUp, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CHANNEL_COLORS = {
  'Meta Ads': '#1877f2', 'TikTok Ads': '#fe2c55', 'Google Ads': '#fbbc05',
  'Community Referral': '#10b981', 'Influencer Campaign': '#a855f7', 'Email Campaign': '#06b6d4',
};

function HealthBar({ health, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${health}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ background: health > 70 ? '#10b981' : health > 40 ? '#fb923c' : '#ef4444' }} />
      </div>
      <span style={{ color: health > 70 ? '#10b981' : health > 40 ? '#fb923c' : '#ef4444', fontSize: 12, fontWeight: 800, minWidth: 28 }}>{health}</span>
    </div>
  );
}

function TrendIcon({ trend }) {
  if (trend === 'rising' || trend === 'recovering') return <TrendingUp size={13} style={{ color: '#10b981' }} />;
  if (trend === 'declining') return <TrendingDown size={13} style={{ color: '#ef4444' }} />;
  if (trend === 'completed') return <span style={{ fontSize: 11 }}>✅</span>;
  return <Minus size={13} style={{ color: '#6b7280' }} />;
}

function EventTimeline({ events, daysSinceStart }) {
  const TYPE_COLORS = {
    launch: '#3b82f6', peak: '#10b981', decay: '#ef4444', saturation: '#fb923c',
    creative_refresh: '#8b5cf6', testing: '#06b6d4', audience_expand: '#a78bfa',
    referral_surge: '#10b981', fatigued: '#ef4444', completed: '#6b7280', stable: '#10b981',
  };
  return (
    <div className="space-y-1.5">
      {events.map((e, i) => {
        const color = TYPE_COLORS[e.type] || '#888';
        const isPast = e.day <= daysSinceStart;
        return (
          <div key={i} className="flex items-start gap-2.5" style={{ opacity: isPast ? 1 : 0.35 }}>
            <div className="flex flex-col items-center flex-shrink-0" style={{ paddingTop: 3 }}>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isPast ? color : 'rgba(255,255,255,0.15)' }} />
              {i < events.length - 1 && <div className="w-px flex-1" style={{ background: 'rgba(255,255,255,0.06)', minHeight: 12, marginTop: 2 }} />}
            </div>
            <div className="flex-1 min-w-0 pb-1.5">
              <div className="flex items-center gap-2">
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontFamily: 'monospace', flexShrink: 0 }}>D+{e.day}</span>
                <span style={{ color: isPast ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: isPast ? 500 : 400 }}>{e.label}</span>
              </div>
              {e.impact !== 0 && (
                <span style={{ color: e.impact > 0 ? '#10b981' : '#ef4444', fontSize: 9, fontWeight: 700 }}>
                  {e.impact > 0 ? '+' : ''}{e.impact} health
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CampaignCard({ campaign }) {
  const [expanded, setExpanded] = useState(false);
  const intel = CAMPAIGN_LIFECYCLE[campaign.id];
  if (!intel) return null;

  const phase = PHASE_CONFIG[intel.phase] || PHASE_CONFIG.stable;
  const chColor = CHANNEL_COLORS[campaign.channel] || '#3b82f6';
  const action = intel.recommendation;
  const actionCfg = ACTION_CONFIG[action.action] || {};

  // Mark creative refresh / surge events on chart
  const refreshDays = intel.events.filter(e => ['creative_refresh', 'referral_surge', 'audience_expand'].includes(e.type)).map(e => {
    // Map day to week label
    const week = `W${Math.ceil((e.day + 1) / 7)}`;
    return { week, type: e.type };
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(10,20,40,0.8)', border: `1px solid rgba(255,255,255,0.08)` }}>

      {/* Header row */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${chColor}20`, color: chColor }}>{campaign.channel}</span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${phase.color}15`, color: phase.color }}>
                {phase.icon} {phase.label}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                <TrendIcon trend={intel.healthTrend} />
                <span style={{ fontSize: 9 }}>{intel.healthTrend}</span>
              </span>
            </div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: '0 0 2px' }}>{campaign.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0 }}>Day {intel.daysSinceStart} · {intel.events.length} lifecycle events tracked</p>
          </div>

          {/* Health score */}
          <div className="text-center flex-shrink-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
              style={{ background: intel.currentHealth > 70 ? 'rgba(16,185,129,0.15)' : intel.currentHealth > 40 ? 'rgba(251,146,60,0.15)' : 'rgba(239,68,68,0.15)' }}>
              <span style={{ color: intel.currentHealth > 70 ? '#10b981' : intel.currentHealth > 40 ? '#fb923c' : '#ef4444', fontSize: 18, fontWeight: 900 }}>
                {intel.currentHealth}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 700, margin: 0 }}>HEALTH</p>
          </div>
        </div>

        {/* Health bar */}
        <div className="mt-3">
          <HealthBar health={intel.currentHealth} />
        </div>

        {/* Recommendation */}
        <div className="mt-3 flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: `${actionCfg.color || '#888'}0d`, border: `1px solid ${actionCfg.color || '#888'}22` }}>
          <AlertTriangle size={12} style={{ color: actionCfg.color || '#888', flexShrink: 0, marginTop: 1 }} />
          <div className="flex-1 min-w-0">
            <p style={{ color: actionCfg.color || '#888', fontWeight: 700, fontSize: 10, margin: '0 0 2px' }}>
              {actionCfg.label || action.action}
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: action.urgency === 'high' ? 'rgba(239,68,68,0.15)' : action.urgency === 'medium' ? 'rgba(251,146,60,0.15)' : 'rgba(107,114,128,0.15)', color: action.urgency === 'high' ? '#ef4444' : action.urgency === 'medium' ? '#fb923c' : '#6b7280', fontSize: 8, fontWeight: 700 }}>
                {action.urgency.toUpperCase()}
              </span>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, margin: 0, lineHeight: 1.5 }}>{action.detail}</p>
          </div>
        </div>

        {/* Expand toggle */}
        <button onClick={() => setExpanded(v => !v)} className="mt-3 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
          {expanded ? <><ChevronUp size={12} /> Hide details</> : <><ChevronDown size={12} /> Performance trend + timeline</>}
        </button>
      </div>

      {/* Expanded: trend chart + event timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Trend chart */}
              <div className="lg:col-span-2">
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 12px' }}>WEEKLY PERFORMANCE TREND</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={intel.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontSize: 10 }} />
                    <Line type="monotone" dataKey="conversions" stroke={phase.color} strokeWidth={2} dot={{ fill: phase.color, r: 3 }} name="Conversions" />
                    <Line type="monotone" dataKey="cpa" stroke="rgba(255,255,255,0.2)" strokeWidth={1} dot={false} name="CPA ($)" strokeDasharray="4 2" />
                    {/* Mark refresh events */}
                    {refreshDays.map((r, i) => (
                      <ReferenceLine key={i} x={r.week} stroke="rgba(139,92,246,0.4)" strokeDasharray="3 3" label={{ value: '↑', position: 'top', fill: '#8b5cf6', fontSize: 10 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, margin: '6px 0 0', textAlign: 'center' }}>Purple markers = creative refresh / expansion events</p>

                {/* Week-by-week table */}
                <div className="mt-4 overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Week', 'CTR', 'CPA', 'Conv.', 'Spend'].map(h => (
                          <th key={h} className="pb-2 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {intel.trendData.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td className="py-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{row.week}</td>
                          <td className="py-1.5" style={{ color: row.ctr ? (row.ctr > 4 ? '#10b981' : row.ctr > 2.5 ? '#fb923c' : '#ef4444') : 'rgba(255,255,255,0.2)' }}>{row.ctr ? `${row.ctr}%` : '—'}</td>
                          <td className="py-1.5" style={{ color: row.cpa < 700 ? '#10b981' : row.cpa < 1000 ? '#fb923c' : '#ef4444' }}>${row.cpa}</td>
                          <td className="py-1.5" style={{ color: '#10b981', fontWeight: 700 }}>{row.conversions}</td>
                          <td className="py-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>${row.spend.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Event timeline */}
              <div>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 12px' }}>LIFECYCLE EVENTS</p>
                <EventTimeline events={intel.events} daysSinceStart={intel.daysSinceStart} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CampaignIntelligencePanel() {
  const [sortBy, setSortBy] = useState('health');

  const sortedCampaigns = [...CAMPAIGNS].sort((a, b) => {
    const ia = CAMPAIGN_LIFECYCLE[a.id];
    const ib = CAMPAIGN_LIFECYCLE[b.id];
    if (!ia || !ib) return 0;
    if (sortBy === 'health') return ia.currentHealth - ib.currentHealth; // worst first
    if (sortBy === 'urgency') {
      const urgMap = { high: 0, medium: 1, low: 2 };
      return urgMap[ia.recommendation.urgency] - urgMap[ib.recommendation.urgency];
    }
    return ib.currentHealth - ia.currentHealth; // best first
  });

  const avgHealth = Math.round(
    Object.values(CAMPAIGN_LIFECYCLE).reduce((s, c) => s + c.currentHealth, 0) / Object.keys(CAMPAIGN_LIFECYCLE).length
  );
  const critical = Object.values(CAMPAIGN_LIFECYCLE).filter(c => c.currentHealth < 35).length;
  const healthy = Object.values(CAMPAIGN_LIFECYCLE).filter(c => c.currentHealth >= 70).length;

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Portfolio Health', value: `${avgHealth}/100`, color: avgHealth > 60 ? '#10b981' : '#fb923c', sub: 'Avg across active campaigns' },
          { label: 'Healthy Campaigns', value: healthy, color: '#10b981', sub: 'Health score ≥ 70' },
          { label: 'Critical Campaigns', value: critical, color: '#ef4444', sub: 'Health score < 35 — action needed' },
          { label: 'Events Tracked', value: Object.values(CAMPAIGN_LIFECYCLE).reduce((s, c) => s + c.events.length, 0), color: '#8b5cf6', sub: 'Lifecycle milestones total' },
        ].map((k, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: `${k.color}0d`, border: `1px solid ${k.color}20` }}>
            <p style={{ color: k.color, fontSize: 22, fontWeight: 900, margin: '0 0 2px' }}>{k.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, margin: 0 }}>{k.label}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '2px 0 0' }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Sort control */}
      <div className="flex items-center gap-2">
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Sort by:</span>
        {[['health', 'Worst Health First'], ['urgency', 'Urgency'], ['best', 'Best Health First']].map(([key, label]) => (
          <button key={key} onClick={() => setSortBy(key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: sortBy === key ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', color: sortBy === key ? '#a855f7' : 'rgba(255,255,255,0.4)', border: `1px solid ${sortBy === key ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
            {label}
          </button>
        ))}
      </div>

      {/* Campaign cards */}
      <div className="space-y-3">
        {sortedCampaigns.map((c, i) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    </div>
  );
}