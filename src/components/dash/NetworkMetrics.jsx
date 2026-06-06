import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, TrendingUp, Crown, Activity } from 'lucide-react';

// Mock network data
const DAILY_REFERRALS = [
  { date: 'Lun', nuevos: 12, activos: 145 },
  { date: 'Mar', nuevos: 18, activos: 163 },
  { date: 'Mié', nuevos: 15, activos: 178 },
  { date: 'Jue', nuevos: 22, activos: 200 },
  { date: 'Vie', nuevos: 28, activos: 228 },
  { date: 'Sáb', nuevos: 25, activos: 253 },
  { date: 'Dom', nuevos: 16, activos: 269 },
];

const LINE_GROWTH = [
  { week: 'Sem 1', izquierda: 45, derecha: 52 },
  { week: 'Sem 2', izquierda: 62, derecha: 71 },
  { week: 'Sem 3', izquierda: 88, derecha: 95 },
  { week: 'Sem 4', izquierda: 125, derecha: 138 },
];

const TOP_LEADERS = [
  { id: 1, name: 'Carlos Mendez', activos: 45, nuevos_semana: 12, comisiones: 5200, engagement: 92 },
  { id: 2, name: 'María García', activos: 38, nuevos_semana: 9, comisiones: 4100, engagement: 88 },
  { id: 3, name: 'Juan López', activos: 32, nuevos_semana: 7, comisiones: 3400, engagement: 85 },
];

const USER_ACTIVITY = [
  { usuario: 'Carlos M.', actividad: 95, últimos_7_días: 24, estatus: 'activo' },
  { usuario: 'María G.', actividad: 88, últimos_7_días: 18, estatus: 'activo' },
  { usuario: 'Juan L.', actividad: 82, últimos_7_días: 15, estatus: 'activo' },
  { usuario: 'Sofia R.', actividad: 65, últimos_7_días: 8, estatus: 'moderado' },
  { usuario: 'Diego P.', actividad: 42, últimos_7_días: 3, estatus: 'bajo' },
];

