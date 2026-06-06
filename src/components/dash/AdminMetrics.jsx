import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Users, CreditCard, Crown, ShoppingBag } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AlertCenter from './AlertCenter';

const revenueToday = 12450;
const conversionRate = 8.2;
const newUsers = 342;
const paidOrders = 47;

const topLeaders = [
  { name: 'Roberto García', network: 142, active: 98, revenue: 18500 },
  { name: 'María López', network: 126, active: 87, revenue: 15200 },
  { name: 'Carlos Mendez', network: 108, active: 76, revenue: 12800 },
];

const topPlans = [
  { name: 'Growth Plan', purchases: 234, revenue: 23400, uptake: 42 },
  { name: 'Premium Plus', purchases: 156, revenue: 31200, uptake: 28 },
  { name: 'Start Plan', purchases: 98, revenue: 9800, uptake: 18 },
];

const revenueChart = [
  { hora: '00:00', ingresos: 280 },
  { hora: '04:00', ingresos: 150 },
  { hora: '08:00', ingresos: 920 },
  { hora: '12:00', ingresos: 2100 },
  { hora: '16:00', ingresos: 3200 },
  { hora: '20:00', ingresos: 4800 },
];

const conversionChart = [
  { día: 'Lun', tasa: 9.2 },
  { día: 'Mar', tasa: 8.8 },
  { día: 'Mié', tasa: 9.5 },
  { día: 'Jue', tasa: 10.1 },
  { día: 'Vie', tasa: 8.2 },
];

export default function AdminMetrics() {
  const [timeframe, setTimeframe] = useState('today');

  const checkAlerts = async () => {
    try {
      await fetch('/api/functions/alertMonitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversionRate,
          paymentChange: -15,
          registrationChange: -8.5
        })
      });
    } catch (error) {
      console.error('Alert check failed:', error);
    }
  };

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
          PANEL ADMINISTRATIVO
        </p>
        <h2 style={{ color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: 28, margin: '0 0 12px 0' }}>
          Admin Metrics
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          Control centralizado de KPIs y alertas del ecosistema.
        </p>
      </motion.div>

      {/* Top 4 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>INGRESOS HOY</p>
          <p style={{ color: '#10b981', fontSize: 32, fontWeight: 900, margin: 0 }}>${(revenueToday / 1000).toFixed(1)}K</p>
          <p style={{ color: '#10b981', fontSize: 11, fontWeight: 600, margin: '4px 0 0 0' }}>↑ +12.5%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>CONVERSION RATE</p>
          <p style={{ color: '#3b82f6', fontSize: 32, fontWeight: 900, margin: 0 }}>{conversionRate}%</p>
          <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, margin: '4px 0 0 0' }}>↓ -2.3%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}
        >
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>NUEVOS USUARIOS</p>
          <p style={{ color: '#a855f7', fontSize: 32, fontWeight: 900, margin: 0 }}>{newUsers}</p>
          <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, margin: '4px 0 0 0' }}>↓ -8.5%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-xl"
          style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}
        >
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 8px 0' }}>PAGOS COMPLETADOS</p>
          <p style={{ color: '#fb923c', fontSize: 32, fontWeight: 900, margin: 0 }}>{paidOrders}</p>
          <p style={{ color: '#ef4444', fontSize: 11, fontWeight: 600, margin: '4px 0 0 0' }}>↓ -15%</p>
        </motion.div>
      </div>

      {/* Alert Center */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(239,68,68,0.25)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <p style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>
              CENTRO DE ALERTAS
            </p>
          </div>
          <button
            onClick={checkAlerts}
            style={{
              background: 'rgba(59,130,246,0.2)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#3b82f6',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Verificar ahora
          </button>
        </div>
        <AlertCenter />
      </motion.div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>INGRESOS EN TIEMPO REAL</p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={revenueChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="hora" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Conversion Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-8 rounded-2xl"
        style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
      >
        <p style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 24 }}>TASA DE CONVERSIÓN (ÚLTIMOS 5 DÍAS)</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={conversionChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="día" stroke="rgba(255,255,255,0.3)" />
            <YAxis stroke="rgba(255,255,255,0.3)" />
            <Tooltip contentStyle={{ background: '#0a1628', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: 'white' }} />
            <Bar dataKey="tasa" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Leaders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-8 rounded-2xl"
          style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Crown size={18} style={{ color: '#a855f7' }} />
            <p style={{ color: '#a855f7', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>
              TOP LÍDERES
            </p>
          </div>

          <div className="space-y-4">
            {topLeaders.map((leader, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="p-4 rounded-xl"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{i + 1}. {leader.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0 0' }}>
                      {leader.active}/{leader.network} activos
                    </p>
                  </div>
                  <p style={{ color: '#a855f7', fontSize: 13, fontWeight: 700 }}>${(leader.revenue / 1000).toFixed(1)}K</p>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(leader.active / leader.network) * 100}%`,
                      background: 'linear-gradient(90deg, #a855f7, #c084fc)',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Top Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-8 rounded-2xl"
          style={{ background: 'rgba(13,31,60,0.6)', border: '1px solid rgba(59,130,246,0.15)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag size={18} style={{ color: '#fb923c' }} />
            <p style={{ color: '#fb923c', fontSize: 10, fontWeight: 700, letterSpacing: 2, margin: 0, fontFamily: 'Montserrat, sans-serif' }}>
              TOP PLANES
            </p>
          </div>

          <div className="space-y-4">
            {topPlans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="p-4 rounded-xl"
                style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{plan.name}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0 0' }}>
                      {plan.purchases} compras
                    </p>
                  </div>
                  <p style={{ color: '#fb923c', fontSize: 13, fontWeight: 700 }}>${(plan.revenue / 1000).toFixed(1)}K</p>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${plan.uptake}%`,
                      background: 'linear-gradient(90deg, #fb923c, #f97316)',
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}