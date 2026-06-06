import { useState, useMemo } from 'react';
import { TrendingUp, AlertTriangle, Users, Network, Activity, Rocket, Send, Zap, Shield, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import platformDataCore from '@/lib/platformDataCore';
import { getAllDescendants, getUserInvestment, getNetworkInvestment } from '@/lib/warRoomDataAdapter';

const LiveDot = ({ color = '#3b82f6', size = 6 }) => (
  <motion.div
    style={{ width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0 }}
    animate={{ opacity: [1, 0.3, 1], boxShadow: [`0 0 0 0 ${color}50`, `0 0 6px 3px ${color}00`] }}
    transition={{ duration: 2, repeat: Infinity }}
  />
);

const MiniNetworkRadar = ({ userId }) => {
  const descendants = useMemo(() => getAllDescendants(userId, platformDataCore.network_nodes, platformDataCore.users), [userId]);
  const nodes = useMemo(() => platformDataCore.network_nodes.filter(n => descendants.some(d => d.id === n.member_id)), [descendants]);
  const leftCount = nodes.filter(n => n.binary_side === 'left').length;
  const rightCount = nodes.filter(n => n.binary_side === 'right').length;
  const total = leftCount + rightCount;
  const leftPct = total > 0 ? (leftCount / total) * 100 : 50;

  return (
    <div style={{ padding: '20px 0 8px' }}>
      {/* Visual radar-style binary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
        {/* Left branch */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(59,130,246,0.12)', border: '1.5px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
            <span style={{ color: '#60A5FA', fontSize: 15, fontWeight: 900 }}>{leftCount}</span>
          </div>
          <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 700, letterSpacing: '1px', margin: 0, textTransform: 'uppercase' }}>Izq.</p>
        </div>
        {/* Root node */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', gap: 32 }}>
            <div style={{ width: 1, height: 1, background: 'transparent' }} />
          </div>
        </div>
        {/* Right branch */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(99,102,241,0.12)', border: '1.5px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
            <span style={{ color: '#A5B4FC', fontSize: 15, fontWeight: 900 }}>{rightCount}</span>
          </div>
          <p style={{ color: '#6366F1', fontSize: 9, fontWeight: 700, letterSpacing: '1px', margin: 0, textTransform: 'uppercase' }}>Der.</p>
        </div>
      </div>

      {/* Balance rail */}
      <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 8 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${leftPct}%` }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ height: '100%', background: 'linear-gradient(90deg, #1d6ef5, #3b82f6)', boxShadow: '0 0 8px rgba(59,130,246,0.5)' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#3b82f6', fontSize: 8, fontWeight: 700 }}>{leftPct.toFixed(0)}%</span>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8 }}>balance</span>
        <span style={{ color: '#6366F1', fontSize: 8, fontWeight: 700 }}>{(100 - leftPct).toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default function MemberWarRoom() {
  const userId = localStorage.getItem('user_id');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const [autoModeEnabled] = useState(() => {
    const stored = localStorage.getItem('automode_enabled');
    return stored ? JSON.parse(stored) : false;
  });

  const metrics = useMemo(() => {
    const descendants = getAllDescendants(userId, platformDataCore.network_nodes, platformDataCore.users);
    const personalInvestment = getUserInvestment(userId) || 0;
    const networkInvestment = getNetworkInvestment(userId) || 0;
    const totalInvestment = personalInvestment + networkInvestment;
    const monthlyIncome = (totalInvestment * 0.05) + (descendants.length * 50);
    const previousMonthIncome = monthlyIncome * 0.92;
    const monthlyGrowth = ((monthlyIncome - previousMonthIncome) / previousMonthIncome * 100).toFixed(1);
    const activeMembers = descendants.filter(d => d.status === 'activo').length;
    const activationRate = ((activeMembers / Math.max(descendants.length, 1)) * 100).toFixed(1);
    return {
      totalInvestment, networkSize: descendants.length,
      monthlyIncome: monthlyIncome.toFixed(0), monthlyGrowth,
      activationRate, activeMembers,
      personalInvestment, networkInvestment,
    };
  }, [userId]);

  const alerts = useMemo(() => {
    const descendants = getAllDescendants(userId, platformDataCore.network_nodes, platformDataCore.users);
    const nodes = platformDataCore.network_nodes.filter(n => descendants.some(d => d.id === n.member_id));
    const leftCount = nodes.filter(n => n.binary_side === 'left').length;
    const rightCount = nodes.filter(n => n.binary_side === 'right').length;
    const inactiveCount = descendants.filter(d => d.status === 'inactivo').length;
    const list = [];
    if (Math.abs(leftCount - rightCount) > 3) list.push({ id: 'balance', type: 'critical', title: 'Desbalance Binario', message: `${Math.abs(leftCount - rightCount)} nodos de diferencia` });
    if (inactiveCount > 5) list.push({ id: 'inactive', type: 'critical', title: 'Miembros Inactivos', message: `${inactiveCount} requieren reactivación` });
    if (descendants.length > 20) list.push({ id: 'growth', type: 'info', title: 'Red en Expansión', message: `Potencial de ingresos adicionales` });
    return list;
  }, [userId]);

  const activityStream = useMemo(() => {
    const descendants = getAllDescendants(userId, platformDataCore.network_nodes, platformDataCore.users);
    return descendants.slice(0, 5).map((member, idx) => ({
      id: `a-${idx}`, member: member.name, action: 'Se unió a la red',
      timestamp: new Date(Date.now() - Math.random() * 86400000),
    })).sort((a, b) => b.timestamp - a.timestamp);
  }, [userId]);

  return (
    <div style={{ background: '#05070D', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ─── TITLE CLUSTER ─── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '24px 28px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, #080F1E 0%, #0B1426 100%)',
            border: '1px solid rgba(59,130,246,0.15)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
            position: 'relative', overflow: 'hidden',
          }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 600px 300px at 0% 50%, rgba(59,130,246,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'rgba(59,130,246,0.6)', fontSize: 9, fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase', margin: '0 0 6px 0' }}>
                Centro Operacional · Monitoreo Elite
              </p>
              <h1 style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.8px' }}>
                War Room
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: 0 }}>
                Superficie de comando operacional en tiempo real · {userData.rank || 'Elite'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ display: 'flex', items: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center' }}>
                <LiveDot color="#3b82f6" size={7} />
                <span style={{ color: '#93C5FD', fontSize: 9, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginLeft: 6 }}>Sincronización Activa</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── EXECUTIVE OVERVIEW — primary metrics surface ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>Resumen Ejecutivo</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Inversión Total', value: `$${Number(metrics.totalInvestment).toLocaleString()}`, color: '#60A5FA', accent: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.2)', live: true },
              { label: 'Ingreso Mensual', value: `$${Number(metrics.monthlyIncome).toLocaleString()}`, color: '#C4B5FD', accent: 'rgba(124,58,237,0.15)', border: 'rgba(124,58,237,0.2)', live: true },
              { label: 'Crecimiento MoM', value: `+${metrics.monthlyGrowth}%`, color: '#60A5FA', accent: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.12)' },
              { label: 'Red Total', value: `${metrics.networkSize} pers.`, color: 'rgba(255,255,255,0.7)', accent: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '18px 20px', borderRadius: 14, background: item.accent, border: `1px solid ${item.border}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{item.label}</p>
                  {item.live && <LiveDot color={item.color} size={5} />}
                </div>
                <p style={{ color: item.color, fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── MAIN GRID: RADAR + FINANCIAL + ALERTS ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

          {/* LIVE NETWORK RADAR */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14 }}
            style={{ padding: '22px', borderRadius: 14, background: '#0B0F1A', border: '1px solid rgba(59,130,246,0.12)', gridRow: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <p style={{ color: 'rgba(59,130,246,0.6)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>Red Binaria</p>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 800, margin: '3px 0 0 0' }}>Estructura en Vivo</p>
              </div>
              <Eye size={14} style={{ color: 'rgba(59,130,246,0.5)' }} />
            </div>
            <MiniNetworkRadar userId={userId} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 3px 0' }}>Activos</p>
                <p style={{ color: '#60A5FA', fontSize: 16, fontWeight: 900, margin: 0 }}>{metrics.activeMembers}</p>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 3px 0' }}>Tasa</p>
                <p style={{ color: '#A5B4FC', fontSize: 16, fontWeight: 900, margin: 0 }}>{metrics.activationRate}%</p>
              </div>
            </div>
          </motion.div>

          {/* FINANCIAL — higher visual weight */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            style={{
              padding: '22px', borderRadius: 14,
              background: 'linear-gradient(135deg, #0A0D1C 0%, #0D1226 100%)',
              border: '1px solid rgba(124,58,237,0.18)',
              boxShadow: '0 4px 20px rgba(124,58,237,0.06)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ color: 'rgba(124,58,237,0.7)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>Financiero</p>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 800, margin: '3px 0 0 0' }}>Distribución de Capital</p>
              </div>
              <TrendingUp size={14} style={{ color: 'rgba(124,58,237,0.6)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Personal', value: metrics.personalInvestment, total: metrics.totalInvestment, color: '#3b82f6' },
                { label: 'Red', value: metrics.networkInvestment, total: metrics.totalInvestment, color: '#7C3AED' },
              ].map((item, i) => {
                const pct = item.total > 0 ? (item.value / item.total) * 100 : 0;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{item.label}</span>
                      <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>${Number(item.value).toLocaleString()}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
                      <motion.div
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, delay: 0.2 + i * 0.1 }}
                        style={{ height: '100%', background: item.color, boxShadow: `0 0 8px ${item.color}60` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Tendencia mensual</p>
              <p style={{ color: '#C4B5FD', fontSize: 18, fontWeight: 900, margin: 0 }}>↑ +{metrics.monthlyGrowth}%</p>
            </div>
          </motion.div>

          {/* ALERTS + AUTO STATE — high seriousness, blue/violet only */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
            style={{ padding: '22px', borderRadius: 14, background: '#0B0F1A', border: '1px solid rgba(124,58,237,0.12)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'rgba(124,58,237,0.6)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>Señales</p>
                <p style={{ color: 'white', fontSize: 13, fontWeight: 800, margin: '3px 0 0 0' }}>Estado del Sistema</p>
              </div>
              <AlertTriangle size={14} style={{ color: alerts.filter(a => a.type === 'critical').length > 0 ? '#C4B5FD' : 'rgba(255,255,255,0.2)' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {alerts.length === 0 ? (
                <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, margin: 0 }}>— Todos los sistemas normales</p>
                </div>
              ) : alerts.map((alert) => (
                <div key={alert.id} style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: alert.type === 'critical' ? 'rgba(124,58,237,0.08)' : 'rgba(59,130,246,0.06)',
                  border: `1px solid ${alert.type === 'critical' ? 'rgba(124,58,237,0.25)' : 'rgba(59,130,246,0.15)'}`,
                  borderLeft: `2px solid ${alert.type === 'critical' ? '#7C3AED' : '#3b82f6'}`,
                }}>
                  <p style={{ color: alert.type === 'critical' ? '#C4B5FD' : '#93C5FD', fontSize: 10, fontWeight: 700, margin: '0 0 2px 0' }}>{alert.title}</p>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, margin: 0 }}>{alert.message}</p>
                </div>
              ))}
            </div>

            {/* Auto Mode — technical, controlled */}
            <div style={{ paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={11} style={{ color: autoModeEnabled ? '#60A5FA' : 'rgba(255,255,255,0.2)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Auto Mode</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: autoModeEnabled ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${autoModeEnabled ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: autoModeEnabled ? '#3b82f6' : 'rgba(255,255,255,0.2)' }} />
                  <span style={{ color: autoModeEnabled ? '#93C5FD' : 'rgba(255,255,255,0.3)', fontSize: 8, fontWeight: 800, letterSpacing: '0.5px' }}>
                    {autoModeEnabled ? 'ACTIVO' : 'STANDBY'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── BOTTOM TIER: ACTIVITY + ACTIONS + AI ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

          {/* LIVE ACTIVITY */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
            style={{ padding: '20px', borderRadius: 14, background: '#0B0F1A', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <LiveDot color="#3b82f6" />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>Actividad en Vivo</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {activityStream.map((activity, idx) => (
                <motion.div key={activity.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.04 }}
                  style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={10} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    <p style={{ color: 'white', fontSize: 10, fontWeight: 700, margin: 0 }}>{activity.member}</p>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 8, margin: '3px 0 0 6px' }}>
                    {activity.action} · {activity.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* COMMAND ACTIONS */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
            style={{ padding: '20px', borderRadius: 14, background: '#0B0F1A', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 14px 0' }}>Acciones de Comando</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Enviar Mensaje', sub: 'Comunicación directa', icon: Send, color: '#3b82f6' },
                { label: 'Lanzar Campaña', sub: 'Activar secuencia', icon: Rocket, color: '#6366F1' },
                { label: 'Ver Estructura', sub: 'Red binaria completa', icon: Network, color: '#7C3AED' },
                { label: 'Gestionar Equipo', sub: 'Control de miembros', icon: Users, color: 'rgba(255,255,255,0.4)' },
              ].map((action, idx) => {
                const Icon = action.icon;
                return (
                  <motion.button key={idx}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: `${action.color}08`, border: `1px solid ${action.color}15`,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 150ms ease',
                    }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${action.color}15`, border: `1px solid ${action.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={12} style={{ color: action.color }} />
                    </div>
                    <div>
                      <p style={{ color: 'white', fontSize: 10, fontWeight: 700, margin: 0 }}>{action.label}</p>
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, margin: 0 }}>{action.sub}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* AI INTELLIGENCE */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 }}
            style={{ padding: '20px', borderRadius: 14, background: '#0B0F1A', border: '1px solid rgba(124,58,237,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Shield size={12} style={{ color: 'rgba(124,58,237,0.7)' }} />
              <p style={{ color: 'rgba(124,58,237,0.7)', fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>Inteligencia IA</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Acción Prioritaria', text: 'Activar 3 miembros inactivos en rama derecha para restaurar balance.', color: '#7C3AED' },
                { label: 'Proyección', text: '+$2.5K estimado si se logra balance 1:1 en próximas 2 semanas.', color: '#3b82f6' },
                { label: 'Señal Crítica', text: 'Divergencia de rama izquierda puede reducir bonificaciones binarias.', color: '#7C3AED' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: 10, background: `${item.color}08`, border: `1px solid ${item.color}18` }}>
                  <p style={{ color: item.color, fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px 0' }}>{item.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: 0, lineHeight: 1.5 }}>{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ─── STATUS BAR ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}
          style={{
            padding: '10px 20px', borderRadius: 10,
            background: 'rgba(8,15,28,0.8)', border: '1px solid rgba(59,130,246,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LiveDot color="#3b82f6" size={5} />
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 600 }}>Sincronización Activa</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9 }}>Última actualización: hace 3s</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={10} style={{ color: 'rgba(59,130,246,0.4)' }} />
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 600 }}>Sistema 100% Seguro</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}