import { shapeSummary, sortAlerts } from './commandCenter.transform.mjs';

const BASE = import.meta.env?.VITE_API_BASE ?? '';

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' });
  if (res.status === 401) throw new Error('unauthenticated');
  if (res.status === 403) throw new Error('forbidden');
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json();
}

export async function fetchSummary({ from, to } = {}) {
  const qs = new URLSearchParams();
  if (from) qs.set('from', from);
  if (to) qs.set('to', to);
  const raw = await getJson(`/api/admin/command-center/summary?${qs}`);
  return shapeSummary(raw);
}

export async function fetchHealth() {
  return getJson('/api/admin/command-center/health');
}

export async function fetchAlerts() {
  const raw = await getJson('/api/admin/command-center/alerts');
  return { alerts: sortAlerts(raw.alerts) };
}

export async function ackAlert(id) {
  const res = await fetch(`${BASE}/api/admin/command-center/alerts/${id}/ack`, {
    method: 'POST', credentials: 'include',
  });
  if (!res.ok) throw new Error(`ack failed: ${res.status}`);
  return res.json();
}
