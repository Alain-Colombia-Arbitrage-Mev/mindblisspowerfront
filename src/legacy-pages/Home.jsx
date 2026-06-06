import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, TrendingUp, Shield, Users, Globe, Zap } from 'lucide-react';
import TrustStrip from '@/components/TrustStrip';
import TrustIndicators from '@/components/TrustIndicators';
import TrustReasoning from '@/components/TrustReasoning';
import SocialProofSection from '@/components/home/SocialProofSection';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function Home() {
  return (
    <div className="overflow-hidden bg-white">

      {/* ══ HERO CINEMATOGRÁFICO ═════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-20 overflow-hidden">
       <div className="absolute inset-0">
         <img 
           src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&h=900&fit=crop"
           alt="Familia latina con esperanza"
           className="w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-gradient-to-r from-vicion-deep/92 via-vicion-deep/80 to-transparent opacity-95" />
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-vicion-deep/50 to-vicion-deep" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85 }}
              className="font-montserrat font-black text-6xl sm:text-7xl lg:text-8xl text-white mb-8 leading-tight tracking-tight">
              Construye tu acceso a estabilidad y crecimiento en el tiempo
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}
              className="text-xl sm:text-2xl text-white/90 mb-12 leading-relaxed max-w-3xl font-light">
              Un sistema estructurado de participación diseñado para quienes buscan avanzar con claridad dentro de un ecosistema real.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link to="/participar"
                className="inline-flex items-center justify-center gap-3 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-300 shadow-xl shadow-blue-600/40 hover:shadow-2xl hover:shadow-blue-600/60 hover:-translate-y-1">
                Acceder a Vicion Care Plan <ArrowRight size={18} />
              </Link>
              <Link to="/care-plan"
                className="inline-flex items-center justify-center gap-3 border-2 border-white/50 text-white hover:bg-white/15 hover:border-white/80 font-semibold font-montserrat px-8 py-4 rounded-xl transition-all duration-300 backdrop-blur-sm">
                Ver cómo funciona <ArrowRight size={18} />
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }}
              className="flex items-center gap-6 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-white/80" />
                <span>Continuidad</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-white/80" />
                <span>Protección</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-white/80" />
                <span>Estructura</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <TrustStrip />

      <TrustIndicators />

      {/* ══ BLOQUE 1: LA EVOLUCIÓN ══════════════════════════════ */}
      <section className="py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="text-center mb-20">
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-6">
              Hoy, esto cambia
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
           <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
             variants={fadeUp} className="rounded-3xl overflow-hidden h-96 bg-gradient-to-br from-vicion-blue/10 to-blue-500/5 shadow-lg hover:shadow-2xl transition-all duration-400 hover:-translate-y-1">
             <img 
               src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
               alt="Transformación clara"
               className="w-full h-full object-cover"
             />
           </motion.div>

            <div className="space-y-8">
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
                variants={fadeUp} className="text-lg text-gray-700 leading-relaxed">
                Durante mucho tiempo, muchas personas participaron en modelos <span className="font-semibold text-vicion-deep">sin claridad, sin estructura y sin una visión sostenible</span>.
              </motion.p>

              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
                variants={fadeUp} className="text-lg text-vicion-deep leading-relaxed font-semibold">
                Vicion Power decidió evolucionar.
              </motion.p>

              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
                variants={fadeUp} className="text-lg text-gray-700 leading-relaxed">
                Hoy el enfoque ya no está en la velocidad. Está en la <span className="font-semibold">continuidad, el acceso progresivo a beneficios</span> y una estructura capaz de sostenerse con mayor seriedad.
              </motion.p>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}
                variants={fadeUp} className="pt-4">
                <Link to="/care-plan"
                  className="inline-flex items-center gap-2 text-vicion-blue font-bold hover:gap-3 transition-all text-lg">
                  Ver cómo funciona <ArrowRight size={20} />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ BLOQUE 2: LO QUE YA EXISTE ════════════════════════ */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="text-center mb-20">
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-8">
              No partimos de una promesa. Partimos de una base real.
            </h2>
            <p className="text-xl text-gray-600">
              El ecosistema ya cuenta con estructura, tecnología, proyectos y capacidad operativa.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {[
              { 
                title: 'BMP / Be-MindPower',
                desc: 'Una super app operativa con tarjetas reales, pagos y capacidad tecnológica que demuestra ejecución dentro del ecosistema.',
                img: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=500&h=400&fit=crop'
              },
              { 
                title: 'Blue Diamond y Diamond Community',
                desc: 'Desarrollos que forman parte de la visión patrimonial y de expansión del ecosistema.',
                img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=500&h=400&fit=crop'
              },
              { 
                title: 'Infraestructura tecnológica',
                desc: 'Una arquitectura digital creada para conectar servicios, experiencia y crecimiento.',
                img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=400&fit=crop'
              },
              { 
                title: 'Ecosistema activo',
                desc: 'Una base operativa en movimiento, con herramientas, servicios y capacidad real de evolución.',
                img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=400&fit=crop'
              },
            ].map((card, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }} variants={fadeUp}
                className="rounded-3xl overflow-hidden border border-gray-100 shadow-md hover:shadow-2xl hover:border-vicion-blue/40 transition-all duration-400 hover:-translate-y-2">
                <div className="h-48 bg-gradient-to-br from-vicion-blue/10 to-blue-500/5 overflow-hidden">
                  <img src={card.img} alt={card.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-8 bg-white">
                  <h3 className="font-montserrat font-bold text-2xl text-vicion-deep mb-3">{card.title}</h3>
                  <p className="text-gray-600 text-base leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.6 }}
            variants={fadeUp} className="text-center">
            <Link to="/care-plan"
              className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30">
              Explorar el respaldo del ecosistema <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ BLOQUE 3: VICION CARE PLAN (STAR PRODUCT) ═══════════ */}
      <section className="py-32 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="text-center mb-20">
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-6">
              Vicion Care Plan
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              La estructura central del ecosistema
            </p>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto font-semibold text-vicion-deep">
              Esto es lo que realmente estás construyendo
            </p>
          </motion.div>

          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="text-lg text-gray-700 text-center max-w-3xl mx-auto mb-20 leading-relaxed">
            Una propuesta pensada para transformar participación en <span className="font-semibold">acceso real a beneficios dentro del tiempo</span>.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {[
              { icon: Clock, title: 'Ingreso de continuidad', desc: 'Acceso progresivo a beneficios dentro del tiempo.' },
              { icon: TrendingUp, title: 'Beneficio de permanencia', desc: 'Mientras continúas activo, mantienes acceso.' },
              { icon: Shield, title: 'Protección del valor', desc: 'Tu participación evoluciona en lugar de desaparecer.' },
              { icon: Globe, title: 'Política en dólares estadounidenses', desc: 'Referencia clara, estable y global.' },
              { icon: Zap, title: 'Enfoque conservador', desc: 'Estabilidad sobre velocidad.' },
              { icon: Users, title: 'Acceso progresivo', desc: 'Desbloquea beneficios conforme avanzas.' },
            ].map((benefit, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }} variants={fadeUp}
                className="p-8 rounded-3xl bg-gradient-to-br from-vicion-blue/8 to-blue-500/3 border border-vicion-blue/20 hover:border-vicion-blue/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-400 cursor-pointer">
                <benefit.icon size={40} className="text-vicion-blue mb-6" />
                <h3 className="font-montserrat font-bold text-xl text-vicion-deep mb-3">{benefit.title}</h3>
                <p className="text-gray-600 text-base leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.6 }}
            variants={fadeUp} className="text-center">
            <Link to="/care-plan"
              className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30 text-lg">
              Descubrir Vicion Care Plan <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      <TrustReasoning />

      <SocialProofSection />

      {/* ══ BLOQUE 4: CÓMO FUNCIONA ═════════════════════════════ */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-20 text-center">
            Cómo funciona el sistema
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
             variants={fadeUp} className="rounded-3xl overflow-hidden h-96 bg-gradient-to-br from-vicion-blue/10 to-blue-500/5 shadow-lg hover:shadow-2xl transition-all duration-400 hover:-translate-y-1">
               <img 
                 src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
                 alt="Cómo funciona"
                 className="w-full h-full object-cover"
               />
             </motion.div>

            <div className="space-y-6">
              {[
                { num: '1', text: 'Eliges tu nivel de participación' },
                { num: '2', text: 'Comprendes el sistema y los beneficios' },
                { num: '3', text: 'Activas tu participación' },
                { num: '4', text: 'Accedes a herramientas y formación' },
                { num: '5', text: 'Evolucionas dentro del ecosistema' },
              ].map((item, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }} variants={fadeUp}
                  className="flex items-start gap-6 p-6 rounded-2xl bg-white border border-gray-100 hover:border-vicion-blue/40 hover:shadow-lg hover:-translate-x-1 transition-all duration-400">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-vicion-blue to-blue-600 text-white flex items-center justify-center font-montserrat font-bold text-lg flex-shrink-0 shadow-md">
                    {item.num}
                  </div>
                  <p className="text-gray-700 text-lg leading-relaxed pt-2">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL REINFORCEMENT ═════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-3xl sm:text-4xl text-vicion-deep mb-4">
            Miles de personas ya tomaron una decisión.
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="text-xl text-gray-600 mb-10 leading-relaxed">
            Ahora es tu turno de entender si esto es para ti.
          </motion.p>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
            variants={fadeUp}>
            <Link to="/participar"
              className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 text-lg shadow-lg shadow-blue-600/30">
              Acceder a Vicion Care Plan <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ BLOQUE 5: CIERRE ═════════════════════════════════════ */}
      <section className="py-32 bg-vicion-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl sm:text-5xl mb-12 leading-tight">
            Si buscas algo real, estructurado y sostenible, este puede ser tu punto de partida.
          </motion.h2>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
            variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/participar"
              className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 text-lg">
              Simular participación <ArrowRight size={20} />
            </Link>
            <Link to="/planes"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white hover:bg-white/15 font-semibold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 text-lg">
              Ver niveles de participación <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}