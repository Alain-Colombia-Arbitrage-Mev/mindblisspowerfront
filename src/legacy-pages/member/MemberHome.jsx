import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMemberNetworkSummary } from '@/lib/memberNetworkResolver';
import { resolveMemberLevel } from '@/lib/memberLevelResolver';
import { getInactiveMembers, getPriorityMembers, MEMBER_ACTIVITY_LOG } from '@/lib/memberNetworkData';
import platformDataCore from '@/lib/platformDataCore';
import { getAllDescendants, getMonthlyIncome } from '@/lib/warRoomDataAdapter';
import { Target, DollarSign, Users, TrendingUp, AlertTriangle, Activity, Zap, ArrowRight, Scale, Lightbulb, Clock, Network } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MemberHome() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('user_id');

  // Load data
  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (!userId || !userDataStr) {
      setLoading(false);
      return;
    }

    const user = JSON.parse(userDataStr);
    const summary = getMemberNetworkSummary(userId);
    const descendants = getAllDescendants(userId, platformDataCore.network_nodes, platformDataCore.users);
    const monthlyIncome = getMonthlyIncome(userId);

    setUserData({ user, summary, descendants, monthlyIncome });
    setLoading(false);
  }, [userId]);

  // Compute metrics
  const metrics = useMemo(() => {
    if (!userData) return null;
    const { summary, descendants } = userData;
    const leftCount = descendants.filter(d => d.binary_side === 'left').length;
    const rightCount = descendants.filter(d => d.binary_side === 'right').length;
    const inactiveCount = descendants.filter(d => d.status !== 'activo').length;
    const balanceRatio = leftCount > 0 ? rightCount / leftCount : 0;
    const isBalanced = balanceRatio >= 0.7 && balanceRatio <= 1.3;

    return {
      personalInvestment: summary?.personal_investment || 0,
      networkInvestment: summary?.network_investment || 0,
      activeNetwork: descendants.length,
      leftInvestment: descendants.filter(d => d.binary_side === 'left').reduce((sum, d) => sum + (d.investment || 0), 0),
      rightInvestment: descendants.filter(d => d.binary_side === 'right').reduce((sum, d) => sum + (d.investment || 0), 0),
      monthlyIncome: userData.monthlyIncome || 0,
      growth: descendants.length > 0 ? 12.5 : 0,
      inactiveMembers: descendants.filter(d => d.status !== 'activo'),
      topMembers: descendants.sort((a, b) => (b.investment || 0) - (a.investment || 0)).slice(0, 5),
      isBalanced,
      balanceSide: leftCount > rightCount ? 'left' : rightCount > leftCount ? 'right' : 'balanced',
    };
  }, [userData]);

  // Generate insights
  const insights = useMemo(() => {
    if (!metrics) return [];
    const result = [];

    if (metrics.balanceSide === 'left') {
      result.push({ text: 'Rama izquierda más desarrollada — refuerza la derecha', color: '#93c5fd' });
    } else if (metrics.balanceSide === 'right') {
      result.push({ text: 'Rama derecha con mayor potencial — equilibra ambos lados', color: '#93c5fd' });
    }

    if (metrics.inactiveMembers.length > 0) {
      result.push({ text: `${metrics.inactiveMembers.length} miembros requieren reactivación`, color: '#a78bfa' });
    }

    if (metrics.growth > 10) {
      result.push({ text: 'Tu red está creciendo de forma consistente', color: '#93c5fd' });
    }

    if (metrics.activeNetwork > 50) {
      result.push({ text: 'Estructura robusta con descendencia significativa', color: '#a78bfa' });
    }

    return result.slice(0, 3);
  }, [metrics]);

  // Get alerts
  const alerts = useMemo(() => {
    if (!metrics) return [];
    const result = [];

    if (metrics.inactiveMembers.length > 5) {
      result.push({ type: 'warning', text: `${metrics.inactiveMembers.length} miembros inactivos`, icon: AlertTriangle, color: '#7C3AED' });
    }
    if (!metrics.isBalanced) {
      result.push({ type: 'info', text: `Rama ${metrics.balanceSide === 'left' ? 'derecha' : 'izquierda'} necesita atención`, icon: Scale, color: '#3b82f6' });
    }
    if (metrics.activeNetwork < 10) {
      result.push({ type: 'info', text: 'Continúa activando tu red', icon: Users, color: '#3b82f6' });
    }

    return result;
  }, [metrics]);

  const recentActivity = MEMBER_ACTIVITY_LOG.slice(0, 5);

  if (loading) {
    return <div className="p-6" style={{ color: 'rgba(255,255,255,0.5)' }}>Cargando datos...</div>;
  }

  if (!userData) {
    return <div className="p-6" style={{ color: 'rgba(255,255,255,0.5)' }}>No hay datos disponibles</div>;
  }

  const { user } = userData;

  return (
    <div className="p-8 space-y-8 max-w-7xl" style={{ background: '#05070D', minHeight: '100vh' }}>
      {/* PHASE 1: USER CONTEXT */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-2xl px-6 py-5"
        style={{
          background: 'linear-gradient(135deg, rgba(8,18,40,0.8) 0%, rgba(5,7,13,0.9) 100%)',
          border: '1px solid rgba(59,130,246,0.1)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle atmosphere */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse 600px 200px at 20% 50%, rgba(59,130,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="flex items-center gap-6">
          <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(145deg, #0d1f3c 0%, #1a2744 100%)',
              border: '1px solid rgba(59,130,246,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 26,
              fontWeight: 900,
              boxShadow: '0 0 20px rgba(59,130,246,0.12), inset 0 1px 1px rgba(255,255,255,0.06)',
              flexShrink: 0,
            }}>
              {user.name.charAt(0)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h1 style={{ color: 'white', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
                Javier Demo MVP
              </h1>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ background: 'rgba(59,130,246,0.1)', color: '#93C5FD', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: '1px solid rgba(59,130,246,0.25)', letterSpacing: '0.3px' }}>
                  {user.rank || 'Miembro'}
                </span>
                <span style={{ background: 'rgba(124,58,237,0.1)', color: '#A78BFA', padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, border: '1px solid rgba(124,58,237,0.25)', letterSpacing: '0.3px' }}>
                  Activo
                </span>
              </div>
            </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/profile')}
          style={{
            background: 'rgba(59,130,246,0.08)',
            color: '#93C5FD',
            border: '1px solid rgba(59,130,246,0.2)',
            padding: '9px 18px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1,
          }}
          >
          Perfil
          </button>
          </motion.div>

      {/* PHASE 2: CORE METRICS */}
      {metrics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-6 gap-4">
          {[
            { label: 'Inversión Personal', value: `$${metrics.personalInvestment.toLocaleString()}`, color: '#3b82f6', icon: DollarSign },
            { label: 'Inversión Red', value: `$${metrics.networkInvestment.toLocaleString()}`, color: '#7C3AED', icon: Users },
            { label: 'Red Activa', value: metrics.activeNetwork, color: '#3b82f6', icon: Users, unit: 'miembros' },
            { label: 'Izquierda', value: `$${metrics.leftInvestment.toLocaleString()}`, color: '#3b82f6', icon: Scale },
            { label: 'Derecha', value: `$${metrics.rightInvestment.toLocaleString()}`, color: '#7C3AED', icon: Scale },
            { label: 'Ingresos Mes', value: `$${metrics.monthlyIncome.toLocaleString()}`, color: '#3b82f6', icon: TrendingUp },
          ].map((metric, i) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={i}
                whileHover={{ translateY: -2 }}
                className="p-4 rounded-lg"
                style={{
                  background: 'rgba(8,18,40,0.8)',
                  border: '1px solid rgba(59,130,246,0.1)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Icon size={14} style={{ color: metric.color }} />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }}>
                    {metric.label}
                  </span>
                </div>
                <p style={{ color: metric.color, fontSize: 16, fontWeight: 900, margin: 0 }}>
                  {metric.value}
                </p>
                {metric.unit && (
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: '2px 0 0 0' }}>
                    {metric.unit}
                  </p>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* PHASE 3: BINARY VISUAL */}
      {metrics && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="p-6 rounded-lg" style={{ background: 'rgba(8,18,40,0.8)', border: '1px solid rgba(59,130,246,0.1)' }}>
          <h3 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 16px 0' }}>Balance Binario</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Izquierda</span>
                <span style={{ color: '#3b82f6', fontSize: 12, fontWeight: 700 }}>${metrics.leftInvestment.toLocaleString()}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((metrics.leftInvestment / (metrics.leftInvestment + metrics.rightInvestment + 1)) * 100, 100)}%` }}
                  transition={{ duration: 0.8 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #1d6ef5, #3b82f6)' }}
                />
                </div>
                </div>
                <div>
                <div className="flex items-center justify-between mb-2">
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Derecha</span>
                <span style={{ color: '#7C3AED', fontSize: 12, fontWeight: 700 }}>${metrics.rightInvestment.toLocaleString()}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((metrics.rightInvestment / (metrics.leftInvestment + metrics.rightInvestment + 1)) * 100, 100)}%` }}
                  transition={{ duration: 0.8 }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #5b21b6, #7C3AED)' }}
                />
                </div>
                </div>
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(59,130,246,0.06)', borderRadius: 6, border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} style={{ color: metrics.isBalanced ? '#3b82f6' : '#7C3AED' }} />
                <span style={{ color: metrics.isBalanced ? '#93C5FD' : '#A78BFA', fontSize: 11, fontWeight: 600 }}>
                {metrics.isBalanced ? '✓ Balance óptimo' : `Rama ${metrics.balanceSide === 'left' ? 'derecha' : 'izquierda'} necesita atención`}
                </span>
                </div>
          </div>
        </motion.div>
      )}

      {/* PHASE 4: ALERT CENTER */}
      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-4">
          {alerts.map((alert, i) => {
            const AlertIcon = alert.icon;
            return (
              <div key={i} className="p-4 rounded-lg" style={{ background: 'rgba(8,18,40,0.8)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertIcon size={14} style={{ color: '#A78BFA' }} />
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 600 }}>
                    {alert.text}
                  </span>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* PHASE 5: QUICK ACTIONS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="grid grid-cols-4 gap-3">
        {[
          { label: 'Ver mi red', icon: Network, color: '#3b82f6', action: () => navigate('/dashboard/network') },
          { label: 'Gestionar equipo', icon: Users, color: '#3b82f6', action: () => navigate('/dashboard/team') },
          { label: 'Enviar mensaje', icon: Activity, color: '#7C3AED', action: () => navigate('/dashboard/communications') },
          { label: 'Ver ingresos', icon: DollarSign, color: '#7C3AED', action: () => navigate('/dashboard/bonificaciones') },
        ].map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              onClick={action.action}
              style={{
                background: `${action.color}15`,
                border: `1px solid ${action.color}30`,
                color: action.color,
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Icon size={14} />
              {action.label}
            </motion.button>
          );
        })}
      </motion.div>

      {/* PHASE 6: NETWORK SNAPSHOT */}
      {metrics && metrics.topMembers.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="p-6 rounded-lg" style={{ background: 'rgba(8,18,40,0.8)', border: '1px solid rgba(59,130,246,0.1)' }}>
          <h3 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: '0 0 12px 0' }}>Top Miembros</h3>
          <div className="space-y-2">
            {metrics.topMembers.map((member, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 4 }}
                onClick={() => console.log('Member:', member)}
                className="p-3 rounded-lg cursor-pointer transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ color: 'white', fontSize: 11, fontWeight: 600, margin: '0 0 2px 0' }}>
                      {member.name}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, margin: 0 }}>
                      {member.rank || 'Miembro'}
                    </p>
                  </div>
                  <span style={{ color: '#3b82f6', fontSize: 11, fontWeight: 700 }}>
                    ${(member.investment || 0).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* PHASE 7: ACTIVITY TIMELINE */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="p-6 rounded-lg" style={{ background: 'rgba(8,18,40,0.8)', border: '1px solid rgba(59,130,246,0.1)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0 }}>Actividad Reciente</h3>
          <button onClick={() => navigate('/dashboard/activity')} style={{ color: '#3b82f6', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
            Ver todo →
          </button>
        </div>
        <div className="space-y-2">
          {recentActivity.map((log, i) => (
            <div key={i} className="p-3 rounded-lg flex items-center justify-between text-xs" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{log.action}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{log.date}</span>
              </div>
              {log.amount && <span style={{ color: '#3b82f6', fontWeight: 700 }}>${log.amount}</span>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* PHASE 9: PERSONAL INSIGHTS */}
      {insights.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="p-6 rounded-lg" style={{ background: 'rgba(8,18,40,0.8)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={14} style={{ color: '#7C3AED' }} />
            <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>IA · Señales</h3>
          </div>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} style={{ color: insight.color, fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                {insight.text}
              </p>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}