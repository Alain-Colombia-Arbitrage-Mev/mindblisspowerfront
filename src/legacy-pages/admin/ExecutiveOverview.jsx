import { useState, useEffect, useMemo } from 'react';
import { useSimulation } from '@/lib/SimulationEngine';
import { Users, Shield, Activity, Clock, CreditCard, TrendingUp, Headphones, AlertTriangle, ArrowRight, ExternalLink, Radar, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import platformDataCore from '@/lib/platformDataCore';
import HighValueUsersPanel from '@/components/admin/HighValueUsersPanel';

const PRIORITY_BADGE = { critical: { label: 'Crítico', bg: 'rgba(239,68,68,0.12)', color: '#ef4444' }, high: { label: 'Alto', bg: 'rgba(251,146,60,0.12)', color: '#fb923c' }, medium: { label: 'Medio', bg: 'rgba(251,191,36,0.1)', color: '#fbbf24' }, low: { label: 'Bajo', bg: 'rgba(107,114,128,0.12)', color: '#6b7280' } };

const ALERTS = [
  { priority: 'critical', title: '8 Pagos Pendientes de Revisión', detail: 'Transacciones >$1,000 marcadas por fraude. Requieren aprobación.', to: '/admin-dashboard/payments', action: 'Revisar' },
  { priority: 'critical', title: '3 Líderes con Violaciones de Cumplimiento', detail: 'Mensajes fuera de protocolo detectados en BR, MX, CO.', to: '/admin-dashboard/leaders', action: 'Inspeccionar' },
  { priority: 'high', title: '15 Participantes sin Verificar', detail: 'Cola KYC con 3 casos próximos a incumplimiento de SLA 48h.', to: '/admin-dashboard/participants', action: 'Asignar' },
  { priority: 'high', title: '5 Casos de Soporte +3 Días', detail: 'Exceden SLA interno. Reasignación recomendada.', to: '/admin-dashboard/support', action: 'Ver' },
  { priority: 'medium', title: '14 Nuevos Líderes Pendientes', detail: 'Lote de certificación de 6 países. Revisión requerida.', to: '/admin-dashboard/leaders', action: 'Revisar' },
];

const QUICK_ACTIONS = [
  { label: 'Participantes', to: '/admin-dashboard/participants', color: '#10b981', badge: '15 KYC', icon: Users },
  { label: 'Líderes', to: '/admin-dashboard/leaders', color: '#8b5cf6', badge: '3 alertas', icon: Shield },
  { label: 'War Room', to: '/admin-dashboard/war-room', color: '#3b82f6', icon: Radar },
  { label: 'Pagos', to: '/admin-dashboard/payments', color: '#ef4444', badge: '8 revisión', icon: CreditCard },
  { label: 'Soporte', to: '/admin-dashboard/support', color: '#fb923c', badge: '3 críticos', icon: Headphones },
  { label: 'Auditoría', to: '/admin-dashboard/audit', color: '#06b6d4', icon: CheckCircle },
];

const RECENT_EVENTS = [
  { action: 'Pago aprobado', detail: 'J. García · $750', time: '3m', color: '#10b981' },
  { action: 'Cuenta bloqueada', detail: 'P. Martínez · Fraude', time: '18m', color: '#ef4444' },
  { action: 'Líder certificado', detail: 'A. Silva · BR-001', time: '34m', color: '#8b5cf6' },
  { action: 'Plan aprobado', detail: 'M. Rodríguez · $500', time: '52m', color: '#10b981' },
  { action: 'Caso escalado', detail: 'Soporte #4821 → Crítico', time: '1h', color: '#fb923c' },
  { action: 'KYC verificado', detail: 'R. Díaz · ID-8847', time: '4h', color: '#10b981' },
];

export default function ExecutiveOverview() {
  const sim = useSimulation();
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB'));

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-GB')), 30000);
    return () => clearInterval(t);
  }, []);

  const kpis = useMemo(() => {
    const users = sim.users || [];
    const memberships = sim.integrityModel?.memberships || [];
    const activeMembers = users.filter(u => u.status === 'activo').length;
    const activeLeaders = users.filter(u => u.role === 'leader' && u.status === 'activo').length;
    const allLeaders = users.filter(u => u.role === 'leader').length;
    const pending = users.filter(u => u.status === 'pendiente').length;
    const totalInvestment = memberships.filter(m => m.status === 'activo').reduce((sum, m) => sum + (m.plan_value || 0), 0);
    const activePlans = memberships.filter(m => m.status === 'activo').length;
    const avgTicket = activePlans > 0 ? Math.round(totalInvestment / activePlans) : 0;

    // network balance from platformDataCore
    const nodes = platformDataCore.network_nodes || [];
    const leftNodes = nodes.filter(n => n.binary_side === 'left').length;
    const rightNodes = nodes.filter(n => n.binary_side === 'right').length;

    return {
      total: users.length,
      active: activeMembers,
      leaders: allLeaders,
      activeLeaders,
      pending,
      totalInvestment,
      avgTicket,
      leftNodes,
      rightNodes,
      conversionRate: users.length > 0 ? Math.round((activeMembers / users.length) * 100) : 0,
    };
  }, [sim.users, sim.integrityModel]);

  const networkBalance = kpis.leftNodes + kpis.rightNodes > 0
    ? Math.round((kpis.leftNodes / (kpis.leftNodes + kpis.rightNodes)) * 100)
    : 50;

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p style={{ color: '#3b82f6', fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', margin: '0 0 4px' }}>COMANDO EJECUTIVO</p>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>Resumen Ejecutivo</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span style={{ color: '#10b981', fontSize: 10, fontWeight: 600 }}>OPERATIVO · {time}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>MÉTRICAS DE PLATAFORMA</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { icon: Users, label: 'Total Miembros', value: kpis.total.toLocaleString(), sub: `${kpis.active} activos`, color: '#3b82f6' },
            { icon: Activity, label: 'Activos', value: kpis.active.toLocaleString(), sub: `${kpis.conversionRate}% conversión`, color: '#10b981' },
            { icon: Shield, label: 'Líderes', value: kpis.leaders, sub: `${kpis.activeLeaders} activos`, color: '#8b5cf6' },
            { icon: Clock, label: 'Pendientes', value: kpis.pending, sub: 'verificación KYC', color: kpis.pending > 10 ? '#ef4444' : '#fb923c' },
            { icon: CreditCard, label: 'Inversión Total', value: `$${Math.round(kpis.totalInvestment / 1000)}K`, sub: 'planes activos', color: '#06b6d4' },
            { icon: TrendingUp, label: 'Ticket Promedio', value: `$${kpis.avgTicket.toLocaleString()}`, sub: 'por plan activo', color: '#fbbf24' },
          ].map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={i} className="p-4 rounded-xl" style={{ background: `${k.color}0d`, border: `1px solid ${k.color}22` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${k.color}1a` }}>
                    <Icon size={13} style={{ color: k.color }} />
                  </div>
                </div>
                <p style={{ color: k.color, fontSize: 20, fontWeight: 900, margin: '0 0 2px', letterSpacing: -0.5 }}>{k.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, margin: '0 0 1px', fontWeight: 600 }}>{k.label}</p>
                {k.sub && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, margin: 0 }}>{k.sub}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Network Health */}
      <div className="p-4 rounded-xl" style={{ background: 'rgba(8,18,40,0.6)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-3">
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>BALANCE DE RED BINARIA</p>
          <span style={{ color: Math.abs(networkBalance - 50) < 10 ? '#10b981' : '#fb923c', fontSize: 10, fontWeight: 700 }}>
            {Math.abs(networkBalance - 50) < 10 ? '✓ Equilibrada' : '⚠ Desequilibrada'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between mb-1.5">
              <span style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700 }}>◀ IZQ {networkBalance}%</span>
              <span style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 700 }}>DER {100 - networkBalance}% ▶</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: `${networkBalance}%`, background: '#3b82f6', borderRadius: '4px 0 0 4px', transition: 'width 0.6s' }} />
              <div style={{ flex: 1, background: '#8b5cf6', borderRadius: '0 4px 4px 0' }} />
            </div>
            <div className="flex gap-6 mt-2">
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>{kpis.leftNodes} miembros izq</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>{kpis.rightNodes} miembros der</span>
              <span style={{ color: '#10b981', fontSize: 9 }}>{kpis.active} activos total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>ALERTAS ACTIVAS</p>
          <div className="space-y-2">
            {ALERTS.map((a, i) => {
              const badge = PRIORITY_BADGE[a.priority];
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(8,18,40,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: badge.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: 11, margin: 0 }}>{a.title}</p>
                      <span className="px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0" style={{ background: badge.bg, color: badge.color, fontSize: 9 }}>{badge.label}</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: 0 }}>{a.detail}</p>
                  </div>
                  <Link to={a.to} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <span className="flex items-center gap-1" style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700 }}>
                      {a.action} <ArrowRight size={9} />
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions + Recent Activity */}
        <div className="space-y-6">
          <div>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>ACCESO RÁPIDO</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_ACTIONS.map((a, i) => {
                const Icon = a.icon;
                return (
                  <Link key={i} to={a.to} style={{ textDecoration: 'none' }}>
                    <div className="p-3 rounded-xl cursor-pointer transition-all hover:opacity-90" style={{ background: `${a.color}10`, border: `1px solid ${a.color}22` }}>
                      <div className="flex items-center justify-between mb-2">
                        <Icon size={14} style={{ color: a.color }} />
                        {a.badge && <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: `${a.color}20`, color: a.color, fontSize: 8 }}>{a.badge}</span>}
                      </div>
                      <p style={{ color: 'white', fontWeight: 700, fontSize: 11, margin: 0 }}>{a.label}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>ACTIVIDAD RECIENTE</p>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,18,40,0.5)' }}>
              {(sim.activityLog?.length > 0 ? sim.activityLog.slice(0, 6) : RECENT_EVENTS).map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color, boxShadow: i === 0 ? `0 0 5px ${item.color}80` : 'none' }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ color: i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: i === 0 ? 600 : 400, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.action}</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>{item.detail}</p>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 9, flexShrink: 0 }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* High-Value Users Quick Access */}
      <HighValueUsersPanel />

      {/* Flagged Participants Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>CASOS MARCADOS — REQUIERE SUPERVISIÓN</p>
          <Link to="/admin-dashboard/participants" style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Ver Todo <ExternalLink size={10} />
          </Link>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,18,40,0.5)' }}>
          <table className="w-full text-xs">
            <thead style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <tr>
                {['ID', 'Nombre', 'País', 'Líder', 'Plan', 'Estado', '→'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'P-20483', name: 'Pedro Martínez', country: 'BR', leader: 'C. López', plan: 'Básico', status: 'pending_verification', sc: '#fb923c' },
                { id: 'P-20484', name: 'Luisa Fernández', country: 'ES', leader: 'R. Díaz', plan: 'Premium', status: 'under_review', sc: '#06b6d4' },
                { id: 'P-20486', name: 'Andrés Torres', country: 'CO', leader: 'C. López', plan: 'Premium', status: 'blocked', sc: '#ef4444' },
                { id: 'P-20488', name: 'Diego Ramírez', country: 'MX', leader: 'C. López', plan: 'Básico', status: 'inactive', sc: '#6b7280' },
              ].map((p, i) => (
                <tr key={i} style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <td className="px-4 py-2.5" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 9 }}>{p.id}</td>
                  <td className="px-4 py-2.5" style={{ color: 'white', fontWeight: 600 }}>{p.name}</td>
                  <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', fontSize: 9 }}>{p.country}</span></td>
                  <td className="px-4 py-2.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{p.leader}</td>
                  <td className="px-4 py-2.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{p.plan}</td>
                  <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: `${p.sc}15`, color: p.sc }}>{p.status.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-2.5"><Link to="/admin-dashboard/participants" style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>Revisar →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}