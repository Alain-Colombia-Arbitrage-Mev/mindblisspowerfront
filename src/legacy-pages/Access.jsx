import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const benefits = [
  'Acceso a plataforma',
  'Comunidad',
  'Beneficios base',
];

export default function Access() {
  return (
    <div className="overflow-hidden">

      {/* ══ HERO PANEL ═════════════════════════════════════════════════ */}
      <section className="pt-24 pb-20 bg-vicion-deep text-white relative overflow-hidden min-h-screen flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-vicion-deep via-[#071830] to-[#050f1f]" />
          <div className="absolute top-0 right-0 w-2/3 h-full opacity-20"
            style={{ backgroundImage: 'radial-gradient(ellipse at 75% 40%, rgba(59,130,246,0.55) 0%, transparent 60%)' }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(59,130,246,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.8) 1px, transparent 1px)',
            backgroundSize: '72px 72px'
          }} />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center">
            <p className="text-vicion-electric font-montserrat font-bold text-xs tracking-[0.3em] uppercase mb-6">Estado de Cuenta</p>
            <h1 className="font-montserrat font-black text-6xl sm:text-7xl lg:text-8xl mb-8 leading-tight">
              Tu cuenta está<br />
              <span style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                activa
              </span>
            </h1>
          </motion.div>

          {/* ══ CARDS ══════════════════════════════════════════════════ */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">

            {/* Nivel */}
            <div className="p-8 rounded-2xl text-center"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <p className="text-white/50 text-xs font-montserrat font-bold uppercase tracking-widest mb-3">Nivel</p>
              <p className="font-montserrat font-black text-4xl text-vicion-electric">Growth</p>
            </div>

            {/* Estado */}
            <div className="p-8 rounded-2xl text-center"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <p className="text-white/50 text-xs font-montserrat font-bold uppercase tracking-widest mb-3">Estado</p>
              <p className="font-montserrat font-black text-4xl text-vicion-electric">● Activo</p>
            </div>

            {/* Beneficios */}
            <div className="p-8 rounded-2xl text-center"
              style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <p className="text-white/50 text-xs font-montserrat font-bold uppercase tracking-widest mb-3">Beneficios</p>
              <p className="font-montserrat font-black text-4xl text-vicion-electric">Disponibles</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ LISTA DE BENEFICIOS ════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="flex flex-col gap-4">
              {benefits.map((benefit, i) => (
                <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-center gap-4 p-5 rounded-xl bg-gray-50 border border-gray-100 hover:border-vicion-electric/25 hover:shadow-md transition-all duration-300">
                  <CheckCircle size={20} className="text-vicion-blue flex-shrink-0" />
                  <span className="text-gray-700 font-medium text-lg">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ BLOQUE CLAVE ═══════════════════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="p-12 rounded-2xl text-center"
            style={{ background: 'linear-gradient(135deg,#0a1628,#0d1f3c)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <p className="text-vicion-electric font-montserrat font-bold text-xs tracking-[0.3em] uppercase mb-5">Próximo paso</p>
            <h2 className="font-montserrat font-black text-3xl sm:text-4xl text-white mb-8 leading-tight">
              ¿Quieres desbloquear más?
            </h2>
            <p className="text-white/55 text-base mb-10 max-w-xl mx-auto leading-relaxed">
              Tu cuenta está activa. Puedes continuar accediendo a beneficios o dar el siguiente paso y comenzar a construir tu estructura dentro del ecosistema.
            </p>
            <Link to="/dashboard"
              className="inline-flex items-center gap-3 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200 text-base shadow-lg shadow-blue-600/30">
              Quiero crecer <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════════════════════════ */}
      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-widest font-montserrat font-bold">
            Tu participación es la clave de tu evolución dentro del sistema.
          </p>
        </div>
      </section>
    </div>
  );
}