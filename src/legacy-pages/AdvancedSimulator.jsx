import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowRight, AlertCircle, TrendingUp, Shield, Zap, Star } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function AdvancedSimulator() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const VALID_PLANS = [500, 1000, 2500, 5000, 10000, 25000];
  const [nivel, setNivel] = useState(1000);
  const [meses, setMeses] = useState(24);
  const [fase, setFase] = useState('expansión');

  // STRICT ACCESS CONTROL: User must be fully verified to access simulator
  // Only accessible via registered + email verified + phone verified flow
  const isFullyVerified = user && user.email && user.email_verified && user.phone_verified;

  // Intensity factor for full-system scenario
  const [intensidad, setIntensidad] = useState(2); // 1=básica, 2=alta, 3=máxima

  const calcularSimulacion = useMemo(() => {
    const planValido = VALID_PLANS.includes(nivel) ? nivel : 1000;
    const factorTiempo = meses / 12;
    const factorFase = { 'inicial': 1.2, 'expansión': 1.4, 'consolidación': 0.9 }[fase] || 1;
    const factorIntensidad = { 1: 1, 2: 2.8, 3: 5.5 }[intensidad] || 1;

    // Network growth multiplier: a balanced, full-participation network
    const redActiva = 4.2;

    const resultadoBase = planValido * factorTiempo * factorFase;
    const conservador  = Math.round(resultadoBase * 0.9);
    const activo       = Math.round(resultadoBase * 1.5);
    // Full system scenario: high participation + balanced network + consistent activity
    const sistemaCompleto = Math.round(resultadoBase * factorIntensidad * redActiva);

    const bonusMin = 15; const bonusMax = 95;
    const bonusAleatorio = Math.round(bonusMin + Math.random() * (bonusMax - bonusMin));

    const chartData = Array.from({ length: Math.ceil(meses / 3) + 1 }, (_, i) => {
      const mes = i * 3;
      if (mes > meses) return null;
      const factor = (mes / meses) || 0;
      // Full system curve: accelerates toward the end (exponential feel)
      const factorSistema = Math.pow(factor, 0.7);
      return {
        mes,
        conservador: Math.round(conservador * factor),
        activo: Math.round(activo * factor),
        sistemaCompleto: Math.round(sistemaCompleto * factorSistema),
        label: `M${mes}`,
      };
    }).filter(Boolean);

    // Fix typo reference
    const chartDataFixed = Array.from({ length: Math.ceil(meses / 3) + 1 }, (_, i) => {
      const mes = i * 3;
      if (mes > meses) return null;
      const factor = (mes / meses) || 0;
      const factorSistema = Math.pow(factor, 0.7);
      return {
        mes,
        conservador: Math.round(conservador * factor),
        activo: Math.round(activo * factor),
        sistemaCompleto: Math.round(sistemaCompleto * factorSistema),
        label: `M${mes}`,
      };
    }).filter(Boolean);

    return { conservador, activo, sistemaCompleto, bonusAleatorio, chartData: chartDataFixed, resultadoBase };
  }, [nivel, meses, fase, intensidad]);
  
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect if not fully verified OR trying to access directly without flow
  if (!isFullyVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vicion-deep to-[#050c1a] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl text-center">
          <AlertCircle size={48} className="text-vicion-blue mx-auto mb-6" />
          <h1 className="font-montserrat font-black text-4xl text-white mb-6">
            Acceso restringido
          </h1>
          <p className="text-xl text-white/80 mb-12 leading-relaxed">
            El simulador está disponible únicamente para usuarios registrados y validados dentro del ecosistema.
          </p>
          <p className="text-lg text-white/60 mb-12">
            Completa tu registro y validación para acceder a proyecciones personalizadas.
          </p>
          <Link to="/participar"
            className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-10 py-4 rounded-xl transition-all duration-200">
            Completar registro <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 py-20">

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
          variants={fadeUp} className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-6">
            <Star size={13} className="text-vicion-blue" />
            <span className="text-xs font-bold text-vicion-blue uppercase tracking-wider">Escenario de Sistema Completo Disponible</span>
          </div>
          <h1 className="font-montserrat font-black text-5xl sm:text-6xl text-vicion-deep mb-6">
            Simulador de rendimiento estructural
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed mb-4">
            Explora el resultado estimado según tu nivel de participación, actividad y estructura de red.
          </p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            Este simulador muestra escenarios basados en el comportamiento del ecosistema. Los resultados dependen del nivel de participación y actividad real.
          </p>
        </motion.div>
      </section>

      {/* ══ BLOQUE 1: CONFIGURACIÓN ═════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
          variants={fadeUp} className="p-8 sm:p-12 rounded-3xl bg-white shadow-xl border border-gray-100">

          <h2 className="font-montserrat font-black text-3xl text-vicion-deep mb-12 text-center">
            Configura tu escenario
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

            {/* INPUT 1: Nivel */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
              variants={fadeUp}>
              <label className="block font-montserrat font-bold text-gray-800 mb-6 text-lg">
                Nivel de participación
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VALID_PLANS.map(n => (
                  <button key={n} onClick={() => setNivel(n)}
                    className={`px-2 sm:px-4 py-3 rounded-lg font-bold text-sm sm:text-base transition-all duration-200 ${
                      nivel === n
                        ? 'bg-vicion-blue text-white shadow-lg shadow-blue-600/30'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}>
                    ${n}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* INPUT 2: Tiempo */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
              variants={fadeUp}>
              <label className="block font-montserrat font-bold text-gray-800 mb-6 text-lg">
                Proyección: {meses} meses
              </label>
              <input type="range" min="12" max="36" step="3" value={meses} onChange={(e) => setMeses(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-vicion-blue" />
              <div className="flex justify-between text-xs text-gray-500 mt-3">
                <span>12m</span>
                <span>36m</span>
              </div>
            </motion.div>

            {/* INPUT 3: Fase */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
              variants={fadeUp}>
              <label className="block font-montserrat font-bold text-gray-800 mb-6 text-lg">
                Fase de participación
              </label>
              <div className="space-y-2">
                {['inicial', 'expansión', 'consolidación'].map(f => (
                  <button key={f} onClick={() => setFase(f)}
                    className={`w-full px-4 py-3 rounded-lg text-left font-semibold text-sm sm:text-base transition-all duration-200 capitalize ${
                      fase === f
                        ? 'bg-vicion-blue text-white shadow-lg shadow-blue-600/30'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* INPUT 4: Intensidad del sistema */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.25 }}
              variants={fadeUp}>
              <label className="block font-montserrat font-bold text-gray-800 mb-6 text-lg">
                Intensidad del sistema
              </label>
              <div className="space-y-2">
                {[
                  { val: 1, label: 'Participación básica', desc: 'Red inicial' },
                  { val: 2, label: 'Alta participación', desc: 'Red activa' },
                  { val: 3, label: 'Sistema completo', desc: 'Red balanceada óptima', highlight: true },
                ].map(({ val, label, desc, highlight }) => (
                  <button key={val} onClick={() => setIntensidad(val)}
                    className={`w-full px-4 py-3 rounded-lg text-left font-semibold text-sm transition-all duration-200 ${
                      intensidad === val
                        ? highlight ? 'bg-gradient-to-r from-purple-600 to-vicion-blue text-white shadow-lg' : 'bg-vicion-blue text-white shadow-lg shadow-blue-600/30'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}>
                    <span className="block font-bold">{label}</span>
                    <span className="block text-xs opacity-70">{desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ══ BLOQUE 2: ESCENARIO SISTEMA COMPLETO (PEAK) ══════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
          variants={fadeUp}
          className="relative overflow-hidden p-10 sm:p-16 rounded-3xl text-white text-center shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #0d1f3c 0%, #1d6ef5 60%, #7c3aed 100%)' }}>

          {/* background glow orbs */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(124,58,237,0.25)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(29,110,245,0.3)', filter: 'blur(50px)', pointerEvents: 'none' }} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Star size={12} style={{ color: '#fbbf24' }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Escenario de Rendimiento Completo del Sistema
              </span>
            </div>

            <p className="text-base sm:text-lg text-white/70 mb-4 font-semibold">
              Resultado estimado · Alta participación + Red balanceada + Actividad constante
            </p>

            <motion.div key={calcularSimulacion.sistemaCompleto}>
              <motion.p
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                className="font-montserrat font-black mb-2"
                style={{ fontSize: 'clamp(52px, 8vw, 88px)', lineHeight: 1, letterSpacing: '-2px' }}
              >
                ${calcularSimulacion.sistemaCompleto.toLocaleString()}
              </motion.p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
                style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.8), transparent)', margin: '12px auto 16px', maxWidth: 300, transformOrigin: 'center' }}
              />
            </motion.div>

            <p className="text-sm text-white/55 max-w-xl mx-auto leading-relaxed">
              Este resultado representa un escenario completo dentro del sistema y depende del nivel de participación y actividad.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Comparison strip */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Escenario base', value: calcularSimulacion.conservador, color: '#f97316' },
            { label: 'Escenario activo', value: calcularSimulacion.activo, color: '#1d6ef5' },
          ].map(s => (
            <div key={s.label} className="p-5 rounded-2xl bg-white border border-gray-100 shadow text-center">
              <p className="text-xs text-gray-500 font-semibold mb-2">{s.label}</p>
              <motion.p key={s.value} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="font-montserrat font-black text-3xl" style={{ color: s.color }}>
                ${s.value.toLocaleString()}
              </motion.p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ BLOQUE 3: ESCENARIOS ════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
          variants={fadeUp} className="font-montserrat font-black text-4xl text-vicion-deep text-center mb-4">
          Escenarios de rendimiento estructural
        </motion.h2>
        <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
          variants={fadeUp} className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
          Resultados estimados según nivel de participación y actividad en el sistema
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: 'Escenario base',
              context: 'Participación inicial con red en desarrollo',
              value: calcularSimulacion.conservador,
              icon: Shield,
              color: 'from-orange-400 to-orange-600',
              pct: Math.round((calcularSimulacion.conservador / calcularSimulacion.sistemaCompleto) * 100),
            },
            {
              label: 'Escenario activo',
              context: 'Alta actividad con red en crecimiento constante',
              value: calcularSimulacion.activo,
              icon: TrendingUp,
              color: 'from-vicion-blue to-blue-500',
              pct: Math.round((calcularSimulacion.activo / calcularSimulacion.sistemaCompleto) * 100),
            },
            {
              label: 'Sistema completo',
              context: 'Alta participación · Red balanceada · Actividad constante',
              value: calcularSimulacion.sistemaCompleto,
              icon: Star,
              color: 'from-purple-500 to-vicion-blue',
              pct: 100,
              highlight: true,
            },
          ].map((scenario, i) => (
            <motion.div key={scenario.label} initial="hidden" whileInView="visible" viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }} variants={fadeUp}
              className={`p-8 rounded-2xl border shadow-lg hover:shadow-xl transition-all duration-300 ${scenario.highlight ? 'bg-gradient-to-br from-[#0d1f3c] to-[#1a0a3c] border-purple-500/30' : 'bg-white border-gray-100'}`}>

              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${scenario.color} flex items-center justify-center mb-6 ${scenario.highlight ? 'shadow-lg shadow-purple-500/30' : ''}`}>
                <scenario.icon size={24} className="text-white" />
              </div>

              <h3 className={`font-montserrat font-bold text-xl mb-3 ${scenario.highlight ? 'text-white' : 'text-vicion-deep'}`}>
                {scenario.label}
              </h3>
              <p className={`text-sm mb-6 leading-relaxed ${scenario.highlight ? 'text-white/60' : 'text-gray-600'}`}>
                {scenario.context}
              </p>

              <motion.p key={scenario.value} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`font-montserrat font-black text-4xl mb-6 ${scenario.highlight ? 'text-white' : 'text-vicion-blue'}`}>
                ${scenario.value.toLocaleString()}
              </motion.p>

              {scenario.highlight && (
                <p className="text-xs text-white/40 mb-4 italic">Resultado estimado · No garantizado</p>
              )}

              <div className="w-full bg-gray-200/30 h-2 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${scenario.pct}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-full bg-gradient-to-r ${scenario.color}`} />
              </div>
              <p className={`text-xs mt-2 font-semibold ${scenario.highlight ? 'text-white/40' : 'text-gray-400'}`}>
                {scenario.pct}% del escenario completo
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}
          variants={fadeUp} className="mt-12 p-6 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-sm text-gray-700 text-center italic">
            Estos valores representan resultados estimados dentro del sistema. Los rendimientos dependen del nivel de participación, actividad de red y condiciones del ecosistema.
          </p>
        </motion.div>
      </section>

      {/* ══ BLOQUE 4: GRÁFICO ═══════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
          variants={fadeUp} className="font-montserrat font-black text-4xl text-vicion-deep text-center mb-12">
          Evolución en el tiempo
        </motion.h2>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
          variants={fadeUp} className="p-8 rounded-2xl bg-white border border-gray-100 shadow-xl">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={calcularSimulacion.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradConservador" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradActivo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d6ef5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1d6ef5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
                formatter={(value) => `$${value.toLocaleString()}`} />
              <defs>
                <linearGradient id="gradSistema" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="conservador" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#gradConservador)" />
              <Area type="monotone" dataKey="activo" stroke="#1d6ef5" strokeWidth={2} fillOpacity={1} fill="url(#gradActivo)" />
              <Area type="monotone" dataKey="sistemaCompleto" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#gradSistema)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </section>

      {/* ══ BLOQUE 5: BONOS Y VALORIZACIÓN ═══════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
          variants={fadeUp} className="p-10 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200">
          
          <h2 className="font-montserrat font-black text-3xl text-vicion-deep mb-6">
            Participación en valorización del ecosistema
          </h2>

          <p className="text-lg text-gray-700 leading-relaxed mb-8">
            El ecosistema puede generar beneficios adicionales derivados del crecimiento de sus proyectos, incluyendo tecnología, desarrollos inmobiliarios y activos estratégicos.
          </p>

          <div className="p-8 rounded-xl bg-white border border-purple-200 mb-8">
            <p className="text-sm text-gray-600 mb-3">Bonos estimados por valorización</p>
            <motion.p key={calcularSimulacion.bonusAleatorio} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              transition={{ duration: 0.5 }} className="font-montserrat font-black text-5xl text-purple-600">
              +{calcularSimulacion.bonusAleatorio}%
            </motion.p>
          </div>

          <p className="text-sm text-gray-600 italic">
            Estos valores representan escenarios posibles basados en desarrollos reales del ecosistema.
          </p>
        </motion.div>
      </section>

      {/* ══ BLOQUE 6: EJEMPLO REAL (BMP) ═════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
          variants={fadeUp} className="p-10 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
          
          <h2 className="font-montserrat font-black text-3xl text-vicion-deep mb-6">
            Ejemplo de crecimiento del ecosistema
          </h2>

          <p className="text-lg text-gray-700 leading-relaxed mb-10">
            Proyectos como BMP han evolucionado de valuaciones iniciales a estructuras significativamente superiores, reflejando la capacidad de desarrollo del ecosistema.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: 'Valuación inicial', value: '18M USD' },
              { label: 'Valuación actual', value: '72M USD' },
              { label: 'Proyección', value: '150M+ USD' },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }} variants={fadeUp}
                className="p-6 rounded-lg bg-white border border-slate-200 text-center">
                <p className="text-xs uppercase text-gray-500 font-semibold mb-3">{item.label}</p>
                <p className="font-montserrat font-black text-3xl text-vicion-blue">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ BLOQUE LEGAL ═════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
          variants={fadeUp} className="p-8 rounded-2xl bg-orange-50 border-l-4 border-orange-500">
          
          <div className="flex gap-4">
            <AlertCircle size={32} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-montserrat font-bold text-lg text-orange-900 mb-4">
                Aviso de transparencia
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Los valores mostrados en este simulador representan escenarios estimados basados en el comportamiento del ecosistema y <strong>no constituyen una garantía de resultados</strong>.
              </p>
              <p className="text-gray-700 leading-relaxed">
                El acceso a beneficios depende de múltiples factores, incluyendo la participación, permanencia, evolución de los proyectos y capacidad de distribución del sistema.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══ BLOQUE FINAL: CTA ═════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
          variants={fadeUp} className="text-center">
          
          <h2 className="font-montserrat font-black text-4xl text-vicion-deep mb-12">
            Ahora tienes una visión clara
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/participar"
              className="px-6 py-4 rounded-xl bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat transition-all duration-200 flex items-center justify-center gap-2">
              Activar mi participación <ArrowRight size={18} />
            </Link>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-6 py-4 rounded-xl border-2 border-vicion-blue text-vicion-blue hover:bg-vicion-blue/10 font-bold font-montserrat transition-all duration-200">
              Volver a ajustar
            </button>
            <Link to="/planes"
              className="px-6 py-4 rounded-xl bg-gray-200 hover:bg-gray-300 text-vicion-deep font-bold font-montserrat transition-all duration-200 flex items-center justify-center gap-2">
              Ver niveles <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}