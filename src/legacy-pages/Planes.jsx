import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, TrendingUp, Shield, Clock, Zap } from 'lucide-react';

const SectionCTA = () => (
  <section className="py-24 bg-gradient-to-r from-vicion-blue/5 to-blue-500/5 border-y border-vicion-blue/20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.h3 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
        variants={{ hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } }} className="font-montserrat font-black text-3xl sm:text-4xl text-vicion-deep mb-6">
        Entiendes la estructura. Ahora activa tu participación.
      </motion.h3>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
        variants={{ hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={() => window.location.href='/onboarding/start'} className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30 border-none cursor-pointer">Acceder a Vicion Care Plan <ArrowRight size={18} /></button>
        <Link to="/care-plan" className="inline-flex items-center justify-center gap-2 border-2 border-vicion-blue/40 text-vicion-blue hover:bg-vicion-blue/10 font-semibold font-montserrat px-8 py-4 rounded-xl transition-all duration-200">Explorar beneficios <ArrowRight size={18} /></Link>
      </motion.div>
    </div>
  </section>
);

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const CTA_SECTION = () => (
  <section className="py-24 bg-gradient-to-r from-vicion-blue/5 to-blue-500/5 border-y border-vicion-blue/20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.h3 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
        variants={fadeUp} className="font-montserrat font-black text-3xl sm:text-4xl text-vicion-deep mb-6">
        Entiendes la estructura. Ahora activa tu participación.
      </motion.h3>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
        variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={() => window.location.href='/onboarding/start'}
          className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30 border-none cursor-pointer">
          Acceder a Vicion Care Plan <ArrowRight size={18} />
        </button>
        <Link to="/care-plan"
          className="inline-flex items-center justify-center gap-2 border-2 border-vicion-blue/40 text-vicion-blue hover:bg-vicion-blue/10 font-semibold font-montserrat px-8 py-4 rounded-xl transition-all duration-200">
          Explorar beneficios <ArrowRight size={18} />
        </Link>
      </motion.div>
    </div>
  </section>
);

const planes = [
  {
    name: 'Start',
    price: '$500',
    description: 'Acceso inicial al ecosistema',
    forYou: ['Quieres empezar', 'Entender el sistema', 'Acceso a beneficios básicos'],
    activates: ['Acceso al sistema', 'Beneficios iniciales', 'Posición entrada', 'Posibilidad de evolución'],
    evolves: ['Acceso inicial', 'Beneficios en el tiempo', 'Desbloqueo progresivo'],
  },
  {
    name: 'Growth',
    price: '$1,000',
    description: 'Participación ampliada',
    forYou: ['Quieres más acceso', 'Entender oportunidades', 'Beneficios expandidos'],
    activates: ['Acceso ampliado', 'Beneficios intermedios', 'Mayor posición', 'Capacidad de estructura'],
    evolves: ['Acceso expandido', 'Beneficios progresivos', 'Desbloqueos intermedios'],
  },
  {
    name: 'Advance',
    price: '$2,500',
    description: 'Acceso profesional',
    forYou: ['Quieres crecer realmente', 'Construir estructura', 'Beneficios avanzados'],
    activates: ['Acceso profesional', 'Beneficios avanzados', 'Posición estratégica', 'Oportunidades de liderazgo'],
    evolves: ['Acceso progresivo', 'Beneficios continuos', 'Desbloqueos estratégicos'],
  },
  {
    name: 'Pro',
    price: '$5,000 / $10,000',
    description: 'Participación premium',
    forYou: ['Quieres posición fuerte', 'Construir en serio', 'Beneficios premium'],
    activates: ['Acceso premium', 'Beneficios premium', 'Posición superior', 'Oportunidades amplias'],
    evolves: ['Acceso amplio', 'Beneficios premium', 'Desbloqueos continuos'],
  },
  {
    name: 'Elite',
    price: '$25,000',
    description: 'Participación de máximo nivel',
    forYou: ['Quieres máxima posición', 'Liderazgo completo', 'Beneficios máximos'],
    activates: ['Acceso máximo', 'Beneficios elite', 'Posición top', 'Acceso a oportunidades exclusivas'],
    evolves: ['Acceso completo', 'Beneficios máximos', 'Desbloqueos ilimitados'],
  },
];

export default function Planes() {
  const navigate = useNavigate();
  const [selectedPath, setSelectedPath] = useState(null);
  const [simLevel, setSimLevel] = useState('Growth');
  const [simTime, setSimTime] = useState(24);

  return (
    <div className="overflow-hidden">

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&h=900&fit=crop"
            alt="Decisión de participación"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-950/85 via-amber-900/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-900/30 to-vicion-deep/90" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
            className="font-montserrat font-black text-5xl sm:text-6xl lg:text-7xl text-white mb-8 leading-tight">
            No se trata solo de cuánto eliges. Se trata de cómo participas.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/85 mb-12 leading-relaxed max-w-3xl mx-auto">
            Cada nivel define tu acceso, tu posición y tu proyección dentro del ecosistema.
          </motion.p>

          <motion.button 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.9, delay: 0.4 }}
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/40">
            Simular antes de decidir <ArrowRight size={18} />
          </motion.button>
        </div>
      </section>

      {/* ══ BLOQUE 1: EDUCACIÓN ════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="text-center mb-16">
            <h2 className="font-montserrat font-black text-4xl text-vicion-deep mb-4">
              Antes de elegir, entiende esto
            </h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="p-8 bg-vicion-deep/5 border border-vicion-blue/20 rounded-2xl mb-16">
            <p className="text-lg text-gray-700 leading-relaxed">
              Cada nivel de participación no es un producto aislado. Es una forma de acceso al sistema.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'Acceso', desc: 'Tu entrada al ecosistema' },
              { icon: Clock, title: 'Continuidad', desc: 'Lo que construyes permanece' },
              { icon: TrendingUp, title: 'Proyección', desc: 'Tu evolución en el tiempo' },
            ].map((pilar, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }} variants={fadeUp}
                className="p-6 rounded-2xl bg-gradient-to-br from-vicion-blue/10 to-blue-500/5 border border-vicion-blue/20">
                <pilar.icon size={32} className="text-vicion-blue mb-4" />
                <h3 className="font-bold text-lg text-vicion-deep mb-2">{pilar.title}</h3>
                <p className="text-gray-600">{pilar.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionCTA />

      {/* ══ BLOQUE 2: PLANES ════════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="text-center mb-16">
            <h2 className="font-montserrat font-black text-4xl text-vicion-deep mb-4">
              Niveles de participación
            </h2>
            <p className="text-xl text-gray-600">
              Desde $500 USD hasta $25,000 USD
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {planes.map((plan, i) => (
              <motion.div key={plan.name} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }} variants={fadeUp}
                className="rounded-2xl p-6 flex flex-col border border-vicion-blue/20 hover:border-vicion-blue/50 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, rgba(29,110,245,0.08) 0%, rgba(59,130,246,0.03) 100%)' }}>

                <h3 className="font-montserrat font-black text-2xl text-vicion-blue mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold text-vicion-deep mb-1">{plan.price}</p>
                <p className="text-sm text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-6 pb-6 border-b border-gray-200">
                  <p className="font-semibold text-xs uppercase text-gray-500 mb-3">Este nivel es para ti si</p>
                  <ul className="space-y-2">
                    {plan.forYou.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle size={14} className="text-vicion-blue flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6 pb-6 border-b border-gray-200 flex-1">
                  <p className="font-semibold text-xs uppercase text-gray-500 mb-3">Lo que activas</p>
                  <ul className="space-y-2">
                    {plan.activates.map((item, j) => (
                      <li key={j} className="text-sm text-gray-700">• {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <p className="font-semibold text-xs uppercase text-gray-500 mb-3">Cómo evoluciona</p>
                  <ul className="space-y-1">
                    {plan.evolves.map((item, j) => (
                      <li key={j} className="text-xs text-gray-600">→ {item}</li>
                    ))}
                  </ul>
                </div>

                <button onClick={() => navigate('/onboarding/start')}
                  className="w-full bg-vicion-blue hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-center transition-all duration-200 text-sm cursor-pointer border-none">
                  Activar este nivel
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BLOQUE 3: SIMULACIÓN INLINE ════════════════════════ */}
      <section className="py-24 bg-vicion-deep text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl text-center mb-12">
            Visualiza tu escenario antes de activar
          </motion.h2>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="p-8 rounded-2xl bg-white/5 border border-white/10 space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-3">Nivel de participación</label>
                <select value={simLevel} onChange={(e) => setSimLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400">
                  {planes.map(p => (
                    <option key={p.name} value={p.name} className="bg-vicion-deep">{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3">Proyección (meses): {simTime}</label>
                <input type="range" min="1" max="60" value={simTime} onChange={(e) => setSimTime(e.target.value)}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
              <div>
                <p className="text-white/60 text-sm mb-2">Acceso estimado</p>
                <p className="text-2xl font-bold text-blue-400">Progresivo</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-2">Beneficios desbloqueables</p>
                <p className="text-2xl font-bold text-blue-400">{Math.ceil(simTime / 12)} niveles</p>
              </div>
              <div>
                <p className="text-white/60 text-sm mb-2">Evolución en el tiempo</p>
                <p className="text-2xl font-bold text-blue-400">Continua</p>
              </div>
            </div>

            <button onClick={() => navigate('/onboarding/start')}
              className="block w-full bg-vicion-blue hover:bg-blue-500 text-white text-center font-bold py-3 rounded-xl transition-all duration-200 cursor-pointer border-none">
              Comenzar ahora
            </button>
          </motion.div>
        </div>
      </section>

      {/* ══ BLOQUE 4: CIERRE ═════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl text-vicion-deep mb-10">
            Ahora puedes decidir con claridad
          </motion.h2>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
            variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/onboarding/start')}
              className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 border-none cursor-pointer">
              Comenzar ahora <ArrowRight size={18} />
            </button>
            <button onClick={() => navigate('/onboarding/start')}
              className="inline-flex items-center justify-center gap-2 border border-vicion-blue/50 text-vicion-blue hover:bg-vicion-blue/10 font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 cursor-pointer bg-transparent">
              Activar participación <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}