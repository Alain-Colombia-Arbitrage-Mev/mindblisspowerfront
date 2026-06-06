import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateAdminAccess } from '@/lib/AdminRouteGuard';
import { motion } from 'framer-motion';
import { Plus, Trash2, Play, Pause } from 'lucide-react';

const experimentStatuses = ['Planned', 'Running', 'Paused', 'Completed', 'Archived'];

export default function ExperimentLab() {
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState([
    {
      id: 'exp_1',
      name: 'Hero CTA Test',
      hypothesis: 'Action-oriented CTA will increase conversions',
      objective: 'Increase CTR by 15%',
      campaign_id: 'camp_1',
      content_variant: 'Get Started Now',
      start_date: '2026-04-01',
      end_date: '2026-04-15',
      success_metric: 'Conversion Rate',
      status: 'Running',
      variants: 2,
      sample_size: 5000
    },
    {
      id: 'exp_2',
      name: 'Referral Messaging Test',
      hypothesis: 'Social proof messaging increases referral signups',
      objective: 'Increase referral rate',
      campaign_id: 'camp_2',
      content_variant: 'Join 50K+ Members',
      start_date: '2026-04-05',
      end_date: '2026-04-20',
      success_metric: 'Referral Conversion',
      status: 'Running',
      variants: 3,
      sample_size: 8000
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    hypothesis: '',
    objective: '',
    campaign_id: '',
    content_variant: '',
    start_date: '',
    end_date: '',
    success_metric: 'Conversion Rate',
    status: 'Planned'
  });

  useEffect(() => {
    if (!validateAdminAccess()) {
      navigate('/admin-access');
    }
  }, [navigate]);

  const addExperiment = () => {
    if (formData.name && formData.hypothesis) {
      setExperiments([...experiments, { ...formData, id: `exp_${Date.now()}`, variants: 2, sample_size: 5000 }]);
      setFormData({
        name: '',
        hypothesis: '',
        objective: '',
        campaign_id: '',
        content_variant: '',
        start_date: '',
        end_date: '',
        success_metric: 'Conversion Rate',
        status: 'Planned'
      });
      setShowForm(false);
    }
  };

  const deleteExperiment = (id) => {
    setExperiments(experiments.filter(e => e.id !== id));
  };

  const toggleStatus = (id) => {
    setExperiments(experiments.map(e =>
      e.id === id ? { ...e, status: e.status === 'Running' ? 'Paused' : 'Running' } : e
    ));
  };

  return (
    <div className="min-h-screen bg-vicion-deep">
      <header className="border-b border-white/8 p-6">
        <div className="max-w-7xl mx-auto">
          <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0' }}>GROWTH LAB</p>
          <h1 className="text-white font-montserrat font-black text-2xl mb-2">Experiment Lab</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Run structured A/B and multivariate experiments</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', cursor: 'pointer' }}
          >
            <Plus size={16} /> New Experiment
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl mb-6"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <div className="space-y-4 mb-4">
              <input
                type="text"
                placeholder="Experiment Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
              />
              <textarea
                placeholder="Hypothesis"
                value={formData.hypothesis}
                onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
                rows="2"
              />
              <input
                type="text"
                placeholder="Objective"
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-white/10 text-white border border-white/20 text-sm"
              >
                {experimentStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addExperiment}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-green-400"
                style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}
              >
                Create Experiment
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

        {/* Experiments List */}
        <div className="space-y-4">
          {experiments.map((exp, idx) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 rounded-xl"
              style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-sm mb-2">{exp.name}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontStyle: 'italic', margin: '0 0 3px 0' }}>
                    "{exp.hypothesis}"
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
                    Objective: {exp.objective}
                  </p>
                </div>
                <span
                  className="px-2 py-1 rounded text-xs font-semibold"
                  style={{
                    background: exp.status === 'Running' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                    color: exp.status === 'Running' ? '#10b981' : 'rgba(255,255,255,0.5)'
                  }}
                >
                  {exp.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-y border-white/10">
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>VARIANTS</p>
                  <p style={{ color: '#10b981', fontSize: 13, fontWeight: 700 }}>{exp.variants}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>SAMPLE</p>
                  <p style={{ color: '#3b82f6', fontSize: 13, fontWeight: 700 }}>{exp.sample_size.toLocaleString()}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>METRIC</p>
                  <p style={{ color: '#a855f7', fontSize: 13, fontWeight: 700 }}>{exp.success_metric}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleStatus(exp.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    background: exp.status === 'Running' ? 'rgba(251,146,60,0.2)' : 'rgba(16,185,129,0.2)',
                    border: exp.status === 'Running' ? '1px solid rgba(251,146,60,0.3)' : '1px solid rgba(16,185,129,0.3)',
                    color: exp.status === 'Running' ? '#fb923c' : '#10b981',
                    cursor: 'pointer'
                  }}
                >
                  {exp.status === 'Running' ? <Pause size={12} /> : <Play size={12} />}
                  {exp.status === 'Running' ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => deleteExperiment(exp.id)}
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