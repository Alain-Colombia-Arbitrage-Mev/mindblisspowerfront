import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Lock, CheckCircle, AlertCircle, Phone, Mail, UserPlus, Share2, Target, BookOpen, Activity, Award, Lightbulb, GraduationCap, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function DashLeaderPanel({ user }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [showTraining, setShowTraining] = useState(false);

  // Mock member data - check access requirements
  const memberData = {
    isFormationComplete: true,
    isActiveParticipant: true,
    hasAcceptedRules: true,
    monthsActive: 5,
  };

  const canAccessPanel = memberData.isFormationComplete && memberData.isActiveParticipant && memberData.hasAcceptedRules;

  // Lock screen if requirements not met
  if (!canAccessPanel) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <Lock size={40} style={{ color: '#3b82f6' }} />
          </div>
          <h2 style={{ color: 'white', fontSize: 24, fontWeight: 900, marginBottom: 12, fontFamily: 'Montserrat, sans-serif' }}>
            Acceso en preparación
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Para activar el panel de crecimiento debes completar tu formación y validar tu participación.
          </p>
          <button style={{ background: 'linear-gradient(135deg,#1d6ef5,#3b82f6)', color: 'white', padding: '12px 28px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
            Completar formación →
          </button>
        </div>
      </div>
    );
  }

  // Mock data for active panel
  const teamStats = {
    activeMembers: 12,
    newThisWeek: 3,
    totalTeamParticipation: 45000,
  };

  const directTeam = [
    { id: 1, name: 'Carlos Mendez', status: 'Activo', level: 'Growth', progress: 65 },
    { id: 2, name: 'María López', status: 'Activo', level: 'Start', progress: 40 },
    { id: 3, name: 'Juan García', status: 'En proceso', level: 'Start', progress: 25 },
  ];

  const trainingModules = [
    { id: 1, title: 'Cómo explicar Vicion Care Plan', progress: 100, status: 'completo' },
    { id: 2, title: 'Cómo usar el simulador', progress: 100, status: 'completo' },
    { id: 3, title: 'Cómo responder dudas', progress: 75, status: 'en-progreso' },
    { id: 4, title: 'Cómo guiar nuevos miembros', progress: 50, status: 'en-progreso' },
  ];

  const recentActivity = [
    { type: 'new-registration', title: 'Nuevo registro', desc: 'Juan Pérez se registró en tu red', time: 'Hace 2 horas' },
    { type: 'activation', title: 'Activación completada', desc: 'Carlos Mendez completó su participación', time: 'Hace 1 día' },
    { type: 'milestone', title: 'Equipo activo', desc: 'Tu equipo alcanzó 12 miembros activos', time: 'Hace 3 días' },
  ];

  const activityChartData = [
    { week: 'Semana 1', registros: 2, activaciones: 1 },
    { week: 'Semana 2', registros: 3, activaciones: 2 },
    { week: 'Semana 3', registros: 1, activaciones: 1 },
    { week: 'Semana 4', registros: 3, activaciones: 2 },
  ];

  const leadershipProgression = {
    currentLevel: 'Líder Intermedio',
    progress: 72,
    nextLevel: 'Líder Avanzado',
    requirements: [
      { desc: '10+ miembros activos', met: true },
      { desc: 'Formación completa', met: true },
      { desc: 'Acompañamiento consistente', met: false },
    ],
  };

  // Next recommended action
  const nextAction = {
    priority: 'high',
    icon: Phone,
    title: 'Acompañar a Juan García',
    desc: 'Lleva 7 días en el sistema pero aún no completa su formación',
    action: 'Contactar ahora',
    color: '#f59e0b',
  };

  // Network training status
  const networkTrainingStatus = {
    total: 12,
    completed: 8,
    inProgress: 3,
    notStarted: 1,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* ══ BLOQUE 1: VISIÓN GENERAL ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.05 }}
        variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="flex gap-4">
          <AlertCircle size={20} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Comunicación responsable</p>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.5 }}>
              El uso del sistema requiere comunicación responsable. Está prohibido prometer beneficios garantizados o inducir a error.
            </p>
          </div>
        </div>
      </motion.section>

      {/* ══ BLOQUE 1: VISIÓN GENERAL ════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(29,110,245,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>TU ESTRUCTURA</p>
        <h2 style={{ color: 'white', fontSize: 28, fontWeight: 900, marginBottom: 24 }}>Tu estructura de crecimiento</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8 }}>PERSONAS ACTIVAS</p>
            <p style={{ color: 'white', fontSize: 32, fontWeight: 900 }}>{teamStats.activeMembers}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8 }}>NUEVOS ESTA SEMANA</p>
            <p style={{ color: '#10b981', fontSize: 32, fontWeight: 900 }}>+{teamStats.newThisWeek}</p>
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8 }}>PARTICIPACIÓN TOTAL DE EQUIPO</p>
            <p style={{ color: '#a78bfa', fontSize: 32, fontWeight: 900 }}>${(teamStats.totalTeamParticipation / 1000).toFixed(0)}K</p>
          </div>
        </div>

        <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(59,130,246,0.15)' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6 }}>
            Tu estructura crece en función de tu actividad, formación y acompañamiento.
          </p>
        </div>
      </motion.section>

      {/* ══ BLOQUE 2: ESTRUCTURA VISUAL ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>RED</p>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Tu red</h3>

        <div className="flex flex-col items-center space-y-6">
          {/* Root */}
          <div className="w-32 h-16 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '2px solid rgba(59,130,246,0.4)' }}>
            <div className="text-center">
              <p style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>Tú</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Líder</p>
            </div>
          </div>

          {/* Lines */}
          <div className="w-0.5 h-8" style={{ background: 'rgba(59,130,246,0.3)' }} />

          {/* Left-Right */}
          <div className="flex justify-center gap-16">
            {/* Left */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 mb-6" style={{ background: 'rgba(59,130,246,0.3)' }} />
              <div className="w-28 h-14 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" style={{ background: 'rgba(29,110,245,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
                onClick={() => setSelectedNode('left')}>
                <div className="text-center">
                  <p style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>Carlos M.</p>
                  <p style={{ color: '#10b981', fontSize: 9 }}>● Activo</p>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 mb-6" style={{ background: 'rgba(59,130,246,0.3)' }} />
              <div className="w-28 h-14 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" style={{ background: 'rgba(29,110,245,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}
                onClick={() => setSelectedNode('right')}>
                <div className="text-center">
                  <p style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>María L.</p>
                  <p style={{ color: '#10b981', fontSize: 9 }}>● Activo</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedNode && (
          <div className="mt-8 p-6 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <p style={{ color: 'white', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Perfil resumido</p>
            <div className="space-y-3">
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Nivel: <span style={{ color: 'white', fontWeight: 600 }}>Growth</span></p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Estado: <span style={{ color: '#10b981', fontWeight: 600 }}>Activo</span></p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Progreso: <span style={{ color: 'white', fontWeight: 600 }}>65%</span></p>
            </div>
          </div>
        )}
      </motion.section>

      {/* ══ BLOQUE 3: EQUIPO DIRECTO ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.15 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>EQUIPO</p>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Tu equipo directo</h3>

        <div className="space-y-3">
          {directTeam.map((member) => (
            <div key={member.id} className="p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{member.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Nivel: {member.level}</p>
                </div>
                <div className="text-right">
                  <p style={{ color: member.status === 'Activo' ? '#10b981' : '#f59e0b', fontSize: 12, fontWeight: 600 }}>
                    {member.status === 'Activo' ? '●' : '○'} {member.status}
                  </p>
                </div>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full" style={{ width: `${member.progress}%`, background: '#3b82f6' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 4 }}>{member.progress}% de progreso</p>
            </div>
          ))}
        </div>

        <button style={{ marginTop: 20, background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.3)', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
          Contactar / Guiar
        </button>
      </motion.section>

      {/* ══ BLOQUE 4: FORMACIÓN ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>FORMACIÓN</p>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Centro de formación</h3>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 20 }}>
          Completa los módulos para desbloquear nuevas herramientas y niveles.
        </p>

        <div className="p-5 rounded-xl mb-6" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="flex gap-3">
            <AlertCircle size={18} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 1.5 }}>
              El uso del sistema requiere comunicación responsable. Está prohibido prometer beneficios garantizados o inducir a error.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {trainingModules.map((module) => (
            <div key={module.id} className="p-5 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: module.status === 'completo' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)' }}>
                    <CheckCircle size={16} style={{ color: module.status === 'completo' ? '#10b981' : '#3b82f6' }} />
                  </div>
                  <p style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{module.title}</p>
                </div>
                <p style={{ color: module.status === 'completo' ? '#10b981' : '#3b82f6', fontSize: 11, fontWeight: 700 }}>
                  {module.progress}%
                </p>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full" style={{ width: `${module.progress}%`, background: module.status === 'completo' ? '#10b981' : '#3b82f6' }} />
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ══ BLOQUE 5: ACTIVIDAD RECIENTE ════════════════════════════════════ */}
      {/* ══ BLOQUE: SIGUIENTE ACCIÓN RECOMENDADA ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: `linear-gradient(135deg, ${nextAction.color}15, ${nextAction.color}08)`, border: `1px solid ${nextAction.color}30` }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${nextAction.color}25` }}>
            <nextAction.icon size={20} style={{ color: nextAction.color }} />
          </div>
          <div className="flex-1">
            <p style={{ color: nextAction.color, fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>SIGUIENTE ACCIÓN</p>
            <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{nextAction.title}</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 12 }}>{nextAction.desc}</p>
            <button style={{ background: nextAction.color, color: '#0a1628', padding: '10px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
              {nextAction.action} →
            </button>
          </div>
        </div>
      </motion.section>

      {/* ══ BLOQUE: ESTADO DE FORMACIÓN DE RED ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.22 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>FORMACIÓN DE RED</p>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Estado de formación de tu equipo</h3>
        
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 6 }}>Total</p>
            <p style={{ color: '#3b82f6', fontSize: 22, fontWeight: 900, margin: 0 }}>{networkTrainingStatus.total}</p>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 6 }}>Completada</p>
            <p style={{ color: '#10b981', fontSize: 22, fontWeight: 900, margin: 0 }}>{networkTrainingStatus.completed}</p>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 6 }}>En curso</p>
            <p style={{ color: '#fb923c', fontSize: 22, fontWeight: 900, margin: 0 }}>{networkTrainingStatus.inProgress}</p>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 6 }}>No iniciada</p>
            <p style={{ color: '#ef4444', fontSize: 22, fontWeight: 900, margin: 0 }}>{networkTrainingStatus.notStarted}</p>
          </div>
        </div>

        <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <motion.div
            animate={{ width: `${(networkTrainingStatus.completed / networkTrainingStatus.total) * 100}%` }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)' }}
          />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 8 }}>
          {networkTrainingStatus.completed} de {networkTrainingStatus.total} miembros con formación completa
        </p>

        <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <div className="flex items-start gap-3">
            <Lightbulb size={16} style={{ color: '#3b82f6', marginTop: 2, flexShrink: 0 }} />
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: 0, lineHeight: 1.5 }}
            >Tu liderazgo depende de que tu red esté bien formada. Prioriza a los miembros que aún no completan su formación.</p>
          </div>
        </div>
      </motion.section>

      {/* ══ BLOQUE 5: ACTIVIDAD RECIENTE ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.25 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>ACTIVIDAD</p>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Actividad reciente</h3>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={activityChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Line type="monotone" dataKey="registros" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="activaciones" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-8 space-y-3">
          {recentActivity.map((activity, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <Activity size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
              <div className="flex-1">
                <p style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{activity.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{activity.desc}</p>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, flexShrink: 0 }}>{activity.time}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ══ BLOQUE 7: BENEFICIOS DE RED ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.35 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)' }}>
        <p style={{ color: '#a78bfa', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>BENEFICIOS</p>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Acceso a beneficios por crecimiento</h3>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>Acceso estimado a beneficios</p>
        <motion.p initial={{ scale: 0.8 }} animate={{ scale: 1 }} style={{ color: '#a78bfa', fontSize: 40, fontWeight: 900, marginBottom: 12 }}>
          $18,500 USD
        </motion.p>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.6 }}>
          Derivado de la actividad de tu estructura y del desarrollo del ecosistema.
        </p>
      </motion.section>

      {/* ══ BLOQUE 8: PROGRESO DE LÍDER ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.4 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>PROGRESO</p>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Tu evolución como líder</h3>

        <div className="mb-8">
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>Nivel actual</p>
          <p style={{ color: '#3b82f6', fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{leadershipProgression.currentLevel}</p>
          <div className="w-full h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full" style={{ width: `${leadershipProgression.progress}%`, background: '#3b82f6' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 6 }}>{leadershipProgression.progress}% hacia {leadershipProgression.nextLevel}</p>
        </div>

        <div className="space-y-3">
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, marginBottom: 8 }}>REQUISITOS</p>
          {leadershipProgression.requirements.map((req, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: req.met ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)' }}>
                <CheckCircle size={14} style={{ color: req.met ? '#10b981' : 'rgba(255,255,255,0.3)' }} />
              </div>
              <p style={{ color: req.met ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)', fontSize: 12 }}>{req.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ══ BLOQUE 9: SOPORTE ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.45 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>SOPORTE</p>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Tu guía dentro del sistema</h3>

        <div className="p-6 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 12 }}>LÍDER SUPERIOR</p>
          <p style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Roberto García</p>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Phone size={14} /> Llamar
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Mail size={14} /> Enviar mensaje
            </button>
          </div>
        </div>
      </motion.section>

      {/* ══ BLOQUE 10: HERRAMIENTAS ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.5 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>HERRAMIENTAS</p>
        <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Herramientas disponibles</h3>

        <div className="space-y-3 mb-8">
          {['Enlace de invitación', 'Código personal', 'Acceso guiado para nuevos usuarios', 'Material de apoyo'].map((tool, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#10b981' }}>
                <CheckCircle size={14} style={{ color: '#0a1628' }} />
              </div>
              <p style={{ color: 'white', fontSize: 13 }}>{tool}</p>
            </div>
          ))}
        </div>

        <button style={{ width: '100%', background: 'linear-gradient(135deg,#1d6ef5,#3b82f6)', color: 'white', padding: '12px 24px', borderRadius: 12, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <UserPlus size={16} /> Invitar nuevo miembro
        </button>
      </motion.section>

      {/* ══ BLOQUE TRANSPARENCIA ════════════════════════════════════ */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.5 }}
        variants={fadeUp} className="p-6 rounded-2xl" style={{ background: 'rgba(255,159,64,0.08)', border: '1px solid rgba(255,159,64,0.2)' }}>
        <div className="flex gap-4">
          <AlertCircle size={20} style={{ color: '#f97316', flexShrink: 0 }} />
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 1.6 }}>
              El crecimiento dentro del sistema depende de la actividad, formación y evolución del ecosistema.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>
              Los beneficios asociados no constituyen ingresos garantizados y están sujetos al desarrollo del entorno.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}