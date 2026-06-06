import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Zap } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const planes = [
  {
    price: '$500',
    access: 'Acceso entrada',
    level: 'Participante base',
    benefits: ['Acceso al ecosistema', 'Comunidad', 'Herramientas básicas']
  },
  {
    price: '$1,000',
    access: 'Acceso expandido',
    level: 'Participante activo',
    benefits: ['Acceso completo', 'Comunidad premium', 'Herramientas avanzadas']
  },
  {
    price: '$2,500',
    access: 'Acceso profesional',
    level: 'Profesional',
    benefits: ['Todas las herramientas', 'Mentoría', 'Capacitación especializada']
  },
  {
    price: '$5,000',
    access: 'Acceso estratégico',
    level: 'Líder emergente',
    benefits: ['Acceso estratégico', 'Programa de liderazgo', 'Oportunidades de estructura']
  },
  {
    price: '$10,000',
    access: 'Acceso avanzado',
    level: 'Líder senior',
    benefits: ['Beneficios estratégicos', 'Red de líderes', 'Visibilidad institucional']
  },
  {
    price: '$25,000',
    access: 'Acceso máximo',
    level: 'Líder elite',
    benefits: ['Máxima posición', 'Acceso ejecutivo', 'Oportunidades exclusivas']
  },
];

export default function SeleccionarNivel() {
  return (
    <div className="overflow-hidden">

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&h=900&fit=crop"
            alt="Elige tu nivel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-vicion-deep/95 via-vicion-deep/85 to-vicion-deep/70" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-vicion-deep/40 to-vicion-deep/95" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
            className="font-montserrat font-black text-5xl sm:text-6xl lg:text-7xl text-white mb-8 leading-tight">
            Elige tu nivel de participación
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/85 mb-12 leading-relaxed max-w-3xl mx-auto">
            Cada nivel define tu acceso, tu posición y tu proyección dentro del ecosistema.
          </motion.p>
        </div>
      </section>

      {/* ══ PLANES GRID ═════════════════════════════════════════ */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planes.map((plan, i) => (
              <motion.div key={plan.price} 
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06 }} variants={fadeUp}
                className="rounded-2xl p-8 flex flex-col border border-vicion-blue/20 hover:border-vicion-blue/50 transition-all duration-300 bg-white shadow-sm hover:shadow-xl">

                {/* Precio */}
                <div className="mb-8">
                  <p className="text-4xl font-black text-vicion-blue font-montserrat">{plan.price}</p>
                </div>

                {/* Acceso */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-xs uppercase font-bold text-gray-500 mb-2">Acceso</p>
                  <p className="text-lg font-semibold text-vicion-deep">{plan.access}</p>
                </div>

                {/* Nivel */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="text-xs uppercase font-bold text-gray-500 mb-2">Nivel</p>
                  <p className="text-lg font-semibold text-vicion-deep">{plan.level}</p>
                </div>

                {/* Beneficios */}
                <div className="mb-8 flex-1">
                  <p className="text-xs uppercase font-bold text-gray-500 mb-4">Beneficios desbloqueados</p>
                  <ul className="space-y-3">
                    {plan.benefits.map((benefit, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle size={16} className="text-vicion-blue flex-shrink-0 mt-0.5" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <Link to="/participar"
                  className="w-full bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat py-3 rounded-xl text-center transition-all duration-200 flex items-center justify-center gap-2">
                  Continuar proceso <ArrowRight size={16} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ INFORMACIÓN ═════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg,rgba(29,110,245,0.08) 0%,rgba(59,130,246,0.03) 100%)', border: '1px solid rgba(29,110,245,0.25)' }}>
            
            <div className="flex items-start gap-4 mb-6">
              <Zap size={28} className="text-vicion-blue flex-shrink-0" />
              <div>
                <h3 className="font-montserrat font-bold text-xl text-vicion-deep mb-3">Cómo funciona</h3>
                <p className="text-gray-700 text-base leading-relaxed mb-4">
                  Selecciona el nivel que se alinee con tu capacidad e intención de participación. Cada nivel ofrece acceso progresivo a beneficios, herramientas y oportunidades dentro del ecosistema.
                </p>
                <p className="text-gray-700 text-base leading-relaxed">
                  Tu posición define tu capacidad de acceder a recursos, mentoría, y oportunidades de estructura dentro de la comunidad.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                El proceso de registro incluye verificación de identidad, onboarding y aceptación de contrato. Durará entre 10-30 minutos.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ CIERRE ══════════════════════════════════════════════ */}
      <section className="py-24 bg-vicion-deep text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl sm:text-5xl mb-8">
            ¿Dudas sobre qué nivel elegir?
          </motion.h2>

          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="text-lg text-white/75 mb-12 leading-relaxed">
            Contáctanos o explora más sobre cómo funciona el ecosistema antes de decidir.
          </motion.p>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
            variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/care-plan"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white hover:bg-white/15 font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200">
              Explorar beneficios <ArrowRight size={18} />
            </Link>
            <Link to="/participar"
              className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30">
              Seleccionar nivel <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}