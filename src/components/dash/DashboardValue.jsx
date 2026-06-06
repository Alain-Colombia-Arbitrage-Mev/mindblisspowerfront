import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Shield, Zap, CheckCircle, AlertCircle, Award, Target } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function DashboardValue({ user }) {
  // Mock data for activated member
  const memberData = {
    level: 1000,
    monthsActive: 5,
    status: 'Activo',
    estimatedValue: 2400,
    stage: 'participación', // activación, participación, evolución, consolidación
  };

  // Evolution chart data
  const evolutionData = [
    { month: 'Inicio', value: 1000, stage: 'Activación' },
    { month: 'Mes 1', value: 1200, stage: 'Participación' },
    { month: 'Mes 3', value: 1600, stage: 'Participación' },
    { month: 'Mes 5', value: 2100, stage: 'Evolución' },
    { month: 'Mes 12', value: 3200, stage: 'Consolidación' },
  ];

  const benefits = [
    { title: 'Ingreso de continuidad', status: 'activo', desc: 'Acceso progresivo a beneficios' },
    { title: 'Beneficio de permanencia', status: 'activo', desc: 'Mientras continúes activo' },
    { title: 'Protección del valor', status: 'activo', desc: 'Tu participación se preserva' },
    { title: 'Acceso progresivo', status: 'en-desarrollo', desc: 'Desbloqueable con evolución' },
  ];

  const progressStages = [
    { id: 1, label: 'Activación', complete: true },
    { id: 2, label: 'Participación', complete: true },
    { id: 3, label: 'Evolución', complete: false },
    { id: 4, label: 'Consolidación', complete: false },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* ══ BLOQUE 1: RESUMEN PRINCIPAL ════════════════════════════════════ */}
      {/* Level A — hero card */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.2 }}
        variants={fadeUp} className="p-8 rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B0F1A 0%, #101826 100%)', border: '1px solid rgba(59,130,246,0.18)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 500px 300px at 15% 50%, rgba(59,130,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Tu Participación</p>
        
        <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, marginBottom: 20 }}>Tu participación activa</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>NIVEL ACTIVADO</p>
            <p style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>${memberData.level.toLocaleString()} USD</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>ESTADO</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#3b82f6' }} />
              <p style={{ color: '#93C5FD', fontSize: 16, fontWeight: 700 }}>{memberData.status}</p>
            </div>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6 }}>TIEMPO EN EL SISTEMA</p>
            <p style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>{memberData.monthsActive} meses</p>
          </div>
        </div>

        <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(59,130,246,0.15)' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>
            Tu participación forma parte del ecosistema y evoluciona según permanencia, nivel y desarrollo de proyectos.
          </p>
        </div>
      </motion.section>

      {/* ══ BLOQUE 2: ESCENARIO ACTUAL ════════════════════════════════════ */}
      {/* Level B — operational card */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.2, delay: 0.06 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: '#0B0F1A', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
        <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Escenario Actual</p>
        
        <div className="mb-10">
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>Acceso estimado a valor</p>
          <motion.p initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ color: 'white', fontSize: 44, fontWeight: 900 }}>
            ${memberData.estimatedValue.toLocaleString()} USD
          </motion.p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6 }}>
            Basado en el escenario seleccionado y la evolución del sistema.
          </p>
        </div>

        <button style={{ background: 'linear-gradient(135deg,#1d6ef5,#3b82f6)', color: 'white', padding: '12px 24px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
          Recalcular escenario →
        </button>
      </motion.section>

      {/* ══ BLOQUE 3: EVOLUCIÓN VISUAL ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.2, delay: 0.08 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: '#0B0F1A', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
        <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>EVOLUCIÓN</p>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Tu evolución proyectada</h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={evolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {['Acceso inicial', 'Beneficios activos', 'Expansión', 'Consolidación'].map((label, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ══ BLOQUE 4: BENEFICIOS ACTIVOS ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.2, delay: 0.1 }}
        variants={fadeUp} className="space-y-6">
        <div>
          <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Beneficios</p>
          <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>Beneficios dentro del sistema</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((benefit, i) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.08 }}
              variants={fadeUp} className="p-5 rounded-xl flex items-start gap-4" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: benefit.status === 'activo' ? 'rgba(59,130,246,0.1)' : 'rgba(100,116,139,0.08)', border: `1px solid ${benefit.status === 'activo' ? 'rgba(59,130,246,0.2)' : 'rgba(100,116,139,0.15)'}` }}>
                <CheckCircle size={20} style={{ color: benefit.status === 'activo' ? '#3b82f6' : '#64748B' }} />
              </div>
              <div>
                <p style={{ color: 'white', fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{benefit.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{benefit.desc}</p>
                <p style={{ color: benefit.status === 'activo' ? '#93C5FD' : '#64748B', fontSize: 10, fontWeight: 600, marginTop: 6 }}>
                  {benefit.status === 'activo' ? 'Activo' : 'En desarrollo'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ══ BLOQUE 5: VALORIZACIÓN DEL ECOSISTEMA ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.2, delay: 0.12 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: '#0B0F1A', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
        <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Ecosistema</p>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Evolución del ecosistema</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Valuación inicial', value: '18M USD' },
            { label: 'Valuación actual', value: '72M USD' },
            { label: 'Proyección', value: '150M+ USD' },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-xl text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8 }}>{item.label}</p>
              <p style={{ color: '#3b82f6', fontSize: 22, fontWeight: 900 }}>{item.value}</p>
            </div>
          ))}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>
          Estos desarrollos son parte del entorno que impulsa la generación de valor dentro del sistema.
        </p>
      </motion.section>

      {/* ══ BLOQUE 6: BONOS DINÁMICOS ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.2, delay: 0.14 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: '#0B0F1A', border: '1px solid rgba(124,58,237,0.12)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
        <p style={{ color: '#a78bfa', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Beneficios Adicionales</p>
        
        <div className="mb-10">
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>Acceso estimado a beneficios por valorización</p>
          <motion.p initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ color: '#A78BFA', fontSize: 44, fontWeight: 900 }}>
            +42%
          </motion.p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6 }}>
            Derivado del crecimiento del ecosistema y sus proyectos.
          </p>
        </div>
      </motion.section>

      {/* ══ BLOQUE 7: ESTADO DE PROGRESO ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.2, delay: 0.16 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: '#0B0F1A', border: '1px solid rgba(59,130,246,0.08)' }}>
        <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Progreso</p>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Tu progreso</h3>

        <div className="space-y-4">
          {progressStages.map((stage, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: stage.complete ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)', border: `1px solid ${stage.complete ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.1)'}` }}>
                {stage.complete ? (
                  <CheckCircle size={20} style={{ color: '#3b82f6' }} />
                ) : (
                  <div className="w-3 h-3 rounded-full" style={{ background: 'rgba(59,130,246,0.5)' }} />
                )}
              </div>
              <p style={{ color: stage.complete ? 'white' : 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600 }}>{stage.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ══ BLOQUE TRANSPARENCIA (OBLIGATORIO) ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.2, delay: 0.18 }}
        variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'rgba(8,15,28,0.7)', border: '1px solid rgba(59,130,246,0.1)' }}>
        <div className="flex gap-4">
          <AlertCircle size={14} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6 }}>
              Los valores mostrados representan escenarios estimados basados en el comportamiento del ecosistema y <strong>no constituyen una garantía de resultados</strong>.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>
              El acceso a beneficios depende de la participación, permanencia y desarrollo de los proyectos dentro del sistema.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}