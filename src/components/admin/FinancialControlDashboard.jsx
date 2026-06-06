/**
 * Financial Control Dashboard
 * Real-time investment visibility, risk indicators, anomaly detection
 */
import { useSimulation } from '@/lib/SimulationEngine';
import { useMemo } from 'react';
import { AlertTriangle, TrendingUp, Users, Zap, Eye, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import platformDataCore from '@/lib/platformDataCore';

const RISK_LEVEL = { low: { label: 'Bajo', color: '#10b981', bg: 'rgba(16,185,129,0.08)' }, medium: { label: 'Medio', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' }, high: { label: 'Alto', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' } };

export default function FinancialControlDashboard() {
  const sim = useSimulation();

  const financialData = useMemo(() => {
    const users = sim.users || [];
    const memberships = sim.integrityModel?.memberships || [];
    
    // Tier mapping
    const tierRanges = { low: [0, 500], mid: [501, 2500], high: [2501, 10000], strategic: [10001, 50000], elite: [50001, Infinity] };
    
    const activeMemberships = memberships.filter(m => m.status === 'activo');
    const totalInvestment = activeMemberships.reduce((sum, m) => sum + (m.plan_value || 0), 0);
    const avgInvestment = activeMemberships.length > 0 ? Math.round(totalInvestment / activeMemberships.length) : 0;
    
    // Distribution by tier
    const tierDist = {
      low: activeMemberships.filter(m => m.plan_value >= tierRanges.low[0] && m.plan_value <= tierRanges.low[1]),
      mid: activeMemberships.filter(m => m.plan_value >= tierRanges.mid[0] && m.plan_value <= tierRanges.mid[1]),
      high: activeMemberships.filter(m => m.plan_value >= tierRanges.high[0] && m.plan_value <= tierRanges.high[1]),
      strategic: activeMemberships.filter(m => m.plan_value >= tierRanges.strategic[0] && m.plan_value <= tierRanges.strategic[1]),
      elite: activeMemberships.filter(m => m.plan_value >= tierRanges.elite[0]),
    };
    
    const tierData = {
      low: { count: tierDist.low.length, total: tierDist.low.reduce((s, m) => s + (m.plan_value || 0), 0), color: '#6b7280' },
      mid: { count: tierDist.mid.length, total: tierDist.mid.reduce((s, m) => s + (m.plan_value || 0), 0), color: '#3b82f6' },
      high: { count: tierDist.high.length, total: tierDist.high.reduce((s, m) => s + (m.plan_value || 0), 0), color: '#8b5cf6' },
      strategic: { count: tierDist.strategic.length, total: tierDist.strategic.reduce((s, m) => s + (m.plan_value || 0), 0), color: '#fbbf24' },
      elite: { count: tierDist.elite.length, total: tierDist.elite.reduce((s, m) => s + (m.plan_value || 0), 0), color: '#ef4444' },
    };
    
    // Left/Right totals
    const nodes = platformDataCore.network_nodes || [];
    const leftNodes = nodes.filter(n => n.binary_side === 'left');
    const rightNodes = nodes.filter(n => n.binary_side === 'right');
    const leftInvestment = leftNodes.reduce((sum, n) => sum + (n.investment || 0), 0);
    const rightInvestment = rightNodes.reduce((sum, n) => sum + (n.investment || 0), 0);
    
    // Top contributors
    const topContributors = [...activeMemberships]
      .sort((a, b) => (b.plan_value || 0) - (a.plan_value || 0))
      .slice(0, 10)
      .map((m, i) => {
        const user = users.find(u => u.id === m.user_id);
        return {
          rank: i + 1,
          name: user?.name || 'Unknown',
          investment: m.plan_value || 0,
          status: user?.status || 'unknown',
          role: user?.role || 'participant',
        };
      });
    
    // Anomalies
    const anomalies = [];
    const medianInvestment = activeMemberships.length > 0 
      ? [...activeMemberships].sort((a, b) => (a.plan_value || 0) - (b.plan_value || 0))[Math.floor(activeMemberships.length / 2)].plan_value || 0
      : 0;
    const outlierThreshold = medianInvestment * 3;
    
    activeMemberships.forEach(m => {
      if ((m.plan_value || 0) > outlierThreshold) {
        const user = users.find(u => u.id === m.user_id);
        if (user && user.status !== 'activo') {
          anomalies.push({ type: 'inactive_high_value', name: user.name, investment: m.plan_value, status: 'high' });
        }
      }
    });
    
    const leftPercent = leftNodes.length + rightNodes.length > 0 ? Math.round((leftNodes.length / (leftNodes.length + rightNodes.length)) * 100) : 50;
    if (Math.abs(leftPercent - 50) > 15) {
      anomalies.push({ type: 'network_imbalance', detail: `${Math.abs(leftPercent - 50)}% imbalance`, status: leftPercent > 50 ? 'left_heavy' : 'right_heavy' });
    }
    
    return {
      totalInvestment,
      avgInvestment,
      activeCount: activeMemberships.length,
      tierData,
      topContributors,
      leftInvestment,
      rightInvestment,
      leftPercent,
      anomalies,
      dataConsistency: anomalies.length === 0 ? 'ok' : 'warning',
    };
  }, [sim.users, sim.integrityModel]);

  const calcRisk = (investment, activity) => {
    if (investment > 25000 && activity === 'low') return 'high';
    if (investment > 10000 && activity === 'low') return 'medium';
    if (investment < 100) return 'low';
    return 'low';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p style={{ color: '#06b6d4', fontSize: 9, fontWeight: 800, letterSpacing: '0.25em', margin: '0 0 4px' }}>FINANZAS · VISIBILIDAD DE INVERSIÓN</p>
          <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, margin: 0 }}>Control Financiero</h2>
        </div>
        {financialData.dataConsistency === 'ok' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span style={{ color: '#10b981', fontSize: 10, fontWeight: 600 }}>✓ Datos Consistentes</span>
          </div>
        )}
        {financialData.dataConsistency === 'warning' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.18)' }}>
            <AlertTriangle size={13} style={{ color: '#fb923c' }} />
            <span style={{ color: '#fb923c', fontSize: 10, fontWeight: 600 }}>⚠ {financialData.anomalies.length} anomalías</span>
          </div>
        )}
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Inversión Total', value: `$${Math.round(financialData.totalInvestment / 1000)}K`, color: '#06b6d4' },
          { label: 'Promedio', value: `$${financialData.avgInvestment.toLocaleString()}`, color: '#3b82f6' },
          { label: 'Planes Activos', value: financialData.activeCount, color: '#10b981' },
          { label: 'Saldo Izq/Der', value: `${financialData.leftPercent}% L / ${100 - financialData.leftPercent}% R`, color: financialData.leftPercent > 60 || financialData.leftPercent < 40 ? '#fb923c' : '#10b981' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: `${s.color}0d`, border: `1px solid ${s.color}22` }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600, margin: '0 0 4px 0' }}>{s.label}</p>
            <p style={{ color: s.color, fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tier Distribution */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>DISTRIBUCIÓN POR NIVEL</p>
        <div className="grid grid-cols-5 gap-3">
          {[
            { tier: 'low', label: 'Bajo' },
            { tier: 'mid', label: 'Medio' },
            { tier: 'high', label: 'Alto' },
            { tier: 'strategic', label: 'Estratégico' },
            { tier: 'elite', label: 'Elite' },
          ].map((t) => {
            const data = financialData.tierData[t.tier];
            return (
              <div key={t.tier} className="p-4 rounded-xl" style={{ background: `${data.color}0d`, border: `1px solid ${data.color}22` }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600, margin: '0 0 4px 0' }}>{t.label}</p>
                <p style={{ color: data.color, fontSize: 16, fontWeight: 900, margin: '0 0 2px 0' }}>{data.count}</p>
                <p style={{ color: data.color, fontSize: 11, fontWeight: 700, margin: 0 }}>
                  ${data.total > 0 ? Math.round(data.total / 1000) : 0}K
                </p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 8, margin: '2px 0 0 0' }}>
                  {data.count > 0 ? Math.round((data.total / financialData.totalInvestment) * 100) : 0}% total
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Contributors */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>TOP 10 CONTRIBUYENTES</p>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,18,40,0.5)' }}>
          <table className="w-full text-xs">
            <thead style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <tr>
                {['#', 'Nombre', 'Inversión', 'Rol', 'Estado', 'Riesgo', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.35)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {financialData.topContributors.map((c, i) => {
                const risk = c.status === 'activo' && c.investment > 5000 ? 'low' : c.status !== 'activo' ? 'high' : 'medium';
                const riskCfg = RISK_LEVEL[risk];
                return (
                  <tr key={i} style={{ borderBottom: i < 9 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <td className="px-4 py-2.5" style={{ color: '#fbbf24', fontWeight: 700 }}>{c.rank}</td>
                    <td className="px-4 py-2.5" style={{ color: 'white', fontWeight: 600 }}>{c.name}</td>
                    <td className="px-4 py-2.5" style={{ color: '#06b6d4', fontWeight: 700 }}>${c.investment.toLocaleString()}</td>
                    <td className="px-4 py-2.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{c.role}</td>
                    <td className="px-4 py-2.5">
                      <span style={{ color: c.status === 'activo' ? '#10b981' : '#ef4444', fontSize: 10, fontWeight: 600 }}>
                        {c.status === 'activo' ? '✓ Activo' : '⚠ Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-xs font-semibold" style={{ background: riskCfg.bg, color: riskCfg.color }}>
                        {riskCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button className="px-2 py-1 rounded text-xs font-semibold" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
                        Ver →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Anomalies */}
      {financialData.anomalies.length > 0 && (
        <div>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 800, letterSpacing: '0.2em', margin: '0 0 10px' }}>ANOMALÍAS DETECTADAS</p>
          <div className="space-y-2">
            {financialData.anomalies.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <AlertTriangle size={13} style={{ color: '#ef4444', marginTop: 1, flexShrink: 0 }} />
                <div className="flex-1">
                  {a.type === 'inactive_high_value' && (
                    <>
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: 11, margin: 0 }}>Usuario de Alto Valor Inactivo</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '1px 0 0 0' }}>{a.name} · ${a.investment.toLocaleString()}</p>
                    </>
                  )}
                  {a.type === 'network_imbalance' && (
                    <>
                      <p style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: 11, margin: 0 }}>Desequilibrio de Red</p>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '1px 0 0 0' }}>{a.detail} ({a.status})</p>
                    </>
                  )}
                </div>
                <button className="px-2 py-1 rounded text-xs font-semibold flex-shrink-0" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                  Revisar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network Balance Detail */}
      <div className="p-4 rounded-xl" style={{ background: 'rgba(8,18,40,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, margin: '0 0 12px 0' }}>Balance de Inversión por Rama</p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1.5">
              <span style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700 }}>Izquierda</span>
              <span style={{ color: '#3b82f6', fontSize: 10, fontWeight: 700 }}>${Math.round(financialData.leftInvestment / 1000)}K</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: `${financialData.leftPercent}%`, height: '100%', background: '#3b82f6', borderRadius: 1 }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <span style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 700 }}>Derecha</span>
              <span style={{ color: '#8b5cf6', fontSize: 10, fontWeight: 700 }}>${Math.round(financialData.rightInvestment / 1000)}K</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: `${100 - financialData.leftPercent}%`, height: '100%', background: '#8b5cf6', borderRadius: 1, marginLeft: 'auto' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}