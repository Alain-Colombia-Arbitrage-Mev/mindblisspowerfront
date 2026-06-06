import { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Users, Target } from 'lucide-react';

// Mock revenue data
const DAILY_DATA = [
  { date: 'Lun', total: 3200, plan_start: 1200, plan_growth: 1500, plan_pro: 500 },
  { date: 'Mar', total: 4100, plan_start: 1400, plan_growth: 2100, plan_pro: 600 },
  { date: 'Mié', total: 3800, plan_start: 1100, plan_growth: 2200, plan_pro: 500 },
  { date: 'Jue', total: 5200, plan_start: 1800, plan_growth: 2800, plan_pro: 600 },
  { date: 'Vie', total: 6100, plan_start: 2100, plan_growth: 3200, plan_pro: 800 },
  { date: 'Sáb', total: 5800, plan_start: 1900, plan_growth: 3100, plan_pro: 800 },
  { date: 'Dom', total: 4900, plan_start: 1600, plan_growth: 2800, plan_pro: 500 },
];

const WEEKLY_DATA = [
  { week: 'Sem 1', total: 32500, plan_start: 12000, plan_growth: 15500, plan_pro: 5000 },
  { week: 'Sem 2', total: 38200, plan_start: 13500, plan_growth: 18200, plan_pro: 6500 },
  { week: 'Sem 3', total: 41800, plan_start: 15200, plan_growth: 20100, plan_pro: 6500 },
  { week: 'Sem 4', total: 45600, plan_start: 17100, plan_growth: 21800, plan_pro: 6700 },
];

const PLAN_PERFORMANCE = [
  { name: 'Growth', users: 1245, revenue: 62250, percentage: 48.5, color: '#3b82f6' },
  { name: 'Start', users: 892, revenue: 44600, percentage: 34.8, color: '#60a5fa' },
  { name: 'Pro', users: 234, revenue: 23400, percentage: 18.2, color: '#a855f7' },
];

export default function RevenueMetrics() {
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'

  const chartData = viewMode === 'daily' ? DAILY_DATA : WEEKLY_DATA;
  const totalRevenue = chartData.reduce((sum, item) => sum + item.total, 0);
  const avgTicket = (totalRevenue / chartData.length).toFixed(2);
  const revenuePerUser = Math.floor(totalRevenue / PLAN_PERFORMANCE.reduce((sum, p) => sum + p.users, 0));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: '0 0 12px 0', fontFamily: 'Montserrat, sans-serif' }}>
          MÉTRICAS DE INGRESOS
        </p>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, margin: '0 0 12px 0' }}>
          Revenue & Sales Analytics
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Visualiza qué planes se venden más y cuánto ingresa cada uno a la plataforma.
        </p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={18} style={{ color: '#3b82f6' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>TOTAL {viewMode === 'daily' ? 'HOY' : 'ESTA SEMANA'}</p>
          </div>
          <p style={{ color: '#3b82f6', fontSize: 32, fontWeight: 900, margin: 0 }}>${totalRevenue.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Target size={18} style={{ color: '#10b981' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>TICKET PROMEDIO</p>
          </div>
          <p style={{ color: '#10b981', fontSize: 32, fontWeight: 900, margin: 0 }}>${avgTicket}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} style={{ color: '#a855f7' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>INGRESOS/USUARIO</p>
          </div>
          <p style={{ color: '#a855f7', fontSize: 32, fontWeight: 900, margin: 0 }}>${revenuePerUser}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} style={{ color: '#fb923c' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: 0 }}>USUARIOS ACTIVOS</p>
          </div>
          <p style={{ color: '#fb923c', fontSize: 32, fontWeight: 900, margin: 0 }}>
            {PLAN_PERFORMANCE.reduce((sum, p) => sum + p.users, 0).toLocaleString()}
          </p>
        </motion.div>
      </div>

      {/* Chart Toggle */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => setViewMode('daily')}
          className="px-6 py-2 rounded-lg font-semibold transition-all"
          style={{
            background: viewMode === 'daily' ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(59,130,246,0.2))' : 'rgba(255,255,255,0.05)',
            border: viewMode === 'daily' ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
            color: viewMode === 'daily' ? '#3b82f6' : 'rgba(255,255,255,0.5)',
          }}
        >
          Vista Diaria
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => setViewMode('weekly')}
          className="px-6 py-2 rounded-lg font-semibold transition-all"
          style={{
            background: viewMode === 'weekly' ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(59,130,246,0.2))' : 'rgba(255,255,255,0.05)',
            border: viewMode === 'weekly' ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
            color: viewMode === 'weekly' ? '#3b82f6' : 'rgba(255,255,255,0.5)',
          }}
        >
          Vista Semanal
        </motion.button>
      </div>

      {/* Total Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>INGRESOS TOTALES</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey={viewMode === 'daily' ? 'date' : 'week'} stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Revenue by Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>INGRESOS POR PLAN</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey={viewMode === 'daily' ? 'date' : 'week'} stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Legend />
            <Bar dataKey="plan_start" fill="#60a5fa" name="Plan Start" />
            <Bar dataKey="plan_growth" fill="#3b82f6" name="Plan Growth" />
            <Bar dataKey="plan_pro" fill="#a855f7" name="Plan Pro" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top 3 Plans */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 20 }}>TOP 3 PLANES MÁS ELEGIDOS</p>

        <div className="space-y-4">
          {PLAN_PERFORMANCE.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-6 rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${plan.color}15, ${plan.color}08)`,
                border: `1px solid ${plan.color}30`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white"
                      style={{ background: plan.color }}
                    >
                      {index + 1}
                    </div>
                    <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>
                      {plan.name}
                    </h3>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>
                    {plan.users.toLocaleString()} usuarios activos
                  </p>
                </div>
                <div className="text-right">
                  <p style={{ color: plan.color, fontSize: 20, fontWeight: 900, margin: 0 }}>
                    ${plan.revenue.toLocaleString()}
                  </p>
                  <p style={{ color: plan.color, fontSize: 12, fontWeight: 700, margin: '4px 0 0 0' }}>
                    {plan.percentage}% del total
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${plan.percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1 + 0.2 }}
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${plan.color}, ${plan.color}80)`,
                    borderRadius: 4,
                  }}
                />
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>PRECIO PROMEDIO</p>
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>
                    ${Math.round(plan.revenue / plan.users)}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '0 0 4px 0' }}>CONVERSIÓN</p>
                  <p style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: 0 }}>
                    {(plan.percentage / 3).toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-8 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(34,197,94,0.08))', border: '1px solid rgba(16,185,129,0.25)' }}
      >
        <p style={{ color: '#10b981', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12, fontFamily: 'Montserrat, sans-serif' }}>INSIGHTS</p>
        <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: '0 0 16px 0' }}>Qué está funcionando</h3>

        <div className="space-y-3">
          {[
            { label: 'Plan Growth domina', desc: '48.5% del ingreso total. Es tu producto estrella.' },
            { label: 'Crecimiento consistente', desc: 'Los ingresos crecen 15% semana a semana.' },
            { label: 'Oportunidad en Pro', desc: 'Plan Pro es solo 18.2%. Potencial de crecimiento aquí.' },
          ].map((insight, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#10b981' }} />
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