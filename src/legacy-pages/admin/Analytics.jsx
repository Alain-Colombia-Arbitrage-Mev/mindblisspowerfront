import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CAMPAIGNS, REFERRAL_CHAINS, getSourceBreakdown,
  getConversionBySource, getTopReferrers, getAttribution, getCampaign,
  getInvestmentBySource, getLeaderPerformance
} from '@/lib/acquisitionData';
import { PARTICIPANTS_DATA } from '@/lib/simulatedData';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts';
import { TrendingUp, Users, DollarSign, Target, GitBranch, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import CampaignIntelligencePanel from '@/components/admin/CampaignIntelligencePanel';

const CHANNEL_COLORS = {
  'Meta Ads': '#1877f2',
  'TikTok Ads': '#fe2c55',
  'Google Ads': '#fbbc05',
  'Community Referral': '#10b981',
  'Influencer Campaign': '#a855f7',
  'Email Campaign': '#06b6d4',
};

const SOURCE_COLORS = {
  'Referral': '#8b5cf6',
  'Campaign': '#3b82f6',
  'Organic': '#10b981',
  'Social': '#fb923c',
  'Direct': '#06b6d4',
};

const STATUS_COLORS = {
  active: '#10b981',
  paused: '#fb923c',
  completed: '#6b7280',
};

const CONV_COLORS = ['#10b981', '#3b82f6', '#fb923c', '#6b7280'];

const TABS = ['Campaign Intelligence', 'Campaigns', 'Acquisition Sources', 'Referral Network', 'Conversion Funnel', 'Investment Attribution', 'Leader Attribution'];

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="p-4 rounded-xl flex flex-col gap-2" style={{ background: `${color}0d`, border: `1px solid ${color}22` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}1a` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <p style={{ color, fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>{value}</p>
      <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, margin: '2px 0 0', fontWeight: 600 }}>{label}</p>
      {sub && <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, margin: 0 }}>{sub}</p>}
    </div>
  );
}

function CampaignsTab() {
  const [selected, setSelected] = useState(null);
  const barData = CAMPAIGNS.map(c => ({ name: c.name.split(' ').slice(0, 2).join(' '), users: c.usersGenerated, conversions: c.conversions, volume: Math.round(c.investmentVolume / 1000) }));

  return (
    <div className="space-y-6">
      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {CAMPAIGNS.map((c, i) => {
          const chColor = CHANNEL_COLORS[c.channel] || '#3b82f6';
          const isSelected = selected?.id === c.id;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(isSelected ? null : c)}
              className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
              style={{ background: isSelected ? `${chColor}12` : 'rgba(13,31,60,0.6)', border: `1px solid ${isSelected ? chColor + '40' : 'rgba(255,255,255,0.08)'}` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${chColor}20`, color: chColor }}>{c.channel}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${STATUS_COLORS[c.status] || '#888'}15`, color: STATUS_COLORS[c.status] || '#888' }}>{c.status}</span>
                  </div>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0 }}>{c.name}</p>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 12px' }}>{c.objective}</p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { l: 'Users', v: c.usersGenerated, c: '#3b82f6' },
                  { l: 'Conv.', v: `${c.conversionRate}%`, c: '#10b981' },
                  { l: 'Volume', v: `$${(c.investmentVolume / 1000).toFixed(0)}K`, c: '#fb923c' },
                  { l: 'CPA', v: `$${c.cpa}`, c: '#a855f7' },
                ].map((f, j) => (
                  <div key={j} className="text-center">
                    <p style={{ color: f.c, fontSize: 14, fontWeight: 800, margin: 0 }}>{f.v}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>{f.l}</p>
                  </div>
                ))}
              </div>
              {/* Budget bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <span>Budget utilization</span>
                  <span>${c.spent.toLocaleString()} / ${c.budget.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(c.spent / c.budget * 100)}%`, background: chColor }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Performance Chart */}
      <div className="p-5 rounded-xl" style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 16px' }}>CAMPAIGN PERFORMANCE COMPARISON</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontSize: 11 }} />
            <Bar dataKey="users" name="Users Generated" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="conversions" name="Conversions" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AcquisitionTab() {
  const sourceData = getSourceBreakdown();
  const convData = getConversionBySource();
  const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#fb923c', '#06b6d4'];

  // Participants with their attribution
  const enriched = PARTICIPANTS_DATA.slice(0, 20).map(p => {
    const attr = getAttribution(p.id);
    const cam = getCampaign(attr.campaignId);
    return { ...p, attr, cam };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Pie */}
        <div className="p-5 rounded-xl" style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 12px' }}>TRAFFIC SOURCE BREAKDOWN</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={sourceData} dataKey="count" nameKey="source" innerRadius={40} outerRadius={72} paddingAngle={3}>
                  {sourceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {sourceData.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, flex: 1 }}>{s.source}</span>
                  <span style={{ color: PIE_COLORS[i % PIE_COLORS.length], fontWeight: 700, fontSize: 12 }}>{s.count}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion by source */}
        <div className="p-5 rounded-xl" style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 12px' }}>CONVERSION RATE BY SOURCE</p>
          <div className="space-y-3">
            {convData.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>{s.source}</span>
                  <span style={{ color: s.conversionRate >= 70 ? '#10b981' : s.conversionRate >= 50 ? '#fb923c' : '#ef4444', fontWeight: 800, fontSize: 12 }}>{s.conversionRate}%</span>
                </div>
                <div className="flex gap-0.5 h-4">
                  {[
                    { count: s.investors, color: '#10b981', label: 'Investor' },
                    { count: s.participants, color: '#3b82f6', label: 'Participant' },
                    { count: s.leads, color: '#fb923c', label: 'Lead' },
                  ].map((seg, j) => seg.count > 0 && (
                    <div key={j} title={`${seg.label}: ${seg.count}`}
                      className="rounded-sm transition-all hover:opacity-80"
                      style={{ width: `${(seg.count / s.total) * 100}%`, background: seg.color, minWidth: 4 }} />
                  ))}
                </div>
                <div className="flex gap-3 mt-0.5">
                  {[{ l: 'Investors', v: s.investors, c: '#10b981' }, { l: 'Participants', v: s.participants, c: '#3b82f6' }, { l: 'Leads', v: s.leads, c: '#fb923c' }].map((d, j) => (
                    <span key={j} style={{ color: d.c, fontSize: 9, fontWeight: 600 }}>{d.l}: {d.v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attribution table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,31,60,0.5)' }}>
        <div className="px-4 py-3 border-b border-white/8">
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>PARTICIPANT ACQUISITION ATTRIBUTION (SAMPLE)</p>
        </div>
        <table className="w-full text-xs">
          <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
            <tr>
              {['Participant', 'Source', 'Campaign', 'Entry Point', 'Conversion Stage'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enriched.map((p, i) => {
              const sc = SOURCE_COLORS[p.attr.source] || '#888';
              const stage = p.attr.conversionStage;
              const stageColor = { investor: '#10b981', participant: '#3b82f6', lead: '#fb923c' }[stage] || '#888';
              return (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-2.5">
                    <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{p.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0, fontSize: 9 }}>{p.id} · {p.country}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${sc}18`, color: sc }}>{p.attr.source}</span>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: p.cam ? '#3b82f6' : 'rgba(255,255,255,0.25)', fontSize: 10 }}>
                    {p.cam ? p.cam.name : '—'}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 10 }}>
                    {p.attr.entryPoint}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${stageColor}18`, color: stageColor }}>{stage}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReferralTab() {
  const topReferrers = getTopReferrers();
  const [selectedRef, setSelectedRef] = useState(null);

  const chains = selectedRef
    ? REFERRAL_CHAINS.filter(r => r.referrerId === selectedRef.id)
    : REFERRAL_CHAINS.slice(0, 15);

  const convColor = { converted: '#10b981', pending: '#fb923c', inactive: '#6b7280', blocked: '#ef4444', review: '#06b6d4' };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Referrers */}
        <div className="p-5 rounded-xl" style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 12px' }}>TOP REFERRERS</p>
          <div className="space-y-2">
            {topReferrers.map((r, i) => (
              <button key={i} onClick={() => setSelectedRef(selectedRef?.id === r.id ? null : r)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all hover:bg-white/5"
                style={{ background: selectedRef?.id === r.id ? 'rgba(139,92,246,0.1)' : 'transparent', border: `1px solid ${selectedRef?.id === r.id ? 'rgba(139,92,246,0.3)' : 'transparent'}` }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black" style={{ background: i < 3 ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)', color: i < 3 ? '#8b5cf6' : 'rgba(255,255,255,0.4)' }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ color: 'white', fontWeight: 600, fontSize: 11, margin: 0 }}>{r.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: 0 }}>{r.type}</p>
                </div>
                <div className="text-right">
                  <p style={{ color: '#8b5cf6', fontWeight: 800, fontSize: 13, margin: 0 }}>{r.total}</p>
                  <p style={{ color: '#10b981', fontSize: 9, margin: 0 }}>{r.converted} conv.</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Referral chain list */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>
              {selectedRef ? `REFERRALS BY ${selectedRef.name.toUpperCase()}` : 'REFERRAL CHAINS'}
            </p>
            {selectedRef && <button onClick={() => setSelectedRef(null)} style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700 }}>Show all</button>}
          </div>
          <div className="overflow-auto" style={{ maxHeight: 420 }}>
            {chains.map((r, i) => {
              const cc = convColor[r.conversionStatus] || '#888';
              const cam = getCampaign(r.campaign);
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)', minWidth: 60 }}>{r.id}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{r.referrerName}</span>
                      <ArrowRight size={10} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                      <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>{r.referredName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>{r.referrerId} → {r.referredId}</span>
                      {cam && <span style={{ color: '#3b82f6', fontSize: 9 }}>· {cam.channel}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${cc}18`, color: cc }}>{r.conversionStatus}</span>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, margin: '2px 0 0' }}>{r.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Referral stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Referral Events', value: REFERRAL_CHAINS.length, color: '#8b5cf6' },
          { label: 'Converted', value: REFERRAL_CHAINS.filter(r => r.conversionStatus === 'converted').length, color: '#10b981' },
          { label: 'Pending Conversion', value: REFERRAL_CHAINS.filter(r => r.conversionStatus === 'pending').length, color: '#fb923c' },
          { label: 'Chain Depth (max)', value: '3 levels', color: '#3b82f6' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: `${s.color}0d`, border: `1px solid ${s.color}22` }}>
            <p style={{ color: s.color, fontSize: 22, fontWeight: 900, margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelTab() {
  const convData = getConversionBySource();
  const totalInvestors = convData.reduce((s, d) => s + d.investors, 0);
  const totalParticipants = convData.reduce((s, d) => s + d.participants, 0);
  const totalLeads = convData.reduce((s, d) => s + d.leads, 0);
  const totalVisitors = 312; // simulated top-of-funnel

  const funnel = [
    { stage: 'Visitors', count: totalVisitors, color: '#6b7280', pct: 100 },
    { stage: 'Leads (Registered)', count: totalInvestors + totalParticipants + totalLeads, color: '#3b82f6', pct: Math.round(((totalInvestors + totalParticipants + totalLeads) / totalVisitors) * 100) },
    { stage: 'Participants (Activated)', count: totalInvestors + totalParticipants, color: '#fb923c', pct: Math.round(((totalInvestors + totalParticipants) / totalVisitors) * 100) },
    { stage: 'Investors (Payment Verified)', count: totalInvestors, color: '#10b981', pct: Math.round((totalInvestors / totalVisitors) * 100) },
  ];

  const trendData = [
    { month: 'Nov 25', organic: 3, referral: 5, campaign: 2, social: 1 },
    { month: 'Dec 25', organic: 4, referral: 7, campaign: 4, social: 2 },
    { month: 'Jan 26', organic: 5, referral: 9, campaign: 8, social: 3 },
    { month: 'Feb 26', organic: 4, referral: 8, campaign: 7, social: 4 },
    { month: 'Mar 26', organic: 3, referral: 6, campaign: 5, social: 3 },
    { month: 'Apr 26', organic: 2, referral: 4, campaign: 3, social: 2 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="p-5 rounded-xl" style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 16px' }}>ACQUISITION FUNNEL</p>
          <div className="space-y-3">
            {funnel.map((f, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ color: 'white', fontWeight: 600, fontSize: 12 }}>{f.stage}</span>
                  <div className="flex items-center gap-3">
                    <span style={{ color: f.color, fontWeight: 800, fontSize: 16 }}>{f.count}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${f.color}18`, color: f.color }}>{f.pct}%</span>
                  </div>
                </div>
                <div className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${f.pct}%`, background: f.color, opacity: 0.85 }} />
                </div>
                {i < funnel.length - 1 && (
                  <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, margin: '4px 0 0', textAlign: 'right' }}>
                    ↓ drop-off: {funnel[i].count - funnel[i+1].count} ({100 - Math.round(funnel[i+1].count / funnel[i].count * 100)}%)
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Acquisition trend */}
        <div className="p-5 rounded-xl" style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 12px' }}>ACQUISITION TREND BY SOURCE</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', fontSize: 11 }} />
              <Line type="monotone" dataKey="referral" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Referral" />
              <Line type="monotone" dataKey="campaign" stroke="#3b82f6" strokeWidth={2} dot={false} name="Campaign" />
              <Line type="monotone" dataKey="organic" stroke="#10b981" strokeWidth={2} dot={false} name="Organic" />
              <Line type="monotone" dataKey="social" stroke="#fb923c" strokeWidth={2} dot={false} name="Social" />
              <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Source × Conversion table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,31,60,0.5)' }}>
        <div className="px-4 py-3 border-b border-white/8">
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>CONVERSION BY SOURCE — DETAIL</p>
        </div>
        <table className="w-full text-xs">
          <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
            <tr>
              {['Source', 'Total Users', 'Investors', 'Participants', 'Leads', 'Conv. Rate'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {convData.map((s, i) => {
              const sc = SOURCE_COLORS[s.source] || '#888';
              return (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: `${sc}18`, color: sc }}>{s.source}</span>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'white', fontWeight: 700 }}>{s.total}</td>
                  <td className="px-4 py-2.5" style={{ color: '#10b981', fontWeight: 700 }}>{s.investors}</td>
                  <td className="px-4 py-2.5" style={{ color: '#3b82f6', fontWeight: 700 }}>{s.participants}</td>
                  <td className="px-4 py-2.5" style={{ color: '#fb923c', fontWeight: 700 }}>{s.leads}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <div className="h-full rounded-full" style={{ width: `${s.conversionRate}%`, background: s.conversionRate >= 70 ? '#10b981' : s.conversionRate >= 50 ? '#fb923c' : '#ef4444' }} />
                      </div>
                      <span style={{ color: s.conversionRate >= 70 ? '#10b981' : s.conversionRate >= 50 ? '#fb923c' : '#ef4444', fontWeight: 700 }}>{s.conversionRate}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvestmentTab() {
  const investData = getInvestmentBySource();
  const campaignRanked = [...CAMPAIGNS].sort((a, b) => b.investmentVolume - a.investmentVolume);
  const totalVol = CAMPAIGNS.reduce((s, c) => s + c.investmentVolume, 0);

  return (
    <div className="space-y-6">
      {/* Source ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl" style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 14px' }}>INVESTMENT VOLUME BY ACQUISITION SOURCE</p>
          <div className="space-y-3">
            {investData.filter(s => s.volume > 0).map((s, i) => {
              const sc = SOURCE_COLORS[s.source] || '#888';
              const maxVol = Math.max(...investData.map(x => x.volume));
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded text-xs font-black flex items-center justify-center" style={{ background: `${sc}20`, color: sc }}>{i + 1}</span>
                      <span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{s.source}</span>
                    </div>
                    <span style={{ color: sc, fontWeight: 900, fontSize: 14 }}>${(s.volume / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(s.volume / maxVol) * 100}%`, background: sc }} />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '3px 0 0' }}>{Math.round((s.volume / totalVol) * 100)}% of total investment volume</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campaign ranking by investment */}
        <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-4 py-3 border-b border-white/8">
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>CAMPAIGNS RANKED BY INVESTMENT VOLUME</p>
          </div>
          <table className="w-full text-xs">
            <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
              <tr>
                {['#', 'Campaign', 'Channel', 'Users', 'Investment', 'CPA', 'ROI Signal'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaignRanked.map((c, i) => {
                const chColor = CHANNEL_COLORS[c.channel] || '#3b82f6';
                const roi = Math.round((c.investmentVolume / c.spent) * 10) / 10;
                return (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-3 py-2.5" style={{ color: i < 3 ? '#fb923c' : 'rgba(255,255,255,0.3)', fontWeight: 800 }}>#{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{c.name}</p>
                      <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0, fontSize: 9 }}>{c.startDate}</p>
                    </td>
                    <td className="px-3 py-2.5"><span style={{ color: chColor, fontSize: 10, fontWeight: 600 }}>{c.channel}</span></td>
                    <td className="px-3 py-2.5" style={{ color: '#3b82f6', fontWeight: 700 }}>{c.usersGenerated}</td>
                    <td className="px-3 py-2.5" style={{ color: '#10b981', fontWeight: 800 }}>${(c.investmentVolume / 1000).toFixed(0)}K</td>
                    <td className="px-3 py-2.5" style={{ color: '#a855f7', fontWeight: 700 }}>${c.cpa}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: roi > 10 ? 'rgba(16,185,129,0.15)' : roi > 5 ? 'rgba(251,146,60,0.15)' : 'rgba(239,68,68,0.15)', color: roi > 10 ? '#10b981' : roi > 5 ? '#fb923c' : '#ef4444' }}>
                        {roi}x
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Source vs Paid vs Organic comparison */}
      <div className="p-5 rounded-xl" style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 14px' }}>PAID VS REFERRAL VS ORGANIC — COMPARISON</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Paid Campaigns', volume: CAMPAIGNS.filter(c => ['Meta Ads','TikTok Ads','Google Ads','Influencer Campaign','Email Campaign'].includes(c.channel)).reduce((s,c)=>s+c.investmentVolume,0), users: CAMPAIGNS.filter(c => c.channel !== 'Community Referral').reduce((s,c)=>s+c.usersGenerated,0), color: '#3b82f6', note: 'Meta, Google, TikTok, Influencer, Email' },
            { label: 'Referral / Community', volume: CAMPAIGNS.find(c=>c.channel==='Community Referral')?.investmentVolume || 0, users: CAMPAIGNS.find(c=>c.channel==='Community Referral')?.usersGenerated || 0, color: '#8b5cf6', note: 'Leader-activated referral chains' },
            { label: 'Organic / Direct', volume: Math.round(totalVol * 0.12), users: 8, color: '#10b981', note: 'Search, direct visits, word-of-mouth' },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: `${s.color}0a`, border: `1px solid ${s.color}20` }}>
              <p style={{ color: s.color, fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', margin: '0 0 8px' }}>{s.label.toUpperCase()}</p>
              <p style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: '0 0 2px' }}>${(s.volume / 1000).toFixed(0)}K</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 6px' }}>{s.users} users sourced</p>
              <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, margin: 0 }}>{s.note}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderTab() {
  const leaders = getLeaderPerformance();
  const topRef = getTopReferrers();
  const [sort, setSort] = useState('converted');

  const sorted = [...leaders].sort((a, b) => b[sort] - a[sort]);

  return (
    <div className="space-y-6">
      {/* Leader ranking table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>LEADER PERFORMANCE — ACQUISITION RANKING</p>
          <div className="flex gap-2">
            {['converted', 'referrals', 'convRate'].map(s => (
              <button key={s} onClick={() => setSort(s)}
                className="px-2 py-1 rounded text-xs font-semibold transition-all"
                style={{ background: sort === s ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)', color: sort === s ? '#a855f7' : 'rgba(255,255,255,0.4)', border: `1px solid ${sort === s ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                {s === 'convRate' ? 'Conv %' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full text-xs">
          <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
            <tr>
              {['Rank', 'Leader', 'Type', 'Referrals', 'Converted', 'Pending', 'Inactive', 'Conv. Rate', 'Performance'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((l, i) => (
              <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-4 py-3" style={{ color: i < 3 ? '#fb923c' : 'rgba(255,255,255,0.3)', fontWeight: 800 }}>#{i + 1}</td>
                <td className="px-4 py-3">
                  <p style={{ color: 'white', fontWeight: 700, margin: 0 }}>{l.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>{l.id}</p>
                </td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>Leader</span></td>
                <td className="px-4 py-3" style={{ color: '#3b82f6', fontWeight: 800, fontSize: 14 }}>{l.referrals}</td>
                <td className="px-4 py-3" style={{ color: '#10b981', fontWeight: 800, fontSize: 14 }}>{l.converted}</td>
                <td className="px-4 py-3" style={{ color: '#fb923c', fontWeight: 700 }}>{l.pending}</td>
                <td className="px-4 py-3" style={{ color: '#6b7280', fontWeight: 700 }}>{l.inactive}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width: `${l.convRate}%`, background: l.convRate >= 70 ? '#10b981' : l.convRate >= 50 ? '#fb923c' : '#ef4444' }} />
                    </div>
                    <span style={{ color: l.convRate >= 70 ? '#10b981' : l.convRate >= 50 ? '#fb923c' : '#ef4444', fontWeight: 800 }}>{l.convRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: l.convRate >= 70 ? 'rgba(16,185,129,0.15)' : l.convRate >= 50 ? 'rgba(251,146,60,0.15)' : 'rgba(239,68,68,0.15)', color: l.convRate >= 70 ? '#10b981' : l.convRate >= 50 ? '#fb923c' : '#ef4444' }}>
                    {l.convRate >= 70 ? 'High' : l.convRate >= 50 ? 'Medium' : 'Low'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top referrers across all types */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(13,31,60,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-4 py-3 border-b border-white/8">
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>ALL REFERRERS RANKED — LEADERS + PARTICIPANTS</p>
        </div>
        <table className="w-full text-xs">
          <thead style={{ background: 'rgba(0,0,0,0.3)' }}>
            <tr>
              {['Rank', 'Name', 'Type', 'Total Referrals', 'Converted', 'Conv. Rate', 'Growth Signal'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topRef.map((r, i) => {
              const cr = Math.round((r.converted / r.total) * 100);
              return (
                <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-4 py-3" style={{ color: i < 3 ? '#fb923c' : 'rgba(255,255,255,0.3)', fontWeight: 800 }}>#{i + 1}</td>
                  <td className="px-4 py-3" style={{ color: 'white', fontWeight: 700 }}>{r.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: r.type === 'leader' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)', color: r.type === 'leader' ? '#8b5cf6' : '#3b82f6' }}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#3b82f6', fontWeight: 800, fontSize: 14 }}>{r.total}</td>
                  <td className="px-4 py-3" style={{ color: '#10b981', fontWeight: 800 }}>{r.converted}</td>
                  <td className="px-4 py-3">
                    <span style={{ color: cr >= 70 ? '#10b981' : cr >= 50 ? '#fb923c' : '#ef4444', fontWeight: 800 }}>{cr}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(r.total, 8) }).map((_, j) => (
                        <div key={j} className="w-2 h-2 rounded-sm" style={{ background: j < r.converted ? '#10b981' : '#fb923c', opacity: 0.7 }} />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [tab, setTab] = useState('Campaign Intelligence');

  const totalUsers = CAMPAIGNS.reduce((s, c) => s + c.usersGenerated, 0);
  const totalVolume = CAMPAIGNS.reduce((s, c) => s + c.investmentVolume, 0);
  const totalConversions = CAMPAIGNS.reduce((s, c) => s + c.conversions, 0);
  const avgCR = Math.round((totalConversions / totalUsers) * 100);

  return (
    <div className="space-y-7 max-w-[1400px]">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ color: '#a855f7', fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', margin: '0 0 6px' }}>ACQUISITION INTELLIGENCE</p>
        <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, margin: '0 0 4px', letterSpacing: -0.5 }}>Growth & Attribution Analytics</h1>
        <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, margin: 0 }}>Campaign performance · Traffic sources · Referral chains · Conversion funnel</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Zap} label="Campaign-Sourced Users" value={totalUsers} sub="Across 6 campaigns" color="#3b82f6" />
        <KpiCard icon={Target} label="Avg Conversion Rate" value={`${avgCR}%`} sub="Campaign leads → investors" color="#10b981" />
        <KpiCard icon={DollarSign} label="Campaign Investment Volume" value={`$${(totalVolume / 1000).toFixed(0)}K`} sub="Verified activations" color="#fb923c" />
        <KpiCard icon={GitBranch} label="Referral Events" value={REFERRAL_CHAINS.length} sub={`${REFERRAL_CHAINS.filter(r => r.conversionStatus === 'converted').length} converted`} color="#8b5cf6" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: tab === t ? 'rgba(139,92,246,0.2)' : 'transparent', color: tab === t ? '#a855f7' : 'rgba(255,255,255,0.4)', border: tab === t ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        {tab === 'Campaign Intelligence' && <CampaignIntelligencePanel />}
        {tab === 'Campaigns' && <CampaignsTab />}
        {tab === 'Acquisition Sources' && <AcquisitionTab />}
        {tab === 'Referral Network' && <ReferralTab />}
        {tab === 'Conversion Funnel' && <FunnelTab />}
        {tab === 'Investment Attribution' && <InvestmentTab />}
        {tab === 'Leader Attribution' && <LeaderTab />}
      </motion.div>
    </div>
  );
}