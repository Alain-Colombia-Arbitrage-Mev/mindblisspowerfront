/**
 * Admin War Room — Live operational command panel
 * Focused: alerts, live activity, interventions, critical queues
 */
import { useState, useEffect } from 'react';
import { AlertTriangle, Users, CreditCard, Shield, CheckCircle, X, ArrowRight, Zap, Clock, RefreshCw, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSimulation } from '@/lib/SimulationEngine';

const PRIORITY_CFG = {
  critical: { label: 'Crítico', bg: 'rgba(239,68,68,0.12)', color: '#ef4444', dot: '#ef4444' },
  high:     { label: 'Alto',    bg: 'rgba(251,146,60,0.10)', color: '#fb923c', dot: '#fb923c' },
  medium:   { label: 'Medio',  bg: 'rgba(251,191,36,0.08)', color: '#fbbf24', dot: '#fbbf24' },
  low:      { label: 'Bajo',   bg: 'rgba(107,114,128,0.1)', color: '#6b7280', dot: '#6b7280' },
};

const ALERT_GROUPS = [
  {
    group: 'PARTICIPANTES EN RIESGO',
    color: '#ef4444',
    items: [
      { priority: 'critical', name: 'Andrés Torres', detail: 'Cuenta bloqueada · CO · Premium', to: '/admin-dashboard/participants' },
      { priority: 'high',     name: 'Pedro Martínez', detail: 'KYC pendiente 72h · BR · Básico', to: '/admin-dashboard/participants' },
      { priority: 'high',     name: 'Luisa Fernández', detail: 'En revisión · ES · Premium', to: '/admin-dashboard/participants' },
    ]
  },
  {
    group: 'LÍDERES — INTERVENCIÓN',
    color: '#8b5cf6',
    items: [
      { priority: 'critical', name: 'Líder BR-004', detail: '3 violaciones de comunicación · Suspensión pendiente', to: '/admin-dashboard/leaders' },
      { priority: 'high',     name: 'Líder MX-011', detail: 'Desequilibrio izq/der >40% · Red inactiva', to: '/admin-dashboard/leaders' },
      { priority: 'medium',   name: 'Líder CO-015', detail: 'Certificación pendiente · Requiere revisión', to: '/admin-dashboard/leaders' },
    ]
  },
  {
    group: 'PAGOS — ANOMALÍAS',
    color: '#06b6d4',
    items: [
      { priority: 'critical', name: 'Pago $2,400', detail: 'R. Gómez · Transferencia no verificada · 48h pendiente', to: '/admin-dashboard/payments' },
      { priority: 'high',     name: '7 pagos marcados', detail: 'Detección de fraude automática · SLA en riesgo', to: '/admin-dashboard/payments' },
    ]
  },
  {
    group: 'VERIFICACIONES PENDIENTES',
    color: '#fb923c',
    items: [
      { priority: 'high',   name: '15 participantes', detail: 'Cola KYC · 3 casos próximos a incumplimiento SLA', to: '/admin-dashboard/participants' },
      { priority: 'medium', name: '14 nuevos líderes', detail: 'Lote de certificación de 6 países', to: '/admin-dashboard/leaders' },
    ]
  },
];

const PENDING_INTERVENTIONS = [
  { id: 'INT-001', type: 'Revisión de Líder', target: 'Carlos López · BR-001', reason: 'Violaciones de comunicación', assignedTo: 'Admin', priority: 'critical', status: 'pending' },
  { id: 'INT-002', type: 'Bloqueo de Cuenta', target: 'Andrés Torres · P-20486', reason: 'Actividad sospechosa', assignedTo: 'Compliance', priority: 'critical', status: 'in_progress' },
  { id: 'INT-003', type: 'Verificación KYC', target: 'Lote #77 · 8 participantes', reason: 'Supera SLA 48h', assignedTo: 'Sin asignar', priority: 'high', status: 'pending' },
  { id: 'INT-004', type: 'Corrección de Red', target: 'Luisa Fernández · P-20484', reason: 'Solicitud de reasignación', assignedTo: 'Admin', priority: 'medium', status: 'pending' },
  { id: 'INT-005', type: 'Auditoría de Pago', target: 'Roberto Gómez · $1,500', reason: 'Transferencia bancaria sin confirmar', assignedTo: 'Finanzas', priority: 'high', status: 'pending' },
];

