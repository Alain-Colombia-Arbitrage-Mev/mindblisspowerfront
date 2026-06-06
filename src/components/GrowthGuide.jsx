import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Users, Lightbulb, TrendingUp, Target } from 'lucide-react';

const GUIDE_SECTIONS = [
  {
    id: 'quality',
    icon: Target,
    title: 'Calidad sobre cantidad',
    points: [
      'Una persona que entiende = mejor que 10 que no encajan',
      'Tómate tiempo explicando antes de invitar',
      'Si tienen dudas, responde con claridad',
      'La mejor red crece lentamente pero sólidamente',
    ],
  },
  {
    id: 'selection',
    icon: Users,
    title: 'A quién invitar',
    points: [
      'Personas abiertas a nuevas ideas',
      'Gente que respeta tu opinión',
      'Quienes buscan orden y claridad',
      'No: personas desesperadas o impacientes',
    ],
  },
  {
    id: 'approach',
    icon: Lightbulb,
    title: 'Cómo acercarse',
    points: [
      'Comparte tu experiencia primero',
      '"Encontré algo que me gusta..."',
      'No venda, invita a explorar',
      'Deja que decidan sin presión',
    ],
  },
  {
    id: 'growth',
    icon: TrendingUp,
    title: 'Crecimiento sostenible',
    points: [
      'Acompaña a tu red, no solo invites',
      'Tu éxito depende de su éxito',
      'Invierte tiempo en formar a tu equipo',
      'El crecimiento lleva meses, no días',
    ],
  },
];

export default function GrowthGuide() {
  const [expanded, setExpanded] = useState('quality');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 rounded-2xl"
      style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}
    >
      <p style={{ color: '#fb923c', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat, sans-serif' }}>
        GUÍA DE CRECIMIENTO
      </p>

      <h3 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 8, margin: '0 0 8px 0' }}>
        Cómo construir una red real
      </h3>

      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, marginBottom: 20, margin: '0 0 20px 0' }}>
        No es sobre números. Es sobre construir con personas que realmente encajan.
      </p>

      {/* Warning banner */}
      <div className="mb-8 p-4 rounded-xl flex gap-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: 'white' }}>Crecimiento = confianza + tiempo.</strong> Si invitas a gente que no está lista, se desactivan y tu red se debilita.
        </p>
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {GUIDE_SECTIONS.map(section => (
          <motion.div
            key={section.id}
            className="rounded-lg overflow-hidden"
            style={{
              background: expanded === section.id ? 'rgba(251,146,60,0.15)' : 'rgba(251,146,60,0.08)',
              border: `1px solid ${expanded === section.id ? 'rgba(251,146,60,0.4)' : 'rgba(251,146,60,0.2)'}`,
            }}
          >
            {/* Header */}
            <motion.button
              onClick={() => setExpanded(expanded === section.id ? null : section.id)}
              className="w-full p-4 flex items-center gap-3 text-left"
              style={{ cursor: 'pointer' }}
            >
              <section.icon size={20} style={{ color: '#fb923c', flexShrink: 0 }} />
              <span style={{ color: 'white', fontSize: 14, fontWeight: 700, flex: 1 }}>
                {section.title}
              </span>
              <motion.div
                animate={{ rotate: expanded === section.id ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ color: '#fb923c' }}
              >
                ▼
              </motion.div>
            </motion.button>

            {/* Content */}
            <motion.div
              initial={false}
              animate={{
                height: expanded === section.id ? 'auto' : 0,
                opacity: expanded === section.id ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              overflow="hidden"
            >
              <div className="px-4 pb-4 border-t border-white/10">
                <ul style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.8, margin: 0, paddingLeft: 20 }}>
                  {section.points.map((point, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ marginBottom: 8 }}
                    >
                      {point}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Core principle */}
      <div className="mt-8 p-6 rounded-xl text-center"
        style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(34,197,94,0.08))', border: '1px solid rgba(251,146,60,0.25)' }}>
        <h4 style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 8, margin: '0 0 8px 0' }}>
          El principio fundamental
        </h4>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          <strong style={{ color: '#10b981' }}>Comparte solo con quien creas que encaja.</strong><br/>
          La gente que entra por genuino interés construye mejor red que la que entra presionada.
        </p>
      </div>
    </motion.div>
  );
}