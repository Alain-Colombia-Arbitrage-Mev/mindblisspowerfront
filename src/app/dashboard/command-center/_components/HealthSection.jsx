'use client';
import { ShieldCheck } from 'lucide-react';

export default function HealthSection({ health }) {
  if (!health) return <div className="executive-panel text-sm" style={{ color: 'var(--vp-muted)' }}>Cargando salud...</div>;
  if (!health.ok) {
    return (
      <section className="executive-panel">
        <h2 className="executive-section-title">
          <ShieldCheck size={18} style={{ color: 'var(--vp-accent)' }} />
          Salud de la red
        </h2>
        <p className="text-sm leading-7" style={{ color: 'var(--vp-muted)' }}>
          Motor no disponible. Mostrando metricas locales. Company Fund: {health.companyFund}
        </p>
      </section>
    );
  }
  const a = health.analysis;
  return (
    <section className="executive-panel">
      <div className="flex items-center justify-between">
        <h2 className="executive-section-title mb-0">
          <ShieldCheck size={18} style={{ color: 'var(--vp-accent)' }} />
          Salud de la red
        </h2>
        <span className={`executive-status ${riskTone(a.risk_level)}`}>Riesgo: {a.risk_level}</span>
      </div>
      <div className="mt-5 text-4xl font-light" style={{ color: 'var(--vp-text)' }}>
        {a.health_score}<span className="text-base" style={{ color: 'var(--vp-muted)' }}>/100</span>
      </div>
      <p className="mt-3 text-sm leading-7" style={{ color: 'var(--vp-muted)' }}>{a.summary}</p>
      {a.warnings?.length ? (
        <ul className="mt-4 list-disc pl-5 text-sm leading-7" style={{ color: 'var(--vp-accent)' }}>
          {a.warnings.map((w, i) => <li key={i}>{w}</li>)}
        </ul>
      ) : null}
    </section>
  );
}

function riskTone(risk) {
  if (risk === 'high') return 'danger';
  if (risk === 'medium') return 'warning';
  return 'success';
}
