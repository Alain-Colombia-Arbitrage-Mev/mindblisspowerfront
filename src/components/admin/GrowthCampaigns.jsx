import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function GrowthCampaigns() {
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Early Bird Onboarding', status: 'active', conversion: 34, reach: 2400 },
    { id: 2, name: 'Referral Boost Q2', status: 'paused', conversion: 28, reach: 1800 },
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Growth Campaigns</h3>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-vicion-blue text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition-all">
          <Plus size={14} /> New Campaign
        </button>
      </div>

      <div className="space-y-2">
        {campaigns.map(c => (
          <div key={c.id} className="p-4 rounded-lg flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <p className="text-white text-sm font-medium">{c.name}</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Conversion: {c.conversion}% • Reach: {c.reach}</p>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ background: c.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(107,114,128,0.2)', color: c.status === 'active' ? '#10b981' : '#6b7280', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                {c.status}
              </span>
              <button className="text-white/40 hover:text-white/70 transition-all"><Edit2 size={14} /></button>
              <button className="text-white/40 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}