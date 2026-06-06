import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateAdminAccess } from '@/lib/AdminRouteGuard';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp, Zap, Clock } from 'lucide-react';

const recentCampaigns = [
  { name: 'Q2 Activation Campaign', status: 'Active', progress: 65 },
  { name: 'Referral Growth Push', status: 'Testing', progress: 40 },
  { name: 'Email Reactivation', status: 'Paused', progress: 25 },
];

const recentExperiments = [
  { name: 'Hero CTA Test', status: 'Running', confidence: 92 },
  { name: 'Referral Messaging Test', status: 'Running', confidence: 78 },
  { name: 'Pricing Page Variant', status: 'Completed', confidence: 95 },
];

const recentAutomations = [
  { name: 'New User Activation Sequence', status: 'Active', triggers: 342 },
  { name: 'Referral Reward Trigger', status: 'Active', triggers: 1240 },
  { name: 'Inactivity Re-engagement', status: 'Paused', triggers: 0 },
];

export default function ControlCenter() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!validateAdminAccess()) {
      navigate('/admin-access');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-vicion-deep">
      <header className="border-b border-white/8 p-6">
        <div className="max-w-7xl mx-auto">
          <p style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px 0' }}>GROWTH LAB</p>
          <h1 className="text-white font-montserrat font-black text-2xl mb-2">Control Center</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Operations console and growth system overview</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(168,85,247,0.1) 100%)', border: '1px solid rgba(168,85,247,0.25)' }}
        >
          <div className="flex items-start gap-4">
            <TrendingUp size={24} style={{ color: '#8b5cf6' }} />
            <div>
              <p style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 4px 0' }}>GROWTH SYSTEM STATUS</p>
              <p className="text-white text-sm font-semibold">All systems operational</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 }}>9 active campaigns • 3 running experiments • 3 active automations</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Campaigns */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
          >
            <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>RECENT CAMPAIGNS</p>
            <div className="space-y-4">
              {recentCampaigns.map((camp, idx) => (
                <div key={idx} className="pb-4 border-b border-white/10 last:border-b-0">
                  <p className="text-white text-xs font-semibold mb-2">{camp.name}</p>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${camp.progress}%`,
                        background: camp.status === 'Active' ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : 'rgba(168,85,247,0.5)',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        background: camp.status === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(251,146,60,0.2)',
                        color: camp.status === 'Active' ? '#10b981' : '#fb923c'
                      }}
                    >
                      {camp.status}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{camp.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Experiments */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(16,185,129,0.15)' }}
          >
            <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>RECENT EXPERIMENTS</p>
            <div className="space-y-4">
              {recentExperiments.map((exp, idx) => (
                <div key={idx} className="pb-4 border-b border-white/10 last:border-b-0">
                  <p className="text-white text-xs font-semibold mb-2">{exp.name}</p>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${exp.confidence}%`,
                        background: 'linear-gradient(90deg, #10b981, #34d399)',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        background: exp.status === 'Running' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                        color: exp.status === 'Running' ? '#3b82f6' : '#10b981'
                      }}
                    >
                      {exp.status}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{exp.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Automations */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(6,182,212,0.15)' }}
          >
            <p style={{ color: '#06b6d4', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>ACTIVE AUTOMATIONS</p>
            <div className="space-y-4">
              {recentAutomations.map((auto, idx) => (
                <div key={idx} className="pb-4 border-b border-white/10 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-white text-xs font-semibold flex-1">{auto.name}</p>
                    <Zap size={14} style={{ color: '#06b6d4' }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{
                        background: auto.status === 'Active' ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.1)',
                        color: auto.status === 'Active' ? '#06b6d4' : 'rgba(255,255,255,0.5)'
                      }}
                    >
                      {auto.status}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{auto.triggers} triggers</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Alerts & Pending */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Review */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>PENDING ITEMS</p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-white text-xs font-semibold mb-1">📊 Experiment Completed</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Pricing Page Variant awaits result analysis</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-white text-xs font-semibold mb-1">🎯 Campaign Review</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Email Reactivation ready for launch</p>
              </div>
            </div>
          </motion.div>

          {/* System Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl"
            style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(251,146,60,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={16} style={{ color: '#fb923c' }} />
              <p style={{ color: '#fb923c', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0 }}>ALERTS</p>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)' }}>
                <p className="text-white text-xs font-semibold mb-1">⚠️ Low Sample Size</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Referral test may need more traffic</p>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-white text-xs font-semibold mb-1">ℹ️ Upcoming Campaign</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Spring Referral Launch starts in 2 days</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}