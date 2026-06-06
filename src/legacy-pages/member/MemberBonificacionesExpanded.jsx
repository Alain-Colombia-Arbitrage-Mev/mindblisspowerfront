import { useMemo } from 'react';
import { TrendingUp, BarChart3, Calendar, Target } from 'lucide-react';
import platformDataCore from '@/lib/platformDataCore';
import { getAllDescendants } from '@/lib/warRoomDataAdapter';
import { calculateBonusProjection, calculateMemberStats } from '@/lib/expandedMemberDataset';
import { motion } from 'framer-motion';

export default function MemberBonificacionesExpanded() {
  const userId = localStorage.getItem('user_id');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

  const descendants = useMemo(() => {
    return getAllDescendants(userId, platformDataCore.network_nodes, platformDataCore.users);
  }, [userId]);

  const stats = useMemo(() => {
    return calculateMemberStats(userData, platformDataCore.users);
  }, [userData]);

  const bonusProjection = useMemo(() => {
    return calculateBonusProjection(userData, stats);
  }, [userData, stats]);

  // Monthly progression
  const monthlyData = [
    { month: 'Enero', personal: 145, network: 320, activity: 80 },
    { month: 'Febrero', personal: 158, network: 385, activity: 120 },
    { month: 'Marzo', personal: 172, network: 456, activity: 145 },
    { month: 'Abril', personal: 189, network: 523, activity: 180 },
    { month: 'Actual', personal: bonusProjection.personalBonus, network: bonusProjection.networkBonus, activity: bonusProjection.activityBonus },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl" style={{ background: 'linear-gradient(135deg, #060e1c 0%, #0a1628 100%)' }}>
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ color: 'white', fontSize: 32, fontWeight: 900, margin: '0 0 8px 0' }}>
          Bonificaciones y Rendimiento
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: 0 }}>
          Evolución histórica y proyecciones de tu generación de valor
        </p>
      </motion.div>

      {/* KEY METRICS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-4">
        {[
          { label: 'Este Mes', value: `$${bonusProjection.totalMonthly.toLocaleString()}`, color: '#3b82f6', icon: TrendingUp },
          { label: 'Promedio 3M', value: `$${Math.round(bonusProjection.totalMonthly * 0.92).toLocaleString()}`, color: '#10b981', icon: BarChart3 },
          { label: 'Acumulado Anual', value: `$${bonusProjection.annualProjection.toLocaleString()}`, color: '#8b5cf6', icon: Calendar },
          { label: 'Proyección Anual', value: `$${(bonusProjection.totalMonthly * 12).toLocaleString()}`, color: '#fb923c', icon: Target },
        ].map((metric, i) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={i}
              whileHover={{ translateY: -4 }}
              className="p-6 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(13,31,60,0.5), rgba(8,18,40,0.3))',
                border: `1px solid ${metric.color}30`,
                boxShadow: `0 4px 12px ${metric.color}15`,
              }}
            >
              <Icon size={20} style={{ color: metric.color, marginBottom: 8 }} />
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, margin: '0 0 6px 0' }}>
                {metric.label}
              </p>
              <p style={{ color: metric.color, fontSize: 24, fontWeight: 900, margin: 0 }}>
                {metric.value}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* BONUS BREAKDOWN */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-6">
        {[
          { label: 'Bonificación Personal', value: bonusProjection.personalBonus, description: 'De tu inversión', color: '#3b82f6' },
          { label: 'Bonificación de Red', value: bonusProjection.networkBonus, description: 'De tu estructura', color: '#10b981' },
          { label: 'Bonificación de Actividad', value: bonusProjection.activityBonus, description: 'Por movimiento', color: '#fb923c' },
        ].map((bonus, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 rounded-xl"
            style={{
              background: 'rgba(13,31,60,0.4)',
              border: `1px solid ${bonus.color}30`,
            }}
          >
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, margin: '0 0 8px 0' }}>
              {bonus.label}
            </p>
            <p style={{ color: bonus.color, fontSize: 28, fontWeight: 900, margin: '0 0 4px 0' }}>
              ${bonus.value.toLocaleString()}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
              {bonus.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* NETWORK CONTRIBUTION */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="p-6 rounded-xl" style={{ background: 'rgba(13,31,60,0.4)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Estructura de Red</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Rama Izquierda', value: stats.leftBranch, investment: `$${stats.leftInvestment.toLocaleString()}`, color: '#3b82f6' },
            { label: 'Rama Derecha', value: stats.rightBranch, investment: `$${stats.rightInvestment.toLocaleString()}`, color: '#ec4899' },
            { label: 'Directos', value: stats.directChildren, investment: `${stats.directChildren} miembros`, color: '#10b981' },
            { label: 'Descendencia', value: stats.descendants, investment: `${stats.descendants} total`, color: '#8b5cf6' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, margin: '0 0 4px 0' }}>
                {item.label}
              </p>
              <p style={{ color: item.color, fontSize: 18, fontWeight: 900, margin: '0 0 4px 0' }}>
                {item.value}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0 }}>
                {item.investment}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* MONTHLY PROGRESSION */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="p-6 rounded-xl" style={{ background: 'rgba(13,31,60,0.4)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <h3 style={{ color: 'white', fontSize: 14, fontWeight: 700, margin: '0 0 16px 0' }}>Evolución Mensual</h3>
        <div className="space-y-3">
          {monthlyData.map((month, i) => {
            const total = month.personal + month.network + month.activity;
            const maxTotal = Math.max(...monthlyData.map(m => m.personal + m.network + m.activity));
            const percentage = (total / maxTotal) * 100;

            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }}>
                    {month.month}
                  </span>
                  <span style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700 }}>
                    ${total.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  height: 6,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, #3b82f6 0%, #3b82f6 ${(month.personal / total) * 100}%, #10b981 ${(month.personal / total) * 100}%, #10b981 ${((month.personal + month.network) / total) * 100}%, #fb923c ${((month.personal + month.network) / total) * 100}%)`,
                    }}
                  />
                </div>
                <div style={{
                  display: 'flex',
                  gap: 16,
                  marginTop: 4,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.4)',
                }}>
                  <span>Personal: ${month.personal}</span>
                  <span>Red: ${month.network}</span>
                  <span>Actividad: ${month.activity}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* NOTES */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="p-4 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: '#3b82f6' }}>Nota:</strong> Las bonificaciones se calculan mensualmente basándose en tu inversión personal, 
          estructura de red y actividad. Las proyecciones están basadas en el movimiento histórico de los últimos 3 meses.
        </p>
      </motion.div>
    </div>
  );
}