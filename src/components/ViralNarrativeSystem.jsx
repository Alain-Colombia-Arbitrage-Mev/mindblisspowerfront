import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { VIRAL_SCRIPTS, VIDEO_GUIDELINES, CONTENT_PILLARS, ANTI_PATTERNS } from '@/lib/viralScripts';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function ViralNarrativeSystem() {
  const [selectedScript, setSelectedScript] = useState(VIRAL_SCRIPTS[0]);
  const [activeTab, setActiveTab] = useState('scripts');

  return (
    <div className="max-w-6xl mx-auto py-20 px-4 space-y-16">
      {/* Header */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center space-y-4"
      >
        <h1 style={{
          fontSize: 40,
          fontWeight: 900,
          color: '#0F1419',
          margin: 0,
          fontFamily: 'Inter, sans-serif'
        }}>
          Viral Narrative System
        </h1>
        <p style={{
          fontSize: 16,
          fontWeight: 400,
          color: '#4b5563',
          margin: 0,
          fontFamily: 'Inter, sans-serif'
        }}>
          15-30 second videos designed for curiosity → click → entry
        </p>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #e5e7eb' }}>
        {['scripts', 'structure', 'dos', 'pillars'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              color: activeTab === tab ? '#1e40af' : '#9ca3af',
              borderBottom: activeTab === tab ? '2px solid #1e40af' : 'none',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'scripts' && (
          <motion.div
            key="scripts"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeUp}
            className="space-y-8"
          >
            {/* Script Selector */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: 1 }}>
                Select Script
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {VIRAL_SCRIPTS.map((script) => (
                  <motion.button
                    key={script.id}
                    onClick={() => setSelectedScript(script)}
                    whileHover={{ scale: 1.05 }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `2px solid ${selectedScript.id === script.id ? '#1e40af' : '#e5e7eb'}`,
                      background: selectedScript.id === script.id ? '#f0f4ff' : '#FFFFFF',
                      color: selectedScript.id === script.id ? '#1e40af' : '#4b5563',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {script.id.replace('script_', '')}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Selected Script Display */}
            <motion.div
              key={selectedScript.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="p-8 rounded-16 space-y-6"
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
            >
              {/* Title & Metadata */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F1419', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                    {selectedScript.title}
                  </h2>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0 0', fontFamily: 'Inter, sans-serif' }}>
                    {selectedScript.duration} • {selectedScript.vibe}
                  </p>
                </div>
                <span style={{
                  padding: '4px 12px',
                  background: '#1e40af',
                  color: '#FFFFFF',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif'
                }}>
                  {selectedScript.platform}
                </span>
              </div>

              {/* Script Structure */}
              <div className="space-y-6">
                {[
                  { label: '1. HOOK', text: selectedScript.hook, icon: '🎣' },
                  { label: '2. PROBLEM', text: selectedScript.problem, icon: '⚠️' },
                  { label: '3. INSIGHT', text: selectedScript.insight, icon: '💡' },
                  { label: '4. SOFT CTA', text: selectedScript.cta, icon: '→' }
                ].map((section, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{
                      padding: 12,
                      background: '#FFFFFF',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8
                    }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', margin: '0 0 6px 0', fontFamily: 'Montserrat, sans-serif', letterSpacing: 0.5 }}>
                      {section.label}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 400, color: '#0F1419', margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                      {section.icon} {section.text}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Key Insight */}
            <div className="p-6 rounded-12" style={{ background: 'rgba(30, 64, 175, 0.08)', border: '1px solid rgba(30, 64, 175, 0.2)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', margin: '0 0 8px 0', fontFamily: 'Montserrat, sans-serif' }}>
                KEY PRINCIPLE
              </p>
              <p style={{ fontSize: 14, fontWeight: 400, color: '#0F1419', margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                Never explain the system. Never promise money. The curiosity gap is the only conversion tool you need.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'structure' && (
          <motion.div
            key="structure"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeUp}
            className="space-y-8"
          >
            <div className="p-8 rounded-16" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F1419', margin: '0 0 20px 0', fontFamily: 'Inter, sans-serif' }}>
                Hook → Problem → Insight → Soft CTA
              </h3>

              <div className="space-y-6">
                {[
                  {
                    stage: '1. HOOK (0-3s)',
                    desc: 'Grab attention with a contradiction or question',
                    example: '"Crecimiento no significa más gente..."',
                    color: '#1e40af'
                  },
                  {
                    stage: '2. PROBLEM (3-10s)',
                    desc: 'Show the gap between what they think and reality',
                    example: '"Casi todos confunden volumen con valor"',
                    color: '#fb923c'
                  },
                  {
                    stage: '3. INSIGHT (10-25s)',
                    desc: 'Reveal the pattern they\'re missing',
                    example: '"Lo que realmente importa es la estructura"',
                    color: '#10b981'
                  },
                  {
                    stage: '4. SOFT CTA (25-30s)',
                    desc: 'End with curiosity, not a direct ask',
                    example: '"Hay un patrón que no ves"',
                    color: '#a78bfa'
                  }
                ].map((item, i) => (
                  <div key={i} style={{ paddingLeft: 20, borderLeft: `3px solid ${item.color}` }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0F1419', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                      {item.stage}
                    </p>
                    <p style={{ fontSize: 12, color: '#4b5563', margin: '4px 0 8px 0', fontFamily: 'Inter, sans-serif' }}>
                      {item.desc}
                    </p>
                    <p style={{ fontSize: 12, color: item.color, fontWeight: 600, margin: 0, fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
                      "{item.example}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'dos' && (
          <motion.div
            key="dos"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeUp}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* DO */}
            <div className="p-8 rounded-16" style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle size={20} style={{ color: '#10b981' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#10b981', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                  DO THIS
                </h3>
              </div>
              <div className="space-y-3">
                {VIDEO_GUIDELINES.do.map((item, i) => (
                  <p key={i} style={{ fontSize: 13, color: '#0F1419', margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                    {item}
                  </p>
                ))}
              </div>
            </div>

            {/* DO NOT */}
            <div className="p-8 rounded-16" style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div className="flex items-center gap-2 mb-6">
                <AlertCircle size={20} style={{ color: '#ef4444' }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                  DO NOT DO THIS
                </h3>
              </div>
              <div className="space-y-3">
                {VIDEO_GUIDELINES.doNot.map((item, i) => (
                  <p key={i} style={{ fontSize: 13, color: '#0F1419', margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'pillars' && (
          <motion.div
            key="pillars"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeUp}
            className="space-y-6"
          >
            {Object.values(CONTENT_PILLARS).map((pillar, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-12"
                style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} style={{ color: '#1e40af' }} />
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F1419', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                    {pillar.name}
                  </h3>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {pillar.examples.map((example, j) => (
                    <li key={j} style={{ fontSize: 12, color: '#4b5563', margin: '6px 0', fontFamily: 'Inter, sans-serif', paddingLeft: 12, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#1e40af', fontWeight: 700 }}>→</span>
                      {example}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}