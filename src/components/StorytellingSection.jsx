import { motion } from 'framer-motion';
import { Lightbulb, Users, TrendingUp, Heart } from 'lucide-react';

const STORY_STEPS = [
  {
    icon: Lightbulb,
    title: 'El principio',
    desc: 'Empezó como una pregunta: ¿existe una forma diferente de avanzar?',
    color: '#3b82f6',
  },
  {
    icon: Users,
    title: 'La comunidad',
    desc: 'Personas como tú buscaban orden, claridad y un camino real.',
    color: '#10b981',
  },
  {
    icon: TrendingUp,
    title: 'La estructura',
    desc: 'Se construyó un sistema donde el crecimiento es ordenado y sostenible.',
    color: '#f59e0b',
  },
  {
    icon: Heart,
    title: 'Ahora',
    desc: 'Cientos encuentran en Vicion lo que antes era imposible: claridad sin promesas falsas.',
    color: '#ec4899',
  },
];

export default function StorytellingSection() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16 text-center"
      >
        <p style={{
          color: '#3b82f6',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2,
          margin: '0 0 12px 0',
          fontFamily: 'Montserrat, sans-serif',
        }}>
          NUESTRO CAMINO
        </p>
        <h2 style={{
          color: 'white',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 900,
          fontSize: 28,
          margin: '0 0 12px 0',
        }}>
          Cómo llegamos hasta aquí
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 15,
          lineHeight: 1.7,
          margin: 0,
        }}>
          No es un accidente. Es el resultado de escuchar, aprender y construir responsablemente.
        </p>
      </motion.div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5"
          style={{
            background: 'linear-gradient(180deg, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0.1) 100%)',
            transform: 'translateX(-50%)',
          }}
        />

        {/* Steps */}
        <div className="space-y-12 md:space-y-16">
          {STORY_STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ delay: i * 0.1 }}
              className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}
            >
              {/* Content */}
              <div className="flex-1">
                <div className="p-6 rounded-2xl"
                  style={{
                    background: `${step.color}12`,
                    border: `1px solid ${step.color}30`,
                  }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 8,
                    margin: '0 0 8px 0',
                  }}>
                    {step.title}
                  </h3>
                  <p style={{
                    color: 'rgba(255,255,255,0.65)',
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin: 0,
                  }}>
                    {step.desc}
                  </p>
                </div>
              </div>

              {/* Icon circle */}
              <div className="flex-shrink-0 md:flex-shrink-0">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: step.color,
                    color: '#0a1628',
                    zIndex: 10,
                  }}
                >
                  <step.icon size={28} />
                </motion.div>
              </div>

              {/* Spacer */}
              <div className="flex-1 hidden md:block" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Closing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mt-16 p-8 rounded-2xl text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.08))',
          border: '1px solid rgba(59,130,246,0.2)',
        }}
      >
        <h3 style={{
          color: 'white',
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 12,
          margin: '0 0 12px 0',
        }}>
          Y ahora te invitamos a formar parte
        </h3>
        <p style={{
          color: 'rgba(255,255,255,0.65)',
          fontSize: 14,
          lineHeight: 1.7,
          margin: 0,
        }}>
          No es un evento puntual. Es el comienzo de algo que construimos juntos, donde cada persona suma.
        </p>
      </motion.div>
    </div>
  );
}