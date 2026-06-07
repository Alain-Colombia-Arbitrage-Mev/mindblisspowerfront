import { motion } from 'framer-motion';
import { Lock, CheckCircle, TrendingUp, Users, Shield, BookOpen, ChevronRight, Unlock, Star, Zap } from 'lucide-react';

const STATES = {
  basic: {
    color: '#3b82f6',
    colorDim: 'rgba(59,130,246,0.15)',
    colorBorder: 'rgba(59,130,246,0.35)',
    glow: '0 0 40px rgba(59,130,246,0.2)',
    label: 'ESTADO 1',
    title: 'Tu acceso está activo',
    subtitle: 'Estás dentro del ecosistema. Aquí tienes tu información, beneficios y estado de membresía.',
    emoji: '🔷',
  },
  training: {
    color: '#f59e0b',
    colorDim: 'rgba(245,158,11,0.15)',
    colorBorder: 'rgba(245,158,11,0.35)',
    glow: '0 0 40px rgba(245,158,11,0.2)',
    label: 'ESTADO 2',
    title: 'Modo crecimiento',
    subtitle: 'Estás en formación activa. Completa los módulos para desbloquear el sistema completo.',
    emoji: '🔶',
  },
  builder: {
    color: '#34d399',
    colorDim: 'rgba(52,211,153,0.15)',
    colorBorder: 'rgba(52,211,153,0.35)',
    glow: '0 0 40px rgba(52,211,153,0.2)',
    label: 'ESTADO 3',
    title: 'Sistema completo activo',
    subtitle: 'Tienes acceso completo a estructura, red, progreso y todas las funcionalidades.',
    emoji: '✅',
  },
};

