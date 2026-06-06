import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Users, TrendingUp, Briefcase, Heart } from 'lucide-react';
import TrustStrip from '@/components/TrustStrip';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function Opportunity() {
  return (
    <div className="overflow-hidden">

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&h=900&fit=crop"
            alt="Liderazgo y crecimiento"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-blue-900/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/30 to-vicion-deep/85" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
            className="font-montserrat font-black text-5xl sm:text-6xl lg:text-7xl text-white mb-8 leading-tight">
            Crece dentro de una estructura real
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/85 mb-12 leading-relaxed max-w-3xl mx-auto">
            Desarrolla comunidad, liderazgo y progreso dentro de una plataforma diseñada para acompañar tu evolución.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/participar"
              className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/40">
              Comenzar participación <ArrowRight size={18} />
            </Link>
            <Link to="/care-plan"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white hover:bg-white/15 font-semibold font-montserrat px-8 py-4 rounded-xl transition-all duration-200">
              Entender el modelo <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      <TrustStrip />

      {/* ══ BLOQUE 1: POR QUÉ CRECER ════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-16 text-center">
            ¿Por qué crecer dentro del sistema?
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
              variants={fadeUp} className="rounded-2xl overflow-hidden h-80 bg-gradient-to-br from-vicion-blue/20 to-blue-500/10">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
                alt="Estructura de crecimiento"
                className="w-full h-full object-cover"
              />
            </motion.div>

            <div className="space-y-6">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
                variants={fadeUp} className="space-y-3">
                <p className="text-lg text-gray-700 leading-relaxed font-semibold text-vicion-deep">
                  No cualquiera construye.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Primero se entiende. Luego se crece. Luego se lidera.
                </p>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
                variants={fadeUp} className="space-y-4">
                {[
                  { icon: Users, title: 'Comunidad', desc: 'Desarrolla junto a otros dentro de una estructura ordenada.' },
                  { icon: TrendingUp, title: 'Crecimiento', desc: 'Acceso a herramientas, formación y acompañamiento real.' },
                  { icon: Briefcase, title: 'Liderazgo', desc: 'Evoluciona hacia posiciones de mayor alcance dentro del sistema.' },
                ].map((item, i) => (
                  <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.08 }} variants={fadeUp}
                    className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <item.icon size={24} className="text-vicion-blue flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-vicion-deep">{item.title}</p>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ BLOQUE 2: EL ACOMPAÑAMIENTO ═════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-16 text-center">
            Tu evolución será acompañada
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Formación', desc: 'Acceso a módulos de formación diseñados para tu desarrollo.' },
              { title: 'Guía', desc: 'Un acompañador dedicado a tu progreso dentro del sistema.' },
              { title: 'Herramientas', desc: 'Recursos y plataformas para organizar tu crecimiento.' },
              { title: 'Comunidad', desc: 'Red activa de personas en tu mismo camino de evolución.' },
            ].map((card, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }} variants={fadeUp}
                className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-vicion-blue/30 transition-all duration-300">
                <h3 className="font-montserrat font-bold text-lg text-vicion-deep mb-3">{card.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BLOQUE 3: QUÉ CAMBIA AL CRECER ══════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-16 text-center">
            Qué cambia cuando creces dentro del sistema
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
              variants={fadeUp} className="space-y-6 order-2 lg:order-1">
              {[
                { icon: CheckCircle, title: 'Acceso a formación avanzada', desc: 'Módulos especializados para líderes en construcción.' },
                { icon: CheckCircle, title: 'Nuevas herramientas', desc: 'Acceso a plataformas y recursos para gestionar tu estructura.' },
                { icon: CheckCircle, title: 'Estructura visible', desc: 'Tu red y progreso se visualizan dentro del sistema.' },
                { icon: CheckCircle, title: 'Mayor participación', desc: 'Evoluciona tu posición y alcance dentro del ecosistema.' },
              ].map((item, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.15 + i * 0.08 }} variants={fadeUp}
                  className="flex items-start gap-4">
                  <item.icon size={24} className="text-vicion-blue flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-vicion-deep">{item.title}</p>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
              variants={fadeUp} className="rounded-2xl overflow-hidden h-80 bg-gradient-to-br from-vicion-blue/20 to-blue-500/10 order-1 lg:order-2">
              <img 
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
                alt="Evolución y progreso"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ BLOQUE 4: CIERRE ═════════════════════════════════════ */}
      <section className="py-24 bg-vicion-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl sm:text-5xl mb-10 leading-tight">
            Estás listo para desarrollar tu potencial dentro del ecosistema.
          </motion.h2>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
            variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/participar"
              className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200">
              Iniciar proceso de crecimiento <ArrowRight size={18} />
            </Link>
            <Link to="/planes"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white hover:bg-white/15 font-semibold font-montserrat px-8 py-4 rounded-xl transition-all duration-200">
              Ver niveles disponibles <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}