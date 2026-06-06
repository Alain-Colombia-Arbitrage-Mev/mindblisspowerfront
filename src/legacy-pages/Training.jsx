import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, MessageCircle, ArrowRight } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const courses = [
  { name: 'Curso 1', status: 'completed' },
  { name: 'Curso 2', status: 'completed' },
  { name: 'Curso 3', status: 'in_progress' },
];

const blocks = [
  { title: 'Qué es Vicion', desc: 'Comprende la identidad, misión y valores fundamentales de la plataforma.' },
  { title: 'Cómo funciona', desc: 'Aprende el mecanismo operativo, estructura y flujos del ecosistema.' },
  { title: 'Qué no decir', desc: 'Conoce las límites, restricciones y comunicación responsable.' },
  { title: 'Cómo invitar', desc: 'Domina las mejores prácticas para presentar la plataforma a otros.' },
];

export default function Training() {
  return (
    <div className="overflow-hidden">

      {/* ══ HERO ═══════════════════════════════════════════════════════ */}
      <section className="pt-32 pb-20 bg-vicion-deep text-white relative overflow-hidden min-h-[70vh] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-vicion-deep via-[#071830] to-[#050f1f]" />
          <div className="absolute top-0 right-0 w-2/3 h-full opacity-20"
            style={{ backgroundImage: 'radial-gradient(ellipse at 75% 40%, rgba(59,130,246,0.55) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)',
            backgroundSize: '72px 72px'
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-vicion-electric font-montserrat font-bold text-xs tracking-[0.3em] uppercase mb-5">Tu recorrido</p>
            <h1 className="font-montserrat font-black text-5xl sm:text-6xl lg:text-7xl mb-6 leading-tight">
              Modo crecimiento<br />
              <span style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                activado
              </span>
            </h1>
            <p className="text-white/70 text-xl leading-relaxed max-w-2xl">
              Completarás una formación estructurada para comprender, comunicar y crecer responsablemente dentro del ecosistema.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══ PROGRESO ═══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="text-center mb-12">
            <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-3">Progreso</p>
            <h2 className="font-montserrat font-black text-3xl sm:text-4xl text-vicion-deep">Tu avance formativo</h2>
          </motion.div>

          <div className="space-y-4">
            {courses.map((course, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="flex items-center gap-4 p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-vicion-electric/25 transition-all duration-300">
                <div className="flex-shrink-0">
                  {course.status === 'completed' ? (
                    <CheckCircle size={28} className="text-vicion-blue" />
                  ) : (
                    <Clock size={28} className="text-vicion-electric animate-pulse" />
                  )}
                </div>
                <span className={`font-montserrat font-bold text-lg ${course.status === 'completed' ? 'text-vicion-deep' : 'text-vicion-electric'}`}>
                  {course.name}
                </span>
                <span className={`ml-auto text-xs font-semibold uppercase tracking-widest ${course.status === 'completed' ? 'text-vicion-blue' : 'text-vicion-electric'}`}>
                  {course.status === 'completed' ? '✔ Completado' : '⏳ En progreso'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BLOQUES DE CONTENIDO ═══════════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="text-center mb-16">
            <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-3">Contenido</p>
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep">Qué aprenderás</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {blocks.map((block, i) => (
              <motion.div key={block.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:border-vicion-electric/25 transition-all duration-300 flex flex-col">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                  <div className="w-5 h-5 rounded-full bg-vicion-electric" />
                </div>
                <h3 className="font-montserrat font-bold text-lg text-vicion-deep mb-3">{block.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1">{block.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SOPORTE ════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="p-10 rounded-2xl text-center"
            style={{ background: 'linear-gradient(135deg,#0a1628,#0d1f3c)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)' }}>
              <MessageCircle size={28} className="text-vicion-electric" />
            </div>
            <p className="text-white/50 font-montserrat font-bold text-xs tracking-[0.3em] uppercase mb-4">Acompañamiento</p>
            <h2 className="font-montserrat font-black text-3xl text-white mb-8">Tu guía de soporte</h2>
            <div className="bg-vicion-deep/50 rounded-xl p-6 border border-vicion-electric/20 mb-6">
              <p className="text-white/70 text-sm mb-2">Si tienes preguntas o necesitas aclaración:</p>
              <p className="text-vicion-electric font-semibold text-lg">
                María García<br />
                <span className="text-white/55 text-sm font-normal">+971 50 XXX XXXX</span>
              </p>
            </div>
            <p className="text-white/40 text-xs leading-relaxed">
              Estamos aquí para asegurar que comprendas cada aspecto del sistema y te sientas preparado para avanzar.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══ CTA FINAL ═══════════════════════════════════════════════════ */}
      <section className="py-32 bg-vicion-deep text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(59,130,246,1) 0%, transparent 65%)' }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)',
          backgroundSize: '72px 72px'
        }} />
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <p className="text-vicion-electric font-montserrat font-bold text-xs tracking-[0.3em] uppercase mb-5">Siguiente paso</p>
          <h2 className="font-montserrat font-black text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight">
            Completa tu formación<br />
            <span style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              y comienza a crecer
            </span>
          </h2>
          <p className="text-white/55 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Una vez completes la formación, accederás a todas las herramientas y funcionalidades del modo constructor.
          </p>
          <Link to="/dashboard"
            className="inline-flex items-center gap-3 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 text-base shadow-xl shadow-blue-600/30">
            Activar modo constructor <ArrowRight size={20} />
          </Link>
          <p className="text-white/25 text-xs mt-6">Completarás tu formación durante este proceso.</p>
        </motion.div>
      </section>
    </div>
  );
}