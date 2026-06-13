'use client';
import { Bell } from 'lucide-react';

export default function AlertsSection({ alerts, onAck }) {
  if (!alerts) return <div className="executive-panel text-sm" style={{ color: 'var(--vp-muted)' }}>Cargando alertas...</div>;
  if (alerts.length === 0) {
    return (
      <section className="executive-panel">
        <h2 className="executive-section-title">
          <Bell size={18} style={{ color: 'var(--vp-accent)' }} />
          Alertas
        </h2>
        <span className="executive-status success">Sin alertas activas</span>
      </section>
    );
  }
  return (
    <section className="executive-panel">
      <h2 className="executive-section-title">
        <Bell size={18} style={{ color: 'var(--vp-accent)' }} />
        Alertas
      </h2>
      <div className="space-y-3">
      {alerts.map((a) => (
        <div key={a.id} className="flex items-start justify-between rounded-2xl p-4" style={{ background: 'var(--vp-bg)', border: '1px solid var(--vp-border)' }}>
          <div>
            <span className={`executive-status ${tone(a.severity)}`}>{a.severity} · {a.signal}</span>
            <div className="mt-3 text-sm" style={{ color: 'var(--vp-text-soft)' }}>{a.detail}</div>
          </div>
          {a.status === 'open' && onAck && (
            <button onClick={() => onAck(a.id)} className="executive-button ml-3 shrink-0" type="button">Reconocer</button>
          )}
        </div>
      ))}
      </div>
    </section>
  );
}

function tone(severity) {
  if (severity === 'critical') return 'danger';
  if (severity === 'warning') return 'warning';
  return 'info';
}
