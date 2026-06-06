import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Users, TrendingUp, Briefcase, Loader } from 'lucide-react';
import TrustStrip from '@/components/TrustStrip';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const opciones = [
  {
    id: 'miembro',
    title: 'Acceder como miembro',
    desc: 'Quiero activar mi participación y acceder a los beneficios del sistema.',
    icon: Users,
    cta: 'Continuar como miembro',
  },
  {
    id: 'crecer',
    title: 'Crecer dentro del sistema',
    desc: 'Quiero formarme, construir estructura y avanzar dentro del ecosistema.',
    icon: TrendingUp,
    cta: 'Quiero crecer',
  },
  {
    id: 'estrategico',
    title: 'Participación estratégica',
    desc: 'Busco una posición más amplia con acompañamiento directo.',
    icon: Briefcase,
    cta: 'Solicitar evaluación',
  },
];

const steps = [
  { num: '1', title: 'Seleccionas tu nivel' },
  { num: '2', title: 'Validas tu acceso' },
  { num: '3', title: 'Activas tu participación' },
  { num: '4', title: 'El sistema verifica' },
  { num: '5', title: 'Accedes a tu panel' },
];

const trustPoints = [
  'No necesitas experiencia',
  'Puedes comenzar sin construir red',
  'El sistema funciona por etapas',
  'Tendrás acompañamiento',
];

export default function Participar() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('inicio');

  const handleSelect = async (id) => {
    setSelected(id);
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoading(false);
    setStep('confirmacion');
  };

  const handleContinue = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setLoading(false);
    setStep('planes');
  };

  return (
    <div className="overflow-hidden">

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&h=900&fit=crop"
            alt="Decisión clara de participación"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-vicion-deep/85 via-vicion-deep/70 to-vicion-deep/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-vicion-deep/30 to-vicion-deep/90" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.9 }}
            className="font-montserrat font-black text-5xl sm:text-6xl lg:text-7xl text-white mb-8 leading-tight">
            Todo empieza con una decisión clara
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.9, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/85 mb-12 leading-relaxed max-w-3xl mx-auto">
            Elige cómo quieres participar dentro del ecosistema.
          </motion.p>

          <motion.button 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.9, delay: 0.4 }}
          onClick={() => navigate('/onboarding/start')}
          className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/40">
          Comenzar ahora <ArrowRight size={18} />
          </motion.button>
        </div>
      </section>

      <TrustStrip />

      {/* ══ FILTRO INTELIGENTE ═════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }} 
            transition={{ duration: 0.7 }}
            variants={fadeUp}
            className="text-center mb-16">
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-4">
              ¿Cómo quieres comenzar?
            </h2>
            <p className="text-xl text-gray-600">
              Selecciona tu forma de participación
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {opciones.map((opcion, i) => (
              <motion.button
                key={opcion.id}
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true }} 
                transition={{ duration: 0.6, delay: i * 0.15 }}
                variants={fadeUp}
                onClick={() => handleSelect(opcion.id)}
                disabled={loading}
                className={`text-left p-8 rounded-2xl border-2 transition-all duration-300 ${
                  selected === opcion.id
                    ? 'border-vicion-blue bg-vicion-blue/10 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-vicion-blue/50'
                } ${loading ? 'opacity-50' : 'opacity-100'}`}>
                
                <div className="flex items-start justify-between mb-4">
                  <opcion.icon size={32} className="text-vicion-blue" />
                  {selected === opcion.id && !loading && (
                    <CheckCircle size={24} className="text-vicion-blue" />
                  )}
                  {selected === opcion.id && loading && (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                      <Loader size={24} className="text-vicion-blue" />
                    </motion.div>
                  )}
                </div>

                <h3 className="font-montserrat font-bold text-xl text-vicion-deep mb-2">
                  {opcion.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {opcion.desc}
                </p>

                {selected === opcion.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 pt-4 border-t border-vicion-blue/20">
                    <p className="text-vicion-blue text-sm font-semibold flex items-center gap-2">
                      Seleccionado <CheckCircle size={16} />
                    </p>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Botón de continuación */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center">
                <button
                  onClick={handleContinue}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/40 disabled:opacity-60"
                  onClick={() => { if (!loading) window.location.href = '/onboarding/start'; }}>
                  {loading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                        <Loader size={18} />
                      </motion.div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      Continuar <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ══ EXPLICACIÓN SIMPLE ═════════════════════════════════════════════════ */}
      {step !== 'planes' && (
        <section className="py-24 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true }} 
              transition={{ duration: 0.7 }}
              variants={fadeUp}
              className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep text-center mb-16">
              Qué ocurre después
            </motion.h2>

            {/* Timeline horizontal */}
            <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
              {steps.map((s, i) => (
                <motion.div 
                  key={i}
                  initial="hidden" 
                  whileInView="visible" 
                  viewport={{ once: true }} 
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  variants={fadeUp}
                  className="flex flex-col items-center flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-vicion-blue text-white flex items-center justify-center font-montserrat font-black text-lg mb-4 shadow-lg">
                    {s.num}
                  </div>
                  <p className="text-center text-sm font-semibold text-vicion-deep whitespace-nowrap">
                    {s.title}
                  </p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute left-[calc(50%+32px)] w-12 h-px bg-vicion-blue/30" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ CONFIANZA RÁPIDA ═══════════════════════════════════════════════════ */}
      {step !== 'planes' && (
        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2 
              initial="hidden" 
              whileInView="visible" 
              viewport={{ once: true }} 
              transition={{ duration: 0.7 }}
              variants={fadeUp}
              className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep text-center mb-12">
              Antes de continuar
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trustPoints.map((point, i) => (
                <motion.div 
                  key={i}
                  initial="hidden" 
                  whileInView="visible" 
                  viewport={{ once: true }} 
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  variants={fadeUp}
                  className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-vicion-blue/5 to-blue-500/5 border border-vicion-blue/20">
                  <CheckCircle size={24} className="text-vicion-blue flex-shrink-0 mt-0.5" />
                  <p className="text-lg font-semibold text-vicion-deep">{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ CTA A PLANES ═══════════════════════════════════════════════════════ */}
      {step === 'planes' && (
        <section className="py-32 bg-vicion-deep text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl mb-6">
              Ahora elige tu nivel de participación
            </h2>
            <p className="text-xl text-white/70 mb-10">
              Basado en tu selección, te recomendamos explorar los niveles que mejor se adapten a tu plan.
            </p>
            <Link to="/onboarding/start"
              className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/40 text-lg">
              Ver niveles disponibles <ArrowRight size={20} />
            </Link>
            <p className="text-white/50 text-sm mt-8">
              Cada nivel te brinda acceso diferente. Selecciona según tus objetivos.
            </p>
          </motion.div>
        </section>
      )}
    </div>
  );
}