export default function MemberStateView({ memberState, onGrow, onComplete, user }) {
  const s = STATES[memberState];

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* State indicator strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {['basic', 'training', 'builder'].map((st, i) => {
          const cfg = STATES[st];
          const isActive = memberState === st;
          const isPast = ['basic','training','builder'].indexOf(memberState) > i;
          return (
            <div key={st} style={{ flex: 1, display: 'flex', flex_direction: 'column', gap: 4 }}>
              <div style={{ height: 4, borderRadius: 2, background: isActive || isPast ? cfg.color : 'rgba(255,255,255,0.08)', transition: 'background 0.5s ease' }} />
              <p style={{ color: isActive ? cfg.color : 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 700, letterSpacing: 2, fontFamily: 'Montserrat,sans-serif', marginTop: 4 }}>{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Main state card */}
      <motion.div
        key={memberState}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'linear-gradient(135deg,#0d1f3c,#0a1628)',
          border: `1px solid ${s.colorBorder}`,
          borderRadius: 20,
          padding: 28,
          boxShadow: s.glow,
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}>
        {/* Glow blob */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${s.color}20, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            style={{ width: 52, height: 52, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.colorDim, border: `2px solid ${s.colorBorder}`, fontSize: 24, flexShrink: 0 }}>
            {s.emoji}
          </motion.div>
          <div>
            <p style={{ color: s.color, fontSize: 10, fontWeight: 700, letterSpacing: 3, fontFamily: 'Montserrat,sans-serif', marginBottom: 2 }}>{s.label}</p>
            <h2 style={{ color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 900, fontSize: 22, lineHeight: 1.1 }}>{s.title}</h2>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.6, marginBottom: 22 }}>{s.subtitle}</p>

        {/* Progress bar animated */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Progreso en el sistema</span>
            <span style={{ color: s.color, fontSize: 11, fontWeight: 700 }}>
              {memberState === 'basic' ? '33%' : memberState === 'training' ? '66%' : '100%'}
            </span>
          </div>
          <div style={{ height: 7, background: 'rgba(255,255,255,0.07)', borderRadius: 4 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: memberState === 'basic' ? '33%' : memberState === 'training' ? '66%' : '100%' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ height: '100%', background: `linear-gradient(90deg, ${s.color}, ${s.color}aa)`, borderRadius: 4 }}
            />
          </div>
        </div>

        {/* Content by state */}
        {memberState === 'basic' && <BasicContent color={s.color} colorDim={s.colorDim} colorBorder={s.colorBorder} onGrow={onGrow} user={user} />}
        {memberState === 'training' && <TrainingContent color={s.color} colorDim={s.colorDim} colorBorder={s.colorBorder} onComplete={onComplete} />}
        {memberState === 'builder' && <BuilderContent color={s.color} colorDim={s.colorDim} colorBorder={s.colorBorder} />}
      </motion.div>
    </div>
  );
}

function BasicContent({ color, colorDim, colorBorder, onGrow, user }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { icon: Shield, label: 'Estado', value: '● Activo', color },
          { icon: Star, label: 'Nivel activado', value: 'Start', color },
          { icon: CheckCircle, label: 'Beneficios', value: '4 disponibles', color },
        ].map(item => (
          <div key={item.label} style={{ padding: '14px 16px', borderRadius: 12, background: colorDim, border: `1px solid ${colorBorder}` }}>
            <item.icon size={16} style={{ color, marginBottom: 6 }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 2 }}>{item.label}</p>
            <p style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>BENEFICIOS ACTIVOS</p>
        {['Acceso a la plataforma', 'Comunidad activa', 'Formación inicial', 'Elegibilidad a beneficios'].map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <CheckCircle size={13} style={{ color, flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>{b}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>BLOQUEADO</p>
        {['Red de referidos', 'Estructura binaria', 'Incentivos avanzados'].map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, opacity: 0.35 }}>
            <Lock size={12} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{b}</span>
          </div>
        ))}
      </div>

      <button onClick={onGrow}
        style={{ width: '100%', padding: '14px 0', borderRadius: 12, background: `linear-gradient(135deg,${color},#60a5fa)`, border: 'none', color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        Desbloquear crecimiento <ChevronRight size={18} />
      </button>
    </>
  );
}

function TrainingContent({ color, colorDim, colorBorder, onComplete }) {
  const modules = ['Qué es Mindbliss Power', 'Cómo funciona', 'Cómo explicar', 'Qué no decir', 'Cómo invitar'];
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>FORMACIÓN ACTIVA</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {modules.map((mod, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: i < 2 ? colorDim : 'rgba(255,255,255,0.02)', border: `1px solid ${i < 2 ? colorBorder : 'rgba(255,255,255,0.07)'}` }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: i < 2 ? `${color}30` : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i < 2 ? <CheckCircle size={12} style={{ color }} /> : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}>{i + 1}</span>}
              </div>
              <span style={{ color: i < 2 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)', fontSize: 13 }}>{mod}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>BLOQUEADO HASTA COMPLETAR FORMACIÓN</p>
        {['Red de referidos', 'Incentivos del sistema'].map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, opacity: 0.35 }}>
            <Lock size={12} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{b}</span>
          </div>
        ))}
      </div>

      <button onClick={onComplete}
        style={{ width: '100%', padding: '14px 0', borderRadius: 12, background: `linear-gradient(135deg,${color},#fbbf24)`, border: 'none', color: 'white', fontFamily: 'Montserrat,sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        Completar formación <Zap size={18} />
      </button>
    </>
  );
}

function BuilderContent({ color, colorDim, colorBorder }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginBottom: 20 }}>
        {[
          { icon: Users, label: 'Red activa', value: '12 miembros' },
          { icon: TrendingUp, label: 'Progreso', value: '68%' },
          { icon: Unlock, label: 'Acceso', value: 'Completo' },
          { icon: Zap, label: 'Actividad', value: '7 días activo' },
        ].map(item => (
          <div key={item.label} style={{ padding: '14px 16px', borderRadius: 12, background: colorDim, border: `1px solid ${colorBorder}` }}>
            <item.icon size={16} style={{ color, marginBottom: 6 }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 2 }}>{item.label}</p>
            <p style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>TODO DESBLOQUEADO</p>
        {['Estructura binaria', 'Red de referidos', 'Incentivos del sistema', 'Panel completo de progresión', 'Actividad e historial'].map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <CheckCircle size={13} style={{ color, flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{b}</span>
          </div>
        ))}
      </div>
    </>
  );
}