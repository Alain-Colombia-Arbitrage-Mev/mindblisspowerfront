import { TrendingUp, Users, Award, Target, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function GrowthLogic() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))', border: '1px solid rgba(16,185,129,0.25)' }}>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp size={24} style={{ color: '#10b981' }} />
          <p style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat,sans-serif', margin: 0 }}>
            LÓGICA DE CRECIMIENTO
          </p>
        </div>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 26, marginBottom: 8 }}>
          Cómo crece tu posición
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          El crecimiento en Vicion Power no se trata de invitar más personas. Se trata de desarrollar tu capacidad de liderazgo y guiar a otros hacia el éxito dentro de la estructura.
        </p>
      </motion.div>

      {/* Core Philosophy */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.8)', border: '2px solid rgba(59,130,246,0.25)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* What Growth IS NOT */}
          <div>
            <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>CRECE MEDIANTE</p>
            <div className="space-y-3">
              {[
                'Desarrollar tu capacidad de liderazgo',
                'Enseñar a otros cómo funciona el sistema',
                'Construir relaciones duraderas de confianza',
                'Guiar a tu equipo hacia sus objetivos',
                'Crear una estructura ordenada y coherente',
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ background: '#10b981', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{item}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* What Growth IS */}
          <div>
            <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>NO SE TRATA DE</p>
            <div className="space-y-3">
              {[
                'Invitar gente sin contexto',
                'Hacer promesas de dinero',
                'Presionar a personas a participar',
                'Buscar números sobre calidad',
                'Crecimiento rápido y desordenado',
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full mt-2" style={{ background: '#ef4444', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Pillar */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(249,115,22,0.08))', border: '1px solid rgba(251,146,60,0.3)' }}>
        <div className="flex gap-4">
          <div className="text-4xl flex-shrink-0">💡</div>
          <div>
            <p style={{ color: '#fb923c', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>EL PILAR DEL SISTEMA</p>
            <p style={{ color: 'white', fontSize: 16, fontWeight: 800, marginBottom: 8, lineHeight: 1.6 }}>
              El crecimiento depende de tu capacidad de guiar, no de invitar.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              Cualquiera puede pedir a alguien que se una. Pero construir un equipo que progresa, que entiende el sistema y que crece junto contigo — eso es liderazgo real. Eso es lo que te hace crecer dentro de Vicion Power.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Three Pillars of Growth */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
          LOS TRES PILARES
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Personal Development */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0 }}
            variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <BookOpen size={20} style={{ color: '#3b82f6' }} />
            </div>
            <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Desarrollo Personal</h3>
            <ul style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, margin: 0, paddingLeft: 0 }}>
              <li style={{ marginBottom: 6 }}>• Completar toda la formación</li>
              <li style={{ marginBottom: 6 }}>• Entender profundamente el sistema</li>
              <li>• Ser ejemplo dentro del ecosistema</li>
            </ul>
          </motion.div>

          {/* Leadership */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <Users size={20} style={{ color: '#10b981' }} />
            </div>
            <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Liderazgo</h3>
            <ul style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, margin: 0, paddingLeft: 0 }}>
              <li style={{ marginBottom: 6 }}>• Guiar a tu equipo con claridad</li>
              <li style={{ marginBottom: 6 }}>• Responder preguntas con honestidad</li>
              <li>• Acompañar el desarrollo de otros</li>
            </ul>
          </motion.div>

          {/* Structured Duplication */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
            variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(251,146,60,0.15)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)' }}>
              <Target size={20} style={{ color: '#fb923c' }} />
            </div>
            <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Duplicación Estructurada</h3>
            <ul style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7, margin: 0, paddingLeft: 0 }}>
              <li style={{ marginBottom: 6 }}>• Que tu equipo enseñe lo mismo</li>
              <li style={{ marginBottom: 6 }}>• Replicación de tu modelo</li>
              <li>• Crecimiento ordenado y duradero</li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Growth Timeline */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
          TU CAMINO DE CRECIMIENTO
        </p>
        <div className="space-y-4">
          {[
            { month: 'Mes 1-2', title: 'Aprender', desc: 'Completa la formación y entiende el sistema profundamente' },
            { month: 'Mes 2-3', title: 'Estructurar', desc: 'Invita a personas alineadas y comienza a construir tu equipo' },
            { month: 'Mes 3-6', title: 'Desarrollar', desc: 'Guía a tu equipo, enséñales, acompaña su crecimiento' },
            { month: 'Mes 6+', title: 'Expandir', desc: 'Tu estructura crece naturalmente porque otros replican lo que haces' },
          ].map((phase, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex gap-4 p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-lg font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)' }}>
                {phase.month}
              </div>
              <div className="flex-1">
                <p style={{ color: 'white', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{phase.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>{phase.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Difference Block */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.4 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(139,92,246,0.08))', border: '2px solid rgba(168,85,247,0.25)' }}>
        <p style={{ color: '#c084fc', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
          LA DIFERENCIA
        </p>
        <div className="space-y-4">
          {[
            { label: 'Mentalidad antigua', text: '"Necesito invitar 10 personas para crecer"' },
            { label: 'Mentalidad Vicion', text: '"Necesito guiar 2-3 personas para que repliquen lo que hago"' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-lg" style={{ background: i === 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: i === 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)' }}>
              <p style={{ color: i === 0 ? '#ef4444' : '#10b981', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{item.label}</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontStyle: 'italic', margin: 0 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }}
        variants={fadeUp} className="p-8 rounded-2xl text-center" style={{ background: 'rgba(13,31,60,0.8)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <h3 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 20, marginBottom: 12 }}>
          ¿Listo para crecer de verdad?
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
          El crecimiento no es velocidad. Es solidez. Construye bien desde el inicio y tu estructura se mantendrá.
        </p>
        <button
          style={{
            padding: '14px 28px',
            borderRadius: 10,
            background: 'linear-gradient(135deg,#1d6ef5,#3b82f6)',
            border: 'none',
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Montserrat,sans-serif',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >
          Ver tu roadmap de crecimiento <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
}