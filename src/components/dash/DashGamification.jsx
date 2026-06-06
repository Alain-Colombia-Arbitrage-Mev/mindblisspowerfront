import { Star, Award, Zap, Users, CheckCircle, TrendingUp, Lock } from 'lucide-react';

const achievements = [
  { icon: '🚀', label: 'Primer acceso', desc: 'Ingresaste al sistema', unlocked: true },
  { icon: '⚡', label: 'Primera activación', desc: 'Activaste tu membresía', unlocked: true },
  { icon: '👥', label: 'Primer referido', desc: 'Invitaste a alguien', unlocked: false },
  { icon: '🏗️', label: 'Primer equipo', desc: 'Tienes 3+ miembros activos', unlocked: false },
  { icon: '🏆', label: 'Primer nivel', desc: 'Subiste de nivel interno', unlocked: false },
];

const LEVEL = 7;
const XP = 340;
const XP_NEXT = 500;
const RANK_POSITION = 142;
const TOTAL_USERS = 1840;
const TOP_PCT = Math.round((RANK_POSITION / TOTAL_USERS) * 100);

const xpHistory = [
  { label: 'Acceso a la plataforma', xp: 50, date: 'Hoy' },
  { label: 'Módulo completado', xp: 120, date: 'Ayer' },
  { label: 'Activación confirmada', xp: 170, date: 'Hace 3 días' },
];

export default function DashGamification() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Hero XP card */}
      <div style={{ background: 'linear-gradient(135deg,#0d1f3c,#0a1628)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 20, padding: 28, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: 250, height: 200, background: 'radial-gradient(ellipse,rgba(59,130,246,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700, letterSpacing: 3, fontFamily: 'Montserrat,sans-serif', marginBottom: 6 }}>TU EVOLUCIÓN</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 2 }}>Nivel interno</p>
            <p style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 900, color: 'white', fontSize: 52, lineHeight: 1 }}>{LEVEL}</p>
          </div>
          <div style={{ paddingBottom: 8 }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>de 50</p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right', paddingBottom: 4 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 2 }}>Posición en ranking</p>
            <p style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, color: '#60a5fa', fontSize: 22 }}>#{RANK_POSITION}</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Top {TOP_PCT}% del sistema</p>
          </div>
        </div>

        {/* XP bar */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Experiencia acumulada</span>
            <span style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700 }}>{XP} / {XP_NEXT} XP</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${(XP / XP_NEXT) * 100}%`, background: 'linear-gradient(90deg,#1d6ef5,#60a5fa)', borderRadius: 4, transition: 'width 1s ease' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 4 }}>Sigue avanzando para subir al nivel {LEVEL + 1}</p>
        </div>

        {/* Motivation */}
        <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>🔥 Estás en el top {TOP_PCT}% del sistema. Sube de posición completando cursos y activando tu estructura.</p>
        </div>
      </div>

      {/* Grid row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {/* Achievements */}
        <div style={{ background: 'linear-gradient(135deg,#0d1f3c,#0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Montserrat,sans-serif', marginBottom: 14 }}>LOGROS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {achievements.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: a.unlocked ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${a.unlocked ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
                <span style={{ fontSize: 20, opacity: a.unlocked ? 1 : 0.25 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: a.unlocked ? 'white' : 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 600 }}>{a.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{a.desc}</p>
                </div>
                {a.unlocked
                  ? <CheckCircle size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                  : <Lock size={12} style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* XP History */}
        <div style={{ background: 'linear-gradient(135deg,#0d1f3c,#0a1628)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 16, padding: 20 }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Montserrat,sans-serif', marginBottom: 14 }}>EXPERIENCIA GANADA</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {xpHistory.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>{h.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{h.date}</p>
                </div>
                <span style={{ fontFamily: 'Montserrat,sans-serif', fontWeight: 800, color: '#3b82f6', fontSize: 16 }}>+{h.xp}</span>
              </div>
            ))}
          </div>

          {/* Notifications */}
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>NOTIFICACIONES</p>
            {[
              '🏆 Nuevo nivel alcanzado',
              '📚 Curso completado',
              '⬆️ Subiste en el ranking',
            ].map((n, i) => (
              <p key={i} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginBottom: 5 }}>{n}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}