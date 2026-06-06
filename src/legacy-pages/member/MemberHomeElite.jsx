import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, Network, Mail, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import platformDataCore from '@/lib/platformDataCore';
import BinaryNetworkSummaryEngine from '@/lib/BinaryNetworkSummaryEngine';
import { buildMemberValidationRecords } from '@/lib/memberValidationRecords';
import EnhancedKPICard from '@/components/premium/EnhancedKPICard';
import BinaryBalanceBar from '@/components/premium/BinaryBalanceBar';
import VisualAlertIndicator from '@/components/premium/VisualAlertIndicator';
import PremiumChart from '@/components/premium/PremiumChart';
import PremiumPanel from '@/components/premium/PremiumPanel';
import ValidationPanel from '@/components/premium/ValidationPanel';
import { getUserType, USER_TYPES } from '@/lib/userTypeEngine';
import MemberHomeDirect from './MemberHomeDirect';
import MemberHomeTransition from './MemberHomeTransition';
import GamificationMiniBar from '@/components/gamification/GamificationMiniBar';
import NetworkBalanceWidget from '@/components/network/NetworkBalanceWidget';
import AIGrowthRecommendationPanel from '@/components/ai/AIGrowthPanel';

export default function MemberHomeElite() {
  const userType = getUserType();
  if (userType === USER_TYPES.DIRECT) return <MemberHomeDirect />;
  if (userType === USER_TYPES.TRANSITION) return <MemberHomeTransition />;
  return <MemberHomeNetwork />;
}

