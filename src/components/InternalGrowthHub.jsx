import { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, MessageCircle, Lightbulb, ChevronDown } from 'lucide-react';
import ReferralLink from './ReferralLink';
import ReferralScripts from './ReferralScripts';
import GrowthGuide from './GrowthGuide';

export default function InternalGrowthHub({ user }) {
  const [expandedSection, setExpandedSection] = useState('link');

  const sections = [
    {
      id: 'link',
      icon: Share2,
      title: 'Tu enlace personal',
      subtitle: 'Comparte tu link único',
    },
    {
      id: 'scripts',
      icon: MessageCircle,
      title: 'Scripts de conversación',
      subtitle: 'Palabras que funcionan',
    },
    {
      id: 'guide',
      icon: Lightbulb,
      title: 'Guía de crecimiento',
      subtitle: 'Cómo construir una red sólida',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.08))', border: '1px solid rgba(59,130,246,0.2)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat, sans-serif' }}>
          MOTOR DE CRECIMIENTO
        </p>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, margin: '0 0 12px 0' }}>
          Crece de forma orgánica
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Aquí tienes todo lo que necesitas para construir tu red: tu link personal, scripts que funcionan y una guía clara de cómo hacerlo.
        </p>
      </motion.div>

      {/* Emotional Hook */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-xl text-center"
        style={{ background: 'linear-gradient(135deg, rgba(236,74,137,0.12), rgba(168,85,247,0.08))', border: '1px solid rgba(168,85,247,0.2)' }}
      >
        <h3 style={{ color: '#ec4899', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0', fontFamily: 'Montserrat, sans-serif' }}>
          Comparte solo con quien creas que encaja
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          La mejor red no es la más grande, es la mejor. Invita con criterio. La calidad siempre gana.
        </p>
      </motion.div>

      {/* Sections Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {sections.map((section, i) => (
          <motion.button
            key={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            onClick={() => setExpandedSection(section.id)}
            className="p-4 rounded-xl text-left transition-all"
            style={{
              background: expandedSection === section.id ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1))' : 'rgba(59,130,246,0.08)',
              border: expandedSection === section.id ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(59,130,246,0.15)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(59,130,246,0.15)';
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = expandedSection === section.id ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1))' : 'rgba(59,130,246,0.08)';
              e.currentTarget.style.borderColor = expandedSection === section.id ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(59,130,246,0.15)';
            }}
          >
            <div className="flex items-start gap-3">
              <section.icon size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 4px 0' }}>
                  {section.title}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
                  {section.subtitle}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Content Section */}
      <motion.div
        key={expandedSection}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {expandedSection === 'link' && (
          <ReferralLink userId={user?.id || 'user123'} userName={user?.full_name || 'Usuario'} />
        )}
        {expandedSection === 'scripts' && (
          <ReferralScripts />
        )}
        {expandedSection === 'guide' && (
          <GrowthGuide />
        )}
      </motion.div>

      {/* Stats preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
      >
        <div className="p-6 rounded-xl text-center"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 8, margin: '0 0 8px 0' }}>PERSONAS INVITADAS</p>
          <p style={{ color: '#3b82f6', fontSize: 32, fontWeight: 900, margin: 0 }}>0</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, margin: '4px 0 0 0' }}>Espacio para crecer</p>
        </div>
        <div className="p-6 rounded-xl text-center"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 8, margin: '0 0 8px 0' }}>ACTIVAS AHORA</p>
          <p style={{ color: '#10b981', fontSize: 32, fontWeight: 900, margin: 0 }}>0</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, margin: '4px 0 0 0' }}>Comenzarán pronto</p>
        </div>
        <div className="p-6 rounded-xl text-center"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, marginBottom: 8, margin: '0 0 8px 0' }}>IMPACTO TOTAL</p>
          <p style={{ color: '#a855f7', fontSize: 32, fontWeight: 900, margin: 0 }}>1</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, margin: '4px 0 0 0' }}>(incluida tu participación)</p>
        </div>
      </motion.div>

      {/* Bottom reminder */}
      <div className="p-6 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.7, margin: 0 }}>
          <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Recuerda:</strong> El crecimiento orgánico es lento pero sólido. No es sobre presionar a otros, es sobre compartir con gente que realmente puede beneficiarse de estar aquí.
        </p>
      </div>
    </div>
  );
}