export default function NetworkMetrics() {
  const [selectedLeader, setSelectedLeader] = useState(null);

  const totalReferrals = DAILY_REFERRALS.reduce((sum, d) => sum + d.nuevos, 0);
  const totalActive = DAILY_REFERRALS[DAILY_REFERRALS.length - 1].activos;
  const activeLeaders = TOP_LEADERS.length;
  const lineGrowth = (LINE_GROWTH[3].izquierda + LINE_GROWTH[3].derecha) / 
                     (LINE_GROWTH[0].izquierda + LINE_GROWTH[0].derecha) * 100 - 100;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      {/* Level A header card */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0B0F1A 0%, #101826 100%)', border: '1px solid rgba(59,130,246,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 600px 300px at 15% 50%, rgba(59,130,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 12px 0' }}>
            Métricas de Red
          </p>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: 28, margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
            Network Activity & Growth
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 14, lineHeight: 1.65, margin: 0, maxWidth: 480 }}>
            Visualiza el crecimiento de tu red, identifica líderes y monitorea la actividad en tiempo real.
          </p>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Nuevos Esta Semana', value: totalReferrals, color: '#3b82f6', Icon: TrendingUp, delay: 0 },
          { label: 'Usuarios Activos', value: totalActive, color: '#3b82f6', Icon: Users, delay: 0.04 },
          { label: 'Líderes Activos', value: activeLeaders, color: '#7C3AED', Icon: Crown, delay: 0.08 },
          { label: 'Crecimiento Líneas', value: `+${lineGrowth.toFixed(0)}%`, color: '#7C3AED', Icon: Activity, delay: 0.12 },
        ].map(({ label, value, color, Icon, delay }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="p-6 rounded-xl"
            style={{ background: '#0B0F1A', border: `1px solid ${color}18`, boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Icon size={13} style={{ color }} />
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{label}</p>
            </div>
            <p style={{ color, fontSize: 30, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Nuevos Referidos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-8 rounded-2xl"
        style={{ background: '#0B0F1A', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
      >
        <p style={{ color: 'rgba(59,130,246,0.6)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', marginBottom: 20, textTransform: 'uppercase' }}>Nuevos Referidos Por Día</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={DAILY_REFERRALS}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Bar dataKey="nuevos" fill="#3b82f6" name="Nuevos" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Usuarios Activos Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="p-8 rounded-2xl"
        style={{ background: '#0B0F1A', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
      >
        <p style={{ color: 'rgba(59,130,246,0.6)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', marginBottom: 20, textTransform: 'uppercase' }}>Usuarios Activos en Red</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={DAILY_REFERRALS}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Line
              type="monotone"
              dataKey="activos"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Crecimiento por Línea */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-8 rounded-2xl"
        style={{ background: '#0B0F1A', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
      >
        <p style={{ color: 'rgba(59,130,246,0.6)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', marginBottom: 20, textTransform: 'uppercase' }}>Crecimiento por Línea</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={LINE_GROWTH}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Legend />
            <Bar dataKey="izquierda" fill="#3b82f6" name="Izquierda" />
            <Bar dataKey="derecha" fill="#7C3AED" name="Derecha" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top Líderes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="p-8 rounded-2xl"
        style={{ background: '#0B0F1A', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
      >
        <p style={{ color: 'rgba(59,130,246,0.6)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', marginBottom: 20, textTransform: 'uppercase' }}>Top Líderes Activos</p>

        <div className="space-y-4">
          {TOP_LEADERS.map((leader, idx) => (
            <motion.div
              key={leader.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + idx * 0.08 }}
              onClick={() => setSelectedLeader(leader.id)}
              className="p-6 rounded-xl cursor-pointer transition-all hover:scale-102"
              style={{
                background: selectedLeader === leader.id
                  ? 'rgba(124,58,237,0.12)'
                  : 'rgba(8,18,40,0.6)',
                border: selectedLeader === leader.id
                  ? '1px solid rgba(124,58,237,0.35)'
                  : '1px solid rgba(59,130,246,0.1)',
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: idx === 0 ? 'rgba(124,58,237,0.15)' : 'rgba(59,130,246,0.1)', border: `1px solid ${idx === 0 ? 'rgba(124,58,237,0.35)' : 'rgba(59,130,246,0.25)'}` }}
                  >
                    <span style={{ color: idx === 0 ? '#A78BFA' : '#93C5FD', fontSize: 12, fontWeight: 800 }}>{idx + 1}</span>
                  </div>
                  <div>
                    <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, margin: '0 0 4px 0' }}>
                      {leader.name}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                      {leader.activos} usuarios en red
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p style={{ color: '#3b82f6', fontSize: 14, fontWeight: 700, margin: 0 }}>
                    +{leader.nuevos_semana} esta semana
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0 0' }}>
                    Engagement: {leader.engagement}%
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>COMISIONES</p>
                  <p style={{ color: '#3b82f6', fontSize: 13, fontWeight: 700, margin: 0 }}>
                    ${leader.comisiones}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(124,58,237,0.1)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>ACTIVOS</p>
                  <p style={{ color: '#7C3AED', fontSize: 13, fontWeight: 700, margin: 0 }}>
                    {leader.activos}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(124,58,237,0.1)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>SCORE</p>
                  <p style={{ color: '#7C3AED', fontSize: 13, fontWeight: 700, margin: 0 }}>
                    {leader.engagement}/100
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Actividad por Usuario */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-8 rounded-2xl"
        style={{ background: '#0B0F1A', border: '1px solid rgba(59,130,246,0.1)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
      >
        <p style={{ color: 'rgba(59,130,246,0.6)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', marginBottom: 16, textTransform: 'uppercase' }}>Actividad por Usuario</p>

        <div className="space-y-3">
          {USER_ACTIVITY.map((user, i) => {
            const statusColor = user.estatus === 'activo' ? '#3b82f6' : user.estatus === 'moderado' ? '#7C3AED' : '#6b7280';
            return (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.08)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{user.usuario}</p>
                  </div>
                  <p style={{ color: statusColor, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
                    {user.estatus}
                  </p>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Últimos 7 días: {user.últimos_7_días} acciones</p>
                  <p style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700 }}>{user.actividad}% actividad</p>
                </div>

                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${user.actividad}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${statusColor}, ${statusColor}80)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="p-8 rounded-2xl"
        style={{ background: '#0B0F1A', border: '1px solid rgba(124,58,237,0.12)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
      >
        <p style={{ color: 'rgba(124,58,237,0.7)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', marginBottom: 12, textTransform: 'uppercase' }}>Insights</p>
        <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>Red en crecimiento</h3>

        <div className="space-y-3">
          {[
            { label: '3 líderes activos', desc: 'Carlos, María y Juan impulsan el crecimiento de la red.' },
            { label: 'Crecimiento acelerado', desc: 'Línea derecha crece 165% en últimas 4 semanas.' },
            { label: 'Engagement alto', desc: 'Promedio de 88% en líderes activos.' },
          ].map((insight, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-lg" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#7C3AED' }} />
              <div>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: '0 0 2px 0' }}>{insight.label}</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0 }}>{insight.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}