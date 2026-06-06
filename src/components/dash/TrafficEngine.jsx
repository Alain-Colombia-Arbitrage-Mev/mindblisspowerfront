import { useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Music, Youtube, Globe, Users, Lightbulb, AlertCircle, ArrowRight, PlayCircle, Heart, MessageSquare } from 'lucide-react';

const CHANNELS = [
  {
    id: 'instagram',
    name: 'Instagram Reels',
    icon: Instagram,
    color: '#e1306c',
    description: 'Contenido de 15-60 segundos, historias visuales',
    reach: '8.5M usuarios',
    engagement: 'Alto',
    tips: [
      'Hook en los primeros 3 segundos',
      'Storytelling visual',
      'Música envolvente',
      'Sutileza en mensajes',
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Music,
    color: '#000000',
    description: 'Algo viralizante, tendencias, autenticidad',
    reach: '12M usuarios',
    engagement: 'Muy alto',
    tips: [
      'Trends + tu historia',
      'Genuinidad ante todo',
      'Duetos y colabs',
      'Ritmo rápido',
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts',
    icon: Youtube,
    color: '#ff0000',
    description: 'Contenido educativo + entretenimiento',
    reach: '6.2M usuarios',
    engagement: 'Medio-Alto',
    tips: [
      'Valor + curiosidad',
      'Preguntas provocadoras',
      'Transformación visible',
      'CTAs claras',
    ],
  },
  {
    id: 'landing',
    name: 'Landing Pages',
    icon: Globe,
    color: '#0ea5e9',
    description: 'Conversión desde tráfico pagado o orgánico',
    reach: 'Tráfico directo',
    engagement: 'Conversión',
    tips: [
      'Testimonios reales',
      'Preguntas de calificación',
      'Claridad (no venta)',
      'Propósito antes que dinero',
    ],
  },
  {
    id: 'referidos',
    name: 'Referidos Internos',
    icon: Users,
    color: '#10b981',
    description: 'Red de embajadores y líderes existentes',
    reach: 'Comunidad activa',
    engagement: 'Más conversión',
    tips: [
      'Toolkits para miembros',
      'Testimonios de líderes',
      'Historias de transformación',
      'Apoyo personalizado',
    ],
  },
];

const HOOKS = [
  {
    text: '"Hay otra forma de avanzar"',
    color: '#3b82f6',
    context: 'Para personas cansadas de lo convencional',
  },
  {
    text: '"No todo tiene que ser incierto"',
    color: '#10b981',
    context: 'Para personas que buscan claridad',
  },
  {
    text: '"Esto no es para todos"',
    color: '#a855f7',
    context: 'Para seleccionar audiencia calificada',
  },
];

const CONTENT_PILLARS = [
  {
    icon: PlayCircle,
    title: 'Historias humanas',
    desc: 'Transformaciones reales, decisiones difíciles, crecimiento auténtico',
    color: '#3b82f6',
  },
  {
    icon: Heart,
    title: 'Transformación',
    desc: 'Antes-después de personas: mindset, confianza, visión',
    color: '#ec4899',
  },
  {
    icon: MessageSquare,
    title: 'Decisiones reales',
    desc: 'Cómo alguien decidió cambiar. Qué pesó. Qué pasó después',
    color: '#f59e0b',
  },
];

const DO_DONT = [
  {
    label: '❌ NO DECIR',
    items: ['Dinero fácil', 'Garantizado', 'Sin esfuerzo', 'Pasivo', 'Duplicar en 30 días'],
    color: '#ef4444',
  },
  {
    label: '✅ SÍ DECIR',
    items: ['Estructura clara', 'Crecimiento real', 'Comunidad', 'Herramientas', 'Apoyo'],
    color: '#10b981',
  },
];

export default function TrafficEngine() {
  const [activeChannel, setActiveChannel] = useState('instagram');
  const [showContentGuide, setShowContentGuide] = useState(false);

  const activeChannelData = CHANNELS.find(c => c.id === activeChannel);
  const ActiveIcon = activeChannelData.icon;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="p-8 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb size={24} style={{ color: '#3b82f6' }} />
          <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat,sans-serif', margin: 0 }}>
            MOTOR DE TRÁFICO
          </p>
        </div>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 26, marginBottom: 8 }}>
          Atrae curiosidad y emoción
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          5 canales, contenido auténtico, hooks poderosos. Sin dinero. Sin promesas. Solo transformación real.
        </p>
      </motion.div>

      {/* Channels Overview */}
      <div className="space-y-4">
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
          SELECCIONA UN CANAL
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {CHANNELS.map(channel => {
            const Icon = channel.icon;
            const isActive = activeChannel === channel.id;
            return (
              <motion.button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                whileHover={{ scale: 1.02 }}
                className="p-4 rounded-xl text-left transition-all"
                style={{
                  background: isActive ? `${channel.color}20` : 'rgba(255,255,255,0.03)',
                  border: isActive ? `2px solid ${channel.color}` : '1px solid rgba(255,255,255,0.06)',
                }}>
                <Icon size={20} style={{ color: channel.color, marginBottom: 8 }} />
                <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0 }}>{channel.name}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active Channel Details */}
      <motion.div
        key={activeChannel}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-8 rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${activeChannelData.color}10, ${activeChannelData.color}05)`,
          border: `1px solid ${activeChannelData.color}30`,
        }}>
        
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${activeChannelData.color}25` }}>
            <ActiveIcon size={28} style={{ color: activeChannelData.color }} />
          </div>
          <div>
            <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, margin: '0 0 4px 0' }}>
              {activeChannelData.name}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>
              {activeChannelData.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>Alcance</p>
            <p style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{activeChannelData.reach}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>Engagement</p>
            <p style={{ color: activeChannelData.color, fontSize: 14, fontWeight: 700 }}>{activeChannelData.engagement}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>Tipo de contenido</p>
            <p style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>Video corto</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>CTA</p>
            <p style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>Enlace en bio</p>
          </div>
        </div>

        <div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
            CONSEJOS CLAVE
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeChannelData.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: `${activeChannelData.color}12` }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: activeChannelData.color }} />
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content Pillars */}
      <div className="space-y-4">
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>
          PILARES DE CONTENIDO
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CONTENT_PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl"
                style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${pillar.color}25` }}>
                  <Icon size={20} style={{ color: pillar.color }} />
                </div>
                <h4 style={{ color: 'white', fontSize: 15, fontWeight: 700, marginBottom: 6, margin: '0 0 6px 0' }}>
                  {pillar.title}
                </h4>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                  {pillar.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Hooks Section */}
      <div className="space-y-4">
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, letterSpacing: 2 }}>
          HOOKS PODEROSOS
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HOOKS.map((hook, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl"
              style={{ background: `${hook.color}15`, border: `1px solid ${hook.color}30` }}>
              <p style={{ color: hook.color, fontSize: 16, fontWeight: 700, marginBottom: 8, fontStyle: 'italic', margin: '0 0 8px 0' }}>
                {hook.text}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>
                {hook.context}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Do & Don't */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DO_DONT.map((section, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i === 0 ? -10 : 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-6 rounded-2xl"
            style={{
              background: `${section.color}12`,
              border: `1px solid ${section.color}30`,
            }}>
            <p style={{ color: section.color, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 12 }}>
              {section.label}
            </p>
            <div className="space-y-2">
              {section.items.map((item, j) => (
                <div key={j} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: section.color }} />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="p-8 rounded-2xl text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(139,92,246,0.12))',
          border: '1px solid rgba(168,85,247,0.25)',
        }}>
        <h3 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 24, marginBottom: 12 }}>
          El Call-to-Action definitivo
        </h3>
        <div className="mb-8 p-6 rounded-xl"
          style={{ background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.3)' }}>
          <p style={{ color: '#d8b4fe', fontSize: 18, fontWeight: 700, fontStyle: 'italic', margin: 0 }}>
            "Entiende si esto es para ti"
          </p>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7, maxWidth: 500, margin: '0 auto 20px' }}>
          No vender. No convencer. No presionar. Solo invitar a personas que genuinamente buscan algo diferente a explorar si encajan.
        </p>
        <button
          onClick={() => setShowContentGuide(!showContentGuide)}
          className="px-8 py-3 rounded-xl font-bold text-white transition-all flex items-center gap-2 mx-auto"
          style={{
            background: 'linear-gradient(135deg, #a855f7, #d946ef)',
            fontSize: 14,
            fontFamily: 'Montserrat,sans-serif',
          }}
          onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}>
          Ver guía de contenido <ArrowRight size={16} />
        </button>
      </motion.div>

      {/* Content Creation Guide */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showContentGuide ? 1 : 0 }}
        className="p-8 rounded-2xl"
        style={{
          background: 'rgba(13,31,60,0.8)',
          border: '1px solid rgba(59,130,246,0.2)',
          display: showContentGuide ? 'block' : 'none',
        }}>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
          GUÍA RÁPIDA
        </p>
        <h4 style={{ color: 'white', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
          Cómo crear un video que atraiga
        </h4>
        <div className="space-y-4">
          {[
            { step: 1, title: 'Hook fuerte', desc: 'Primeros 3 segundos: "Hay otra forma..." o pregunta provocadora' },
            { step: 2, title: 'Historia real', desc: 'Persona X decidió cambiar. Esto es lo que pasó.' },
            { step: 3, title: 'Sin dinero', desc: 'Habla de claridad, comunidad, herramientas. Nunca de dinero.' },
            { step: 4, title: 'Transformación visible', desc: 'Cómo cambió su mindset, confianza o decisiones.' },
            { step: 5, title: 'CTA sutil', desc: '"Si resonas con esto, entiende si es para ti. Link en bio."' },
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                style={{ background: '#3b82f6', color: 'white' }}>
                {item.step}
              </div>
              <div>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 700, marginBottom: 2, margin: '0 0 2px 0' }}>
                  {item.title}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="p-6 rounded-2xl"
        style={{ background: 'rgba(255,159,64,0.08)', border: '1px solid rgba(255,159,64,0.2)' }}>
        <div className="flex gap-4">
          <AlertCircle size={20} style={{ color: '#f97316', flexShrink: 0, marginTop: 2 }} />
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.7, margin: 0 }}>
            El tráfico es importante, pero la <strong>calidad del prospecto es todo</strong>. Personas atraídas por historias reales + propósito claro = conversión natural y retención real.
          </p>
        </div>
      </motion.div>
    </div>
  );
}