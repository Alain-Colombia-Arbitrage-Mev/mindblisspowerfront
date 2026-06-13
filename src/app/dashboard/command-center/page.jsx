'use client';
import { useEffect, useState } from 'react';
import { Activity, ShieldAlert } from 'lucide-react';
import { fetchSummary, fetchHealth, fetchAlerts, ackAlert } from '@/api/commandCenterApi';
import FinanceSection from './_components/FinanceSection';
import HealthSection from './_components/HealthSection';
import AlertsSection from './_components/AlertsSection';

export default function CommandCenterPage() {
  const [summary, setSummary] = useState(null);
  const [health, setHealth] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);

  const loadAlerts = () => fetchAlerts().then((r) => setAlerts(r.alerts)).catch((e) => setError(e.message));

  useEffect(() => {
    fetchSummary().then(setSummary).catch((e) => setError(e.message));
    fetchHealth().then(setHealth).catch((e) => setError(e.message));
    loadAlerts();
  }, []);

  const onAck = async (id) => { await ackAlert(id); await loadAlerts(); };

  return (
    <section className="executive-page">
      <div className="executive-container">
        <div className="executive-page-header">
          <div>
            <p className="executive-eyebrow">Administracion</p>
            <h1 className="executive-title">Centro de Mando</h1>
            <p className="executive-subtitle">
              Vista ejecutiva para alertas, sanidad de red, margen, retiros y fondo corporativo.
            </p>
          </div>
          <span className="executive-icon-badge">
            <Activity size={20} />
          </span>
        </div>

        {error && (
          <div className="executive-panel mb-6 flex items-start gap-3" style={{ borderColor: 'var(--vp-danger-border)', color: 'var(--vp-danger)' }}>
            <ShieldAlert size={18} />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          <AlertsSection alerts={alerts} onAck={onAck} />
          <HealthSection health={health} />
          <FinanceSection summary={summary} />
        </div>
      </div>
    </section>
  );
}
