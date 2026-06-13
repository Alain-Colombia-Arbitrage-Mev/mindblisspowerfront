'use client';
import { marginStatus } from '@/api/commandCenter.transform.mjs';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' }).format(n ?? 0);

export default function FinanceSection({ summary }) {
  if (!summary) return <div className="executive-panel text-sm" style={{ color: 'var(--vp-muted)' }}>Cargando KPIs...</div>;
  const status = marginStatus(summary.marginPct);
  return (
    <section className="executive-grid metrics">
      <Kpi label="Ingresos (período)" value={fmt(summary.inflows)} />
      <Kpi label="Bonos pagados" value={fmt(summary.bonusOutflows)} />
      <Kpi label="Margen" value={`${fmt(summary.margin)} (${summary.marginPct}%)`} tone={status} />
      <Kpi label="Company Fund" value={fmt(summary.companyFund)} />
      <Kpi label="Retiros" value={fmt(summary.withdrawals)} />
      <Kpi label="Miembros activos" value={`${summary.network.activeMembers}/${summary.network.totalMembers}`} />
      <Kpi label="Volumen Izq" value={summary.network.leftVolume} />
      <Kpi label="Volumen Der" value={summary.network.rightVolume} />
    </section>
  );
}

function Kpi({ label, value, tone }) {
  const color = tone === 'critical' ? 'var(--vp-danger)' : tone === 'warning' ? 'var(--vp-accent)' : 'var(--vp-text)';

  return (
    <div className="executive-card">
      <div className="executive-card-label">{label}</div>
      <div className="mt-1 text-lg font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}
