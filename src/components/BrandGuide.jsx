import { motion } from 'framer-motion';

export default function BrandGuide() {
  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-16 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12"
      >
        <h1 style={{ color: '#0F1419', fontSize: 40, fontWeight: 900, fontFamily: 'Inter, sans-serif', margin: '0 0 12px 0', letterSpacing: -0.5 }}>
          Vicion Power
        </h1>
        <p style={{ color: '#4b5563', fontSize: 16, fontWeight: 400, margin: '0 0 24px 0', lineHeight: 1.6 }}>
          Brand identity guidelines · Minimalista · Premium · Fintech-inspired
        </p>
      </motion.div>

      {/* Color Palette */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
        <div>
          <h2 style={{ color: '#0F1419', fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Color Palette</h2>
          <p style={{ color: '#4b5563', fontSize: 13, margin: 0 }}>Professional, clean, technology-focused</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: 'Navy Deep', hex: '#0F1419', desc: 'Primary' },
            { name: 'Blue Primary', hex: '#1e40af', desc: 'Actions' },
            { name: 'Blue Accent', hex: '#3b82f6', desc: 'Interactive' },
            { name: 'Green Success', hex: '#10b981', desc: 'Positive' },
            { name: 'White', hex: '#FFFFFF', desc: 'Base' },
          ].map((color, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                style={{
                  width: '100%',
                  height: 80,
                  borderRadius: 8,
                  background: color.hex,
                  border: color.hex === '#FFFFFF' ? '1px solid #e5e7eb' : 'none',
                  marginBottom: 12
                }}
              />
              <p style={{ color: '#0F1419', fontSize: 12, fontWeight: 600, margin: '0 0 2px 0' }}>
                {color.name}
              </p>
              <p style={{ color: '#4b5563', fontSize: 11, margin: '0 0 4px 0' }}>{color.hex}</p>
              <p style={{ color: '#9ca3af', fontSize: 10 }}>{color.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Grays */}
        <div className="mt-8">
          <p style={{ color: '#0F1419', fontSize: 13, fontWeight: 600, margin: '0 0 12px 0' }}>Gray Scale</p>
          <div className="space-y-2">
            {[
              { name: 'Neutral 50', hex: '#f9fafb' },
              { name: 'Neutral 100', hex: '#f3f4f6' },
              { name: 'Neutral 200', hex: '#e5e7eb' },
              { name: 'Neutral 400', hex: '#9ca3af' },
              { name: 'Neutral 600', hex: '#4b5563' },
              { name: 'Neutral 900', hex: '#111827' },
            ].map((gray, i) => (
              <div key={i} className="flex items-center gap-3">
                <div style={{ width: 40, height: 40, borderRadius: 4, background: gray.hex, border: gray.hex.includes('f') ? '1px solid #e5e7eb' : 'none' }} />
                <span style={{ color: '#4b5563', fontSize: 12 }}>{gray.name}</span>
                <span style={{ color: '#9ca3af', fontSize: 11, marginLeft: 'auto' }}>{gray.hex}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Typography */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
        <div>
          <h2 style={{ color: '#0F1419', fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Typography</h2>
          <p style={{ color: '#4b5563', fontSize: 13, margin: 0 }}>Clean, modern, professional</p>
        </div>

        <div className="space-y-8">
          {[
            { label: 'Display Large', size: 40, weight: 900, text: 'Vicion Power' },
            { label: 'Heading 1', size: 28, weight: 700, text: 'Building Global Networks' },
            { label: 'Heading 2', size: 20, weight: 700, text: 'Transparent Growth' },
            { label: 'Body Regular', size: 14, weight: 400, text: 'Professional and accessible communication for all members' },
            { label: 'Body Small', size: 12, weight: 400, text: 'Supporting text for clarity and context' },
            { label: 'Label', size: 11, weight: 600, text: 'CATEGORY · SECTION · TAG' },
          ].map((typo, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border-b pb-6"
              style={{ borderColor: '#e5e7eb' }}
            >
              <p style={{ color: '#9ca3af', fontSize: 11, fontWeight: 600, margin: '0 0 8px 0', letterSpacing: 0.5 }}>
                {typo.label}
              </p>
              <p style={{
                color: '#0F1419',
                fontSize: typo.size,
                fontWeight: typo.weight,
                margin: 0,
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.2
              }}>
                {typo.text}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Design Principles */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
        <div>
          <h2 style={{ color: '#0F1419', fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Design Principles</h2>
          <p style={{ color: '#4b5563', fontSize: 13, margin: 0 }}>Core values for every visual decision</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: '✓', title: 'Minimalist', desc: 'Remove the unnecessary. Every element has purpose.' },
            { icon: '◆', title: 'Premium', desc: 'High quality, refined, attention to detail.' },
            { icon: '→', title: 'Clear', desc: 'Direct communication. No jargon, no confusion.' },
            { icon: '⚙', title: 'Technical', desc: 'Modern, efficient, forward-thinking design.' },
            { icon: '👥', title: 'Human', desc: 'Real people, real stories, authentic moments.' },
            { icon: '🌍', title: 'Global', desc: 'Culturally aware, inclusive, accessible to all.' },
          ].map((principle, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="p-6 rounded-8"
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
            >
              <p style={{ fontSize: 20, margin: '0 0 8px 0' }}>{principle.icon}</p>
              <p style={{ color: '#0F1419', fontSize: 14, fontWeight: 600, margin: '0 0 4px 0' }}>
                {principle.title}
              </p>
              <p style={{ color: '#4b5563', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                {principle.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* What NOT to do */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6 p-6 rounded-12 bg-red-50 border border-red-200">
        <div>
          <h2 style={{ color: '#7f1d1d', fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>What NOT to do</h2>
          <p style={{ color: '#a16061', fontSize: 13, margin: 0 }}>Brand violations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            '❌ No fake images or stock photos that look artificial',
            '❌ No MLM-style marketing language or hype',
            '❌ No exaggerated promises or unrealistic claims',
            '❌ No garish colors or aggressive design',
            '❌ No complex jargon without explanation',
            '❌ No outdated or tacky design elements',
          ].map((rule, i) => (
            <p key={i} style={{ color: '#7f1d1d', fontSize: 12, margin: 0 }}>
              {rule}
            </p>
          ))}
        </div>
      </motion.section>

      {/* Component Examples */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
        <div>
          <h2 style={{ color: '#0F1419', fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>Component Examples</h2>
          <p style={{ color: '#4b5563', fontSize: 13, margin: 0 }}>Consistent patterns across the platform</p>
        </div>

        {/* Button Examples */}
        <div className="space-y-4">
          <p style={{ color: '#0F1419', fontSize: 13, fontWeight: 600 }}>Buttons</p>
          <div className="flex gap-3 flex-wrap">
            <button style={{
              padding: '12px 24px',
              background: '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              Primary Action
            </button>
            <button style={{
              padding: '12px 24px',
              background: 'transparent',
              color: '#1e40af',
              border: '1px solid #1e40af',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              Secondary
            </button>
            <button style={{
              padding: '12px 24px',
              background: '#f3f4f6',
              color: '#4b5563',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              Tertiary
            </button>
          </div>
        </div>

        {/* Card Example */}
        <div className="space-y-4">
          <p style={{ color: '#0F1419', fontSize: 13, fontWeight: 600 }}>Cards</p>
          <div style={{
            padding: 24,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: 8
          }}>
            <p style={{ color: '#4b5563', fontSize: 11, fontWeight: 600, margin: '0 0 8px 0', letterSpacing: 0.5 }}>
              SECTION LABEL
            </p>
            <p style={{ color: '#0F1419', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
              Clean Card Design
            </p>
            <p style={{ color: '#4b5563', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
              Subtle backgrounds, clear typography, ample whitespace. Every card tells a story without noise.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <div style={{ paddingTop: 32, borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>
          Vicion Power Brand Guide v1.0 · 2026
        </p>
      </div>
    </div>
  );
}