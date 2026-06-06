import { useState } from 'react';
import { Heart, MessageCircle, Share, Eye } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EngagementMetrics() {
  const [metrics] = useState({
    totalReach: 284600,
    totalEngagement: 18432,
    avgEngagementRate: 6.47,
    totalShares: 4128,
  });

  const [platformMetrics] = useState([
    { platform: 'Instagram', reach: 98500, likes: 5420, comments: 1240, shares: 1200, rate: 7.2 },
    { platform: 'TikTok', reach: 124300, likes: 8650, comments: 2100, shares: 1840, rate: 8.5 },
    { platform: 'YouTube', reach: 42800, likes: 2340, comments: 680, shares: 620, rate: 7.8 },
    { platform: 'X (Twitter)', reach: 19000, likes: 1022, comments: 412, shares: 466, rate: 9.2 },
  ]);

  const [engagementTrend] = useState([
    { day: 'Mon', engagement: 2400 },
    { day: 'Tue', engagement: 2800 },
    { day: 'Wed', engagement: 2200 },
    { day: 'Thu', engagement: 3400 },
    { day: 'Fri', engagement: 4100 },
    { day: 'Sat', engagement: 3800 },
    { day: 'Sun', engagement: 2900 },
  ]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>TOTAL REACH</p>
          <p className="text-white font-bold text-xl mt-2">{(metrics.totalReach / 1000).toFixed(1)}K</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>ENGAGEMENT</p>
          <p className="text-white font-bold text-xl mt-2">{metrics.totalEngagement.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>AVG RATE</p>
          <p className="text-white font-bold text-xl mt-2">{metrics.avgEngagementRate}%</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>SHARES</p>
          <p className="text-white font-bold text-xl mt-2">{metrics.totalShares.toLocaleString()}</p>
        </div>
      </div>

      {/* Engagement Trend Chart */}
      <div className="p-6 rounded-lg" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>
          ENGAGEMENT TREND (7 DAYS)
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={engagementTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Line type="monotone" dataKey="engagement" stroke="#ec4899" strokeWidth={3} dot={{ fill: '#ec4899' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Platform Breakdown */}
      <h3 className="text-white font-semibold">Platform Performance</h3>
      <div className="space-y-3">
        {platformMetrics.map(pm => (
          <div key={pm.platform} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-white font-medium text-sm">{pm.platform}</p>
              <span className="text-vicion-electric font-bold text-sm">{pm.rate}% rate</span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Reach</p>
                <p className="text-white font-semibold">{(pm.reach / 1000).toFixed(0)}K</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Likes</p>
                <p className="text-white font-semibold">{pm.likes.toLocaleString()}</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Comments</p>
                <p className="text-white font-semibold">{pm.comments.toLocaleString()}</p>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Shares</p>
                <p className="text-white font-semibold">{pm.shares.toLocaleString()}</p>
              </div>
            </div>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 8 }}>
              <div style={{ height: '100%', width: `${pm.rate}%`, background: '#ec4899', borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}