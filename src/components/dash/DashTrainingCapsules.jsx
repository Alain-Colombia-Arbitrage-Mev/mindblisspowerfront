import { useState } from 'react';
import { Play, Clock, Users, Presentation, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

const CAPSULES = [
  {
    id: 1,
    category: 'how-to-speak',
    title: 'Cómo hablar del sistema',
    duration: '45s',
    description: 'Los 5 puntos clave que debes mencionar cuando expliques Vicion a alguien nuevo.',
    icon: Users,
    color: '#3b82f6',
    highlights: ['Claridad', 'Sin presión', 'Honestidad'],
  },
  {
    id: 2,
    category: 'how-to-speak',
    title: 'Cómo responder "¿Es seguro?"',
    duration: '38s',
    description: 'La respuesta que tranquiliza sin prometer lo imposible.',
    icon: Users,
    color: '#3b82f6',
    highlights: ['Confianza', 'Transparencia'],
  },
  {
    id: 3,
    category: 'how-to-speak',
    title: 'Cómo cerrar sin presionar',
    duration: '52s',
    description: 'Técnica de cierre que respeta la decisión del otro.',
    icon: Users,
    color: '#3b82f6',
    highlights: ['Respeto', 'Conversación natural'],
  },
  {
    id: 4,
    category: 'how-to-present',
    title: 'Presentación: Estructura binaria',
    duration: '55s',
    description: 'Cómo visualizar y explicar el árbol de red en 1 minuto.',
    icon: Presentation,
    color: '#10b981',
    highlights: ['Visual', 'Estructurado'],
  },
  {
    id: 5,
    category: 'how-to-present',
    title: 'Presentación: Los 3 niveles',
    duration: '48s',
    description: 'De Member a Director: qué cambia en cada nivel.',
    icon: Presentation,
    color: '#10b981',
    highlights: ['Progresión', 'Beneficios claros'],
  },
  {
    id: 6,
    category: 'how-to-present',
    title: 'Presentación: ROI sin números',
    duration: '41s',
    description: 'Cómo hablar de retorno sin prometer cantidades.',
    icon: Presentation,
    color: '#10b981',
    highlights: ['Honesto', 'Atractivo'],
  },
  {
    id: 7,
    category: 'how-to-guide',
    title: 'Guía: Primer encuentro',
    duration: '50s',
    description: 'Los pasos para convertir curiosidad en compromiso.',
    icon: Navigation,
    color: '#a855f7',
    highlights: ['Proceso claro', 'Apoyo cercano'],
  },
  {
    id: 8,
    category: 'how-to-guide',
    title: 'Guía: Superar objeciones',
    duration: '57s',
    description: 'Cómo responder sin convencer forzadamente.',
    icon: Navigation,
    color: '#a855f7',
    highlights: ['Escucha activa', 'Respuestas reales'],
  },
  {
    id: 9,
    category: 'how-to-guide',
    title: 'Guía: Acompañamiento inicial',
    duration: '46s',
    description: 'Qué hacer en los primeros 30 días de un nuevo miembro.',
    icon: Navigation,
    color: '#a855f7',
    highlights: ['Formación', 'Retención'],
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Todas', icon: null },
  { id: 'how-to-speak', label: 'Cómo hablar', icon: Users },
  { id: 'how-to-present', label: 'Cómo presentar', icon: Presentation },
  { id: 'how-to-guide', label: 'Cómo guiar', icon: Navigation },
];

export default function DashTrainingCapsules() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all' 
    ? CAPSULES 
    : CAPSULES.filter(c => c.category === activeCategory);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="p-8 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Play size={24} style={{ color: '#3b82f6' }} />
          <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat,sans-serif', margin: 0 }}>
            CÁPSULAS DE FORMACIÓN
          </p>
        </div>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 26, marginBottom: 8 }}>
          Videos de aprendizaje rápido
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          30–60 segundos de contenido directo. Cómo hablar, presentar y guiar sin complicaciones.
        </p>
      </motion.div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all"
              style={{
                background: activeCategory === cat.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.03)',
                border: activeCategory === cat.id ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                color: activeCategory === cat.id ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                fontSize: 13,
                fontWeight: activeCategory === cat.id ? 600 : 400,
              }}>
              {Icon && <Icon size={16} />}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((capsule, i) => {
          const CapsuleIcon = capsule.icon;
          return (
            <motion.div
              key={capsule.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl overflow-hidden cursor-pointer group transition-all hover:scale-105"
              style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>

              {/* Video Thumbnail */}
              <div className="relative h-40 overflow-hidden"
                style={{ background: `${capsule.color}15` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ background: `${capsule.color}25`, border: `2px solid ${capsule.color}50` }}>
                    <Play size={28} style={{ color: capsule.color, marginLeft: 2 }} />
                  </div>
                </div>
                {/* Duration Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-lg"
                  style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${capsule.color}30` }}>
                  <Clock size={12} style={{ color: capsule.color }} />
                  <span style={{ color: capsule.color, fontSize: 11, fontWeight: 600 }}>{capsule.duration}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${capsule.color}15`, border: `1px solid ${capsule.color}30` }}>
                    <CapsuleIcon size={18} style={{ color: capsule.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 2px 0' }}>
                      {capsule.title}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
                      {capsule.category === 'how-to-speak' && 'Comunicación'}
                      {capsule.category === 'how-to-present' && 'Presentación'}
                      {capsule.category === 'how-to-guide' && 'Liderazgo'}
                    </p>
                  </div>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>
                  {capsule.description}
                </p>

                {/* Highlights */}
                <div className="flex flex-wrap gap-2">
                  {capsule.highlights.map((h, i) => (
                    <span key={i}
                      style={{
                        background: `${capsule.color}15`,
                        border: `1px solid ${capsule.color}30`,
                        color: capsule.color,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 4,
                      }}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Watch Button */}
              <div className="px-6 pb-6">
                <button
                  className="w-full px-4 py-2.5 rounded-xl font-semibold transition-all"
                  style={{
                    background: `${capsule.color}20`,
                    border: `1px solid ${capsule.color}40`,
                    color: capsule.color,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = `${capsule.color}30`;
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = `${capsule.color}20`;
                  }}>
                  Ver video →
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Learning Path Block */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.08))', border: '1px solid rgba(16,185,129,0.25)' }}>
        <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
          RUTA DE APRENDIZAJE RECOMENDADA
        </p>
        <div className="space-y-4">
          {[
            { step: 1, title: 'Entiende cómo hablar', desc: 'Ve los 3 videos sobre comunicación y prueba los tonos.' },
            { step: 2, title: 'Aprende a presentar', desc: 'Domina la estructura y los 3 niveles en tu explicación.' },
            { step: 3, title: 'Guía con confianza', desc: 'Practica el acompañamiento inicial y la manejo de objeciones.' },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                style={{ background: '#10b981', color: 'white' }}>
                {item.step}
              </div>
              <div>
                <p style={{ color: 'white', fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{item.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { num: 9, label: 'Cápsulas disponibles' },
          { num: '30-60s', label: 'Duración promedio' },
          { num: '100%', label: 'Contenido honesto' },
        ].map((stat, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl text-center"
            style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <p style={{ color: '#3b82f6', fontSize: 24, fontWeight: 900, fontFamily: 'Montserrat,sans-serif', margin: '0 0 4px 0' }}>
              {stat.num}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}