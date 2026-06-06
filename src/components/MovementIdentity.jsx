import { motion } from 'framer-motion';
import { Users, Heart, Globe, Zap } from 'lucide-react';
import { MOVEMENT_TERMS, MOVEMENT_MESSAGING } from '@/lib/movementLanguage';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function MovementIdentity() {
  return (
    <div className="max-w-6xl mx-auto space-y-20 py-24 px-4">
      {/* Hero - Core Message */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center space-y-6"
      >
        <h1 style={{
          color: '#0F1419',
          fontSize: 48,
          fontWeight: 900,
          margin: '0 0 12px 0',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.2
        }}>
          {MOVEMENT_TERMS.tagline}
        </h1>
        
        <p style={{
          color: '#1e40af',
          fontSize: 20,
          fontWeight: 700,
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: 0.5
        }}>
          {MOVEMENT_TERMS.globalPhrase}
        </p>

        <p style={{
          color: '#4b5563',
          fontSize: 16,
          lineHeight: 1.7,
          margin: 0,
          maxWidth: 600,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Vicion Power no es un negocio tradicional. Es un movimiento global de {MOVEMENT_TERMS.participants} que construyen {MOVEMENT_TERMS.teamStructure} auténticas y generan valor juntos.
        </p>
      </motion.section>

      {/* Three Pillars of Identity */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
      >
        {[
          {
            icon: Users,
            title: 'Somos una Comunidad',
            points: [
              'Cada participante es valioso',
              'Tu voz importa en decisiones',
              'Crecemos juntos o no crecemos',
              'Sin jerarquía artificial'
            ]
          },
          {
            icon: Heart,
            title: 'Construimos Relaciones Reales',
            points: [
              'Conexiones auténticas, no transacciones',
              'Apoyo genuino entre miembros',
              'Transparencia total siempre',
              'Comunidad antes que profit'
            ]
          },
          {
            icon: Globe,
            title: 'Pensamos Global',
            points: [
              'Movimiento en 24+ países',
              'Respeto por culturas locales',
              'Sistema equitativo para todos',
              'Una red, múltiples expresiones'
            ]
          }
        ].map((pillar, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-16 border"
            style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
          >
            <pillar.icon size={32} style={{ color: '#1e40af', marginBottom: 16 }} />
            <h2 style={{
              color: '#0F1419',
              fontSize: 18,
              fontWeight: 700,
              margin: '0 0 16px 0'
            }}>
              {pillar.title}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, space: '4' }}>
              {pillar.points.map((point, j) => (
                <li key={j} style={{
                  color: '#4b5563',
                  fontSize: 13,
                  margin: '0 0 12px 0',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start'
                }}>
                  <span style={{
                    color: '#10b981',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 2
                  }}>✓</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.section>

      {/* Language Shift Explanation */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="p-12 rounded-16"
        style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
      >
        <h2 style={{
          color: '#0F1419',
          fontSize: 24,
          fontWeight: 900,
          margin: '0 0 16px 0'
        }}>
          Nuestro Lenguaje Define Nuestra Identidad
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          {[
            {
              old: 'usuario',
              new: 'participante',
              why: 'Reconoce agencia, no pasividad. Participas activamente en el movimiento.'
            },
            {
              old: 'cliente',
              new: 'miembro',
              why: 'Pertenencia y comunidad. No eres vendido, eres parte de nosotros.'
            },
            {
              old: 'referido',
              new: 'parte del sistema',
              why: 'Reconoce que todos estamos conectados en una estructura mayor.'
            }
          ].map((shift, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-12 border"
              style={{ background: '#FFFFFF', border: '1px solid #e5e7eb' }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <span style={{
                  color: '#9ca3af',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'line-through'
                }}>
                  {shift.old}
                </span>
                <span style={{ color: '#e5e7eb', fontSize: 12 }}>→</span>
                <span style={{
                  color: '#10b981',
                  fontSize: 12,
                  fontWeight: 700,
                  background: '#d1fae5',
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  {shift.new}
                </span>
              </div>
              <p style={{
                color: '#4b5563',
                fontSize: 12,
                lineHeight: 1.6,
                margin: 0
              }}>
                {shift.why}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* What This Means */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="space-y-8"
      >
        <h2 style={{
          color: '#0F1419',
          fontSize: 28,
          fontWeight: 900,
          margin: '0 0 12px 0'
        }}>
          Qué significa para ti
        </h2>

        <div className="space-y-4">
          {[
            {
              icon: '🎯',
              title: 'Participas, no consumes',
              desc: 'Tu rol activo es central. No eres un espectador.'
            },
            {
              icon: '🤝',
              title: 'Perteneces a una comunidad',
              desc: 'No es una transacción. Es una relación de largo plazo.'
            },
            {
              icon: '🌍',
              title: 'Eres parte de algo mayor',
              desc: 'Tu acción contribuye a un movimiento global.'
            },
            {
              icon: '💪',
              title: 'Tu voz importa',
              desc: 'Decidimos juntos, no desde arriba hacia abajo.'
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-12 flex gap-4"
              style={{ background: '#FFFFFF', border: '1px solid #e5e7eb' }}
            >
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <h3 style={{
                  color: '#0F1419',
                  fontSize: 14,
                  fontWeight: 700,
                  margin: '0 0 4px 0'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  color: '#4b5563',
                  fontSize: 12,
                  margin: 0,
                  lineHeight: 1.6
                }}>
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center p-12 rounded-16"
        style={{ background: '#1e40af' }}
      >
        <h2 style={{
          color: '#FFFFFF',
          fontSize: 28,
          fontWeight: 900,
          margin: '0 0 12px 0'
        }}>
          {MOVEMENT_TERMS.globalPhrase}
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: 15,
          lineHeight: 1.6,
          margin: '0 0 24px 0',
          maxWidth: 500,
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          No es un giro de marketing. Es un cambio fundamental en cómo vemos esta comunidad. Cada palabra cuenta.
        </p>
        <button style={{
          padding: '14px 32px',
          background: '#FFFFFF',
          color: '#1e40af',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'Inter, sans-serif'
        }}
          onMouseEnter={e => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 16px rgba(30, 64, 175, 0.2)';
          }}
          onMouseLeave={e => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Únete al Movimiento
        </button>
      </motion.div>
    </div>
  );
}