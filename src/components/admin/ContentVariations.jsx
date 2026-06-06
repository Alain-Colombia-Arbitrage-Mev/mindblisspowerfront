import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import ContentVariationBuilder from './ContentVariationBuilder';
import ContentPerformance from './ContentPerformance';

export default function ContentVariations() {
  const [activeTab, setActiveTab] = useState('manage');
  const [variations, setVariations] = useState([
    {
      id: 'var_1',
      name: 'Hero Headline - Control',
      type: 'headline',
      content: 'Build Your Financial Future Today',
      location: 'hero',
      status: 'active',
      version: 1,
      created: '2026-04-01',
      performance: { impressions: 12450, clicks: 847, ctr: 6.8 }
    },
    {
      id: 'var_2',
      name: 'Hero Headline - Test A',
      type: 'headline',
      content: 'Join 50K+ Members Building Wealth',
      location: 'hero',
      status: 'active',
      version: 1,
      created: '2026-04-05',
      performance: { impressions: 11234, clicks: 923, ctr: 8.2 }
    },
    {
      id: 'var_3',
      name: 'CTA Button - Control',
      type: 'cta',
      content: 'Get Started Now',
      location: 'hero',
      status: 'active',
      version: 1,
      created: '2026-04-02',
      performance: { impressions: 12450, clicks: 1205, ctr: 9.7 }
    },
  ]);

  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(null);

  const addVariation = (newVar) => {
    setVariations([...variations, { ...newVar, id: `var_${Date.now()}`, created: new Date().toISOString().split('T')[0] }]);
    setShowBuilder(false);
  };

  const deleteVariation = (id) => {
    setVariations(variations.filter(v => v.id !== id));
  };

  const toggleStatus = (id) => {
    setVariations(variations.map(v => v.id === id ? { ...v, status: v.status === 'active' ? 'paused' : 'active' } : v));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat, sans-serif' }}>
              CONTENT ENGINE
            </p>
            <h2 style={{ color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, margin: '0 0 8px 0' }}>
              Dynamic Variations
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: 0 }}>
              Manage headlines, CTAs, and content blocks for A/B testing
            </p>
          </div>
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
            style={{
              background: 'rgba(59,130,246,0.2)',
              border: '1px solid rgba(59,130,246,0.3)',
              cursor: 'pointer'
            }}
          >
            <Plus size={16} /> New Variation
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/8 pt-4">
          {['manage', 'performance'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-sm font-medium transition-all capitalize"
              style={{
                borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
                color: activeTab === tab ? '#3b82f6' : 'rgba(255,255,255,0.5)'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Variation Builder */}
      {showBuilder && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}
        >
          <ContentVariationBuilder onAdd={addVariation} onCancel={() => setShowBuilder(false)} />
        </motion.div>
      )}

      {/* Content */}
      {activeTab === 'manage' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {variations.length === 0 ? (
            <div className="p-8 text-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No variations created yet</p>
            </div>
          ) : (
            variations.map((var_, idx) => (
              <motion.div
                key={var_.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-6 rounded-xl"
                style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-white text-sm font-semibold mb-1">{var_.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                      {var_.type.toUpperCase()} • {var_.location} • v{var_.version}
                    </p>
                  </div>
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      background: var_.status === 'active' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                      color: var_.status === 'active' ? '#10b981' : 'rgba(255,255,255,0.5)'
                    }}
                  >
                    {var_.status}
                  </span>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 12, fontStyle: 'italic' }}>
                  "{var_.content}"
                </p>

                <div className="grid grid-cols-3 gap-4 mb-4 py-3 border-y border-white/10">
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 2px 0' }}>IMPRESSIONS</p>
                    <p style={{ color: '#3b82f6', fontSize: 14, fontWeight: 700 }}>{var_.performance.impressions}</p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 2px 0' }}>CLICKS</p>
                    <p style={{ color: '#10b981', fontSize: 14, fontWeight: 700 }}>{var_.performance.clicks}</p>
                  </div>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: '0 0 2px 0' }}>CTR</p>
                    <p style={{ color: '#fb923c', fontSize: 14, fontWeight: 700 }}>{var_.performance.ctr}%</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStatus(var_.id)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: 'rgba(59,130,246,0.2)',
                      border: '1px solid rgba(59,130,246,0.3)',
                      color: '#3b82f6',
                      cursor: 'pointer'
                    }}
                  >
                    {var_.status === 'active' ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    onClick={() => deleteVariation(var_.id)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-400/10 transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {activeTab === 'performance' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ContentPerformance variations={variations} />
        </motion.div>
      )}
    </div>
  );
}