function MemberHomeNetwork() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');
  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const networkSummary = useMemo(() => {
    const engine = new BinaryNetworkSummaryEngine(platformDataCore);
    return engine.getMemberNetworkSummary(userId);
  }, [userId]);

  const binaryMetrics = useMemo(() => ({
    networkTotal: networkSummary.network_total,
    leftTotal: networkSummary.left_total,
    rightTotal: networkSummary.right_total,
    leftCount: Math.floor(networkSummary.direct_count * 0.4),
    rightCount: Math.floor(networkSummary.direct_count * 0.6),
    totalMembers: networkSummary.deep_count,
    averageInvestment: networkSummary.avgMemberInvestment,
    isBalanced: networkSummary.isBalanced,
    balance: networkSummary.balance,
  }), [networkSummary]);

  const descendants = useMemo(() => platformDataCore.getDescendantsForLeader(userId), [userId]);
  const validationMembers = useMemo(
    () => buildMemberValidationRecords(platformDataCore, userId, descendants),
    [userId, descendants]
  );

  const metrics = useMemo(() => {
    const networkSize = descendants.length;
    const activeCount = descendants.filter(d => {
      const user = platformDataCore.getUserById(d.user_id);
      return user?.status === 'activo';
    }).length;
    const monthlyIncome = (binaryMetrics.networkTotal * 0.08) + (userData.investment || 0) * 0.12;
    const topMembers = descendants
      .map(d => {
        const user = platformDataCore.getUserById(d.user_id);
        const membership = platformDataCore.getMembershipsForUser(user?.id)[0];
        return { user, node: d, investment: membership?.amount || 0 };
      })
      .sort((a, b) => b.investment - a.investment)
      .slice(0, 10);
    return {
      networkSize, activeCount,
      inactiveCount: networkSize - activeCount,
      totalInvestment: binaryMetrics.networkTotal,
      monthlyIncome, topMembers,
      growthRate: Math.round((activeCount / Math.max(networkSize, 1)) * 100),
    };
  }, [descendants, userData, binaryMetrics]);

  const incomeHistory = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    income: Math.round(metrics.monthlyIncome * (0.7 + Math.random() * 0.6)),
  })), [metrics.monthlyIncome]);

  const memberHistory = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
    members: Math.round(metrics.networkSize * (0.5 + (i / 12))),
  })), [metrics.networkSize]);

  const alerts = useMemo(() => networkSummary.alerts.slice(0, 4), [networkSummary]);
  const monthlyIncome = Math.round(metrics.monthlyIncome);
  const leftPct = (binaryMetrics.leftTotal + binaryMetrics.rightTotal) > 0
    ? (binaryMetrics.leftTotal / (binaryMetrics.leftTotal + binaryMetrics.rightTotal)) * 100
    : 50;

  return (
    <div className="max-w-7xl space-y-5 p-4 sm:space-y-6 sm:p-6" style={{ background: 'var(--vp-bg)', minHeight: '100vh' }}>
      <GamificationMiniBar />

      {/* ─── SECTION 1: COMMAND HERO ─── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl relative overflow-hidden"
        style={{
          background: 'var(--vp-surface)',
          border: '1px solid var(--vp-border)',
          boxShadow: 'var(--vp-shadow)',
        }}
      >
        <div className="px-4 py-5 sm:px-8 sm:py-7" style={{ position: 'relative', zIndex: 1 }}>
          {/* Identity row */}
          <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: 'var(--vp-surface-raised)',
                border: '1.5px solid var(--vp-border-strong)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 900, color: 'var(--vp-text)', flexShrink: 0,
              }}>J</div>
              <div className="min-w-0">
                <p style={{ color: 'var(--vp-accent)', fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>
                  Centro de Comando
                </p>
                <h1 style={{ color: 'var(--vp-text)', fontSize: 'clamp(22px, 7vw, 30px)', fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '-0.3px', lineHeight: 1.05 }}>
                  Javier Demo MVP
                </h1>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ background: 'var(--vp-accent-muted)', color: 'var(--vp-accent)', padding: '4px 12px', borderRadius: 7, fontSize: 10, fontWeight: 700, border: '1px solid var(--vp-accent-border)', letterSpacing: '0.4px' }}>
                    Control Center
                  </span>
                  <span style={{ background: 'var(--vp-amber-muted)', color: 'var(--vp-amber)', padding: '4px 12px', borderRadius: 7, fontSize: 10, fontWeight: 700, border: '1px solid var(--vp-amber-border)', letterSpacing: '0.4px' }}>
                    {userData.rank || 'Elite Member'}
                  </span>
                  <span style={{ background: 'var(--vp-surface-raised)', color: 'var(--vp-muted)', padding: '4px 10px', borderRadius: 7, fontSize: 9, fontWeight: 600, border: '1px solid var(--vp-border)' }}>
                    Red Activa
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'var(--vp-accent-muted)', border: '1px solid var(--vp-accent-border)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--vp-accent)' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--vp-accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>Sistema Activo</span>
              </div>
              <p style={{ color: 'var(--vp-subtle)', fontSize: 9, margin: 0 }}>
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>

          {/* Command summary strip */}
          <div className="grid grid-cols-1 gap-3 pt-5 sm:grid-cols-3" style={{ borderTop: '1px solid var(--vp-border)' }}>
            <div style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)' }}>
              <p style={{ color: 'var(--vp-muted)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Red Total</p>
              <p style={{ color: 'var(--vp-accent)', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>${(binaryMetrics.networkTotal / 1000).toFixed(1)}K</p>
            </div>
            <div style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)' }}>
              <p style={{ color: 'var(--vp-muted)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Ingreso Mensual Est.</p>
              <p style={{ color: 'var(--vp-amber)', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>${monthlyIncome.toLocaleString()}</p>
            </div>
            <div style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)' }}>
              <p style={{ color: 'var(--vp-muted)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 4px 0' }}>Miembros Totales</p>
              <p style={{ color: 'var(--vp-text)', fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>{binaryMetrics.totalMembers}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── SECTION 2: KPI STRIP — weighted hierarchy ─── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="mb-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div style={{ padding: '20px 24px', borderRadius: 14, background: 'var(--vp-surface)', border: '1px solid var(--vp-border)', boxShadow: 'none' }}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={13} style={{ color: 'var(--vp-accent)' }} />
              <p style={{ color: 'var(--vp-muted)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Volumen de Red</p>
              <div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: 'var(--vp-accent)' }} />
            </div>
            <p style={{ color: 'var(--vp-accent)', fontSize: 32, fontWeight: 900, margin: '0 0 2px 0', letterSpacing: '-1px' }}>${binaryMetrics.networkTotal.toLocaleString()}</p>
            <p style={{ color: 'var(--vp-subtle)', fontSize: 10, margin: 0 }}>inversión acumulada en red</p>
          </div>
          <div style={{ padding: '20px 24px', borderRadius: 14, background: 'var(--vp-surface)', border: '1px solid var(--vp-border)', boxShadow: 'none' }}>
            <div className="flex items-center gap-2 mb-2">
              <Activity size={13} style={{ color: 'var(--vp-amber)' }} />
              <p style={{ color: 'var(--vp-muted)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Tasa de Activación</p>
            </div>
            <p style={{ color: 'var(--vp-amber)', fontSize: 32, fontWeight: 900, margin: '0 0 2px 0', letterSpacing: '-1px' }}>{metrics.growthRate}%</p>
            <p style={{ color: 'var(--vp-subtle)', fontSize: 10, margin: 0 }}>{metrics.activeCount} de {metrics.networkSize} miembros activos</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Rama Izq.', value: `$${(binaryMetrics.leftTotal/1000).toFixed(1)}K`, color: 'var(--vp-accent)', icon: TrendingUp },
            { label: 'Rama Der.', value: `$${(binaryMetrics.rightTotal/1000).toFixed(1)}K`, color: 'var(--vp-amber)', icon: TrendingUp },
            { label: 'Promedio Red', value: `$${Math.round(binaryMetrics.averageInvestment).toLocaleString()}`, color: 'var(--vp-text-soft)', icon: BarChart3 },
            { label: 'Directos', value: networkSummary.direct_count, color: 'var(--vp-text-soft)', icon: Users },
          ].map(({ label, value, color, icon: Icon }, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--vp-surface)', border: '1px solid var(--vp-border)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={11} style={{ color }} />
                <p style={{ color: 'var(--vp-muted)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>{label}</p>
              </div>
              <p style={{ color, fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>{value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── SECTION 3: BINARY BALANCE — institutional metric ─── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <div style={{
          padding: '24px 28px', borderRadius: 16,
          background: 'var(--vp-surface)',
          border: '1px solid var(--vp-border)',
          boxShadow: 'none',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p style={{ color: 'var(--vp-accent)', fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 3px 0' }}>Balance Binario</p>
                <p style={{ color: 'var(--vp-subtle)', fontSize: 10, margin: 0 }}>Distribución estructural de red</p>
              </div>
              <div style={{ padding: '5px 12px', borderRadius: 20, background: binaryMetrics.isBalanced ? 'var(--vp-accent-muted)' : 'var(--vp-amber-muted)', border: `1px solid ${binaryMetrics.isBalanced ? 'var(--vp-accent-border)' : 'var(--vp-amber-border)'}` }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: binaryMetrics.isBalanced ? 'var(--vp-accent)' : 'var(--vp-amber)', letterSpacing: '0.5px' }}>
                  {binaryMetrics.isBalanced ? 'BALANCEADO' : 'DESBALANCE DETECTADO'}
                </span>
              </div>
            </div>
            <div className="mb-3 grid grid-cols-1 gap-4 sm:flex sm:items-end sm:justify-between">
              <div>
                <p style={{ color: 'var(--vp-accent)', fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Rama Izquierda</p>
                <p style={{ color: 'var(--vp-accent)', fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>${binaryMetrics.leftTotal.toLocaleString()}</p>
                <p style={{ color: 'var(--vp-subtle)', fontSize: 9, margin: '2px 0 0 0' }}>{binaryMetrics.leftCount} miembros</p>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: 'var(--vp-subtle)', fontSize: 9, margin: '0 0 2px 0' }}>RATIO</p>
                <p style={{ color: 'var(--vp-text)', fontSize: 16, fontWeight: 900, margin: 0 }}>
                  {binaryMetrics.leftTotal > 0 && binaryMetrics.rightTotal > 0
                    ? `${leftPct.toFixed(0)}:${(100 - leftPct).toFixed(0)}`
                    : '—'}
                </p>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: 'var(--vp-amber)', fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 2px 0' }}>Rama Derecha</p>
                <p style={{ color: 'var(--vp-amber)', fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>${binaryMetrics.rightTotal.toLocaleString()}</p>
                <p style={{ color: 'var(--vp-subtle)', fontSize: 9, margin: '2px 0 0 0', textAlign: 'left' }}>{binaryMetrics.rightCount} miembros</p>
              </div>
            </div>
            {/* Premium rail */}
            <div style={{ position: 'relative', height: 10, borderRadius: 10, background: 'var(--vp-shell)', overflow: 'hidden', border: '1px solid var(--vp-border)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${leftPct}%` }}
                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: 'var(--vp-accent)' }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${100 - leftPct}%` }}
                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ position: 'absolute', right: 0, top: 0, height: '100%', background: 'var(--vp-amber)' }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* CHARTS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <PremiumChart data={incomeHistory} type="area" dataKey="income" label="Income Evolution" color="var(--vp-accent)" height={240} />
        <PremiumChart data={memberHistory} type="area" dataKey="members" label="Member Growth" color="var(--vp-amber)" height={240} />
      </motion.div>

      {/* ALERTS & STATUS */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <PremiumPanel title="System Alerts" live={alerts.length > 0}>
          <div className="space-y-2">
            {alerts.length > 0 ? alerts.map((alert, index) => (
              <VisualAlertIndicator
                key={getAlertKey(alert, index)}
                alert={alert}
                onClick={() => setSelectedAlert(alert)}
              />
            )) : (
              <p style={{ color: 'var(--vp-muted)', fontSize: 11, textAlign: 'center', padding: '16px 0' }}>— Todos los sistemas normales</p>
            )}
          </div>
        </PremiumPanel>
        <PremiumPanel title="Network Status">
          <div className="space-y-3">
            {[
              { label: 'Miembros Inactivos', value: metrics.inactiveCount, color: 'var(--vp-text-soft)' },
              { label: 'Tasa de Crecimiento', value: `${metrics.growthRate}%`, color: 'var(--vp-accent)' },
              { label: 'Inversión Total', value: `$${(metrics.totalInvestment / 1000).toFixed(1)}K`, color: 'var(--vp-amber)' },
            ].map((stat, i) => (
              <div key={i} className="p-3 rounded-lg flex items-center justify-between"
                style={{ background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)' }}>
                <span style={{ color: 'var(--vp-muted)', fontSize: 11, fontWeight: 600 }}>{stat.label}</span>
                <span style={{ color: stat.color, fontSize: 13, fontWeight: 700 }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </PremiumPanel>
      </motion.div>

      {/* TOP PERFORMERS */}
      {metrics.topMembers.length > 0 && (
        <PremiumPanel title="High-Value Members">
          <div className="space-y-2">
            {metrics.topMembers.map((member, i) => (
              <motion.div key={getTopMemberKey(member, i)} whileHover={{ x: 4 }}
                className="p-3 rounded-lg flex items-center justify-between cursor-pointer"
                style={{ background: 'var(--vp-surface-raised)', border: '1px solid var(--vp-border)' }}
                onClick={() => navigate(`/dashboard/team?search=${member.user?.name}`)}>
                <div className="flex items-center gap-3">
                  <span style={{ color: i < 3 ? 'var(--vp-amber)' : 'var(--vp-subtle)', fontSize: 10, fontWeight: 800, width: 20 }}>#{i + 1}</span>
                  <div>
                    <p style={{ color: 'var(--vp-text)', fontSize: 11, fontWeight: 600, margin: 0 }}>{member.user?.name}</p>
                    <p style={{ color: 'var(--vp-subtle)', fontSize: 9, margin: 0 }}>{member.user?.rank || 'Member'}</p>
                  </div>
                </div>
                <span style={{ color: 'var(--vp-accent)', fontSize: 11, fontWeight: 700 }}>${member.investment.toLocaleString()}</span>
              </motion.div>
            ))}
          </div>
        </PremiumPanel>
      )}

      {/* AI + BALANCE WIDGET */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p style={{ color: 'var(--vp-subtle)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>IA · Recomendaciones</p>
          <AIGrowthRecommendationPanel userId={userId} />
        </div>
        <div>
          <p style={{ color: 'var(--vp-subtle)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>Expansión de Red</p>
          <NetworkBalanceWidget userId={userId} />
        </div>
      </motion.div>

      {/* VALIDATION PANEL */}
      {userId && validationMembers.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
          <ValidationPanel members={validationMembers} rootMemberId={userId} />
        </motion.div>
      )}

      {/* ─── SECTION 4: GUIDED ACTION ZONE ─── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <p style={{ color: 'var(--vp-subtle)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 12 }}>
          Zona de Acción
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { category: 'Crecer', label: 'Ver Red', sub: 'Expandir estructura', icon: Network, color: 'var(--vp-accent)', bg: 'var(--vp-accent-muted)', border: 'var(--vp-accent-border)', action: () => navigate('/dashboard/network') },
            { category: 'Monitorear', label: 'Equipo', sub: 'Estado del equipo', icon: Users, color: 'var(--vp-amber)', bg: 'var(--vp-amber-muted)', border: 'var(--vp-amber-border)', action: () => navigate('/dashboard/team') },
            { category: 'Cobrar', label: 'Bonificaciones', sub: 'Ingresos acumulados', icon: DollarSign, color: 'var(--vp-amber)', bg: 'var(--vp-amber-muted)', border: 'var(--vp-amber-border)', action: () => navigate('/dashboard/bonificaciones') },
            { category: 'Optimizar', label: 'Comunicaciones', sub: 'Mensajes y alertas', icon: Mail, color: 'var(--vp-text-soft)', bg: 'var(--vp-surface)', border: 'var(--vp-border)', action: () => navigate('/dashboard/communications') },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button key={i} onClick={action.action}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                style={{
                  background: action.bg,
                  border: `1px solid ${action.border}`,
                  borderRadius: 12, padding: '16px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
                  transition: 'background 160ms ease, border-color 160ms ease, transform 160ms ease', textAlign: 'left',
                }}>
                <p style={{ color: action.color, fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: 0, opacity: 0.7 }}>{action.category}</p>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--vp-shell)', border: `1px solid ${action.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} style={{ color: action.color }} />
                </div>
                <div>
                  <p style={{ color: 'var(--vp-text)', fontSize: 12, fontWeight: 700, margin: '0 0 2px 0' }}>{action.label}</p>
                  <p style={{ color: 'var(--vp-muted)', fontSize: 9, margin: 0 }}>{action.sub}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function getAlertKey(alert, index) {
  return [
    alert.id,
    alert.type,
    alert.title,
    alert.message,
    alert.severity,
    index,
  ].filter(Boolean).join('-') || `alert-${index}`;
}

function getTopMemberKey(member, index) {
  return member.user?.id || member.node?.user_id || member.node?.member_id || member.user?.email || `top-member-${index}`;
}
