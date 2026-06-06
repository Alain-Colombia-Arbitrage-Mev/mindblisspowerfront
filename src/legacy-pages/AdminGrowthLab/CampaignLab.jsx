import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateAdminAccess } from '@/lib/AdminRouteGuard';
import { motion } from 'framer-motion';
import { Plus, Filter, Trash2, Edit2 } from 'lucide-react';

const campaignCategories = ['Acquisition', 'Activation', 'Retention', 'Referral', 'Monetization', 'Brand Awareness', 'Performance', 'Community', 'Reactivation'];
const campaignStatuses = ['Draft', 'Active', 'Paused', 'Testing', 'Completed', 'Archived'];
const platforms = ['Web', 'Mobile', 'Email', 'Social', 'SMS', 'Referral'];

export default function CampaignLab() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([
    {
      id: 'camp_1',
      name: 'Q2 Activation Campaign',
      objective: 'Increase member activation',
      platform: 'Web',
      category: 'Activation',
      funnel_stage: 'onboarding',
      status: 'Active',
      owner: 'Admin User',
      start_date: '2026-04-01',
      end_date: '2026-06-30',
      notes: 'Focus on new member engagement'
    },
    {
      id: 'camp_2',
      name: 'Referral Growth Push',
      objective: 'Increase viral coefficient',
      platform: 'Mobile',
      category: 'Referral',
      funnel_stage: 'engagement',
      status: 'Testing',
      owner: 'Admin User',
      start_date: '2026-04-05',
      end_date: '2026-05-05',
      notes: 'Testing new referral mechanics'
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Active');
  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    platform: 'Web',
    category: 'Acquisition',
    funnel_stage: 'awareness',
    status: 'Draft',
    owner: 'Admin User',
    start_date: '',
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    if (!validateAdminAccess()) {
      navigate('/admin-access');
    }
  }, [navigate]);

  const addCampaign = () => {
    if (formData.name && formData.objective) {
      setCampaigns([...campaigns, { ...formData, id: `camp_${Date.now()}` }]);
      setFormData({
        name: '',
        objective: '',
        platform: 'Web',
        category: 'Acquisition',
        funnel_stage: 'awareness',
        status: 'Draft',
        owner: 'Admin User',
        start_date: '',
        end_date: '',
        notes: ''
      });
      setShowForm(false);
    }
  };

  const deleteCampaign = (id) => {
    setCampaigns(campaigns.filter(c => c.id !== id));
  };

  const filteredCampaigns = filterStatus ? campaigns.filter(c => c.status === filterStatus) : campaigns;

  return (
    <div className="min-h-screen bg-vicion-deep">
      <header className="border-b border-white/8 p-6">
        <div className="max-w-7xl mx-auto">
          <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0' }}>GROWTH LAB</p>
          <h1 className="text-white font-montserrat font-black text-2xl mb-2">Campaign Lab</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Manage and monitor internal growth campaigns</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {['Active', 'Draft', 'Testing', 'Paused', 'Completed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(filterStatus === status ? 'Active' : status)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: filterStatus === status ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                  color: filterStatus === status ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                  border: filterStatus === status ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.1)'
                }}
              >
                {status}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', cursor: 'pointer' }}
          >
            <Plus size={16} /> New Campaign
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl mb-6"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Campaign Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
              />
              <input
                type="text"
                placeholder="Objective"
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
              >
                {campaignCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
              >
                {campaignStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addCampaign}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-green-400"
                style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}
              >
                Create
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {/* Campaigns List */}
        <div className="space-y-3">
          {filteredCampaigns.map((campaign, idx) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 rounded-xl"
              style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm mb-1">{campaign.name}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                    {campaign.objective} • {campaign.category} • {campaign.platform}
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded text-xs font-semibold"
                  style={{
                    background: campaign.status === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                    color: campaign.status === 'Active' ? '#10b981' : 'rgba(255,255,255,0.5)'
                  }}
                >
                  {campaign.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => deleteCampaign(campaign.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}