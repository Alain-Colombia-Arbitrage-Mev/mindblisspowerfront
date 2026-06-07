import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, TrendingUp, Zap, Globe, Shield, Users, Lock, CheckCircle, Award } from 'lucide-react';
import TrustStrip from '@/components/TrustStrip';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function CarePlan() {
  const [legalConfirmed, setLegalConfirmed] = useState(false);
  return (
    <div className="overflow-hidden">

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1600&h=900&fit=crop"
            alt="Pareja mayor con estabilidad"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-amber-950/90 via-amber-900/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-900/30 to-vicion-deep/95" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
            className="font-montserrat font-black text-5xl sm:text-6xl lg:text-7xl text-white mb-8 leading-tight">
            La estabilidad no se improvisa. Se construye.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/85 mb-12 leading-relaxed max-w-3xl mx-auto">
            Vicion Care Plan es una estructura diseñada para transformar tu participación en acceso real a beneficios dentro del tiempo.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/onboarding/start"
              className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/40">
              Comenzar ahora <ArrowRight size={18} />
            </Link>
            <Link to="/faq"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white hover:bg-white/15 font-semibold font-montserrat px-8 py-4 rounded-xl transition-all duration-200">
              Entender cómo funciona <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      <TrustStrip />

      {/* ══ CÓMO ACCEDER ════════════════════════════════════════ */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="text-center mb-20">
            <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-3">Proceso Sencillo</p>
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep">Cómo acceder a Vicion Care Plan</h2>
          </motion.div>

          <div className="space-y-6">
            {[
              { num: 1, title: 'Elige tu plan', desc: 'Selecciona el nivel de participación que se ajusta a tu visión.' },
              { num: 2, title: 'Completa el registro', desc: 'Proporciona información básica y acepta los términos.' },
              { num: 3, title: 'Realiza tu inversión', desc: 'Procesa el pago de forma segura a través de nuestra plataforma.' },
              { num: 4, title: 'Accede al ecosistema', desc: 'Obtén acceso inmediato a herramientas, capacitación y comunidad.' },
              { num: 5, title: 'Comienza a crecer', desc: 'Participa en ciclos, desarrolla tu red y accede a beneficios progresivos.' }
            ].map((step) => (
              <motion.div key={step.num} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.5 }} variants={fadeUp}
                className="flex gap-6 p-6 rounded-xl bg-white border border-gray-200 hover:border-vicion-blue/30 hover:shadow-lg transition-all duration-300">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-vicion-blue to-blue-500 flex items-center justify-center">
                  <span className="text-white font-montserrat font-black text-lg">{step.num}</span>
                </div>
                <div>
                  <h3 className="font-montserrat font-bold text-lg text-vicion-deep mb-1">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}
            variants={fadeUp} className="mt-16 text-center">
            <Link to="/onboarding/start"
              className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-blue-600/30">
              Comenzar tu participación <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ BLOQUE 1: QUÉ ES ════════════════════════════════════ */}
      <section className="py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-20 text-center">
            ¿Qué es Vicion Care Plan?
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
              variants={fadeUp} className="rounded-2xl overflow-hidden h-80 bg-gradient-to-br from-vicion-blue/20 to-blue-500/10 shadow-lg hover:shadow-2xl transition-all duration-300">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
                alt="Estructura Vicion Care Plan"
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
              variants={fadeUp} className="space-y-8">
              <p className="text-lg text-gray-700 leading-relaxed">
                Vicion Care Plan es la propuesta central del ecosistema Mindbliss Power.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Está concebido para quienes buscan una participación más clara, más estable y más sostenida dentro de un entorno con visión de largo plazo.
              </p>
              <div className="space-y-3">
                {['Acceso estructurado', 'Beneficios progresivos', 'Continuidad en el tiempo'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle size={24} className="text-vicion-blue flex-shrink-0" />
                    <span className="text-gray-700 font-semibold text-lg">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ BLOQUE 2: BENEFITS ARCHITECTURE ═════════════════════ */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="text-center mb-20">
            <p className="text-xl text-vicion-deep font-semibold mb-6">
              Esto es lo que realmente estás construyendo
            </p>
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep">
              Lo que puedes construir dentro del sistema
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: 'Ingreso de continuidad', desc: 'Acceso progresivo a beneficios disponibles dentro del sistema conforme a permanencia y participación.' },
              { icon: TrendingUp, title: 'Beneficio de permanencia', desc: 'La continuidad dentro del ecosistema fortalece el acceso y la estabilidad del participante.' },
              { icon: Zap, title: 'Ingresos de por vida dentro del ecosistema', desc: 'Mientras se mantengan las condiciones del programa, mantiene acceso a ventajas activas.' },
              { icon: Globe, title: 'Política en dólares estadounidenses', desc: 'La estructura se organiza en USD como referencia de orden, estabilidad y visión internacional.' },
              { icon: Shield, title: 'Protección del valor', desc: 'La participación busca transformarse en acceso útil, progresivo y estructurado.' },
              { icon: Users, title: 'Vida y transición', desc: 'La continuidad se piensa con visión de largo plazo y estructura intergeneracional.' },
              { icon: TrendingUp, title: 'Enfoque conservador', desc: 'La prioridad es sostener beneficios en el tiempo, no generar expectativas inmediatas.' },
              { icon: Lock, title: 'Participación con proyección internacional', desc: 'La plataforma se apoya en un ecosistema tecnológico y operativo con proyección global.' },
              { icon: Award, title: 'Simulación de devoluciones estructuradas', desc: 'Visualiza escenarios de acceso a valor y beneficios según tu nivel y permanencia.' },
            ].map((benefit, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06 }} variants={fadeUp}
                className="p-8 rounded-2xl bg-gradient-to-br from-vicion-blue/8 to-blue-500/5 border border-vicion-blue/25 hover:border-vicion-blue/50 hover:shadow-xl transition-all duration-300 cursor-pointer">
                <benefit.icon size={40} className="text-vicion-blue mb-6" />
                <h3 className="font-montserrat font-bold text-xl text-vicion-deep mb-3">{benefit.title}</h3>
                <p className="text-gray-600 text-base leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRANSPARENCIA DEL MODELO ════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp}>
            <h3 className="font-montserrat font-bold text-2xl text-vicion-deep mb-6">Transparencia del modelo</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              El acceso a beneficios dentro del ecosistema se basa en la participación, permanencia y desarrollo de proyectos. Los escenarios mostrados representan estimaciones y no constituyen garantías de resultados.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══ BLOQUE 3: RESPALDO REAL ═════════════════════════════ */}
      <section className="py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-20 text-center">
            Respaldado por una estructura real
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {[
              { title: 'BMP / Be-MindPower', desc: 'Super app operativa con tarjetas reales y capacidad tecnológica demostrada.' },
              { title: 'Blue Diamond y Diamond Community', desc: 'Desarrollos patrimoniales que forman parte de la visión de expansión.' },
              { title: 'Infraestructura tecnológica', desc: 'Arquitectura digital creada para conectar servicios y crecimiento.' },
              { title: 'Operación activa', desc: 'Base operativa en movimiento con herramientas y capacidad real de evolución.' },
            ].map((card, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }} variants={fadeUp}
                className="p-8 rounded-2xl bg-gradient-to-br from-vicion-blue/5 to-blue-500/5 border border-vicion-blue/25 hover:border-vicion-blue/50 hover:shadow-lg transition-all duration-300">
                <h3 className="font-montserrat font-bold text-2xl text-vicion-deep mb-3">{card.title}</h3>
                <p className="text-gray-700 text-lg leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONFIRMACIÓN LEGAL ════════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="p-6 rounded-2xl border border-vicion-blue/30" style={{ background: 'rgba(29,110,245,0.06)' }}>
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={legalConfirmed}
                onChange={(e) => setLegalConfirmed(e.target.checked)}
                className="w-5 h-5 rounded border-vicion-blue/60 mt-1 cursor-pointer flex-shrink-0"
                style={{ accentColor: 'rgb(29, 110, 245)' }}
              />
              <p className="text-sm text-gray-700 leading-relaxed flex-1">
                Declaro que comprendo que los escenarios presentados son estimaciones basadas en el desarrollo del ecosistema y que no constituyen una garantía de resultados.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ BLOQUE 4: SIMULATOR PREVIEW ══════════════════════════ */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl text-vicion-deep mb-8">
            Visualiza tu plan
          </motion.h2>

          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="text-lg text-gray-700 mb-12 leading-relaxed">
            Antes de activar tu participación, puedes explorar escenarios y comprender cómo evoluciona tu acceso a beneficios.
          </motion.p>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
            variants={fadeUp}>
            <button
              disabled={!legalConfirmed}
              onClick={() => window.location.href = '/onboarding/start'}
              className={`inline-flex items-center justify-center gap-2 font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 text-lg ${
                legalConfirmed
                  ? 'bg-vicion-blue hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}>
              Comenzar participación <ArrowRight size={20} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ══ STATEMENT ═════════════════════════════════════════════ */}
      <section className="py-32 bg-white">
       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
         <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.8 }}
           variants={fadeUp} className="font-montserrat font-black text-4xl sm:text-5xl lg:text-6xl text-vicion-deep mb-6 leading-tight">
           No estás accediendo a una oportunidad.<br />Estás tomando una posición.
         </motion.h2>
         <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.15 }}
           variants={fadeUp} className="text-2xl font-semibold text-vicion-blue">
           Y eso cambia todo.
         </motion.p>
       </div>
      </section>

      {/* ══ BLOQUE 5: CIERRE ═════════════════════════════════════ */}
      <section className="py-32 bg-vicion-deep text-white">
       <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
         <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
           variants={fadeUp} className="font-montserrat font-black text-4xl sm:text-5xl mb-12 leading-tight">
           No necesitas más ruido. Necesitas una estructura que tenga sentido.
         </motion.h2>

         <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
           variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
           <Link to="/onboarding/start"
             className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 text-lg">
             Comenzar ahora <ArrowRight size={20} />
           </Link>
           <Link to="/faq"
             className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white hover:bg-white/15 font-semibold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 text-lg">
             Ver FAQ <ArrowRight size={20} />
           </Link>
         </motion.div>
       </div>
      </section>
    </div>
  );
}