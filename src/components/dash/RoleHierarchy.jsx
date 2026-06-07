import { Shield, Lock, Unlock, TrendingUp, Users, BookOpen, Network } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const ROLES = [
  {
    id: 'member',
    name: 'Miembro',
    icon: Users,
    color: '#3b82f6',
    bgColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.2)',
    level: 1,
    requirements: [
      { item: 'Activación completada', icon: '✓' },
      { item: 'Perfil básico lleno', icon: '✓' },
      { item: 'Aceptación de términos', icon: '✓' },
    ],
    unlocks: [
      'Acceso a panel privado',
      'Ver tu estructura básica',
      'Acceso a formación inicial',
      'Contacto con mentor',
    ],
    responsibilities: [
      'Cumplir las normas de comunicación',
      'Mantener actividad regular',
      'Ser respetuoso en comunidad',
    ],
  },
  {
    id: 'leader',
    name: 'Líder',
    icon: Shield,
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.2)',
    level: 2,
    requirements: [
      { item: 'Ser Miembro por 60+ días', icon: '✓' },
      { item: 'Completar toda la formación', icon: '✓' },
      { item: '3+ personas activas en red', icon: '✓' },
      { item: 'Actividad consistente', icon: '✓' },
    ],
    unlocks: [
      'Panel de liderazgo expandido',
      'Ver analítica de equipo detallada',
      'Herramientas de coaching',
      'Acceso a recursos premium',
      'Capacidad de entrenar a otros',
    ],
    responsibilities: [
      'Guiar activamente a tu equipo',
      'Mantener estándares de comunicación',
      'Reportar actividad mensual',
      'Ser ejemplo dentro del ecosistema',
    ],
  },
  {
    id: 'director',
    name: 'Director',
    icon: TrendingUp,
    color: '#fb923c',
    bgColor: 'rgba(251,146,60,0.08)',
    borderColor: 'rgba(251,146,60,0.2)',
    level: 3,
    requirements: [
      { item: 'Ser Líder por 120+ días', icon: '✓' },
      { item: '15+ personas activas en red', icon: '✓' },
      { item: 'Estructura balanceada (3+ en cada rama)', icon: '✓' },
      { item: 'Demostración de liderazgo consistente', icon: '✓' },
      { item: '90%+ cumplimiento de requisitos', icon: '✓' },
    ],
    unlocks: [
      'Dashboard ejecutivo completo',
      'Acceso a herramientas estratégicas',
      'Programa de directores',
      'Participación en decisiones',
      'Recursos de capacitación avanzada',
      'Mayor visibilidad en plataforma',
    ],
    responsibilities: [
      'Supervisar múltiples líderes',
      'Garantizar integridad del ecosistema',
      'Participar en eventos de liderazgo',
      'Contribuir a cultura de plataforma',
    ],
  },
];

export default function RoleHierarchy() {
  const currentRole = ROLES[0]; // Mock: currently a member

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(251,146,60,0.08))', border: '1px solid rgba(59,130,246,0.25)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Shield size={24} style={{ color: '#3b82f6' }} />
          <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat,sans-serif', margin: 0 }}>
            JERARQUÍA DE ROLES
          </p>
        </div>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 26, marginBottom: 8 }}>
          Progresión profesional
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Tu rol dentro de Mindbliss Power se define por tu actividad, formación y estructura — no solo por dinero. Cada rol te da más herramientas, visibilidad y responsabilidad.
        </p>
      </motion.div>

      {/* Key Principle */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(139,92,246,0.08))', border: '2px solid rgba(168,85,247,0.25)' }}>
        <div className="flex gap-4">
          <div className="text-3xl flex-shrink-0">📊</div>
          <div>
            <p style={{ color: '#c084fc', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>EL PRINCIPIO</p>
            <p style={{ color: 'white', fontSize: 15, fontWeight: 800, marginBottom: 8, lineHeight: 1.6 }}>
              Los roles se ganan, no se compran.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
              Tu rol refleja tu compromiso, actividad y capacidad de liderazgo. Cada nivel requiere cumplimiento de criterios específicos que demuestran tu dedicación al sistema.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Role Cards */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
          ROLES Y PROGRESIÓN
        </p>
        <div className="space-y-6">
          {ROLES.map((role, idx) => (
            <motion.div
              key={role.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              variants={fadeUp}
              className="rounded-2xl p-8 overflow-hidden"
              style={{
                background: role.bgColor,
                border: `2px solid ${role.borderColor}`,
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${role.color}20`, border: `2px solid ${role.color}40` }}>
                    <role.icon size={24} style={{ color: role.color }} />
                  </div>
                  <div>
                    <p style={{ color: role.color, fontSize: 11, fontWeight: 700, letterSpacing: 1, margin: '0 0 4px 0' }}>
                      NIVEL {role.level}
                    </p>
                    <h3 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 20, margin: 0 }}>
                      {role.name}
                    </h3>
                  </div>
                </div>
                {currentRole.id === role.id && (
                  <div style={{
                    background: role.color,
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    TÚ ERES AQUÍ
                  </div>
                )}
              </div>

              {/* Grid: Requirements | Unlocks | Responsibilities */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Requirements */}
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
                    SE REQUIERE
                  </p>
                  <div className="space-y-2">
                    {role.requirements.map((req, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span style={{ color: role.color, fontWeight: 700, fontSize: 12, marginTop: 2, flexShrink: 0 }}>
                          {req.icon}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{req.item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Unlocks */}
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
                    DESBLOQUEA
                  </p>
                  <div className="space-y-2">
                    {role.unlocks.map((unlock, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Unlock size={14} style={{ color: role.color, marginTop: 2, flexShrink: 0 }} />
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{unlock}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Responsibilities */}
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
                    RESPONSABILIDADES
                  </p>
                  <div className="space-y-2">
                    {role.responsibilities.map((resp, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span style={{ color: role.color, fontWeight: 700, fontSize: 12, marginTop: 2, flexShrink: 0 }}>
                          •
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{resp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Bar (if not last) */}
              {idx < ROLES.length - 1 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${role.borderColor}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Progreso al siguiente nivel</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '45%' }}
                        transition={{ duration: 1, delay: 0.5 }}
                        style={{ height: '100%', background: role.color }}
                      />
                    </div>
                    <span style={{ color: role.color, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>45%</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.5 }}
        variants={fadeUp} className="p-8 rounded-2xl" style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
          LO QUE SE EVALÚA
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Actividad', desc: 'Participación consistente' },
            { label: 'Formación', desc: 'Módulos completados' },
            { label: 'Estructura', desc: 'Personas activas en red' },
            { label: 'Responsabilidad', desc: 'Cumplimiento de normas' },
          ].map((metric, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <p style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{metric.label}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>{metric.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* What Role Are You Ready For */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.6 }}
        variants={fadeUp} className="p-8 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.08))', border: '2px solid rgba(16,185,129,0.25)' }}>
        <h3 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 20, marginBottom: 12 }}>
          ¿Qué rol estás listo para?
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
          Tu progresión depende de tu compromiso. Cada requisito existe para garantizar que cada rol tiene la capacidad de liderar con integridad.
        </p>
        <button
          style={{
            padding: '14px 28px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1d6ef5, #3b82f6)',
            border: 'none',
            color: 'white',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Montserrat,sans-serif',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >
          Ver tu progreso actual
        </button>
      </motion.div>
    </div>
  );
}