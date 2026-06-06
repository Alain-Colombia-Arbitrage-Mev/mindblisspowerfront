import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateAdminAccess } from '@/lib/AdminRouteGuard';
import { motion } from 'framer-motion';
import { Plus, Trash2, Users } from 'lucide-react';

const segmentTypes = ['New users', 'Returning users', 'High intent users', 'Referral users', 'Inactive users', 'Campaign leads', 'VIP candidates', 'Community members'];
const sources = ['Signup', 'Referral', 'Campaign', 'Organic', 'Social', 'Email'];

export default function AudienceLab() {
  const navigate = useNavigate();
  const [audiences, setAudiences] = useState([
    {
      id: 'aud_1',
      name: 'New Signup - Last 7 Days',
      type: 'New users',
      source: 'Signup',
      count: 342,
      rules: 'created_at > now - 7 days',
      tags: ['onboarding', 'activation'],
      campaign_relevance: ['Q2 Activation Campaign'],
      value_score: 7.5
    },
    {
      id: 'aud_2',
      name: 'High Intent - Activation Completed',
      type: 'High intent users',
      source: 'Campaign',
      count: 1240,
      rules: 'activation_completed = true AND first_purchase > 0',
      tags: ['qualified', 'engaged'],
      campaign_relevance: ['Referral Growth Push'],
      value_score: 8.8
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'New users',
    source: 'Signup',
    rules: '',
    tags: '',
    campaign_relevance: '',
    value_score: 5.0
  });

  useEffect(() => {
    if (!validateAdminAccess()) {
      navigate('/admin-access');
    }
  }, [navigate]);

  const addAudience = () => {
    if (formData.name && formData.type) {
      setAudiences([...audiences, {
        ...formData,
        id: `aud_${Date.now()}`,
        count: Math.floor(Math.random() * 5000) + 100,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        campaign_relevance: formData.campaign_relevance ? [formData.campaign_relevance] : []
      }]);
      setFormData({
        name: '',
        type: 'New users',
        source: 'Signup',
        rules: '',
        tags: '',
        campaign_relevance: '',
        value_score: 5.0
      });
      setShowForm(false);
    }
  };

  const deleteAudience = (id) => {
    setAudiences(audiences.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-vicion-deep">
      <header className="border-b border-white/8 p-6">
        <div className="max-w-7xl mx-auto">
          <p style={{ color: '#fb923c', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0' }}>GROWTH LAB</p>
          <h1 className="text-white font-montserrat font-black text-2xl mb-2">Audience Lab</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Segment and organize user groups and targeting logic</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.3)', color: '#fb923c', cursor: 'pointer' }}
          >
            <Plus size={16} /> New Segment
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl mb-6"
            style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.25)' }}
          >
            <div className="space-y-4 mb-4">
              <input
                type="text"
                placeholder="Segment Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
                >
                  {segmentTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
                >
                  {sources.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Qualification Rules (e.g., created_at > now - 7 days)"
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
                rows="2"
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
              />
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="Value Score (0-10)"
                value={formData.value_score}
                onChange={(e) => setFormData({ ...formData, value_score: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addAudience}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-orange-400"
                style={{ background: 'rgba(251,146,60,0.2)', border: '1px solid rgba(251,146,60,0.3)', cursor: 'pointer' }}
              >
                Create Segment
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

        {/* Audiences List */}
        <div className="space-y-4">
          {audiences.map((aud, idx) => (
            <motion.div
              key={aud.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 rounded-xl"
              style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(251,146,60,0.15)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} style={{ color: '#fb923c' }} />
                    <h3 className="text-white font-semibold text-sm">{aud.name}</h3>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                    {aud.type} • {aud.source}
                  </p>
                </div>
                <div className="text-right">
                  <p style={{ color: '#fb923c', fontSize: 16, fontWeight: 700 }}>{aud.count.toLocaleString()}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>members</p>
                </div>
              </div>

              <div className="py-3 border-y border-white/10 mb-4 space-y-2">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700 }}>VALUE SCORE</p>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${(aud.value_score / 10) * 100}%`,
                        background: 'linear-gradient(90deg, #fb923c, #f97316)',
                      }}
                    />
                  </div>
                  <p style={{ color: '#fb923c', fontSize: 10, fontWeight: 700, marginTop: 2 }}>{aud.value_score.toFixed(1)}/10</p>
                </div>
                {aud.tags.length > 0 && (
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700 }}>TAGS</p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      {aud.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded text-xs" style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => deleteAudience(aud.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer' }}
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}