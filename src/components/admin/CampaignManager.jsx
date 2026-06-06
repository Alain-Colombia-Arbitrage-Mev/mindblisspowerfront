import { useState } from 'react';
import { Plus, Edit2, Pause, Play, Zap } from 'lucide-react';

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Growth Milestone Campaign', status: 'active', startDate: '2026-04-01', endDate: '2026-04-30', platforms: ['instagram', 'tiktok'], reach: 284600, engagement: 18432 },
    { id: 2, name: 'Community Testimonials', status: 'active', startDate: '2026-04-05', endDate: '2026-04-25', platforms: ['tiktok', 'youtube'], reach: 124300, engagement: 10750 },
    { id: 3, name: 'Educational Series Launch', status: 'scheduled', startDate: '2026-04-20', endDate: '2026-05-20', platforms: ['youtube'], reach: 0, engagement: 0 },
    { id: 4, name: 'Market Update Series', status: 'paused', startDate: '2026-03-15', endDate: '2026-04-15', platforms: ['x'], reach: 19000, engagement: 1900 },
  ]);

  const [showForm, setShowForm] = useState(false);

  const toggleStatus = (id) => {
    setCampaigns(campaigns.map(c => {
      if (c.id === id) {
        return { ...c, status: c.status === 'active' ? 'paused' : 'active' };
      }
      return c;
    }));
  };

  const platformIcons = {
    instagram: '📸',
    tiktok: '🎵',
    youtube: '📹',
    x: '𝕏',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Active Campaigns</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-vicion-electric text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-all"
        >
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {showForm && (
        <div className="p-6 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <form className="space-y-4">
            <div>
              <label className="text-white text-sm mb-2 block">Campaign Name</label>
              <input type="text" placeholder="e.g., Growth Milestone Campaign" className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-white text-sm mb-2 block">Start Date</label>
                <input type="date" className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm" />
              </div>
              <div>
                <label className="text-white text-sm mb-2 block">End Date</label>
                <input type="date" className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm" />
              </div>
              <div>
                <label className="text-white text-sm mb-2 block">Platforms</label>
                <select multiple className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm">
                  <option>Instagram</option>
                  <option>TikTok</option>
                  <option>YouTube</option>
                  <option>X (Twitter)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-white text-sm mb-2 block">Campaign Objectives</label>
              <textarea placeholder="Define campaign goals and KPIs..." rows={3} className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 text-sm resize-none" />
            </div>
            <button type="submit" className="w-full py-2 bg-vicion-electric text-white rounded-lg font-semibold text-sm hover:bg-blue-500 transition-all">
              Create Campaign
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{campaign.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>
                  {campaign.startDate} → {campaign.endDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-1 rounded" style={{
                  background: campaign.status === 'active' ? 'rgba(16,185,129,0.2)' : campaign.status === 'scheduled' ? 'rgba(59,130,246,0.2)' : 'rgba(107,114,128,0.2)',
                  color: campaign.status === 'active' ? '#10b981' : campaign.status === 'scheduled' ? '#3b82f6' : '#9ca3af',
                }}>
                  {campaign.status}
                </span>
                <button
                  onClick={() => toggleStatus(campaign.id)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
                >
                  {campaign.status === 'active' ? <Pause size={16} style={{ color: '#f59e0b' }} /> : <Play size={16} style={{ color: '#10b981' }} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              {campaign.platforms.map(platform => (
                <span key={platform} className="text-lg" title={platform}>
                  {platformIcons[platform]}
                </span>
              ))}
            </div>

            {campaign.reach > 0 && (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)' }}>Reach</p>
                  <p className="text-white font-semibold">{(campaign.reach / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)' }}>Engagement</p>
                  <p className="text-vicion-electric font-semibold">{campaign.engagement.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}