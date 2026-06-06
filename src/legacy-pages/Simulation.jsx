import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts';
import { ArrowRight, CheckCircle, TrendingUp, Zap } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 36 }, visible: { opacity: 1, y: 0 } };

export default function Simulation() {
  const [nivel, setNivel] = useState(1000);
  const [años, setAños] = useState(5);
  const [tipoParticipacion, setTipoParticipacion] = useState('activo');
  const [conCrecimiento, setConCrecimiento] = useState(true);

  const niveles = [500, 1000, 2500, 5000, 10000, 25000];
  const tipos = { conservador: 0.8, activo: 1, expansivo: 1.2 };

  // Lógica de cálculo
  const calcularSimulacion = useMemo(() => {
    const factor_tiempo = años * 0.08;
    const factor_tipo = tipos[tipoParticipacion];
    const factor_crecimiento = conCrecimiento ? 1.15 : 1;
    
    const resultado = nivel * factor_tiempo * factor_tipo * factor_crecimiento;
    const acceso_mensual = Math.round(resultado / 12);
    
    return {
      resultado,
      acceso_mensual,
      progreso: Math.min((años / 10) * 100, 100),
    };
  }, [nivel, años, tipoParticipacion, conCrecimiento]);

  // Datos para gráfico (etapas)
  const chartData = Array.from({ length: años + 1 }, (_, i) => {
    const factor_tiempo = i * 0.08;
    const factor_tipo = tipos[tipoParticipacion];
    const factor_crecimiento = conCrecimiento ? 1.15 : 1;
    return {
      año: i,
      acceso: Math.round(nivel * factor_tiempo * factor_tipo * factor_crecimiento),
      label: `Año ${i}`,
    };
  });

  const etapas = [
    { nombre: 'Acceso inicial', año: 0, desc: 'Comienzas tu participación' },
    { nombre: 'Beneficios habilitados', año: Math.ceil(años / 3), desc: 'Se activan tus beneficios' },
    { nombre: 'Acceso ampliado', año: Math.ceil(años / 1.5), desc: 'Expandiste tu acceso' },
    { nombre: 'Continuidad estructurada', año: años, desc: 'Sistema consolidado' },
  ];

  const beneficios = [
    'Ingreso de continuidad',
    'Beneficio de permanencia',
    'Protección del valor',
    'Acceso a condiciones preferentes',
  ];

  return (
    <div className="overflow-hidden">

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="relative min-h-[70vh] flex items-center justify-center pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-vicion-deep via-[#071830] to-[#050f1f]" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(ellipse at 50% 30%, rgba(96,165,250,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 60%, rgba(59,130,246,0.08) 0%, transparent 60%)',
            animation: 'breathe 8s ease-in-out infinite',
          }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-vicion-deep/40 to-vicion-deep/80" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="font-montserrat font-black text-5xl sm:text-6xl lg:text-6xl text-white mb-6 leading-tight">
            Visualiza lo que puedes construir en el tiempo
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-white/70 mb-10 leading-relaxed max-w-2xl mx-auto">
            Ajusta tu participación y observa cómo evoluciona tu acceso a beneficios dentro del sistema.
          </motion.p>
        </div>

        <style>{`
          @keyframes breathe {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </section>

      {/* ══ BLOQUE 1: INPUTS ════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="mb-16 text-center">
            <h2 className="font-montserrat font-black text-4xl text-vicion-deep mb-4">
              Configura tu escenario
            </h2>
            <p className="text-gray-600">Ajusta los parámetros y observa los cambios en tiempo real</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp}
            className="p-8 rounded-2xl border-2 border-vicion-blue/20 hover:border-vicion-blue/40 transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, rgba(29,110,245,0.05) 0%, rgba(59,130,246,0.02) 100%)' }}>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">

              {/* SELECTOR 1: Nivel */}
              <div>
                <label className="block font-semibold text-gray-800 mb-4">Nivel de participación</label>
                <div className="grid grid-cols-3 gap-2">
                  {niveles.map(n => (
                    <button key={n} onClick={() => setNivel(n)}
                      className={`px-3 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                        nivel === n
                          ? 'bg-vicion-blue text-white shadow-lg shadow-blue-600/30'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      ${n}
                    </button>
                  ))}
                </div>
              </div>

              {/* SELECTOR 2: Tiempo */}
              <div>
                <label className="block font-semibold text-gray-800 mb-4">Tiempo de proyección: {años} año{años !== 1 ? 's' : ''}</label>
                <input type="range" min="1" max="10" value={años} onChange={(e) => setAños(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-vicion-blue" />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>1 año</span>
                  <span>10 años</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* SELECTOR 3: Tipo */}
              <div>
                <label className="block font-semibold text-gray-800 mb-4">Tipo de participación</label>
                <div className="space-y-2">
                  {Object.keys(tipos).map(tipo => (
                    <button key={tipo} onClick={() => setTipoParticipacion(tipo)}
                      className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-all duration-200 ${
                        tipoParticipacion === tipo
                          ? 'bg-vicion-blue text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* SELECTOR 4: Crecimiento */}
              <div>
                <label className="block font-semibold text-gray-800 mb-4">Participación activa</label>
                <div className="space-y-2">
                  <button onClick={() => setConCrecimiento(true)}
                    className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-all duration-200 ${
                      conCrecimiento
                        ? 'bg-vicion-blue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    Con desarrollo activo
                  </button>
                  <button onClick={() => setConCrecimiento(false)}
                    className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-all duration-200 ${
                      !conCrecimiento
                        ? 'bg-vicion-blue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    Solo participación
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ BLOQUE 2: GRÁFICO ══════════════════════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl text-vicion-deep text-center mb-16">
            Evolución estimada
          </motion.h2>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="p-8 rounded-2xl bg-white border border-gray-200 shadow-lg">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAcceso" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1d6ef5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1d6ef5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}
                  formatter={(value) => `$${value.toLocaleString()} USD`}
                />
                <Area type="monotone" dataKey="acceso" stroke="#1d6ef5" strokeWidth={3} fillOpacity={1} fill="url(#colorAcceso)" />
              </AreaChart>
            </ResponsiveContainer>

            {/* Etapas animadas */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
              {etapas.map((etapa, i) => (
                <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }} variants={fadeUp}
                  className="p-4 rounded-xl bg-gradient-to-br from-vicion-blue/10 to-blue-500/5 border border-vicion-blue/20">
                  <p className="text-xs uppercase font-bold text-vicion-blue mb-1">Etapa {i + 1}</p>
                  <p className="font-bold text-gray-800 text-sm mb-2">{etapa.nombre}</p>
                  <p className="text-xs text-gray-600">{etapa.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ BLOQUE 3: SIMULACIÓN PERIÓDICA ═════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl text-vicion-deep text-center mb-16">
            Simulación de acceso periódico
          </motion.h2>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="p-12 rounded-2xl text-center border-2 border-vicion-blue/20"
            style={{ background: 'linear-gradient(135deg, rgba(29,110,245,0.08) 0%, rgba(59,130,246,0.03) 100%)' }}>
            
            <p className="text-gray-600 mb-4">Acceso estimado mensual</p>
            <motion.p key={calcularSimulacion.acceso_mensual} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }} className="font-montserrat font-black text-6xl text-vicion-blue mb-4">
              ${calcularSimulacion.acceso_mensual.toLocaleString()}
            </motion.p>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Basado en tu nivel de participación, tiempo de proyección y tipo de participación dentro del sistema.
            </p>

            <div className="mt-8 p-4 rounded-xl bg-white/50 border border-vicion-blue/20">
              <p className="text-xs text-gray-600 leading-relaxed">
                <strong>Importante:</strong> Esta visualización representa un escenario referencial dentro del ecosistema y depende de condiciones de participación y continuidad dentro del sistema.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ BLOQUE 4: BENEFICIOS DESBLOQUEADOS ══════════════════ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl text-vicion-deep text-center mb-16">
            Beneficios según este escenario
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {beneficios.map((b, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }} variants={fadeUp}
                className="flex items-start gap-4 p-6 rounded-xl bg-white border border-gray-200">
                <CheckCircle size={24} className="text-vicion-blue flex-shrink-0 mt-1" />
                <span className="font-semibold text-gray-800">{b}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ BLOQUE 5: PROGRESO PROYECTADO ══════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-4xl text-vicion-deep text-center mb-16">
            Tu evolución dentro del sistema
          </motion.h2>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
            variants={fadeUp} className="space-y-6">
            <div>
              <div className="flex justify-between mb-3">
                <span className="font-semibold text-gray-800">Progreso en {años} año{años !== 1 ? 's' : ''}</span>
                <span className="font-bold text-vicion-blue">{Math.round(calcularSimulacion.progreso)}%</span>
              </div>
              <motion.div animate={{ width: `${calcularSimulacion.progreso}%` }} transition={{ duration: 0.6 }}
                className="h-3 bg-gradient-to-r from-vicion-blue to-blue-500 rounded-full"></motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Nivel alcanzado</p>
                <p className="text-2xl font-bold text-vicion-blue">
                  {Math.ceil((calcularSimulacion.progreso / 100) * 5)} de 5
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Acceso acumulado</p>
                <p className="text-2xl font-bold text-vicion-deep">
                  ${Math.round(calcularSimulacion.resultado).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Factor de crecimiento</p>
                <p className="text-2xl font-bold text-vicion-blue">
                  {(tipos[tipoParticipacion] * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ BLOQUE 6: MENSAJE EMOCIONAL ════════════════════════ */}
      <section className="py-24 bg-vicion-deep text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.8 }}
            variants={fadeUp} className="space-y-6">
            <p className="text-3xl sm:text-4xl font-bold leading-relaxed">
              Esto no es inmediato.
            </p>
            <p className="text-3xl sm:text-4xl font-bold text-vicion-blue leading-relaxed">
              Pero es estructurado.
            </p>
            <p className="text-xl text-white/70 leading-relaxed max-w-2xl mx-auto mt-8">
              Y lo que es estructurado… se puede sostener.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══ BLOQUE FINAL: CONVERSIÓN ═══════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
            variants={fadeUp} className="font-montserrat font-black text-3xl sm:text-4xl text-vicion-deep mb-10">
            Ahora tienes claridad
          </motion.h2>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
            variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/planes"
              className="inline-flex items-center justify-center gap-2 bg-vicion-blue hover:bg-blue-500 text-white font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-600/25">
              Activar este escenario <ArrowRight size={18} />
            </Link>
            <Link to="/planes"
              className="inline-flex items-center justify-center gap-2 border border-vicion-blue/50 text-vicion-blue hover:bg-vicion-blue/10 font-bold font-montserrat px-8 py-4 rounded-xl transition-all duration-200">
              Ver planes <ArrowRight size={18} />
            </Link>
          </motion.div>

          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-vicion-blue font-semibold text-sm hover:text-blue-500 transition-colors">
            ← Volver a ajustar parámetros
          </button>
        </div>
      </section>
    </div>
  );
}