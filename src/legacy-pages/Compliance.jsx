import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertCircle, Users, Layers, FileText, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const SectionCTA = () => (
  <section className="py-24 bg-gradient-to-r from-vicion-blue/5 to-blue-500/5 border-y border-vicion-blue/20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.h3 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
        variants={{ hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } }} className="font-montserrat font-black text-3xl sm:text-4xl text-vicion-deep mb-6">Comprendes los lineamientos. Participa con responsabilidad.</motion.h3>
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
        variants={{ hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } }} className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/participar" className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/30">Acceder a Vicion Care Plan <ArrowRight size={18} /></Link>
        <Link to="/care-plan" className="inline-flex items-center justify-center gap-2 border-2 border-vicion-blue/40 text-vicion-blue hover:bg-vicion-blue/10 font-semibold font-montserrat px-8 py-4 rounded-xl transition-all duration-200">Explorar beneficios <ArrowRight size={18} /></Link>
      </motion.div>
    </div>
  </section>
);

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const notices = [
  'Vicion Care Plan es un programa de membresía estructurada.',
  'La participación dentro de la plataforma está sujeta a los términos y condiciones aplicables.',
  'Los beneficios y funcionalidades pueden variar según el nivel de activación y el estado de la cuenta.',
  'La información presentada en la plataforma debe entenderse dentro del marco operativo y contractual correspondiente.',
];

const conductItems = [
  { icon: FileText, label: 'Comunicación responsable', desc: 'Usar lenguaje claro, veraz y alineado con los materiales oficiales.' },
  { icon: Eye, label: 'Respeto por la información oficial', desc: 'No distorsionar ni ampliar promesas más allá de lo establecido.' },
  { icon: Layers, label: 'Coherencia en materiales', desc: 'Utilizar únicamente recursos aprobados por la plataforma.' },
  { icon: Users, label: 'Directrices internas', desc: 'Seguir los lineamientos de participación definidos por Mindbliss Power.' },
];

export default function Compliance() {
  return (
    <div className="overflow-hidden">

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section className="pt-32 pb-24 bg-vicion-deep text-white relative overflow-hidden min-h-[60vh] flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-vicion-deep via-[#071830] to-[#050f1f]" />
          <div className="absolute top-0 right-0 w-2/3 h-full opacity-20"
            style={{ backgroundImage: 'radial-gradient(ellipse at 75% 35%, rgba(59,130,246,0.5) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)',
            backgroundSize: '72px 72px'
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl">
            <p className="text-vicion-electric font-montserrat font-bold text-xs tracking-[0.3em] uppercase mb-5">Cumplimiento</p>
            <h1 className="font-montserrat font-black text-5xl sm:text-6xl lg:text-7xl mb-6 leading-tight">
              Claridad, estructura<br />
              <span style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                y responsabilidad
              </span>
            </h1>
            <p className="text-white/65 text-xl leading-relaxed max-w-2xl">
              Mindbliss Power promueve una experiencia de participación basada en transparencia, comunicación clara y uso responsable de la plataforma.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══ SECCIÓN 1 — DECLARACIÓN GENERAL ════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-4">Declaración General</p>
              <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-6 leading-tight">
                Compromiso con una experiencia clara
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed">
                Mindbliss Power presenta su ecosistema, programas y oportunidades de forma estructurada, procurando que cada miembro comprenda la naturaleza de su participación, los beneficios disponibles y el funcionamiento general de la plataforma.
              </p>
              <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
                variants={fadeUp} className="text-gray-500 text-sm leading-relaxed max-w-xl mt-3">
                Plataforma de participación estructurada orientada al desarrollo de proyectos, acceso a herramientas y construcción de valor en el tiempo.
              </motion.p>
              </motion.div>
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Shield, title: 'Transparencia', sub: 'Información clara y verificable', color: '#3b82f6' },
                  { icon: FileText, title: 'Estructura', sub: 'Lineamientos definidos y accesibles', color: '#60a5fa' },
                  { icon: Eye, title: 'Claridad', sub: 'Sin ambigüedades en la propuesta', color: '#3b82f6' },
                  { icon: Users, title: 'Responsabilidad', sub: 'Compromiso con cada miembro', color: '#60a5fa' },
                ].map(card => (
                  <div key={card.title} className="p-6 rounded-2xl bg-vicion-deep text-white"
                    style={{ border: '1px solid rgba(59,130,246,0.2)' }}>
                    <card.icon size={22} style={{ color: card.color, marginBottom: 12 }} />
                    <div className="font-montserrat font-bold text-base mb-1">{card.title}</div>
                    <div className="text-white/40 text-xs">{card.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 2 — ACLARACIONES IMPORTANTES ════════════════════════ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="text-center mb-12">
            <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-3">Aclaraciones</p>
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep">Información importante para los usuarios</h2>
          </motion.div>

          {/* Aviso destacado */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="flex items-start gap-4 p-6 rounded-2xl mb-8"
            style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <AlertCircle size={22} className="text-vicion-blue flex-shrink-0 mt-0.5" />
            <p className="text-vicion-deep text-sm leading-relaxed font-medium">
              Por favor, lee la siguiente información antes de participar en la plataforma.
            </p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {notices.map((item, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-vicion-electric/20 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                  <CheckCircle size={15} className="text-vicion-blue" />
                </div>
                <span className="text-gray-600 text-sm leading-relaxed">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECCIÓN 3 — CONDUCTA Y USO ════════════════════════════════ */}
      <section className="py-20 bg-vicion-deep text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="text-center mb-14">
            <p className="text-vicion-electric font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-3">Conducta</p>
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl mb-4">Uso responsable de la plataforma</h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
              La comunidad Mindbliss Power debe desarrollarse con comunicación responsable, respeto por la información oficial, coherencia en el uso de materiales y apego a las directrices internas de participación.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {conductItems.map((item, i) => (
              <motion.div key={item.label} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-7 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.35)' }}>
                  <item.icon size={20} className="text-vicion-electric" />
                </div>
                <h3 className="font-montserrat font-bold text-white text-base mb-2">{item.label}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionCTA />

      {/* ══ SECCIÓN 4 — CIERRE ════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Shield className="text-vicion-blue" size={28} />
            </div>
            <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-4">Compromiso</p>
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep mb-6 leading-tight">
              Una plataforma seria comienza con reglas claras
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto">
              La confianza se construye con orden, estructura y consistencia. Por eso, Mindbliss Power integra criterios de claridad operativa y lineamientos visibles para fortalecer la experiencia de todos sus miembros.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}