const LIVE_EVENTS_BASE = [
  { type: 'Registro nuevo', detail: 'C. Méndez · MX · Básico', time: '1m', color: '#3b82f6' },
  { type: 'Pago aprobado', detail: 'J. García · $750 · CO', time: '3m', color: '#10b981' },
  { type: 'Plan activado', detail: 'M. Rodríguez · Premium', time: '7m', color: '#10b981' },
  { type: 'Cuenta bloqueada', detail: 'P. Martínez · Fraude', time: '18m', color: '#ef4444' },
  { type: 'Líder certificado', detail: 'A. Silva · BR-001', time: '34m', color: '#8b5cf6' },
  { type: 'Caso escalado', detail: 'Soporte #4821 → Crítico', time: '52m', color: '#fb923c' },
  { type: 'Red expandida', detail: '+3 miembros · árbol BR-001', time: '1h', color: '#3b82f6' },
  { type: 'KYC verificado', detail: 'R. Díaz · ID-8847', time: '2h', color: '#10b981' },
];

export default function ControlCenter() {
  const sim = useSimulation();
  const [interventions, setInterventions] = useState(PENDING_INTERVENTIONS);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB'));

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-GB')), 30000);
    return () => clearInterval(t);
  }, []);

  const liveEvents = sim.activityLog?.length > 0 ? sim.activityLog.slice(0, 8) : LIVE_EVENTS_BASE;

  const resolveIntervention = (id) => setInterventions(prev => prev.filter(i => i.id !== id));
  const assignIntervention = (id) => setInterventions(prev => prev.map(i => i.id === id ? { ...i, assignedTo: 'Admin', status: 'in_progress' } : i));

  const criticalCount = ALERT_GROUPS.flatMap(g => g.items).filter(i => i.priority === 'critical').length;
  const pendingCount = interventions.filter(i => i.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p style={{ color: '#ef4444', fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', margin: '0 0 4px' }}>WAR ROOM · COMANDO OPERACIONAL</p>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>Centro de Control</h1>
        </div>
        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={12} style={{ color: '#ef4444' }} />
              <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 700 }}>{criticalCount} CRÍTICOS</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span style={{ color: '#10b981', fontSize: 10, fontWeight: 600 }}>LIVE · {time}</span>
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Alertas Críticas', value: criticalCount, color: '#ef4444', icon: AlertTriangle },
          { label: 'Intervenciones', value: pendingCount, color: '#fb923c', icon: Zap },
          { label: 'Pagos en Cola', value: 8, color: '#06b6d4', icon: CreditCard },
          { label: 'KYC Pendiente', value: 15, color: '#fbbf24', icon: Clock },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: `${s.color}0d`, border: `1px solid ${s.color}22` }}>
              <Icon size={16} style={{ color: s.color }} />
              <div>
                <p style={{ color: s.color, fontSize: 18, fontWeight: 900, margin: 0 }}>{s.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600, margin: 0 }}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts + Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Groups */}
        <div className="space-y-4">
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>ALERTAS POR CATEGORÍA</p>
          {ALERT_GROUPS.map((group, gi) => (
            <div key={gi} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${group.color}20`, background: 'rgba(8,18,40,0.6)' }}>
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: `${group.color}08`, borderBottom: `1px solid ${group.color}15` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: group.color }} />
                <p style={{ color: group.color, fontSize: 9, fontWeight: 800, margin: 0, letterSpacing: '0.1em' }}>{group.group}</p>
                <span className="ml-auto px-1.5 py-0.5 rounded text-xs" style={{ background: `${group.color}15`, color: group.color, fontSize: 8 }}>{group.items.length}</span>
              </div>
              {group.items.map((item, ii) => {
                const p = PRIORITY_CFG[item.priority];
                return (
                  <div key={ii} className="flex items-start gap-3 px-4 py-2.5" style={{ borderBottom: ii < group.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: p.dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: 600, margin: 0 }}>{item.name}</p>
                        <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: p.bg, color: p.color, fontSize: 8 }}>{p.label}</span>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '1px 0 0 0' }}>{item.detail}</p>
                    </div>
                    <Link to={item.to} style={{ textDecoration: 'none', flexShrink: 0 }}>
                      <button className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                        Abrir →
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Live Activity */}
        <div>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>ACTIVIDAD EN VIVO</p>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,18,40,0.6)' }}>
            {liveEvents.slice(0, 8).map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: i === 0 ? `${item.color}06` : 'transparent' }}>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color, boxShadow: i === 0 ? `0 0 6px ${item.color}80` : 'none' }} />
                <div className="flex-1 min-w-0">
                  <p style={{ color: i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: i === 0 ? 600 : 400, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.type || item.action}</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, margin: 0 }}>{item.detail}</p>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 9, flexShrink: 0 }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Intervention Queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: 0 }}>COLA DE INTERVENCIONES — {interventions.length} PENDIENTES</p>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>Marcar como resuelto libera la cola</span>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,18,40,0.5)' }}>
          <table className="w-full text-xs">
            <thead style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <tr>
                {['ID', 'Tipo', 'Objetivo', 'Motivo', 'Asignado', 'Prioridad', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {interventions.map((item, i) => {
                const p = PRIORITY_CFG[item.priority];
                const isLast = i === interventions.length - 1;
                return (
                  <tr key={item.id} style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', fontSize: 9 }}>{item.id}</td>
                    <td className="px-3 py-2.5" style={{ color: 'white', fontWeight: 600 }}>{item.type}</td>
                    <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.target}</td>
                    <td className="px-3 py-2.5" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>{item.reason}</td>
                    <td className="px-3 py-2.5" style={{ color: item.assignedTo === 'Sin asignar' ? '#fb923c' : 'rgba(255,255,255,0.55)' }}>{item.assignedTo}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: p.bg, color: p.color }}>{p.label}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: item.status === 'in_progress' ? 'rgba(59,130,246,0.15)' : 'rgba(251,146,60,0.1)', color: item.status === 'in_progress' ? '#3b82f6' : '#fb923c' }}>
                        {item.status === 'in_progress' ? 'En progreso' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        {item.status === 'pending' && (
                          <button onClick={() => assignIntervention(item.id)} className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                            Asignar
                          </button>
                        )}
                        <button onClick={() => resolveIntervention(item.id)} className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                          Resolver
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {interventions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center" style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>
                    ✓ Todas las intervenciones resueltas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { label: 'Participantes', to: '/admin-dashboard/participants', color: '#10b981' },
          { label: 'Líderes', to: '/admin-dashboard/leaders', color: '#8b5cf6' },
          { label: 'Pagos', to: '/admin-dashboard/payments', color: '#06b6d4' },
          { label: 'Soporte', to: '/admin-dashboard/support', color: '#fb923c' },
          { label: 'Auditoría', to: '/admin-dashboard/audit', color: '#3b82f6' },
          { label: 'Seguridad', to: '/admin-dashboard/security', color: '#ef4444' },
        ].map((a, i) => (
          <Link key={i} to={a.to} style={{ textDecoration: 'none' }}>
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:opacity-90" style={{ background: `${a.color}12`, border: `1px solid ${a.color}22`, color: a.color }}>
              {a.label} <ArrowRight size={11} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}