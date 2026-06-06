import { useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function InviteTracking() {
  const [metrics] = useState({
    totalInvites: 12480,
    conversionRate: 34.2,
    activeInvites: 4240,
    confirmedConversions: 4268,
    pendingConversions: 3840,
    expiredInvites: 1540,
  });

  const [topReferrers] = useState([
    { user: 'User #1847', invites: 245, conversions: 84, convRate: 34.3, reward: '$1,260' },
    { user: 'User #2103', invites: 187, conversions: 68, convRate: 36.4, reward: '$1,020' },
    { user: 'User #5640', invites: 142, conversions: 52, convRate: 36.6, reward: '$780' },
    { user: 'User #3421', invites: 128, conversions: 41, convRate: 32.0, reward: '$615' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-white font-semibold mb-4">Invitation Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Total Invites', value: metrics.totalInvites },
            { label: 'Conversion Rate', value: `${metrics.conversionRate}%` },
            { label: 'Active Pending', value: metrics.activeInvites },
            { label: 'Confirmed', value: metrics.confirmedConversions },
            { label: 'Pending Conversion', value: metrics.pendingConversions },
            { label: 'Expired', value: metrics.expiredInvites },
          ].map((m, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{m.label}</p>
              <p className="text-white font-bold text-lg mt-2">{typeof m.value === 'number' ? m.value.toLocaleString() : m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={16} /> Top Referrers
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {topReferrers.map((ref, i) => (
            <div key={i} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-medium text-sm">{i + 1}. {ref.user}</p>
                <p className="text-vicion-electric font-bold">{ref.reward}</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)' }}>Invites</p>
                  <p className="text-white font-semibold">{ref.invites}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)' }}>Conversions</p>
                  <p className="text-white font-semibold">{ref.conversions}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)' }}>Rate</p>
                  <p className="text-vicion-electric font-semibold">{ref.convRate}%</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)' }}>Rank</p>
                  <p className="text-white font-semibold">#{i + 1}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}