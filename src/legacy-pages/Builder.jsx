import { motion } from 'framer-motion';
import { Copy, Share2, TrendingUp, Zap, Users, Award, LineChart } from 'lucide-react';
import { useState } from 'react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

const referralCode = 'VP-MARIA-2024';
const referralLink = 'https://vicionpower.com?ref=VP-MARIA-2024';

export default function Builder() {
  const [copied, setCopied] = useState(false);
  const [projectedLevel, setProjectedLevel] = useState('Growth');
  const [projectedMonths, setProjectedMonths] = useState(6);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const projections = {
    Growth: { 3: 1200, 6: 3500, 12: 8200 },
    Advance: { 3: 2100, 6: 6200, 12: 15000 },
    Pro: { 3: 4500, 6: 12800, 12: 31000 },
    Elite: { 3: 8900, 6: 25600, 12: 62000 },
  };

  return (
    <div className="overflow-hidden">

      {/* ══ HERO ═══════════════════════════════════════════════════════ */}
      <section className="pt-28 pb-16 bg-vicion-deep text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-vicion-deep via-[#071830] to-[#050f1f]" />
          <div className="absolute top-0 right-0 w-2/3 h-full opacity-20"
            style={{ backgroundImage: 'radial-gradient(ellipse at 75% 40%, rgba(59,130,246,0.55) 0%, transparent 60%)' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-vicion-electric font-montserrat font-bold text-xs tracking-[0.3em] uppercase mb-4">Panel Constructor</p>
            <h1 className="font-montserrat font-black text-5xl sm:text-6xl mb-4 leading-tight">
              Panel completo<br />
              <span style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                activo
              </span>
            </h1>
            <p className="text-white/70 text-lg max-w-2xl">Acceso total a herramientas, métricas y estrategias de crecimiento dentro del ecosistema.</p>
          </motion.div>
        </div>
      </section>

      {/* ══ CARDS KPI ═════════════════════════════════════════════════ */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Progreso */}
            <div className="p-8 rounded-2xl bg-vicion-deep text-white border border-vicion-electric/25">
              <div className="flex items-center gap-3 mb-4">
                <Zap size={20} className="text-vicion-electric" />
                <p className="text-white/50 text-xs font-montserrat font-bold uppercase tracking-widest">Progreso</p>
              </div>
              <p className="font-montserrat font-black text-4xl mb-2">75%</p>
              <p className="text-white/55 text-sm">Hacia el siguiente nivel</p>
            </div>

            {/* Nivel */}
            <div className="p-8 rounded-2xl bg-vicion-deep text-white border border-vicion-electric/25">
              <div className="flex items-center gap-3 mb-4">
                <Award size={20} className="text-vicion-electric" />
                <p className="text-white/50 text-xs font-montserrat font-bold uppercase tracking-widest">Nivel</p>
              </div>
              <p className="font-montserrat font-black text-4xl mb-2">Growth</p>
              <p className="text-white/55 text-sm">Activo desde hace 8 meses</p>
            </div>

            {/* Actividad */}
            <div className="p-8 rounded-2xl bg-vicion-deep text-white border border-vicion-electric/25">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={20} className="text-vicion-electric" />
                <p className="text-white/50 text-xs font-montserrat font-bold uppercase tracking-widest">Actividad</p>
              </div>
              <p className="font-montserrat font-black text-4xl mb-2">12</p>
              <p className="text-white/55 text-sm">Referidos activos esta semana</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ ESTRUCTURA VISUAL LIMPIA ═══════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="text-center mb-16">
            <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-3">Tu Red</p>
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep">Estructura de crecimiento</h2>
          </motion.div>

          {/* Estructura limpia */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }}
            className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {/* Nivel 1: Tu */}
              <div className="flex flex-col items-center">
                <div className="px-6 py-3 rounded-2xl bg-vicion-deep text-white border border-vicion-electric/30"
                  style={{ minWidth: '200px', textAlign: 'center' }}>
                  <p className="font-montserrat font-bold text-white">Tú (Founder)</p>
                  <p className="text-vicion-electric text-xs mt-1">Growth • 8 meses</p>
                </div>
              </div>

              {/* Línea conectora */}
              <div className="flex justify-center">
                <div className="w-1 h-12 bg-gradient-to-b from-vicion-electric to-vicion-electric/30" />
              </div>

              {/* Nivel 2: Directos */}
              <div className="flex justify-around gap-4 px-8">
                <div className="px-4 py-2.5 rounded-xl bg-white border border-vicion-electric/20 text-center"
                  style={{ minWidth: '140px' }}>
                  <p className="font-semibold text-vicion-deep text-sm">Andrea</p>
                  <p className="text-vicion-electric text-xs">Growth</p>
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-white border border-vicion-electric/20 text-center"
                  style={{ minWidth: '140px' }}>
                  <p className="font-semibold text-vicion-deep text-sm">Carlos</p>
                  <p className="text-vicion-electric text-xs">Start</p>
                </div>
                <div className="px-4 py-2.5 rounded-xl bg-white border border-vicion-electric/20 text-center"
                  style={{ minWidth: '140px' }}>
                  <p className="font-semibold text-vicion-deep text-sm">Laura</p>
                  <p className="text-vicion-electric text-xs">Growth</p>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="mt-8 p-6 rounded-2xl bg-white border border-gray-100 text-center">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-montserrat font-black text-2xl text-vicion-deep">3</p>
                    <p className="text-gray-500 text-xs mt-1">Directos</p>
                  </div>
                  <div>
                    <p className="font-montserrat font-black text-2xl text-vicion-deep">12</p>
                    <p className="text-gray-500 text-xs mt-1">Red total</p>
                  </div>
                  <div>
                    <p className="font-montserrat font-black text-2xl text-vicion-blue">↑ 35%</p>
                    <p className="text-gray-500 text-xs mt-1">Este mes</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ REFERIDOS ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="text-center mb-16">
            <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-3">Invitación</p>
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep">Comparte tu código</h2>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-6">

            {/* Código */}
            <div className="p-6 rounded-2xl bg-vicion-deep text-white border border-vicion-electric/25">
              <p className="text-white/50 text-xs font-montserrat font-bold uppercase tracking-widest mb-3">Tu código</p>
              <div className="flex items-center justify-between gap-4">
                <p className="font-montserrat font-black text-3xl text-vicion-electric">{referralCode}</p>
                <button onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                  className="flex-shrink-0 p-3 rounded-xl transition-all duration-200"
                  style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)' }}>
                  <Copy size={18} className="text-vicion-electric" />
                </button>
              </div>
            </div>

            {/* Link */}
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <p className="text-gray-500 text-xs font-montserrat font-bold uppercase tracking-widest mb-3">Tu link</p>
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-sm text-gray-600 truncate">{referralLink}</p>
                <button onClick={handleCopy}
                  className="flex-shrink-0 px-4 py-2 rounded-xl bg-vicion-blue text-white text-sm font-semibold transition-all duration-200 hover:bg-blue-500">
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Compartir */}
            <div className="p-6 rounded-2xl bg-white border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-montserrat font-bold uppercase tracking-widest mb-2">Compartir en</p>
                <p className="text-gray-600 text-sm">Envía a través de tus canales preferidos</p>
              </div>
              <button className="flex-shrink-0 p-3 rounded-xl bg-vicion-blue text-white hover:bg-blue-500 transition-all duration-200">
                <Share2 size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ SIMULADOR ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="text-center mb-16">
            <p className="text-vicion-blue font-montserrat font-bold text-xs tracking-[0.25em] uppercase mb-3">Proyecciones</p>
            <h2 className="font-montserrat font-black text-4xl sm:text-5xl text-vicion-deep">Simulador de beneficios</h2>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-8">

            {/* Selectores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Nivel */}
              <div>
                <label className="block text-vicion-deep font-semibold text-sm mb-3">Proyecta tu nivel</label>
                <div className="flex gap-2">
                  {['Growth', 'Advance', 'Pro', 'Elite'].map(level => (
                    <button key={level}
                      onClick={() => setProjectedLevel(level)}
                      className={`px-4 py-2 rounded-lg transition-all text-sm font-semibold ${
                        projectedLevel === level
                          ? 'bg-vicion-blue text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-vicion-electric/30'
                      }`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meses */}
              <div>
                <label className="block text-vicion-deep font-semibold text-sm mb-3">En {projectedMonths} meses</label>
                <input type="range" min="3" max="12" step="3" value={projectedMonths}
                  onChange={(e) => setProjectedMonths(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-vicion-blue" />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>3 meses</span>
                  <span>12 meses</span>
                </div>
              </div>
            </div>

            {/* Resultado */}
            <div className="p-10 rounded-2xl bg-vicion-deep text-white text-center border border-vicion-electric/25">
              <p className="text-white/50 text-xs font-montserrat font-bold uppercase tracking-widest mb-4">Beneficios proyectados</p>
              <div className="flex items-baseline justify-center gap-2 mb-4">
                <span className="font-montserrat font-black text-6xl text-vicion-electric">
                  ${projections[projectedLevel][projectedMonths].toLocaleString()}
                </span>
              </div>
              <p className="text-white/60 text-sm">
                Proyección basada en nivel {projectedLevel} en {projectedMonths} meses de actividad consistente
              </p>
              <p className="text-white/40 text-xs mt-3 italic">Esta es una proyección. Los resultados pueden variar según actividad real.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ═════════════════════════════════════════════════════ */}
      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-xs uppercase tracking-widest font-montserrat font-bold">
            Panel de control para constructores de ecosistema.
          </p>
        </div>
      </section>
    </div>
  );
}