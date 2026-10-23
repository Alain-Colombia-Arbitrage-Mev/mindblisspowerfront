export function shapeSummary(raw) {
  const kpis = raw?.kpis ?? {};
  const network = raw?.network ?? {};
  const companyFund = raw?.companyFund ?? 0;
  const inflows = finiteNumber(kpis.inflows);
  const margin = finiteNumber(kpis.margin);
  const leftVolume = finiteNumber(network.leftVolume);
  const rightVolume = finiteNumber(network.rightVolume);
  const marginPct = inflows > 0 ? round((margin / inflows) * 100) : 0;
  const totalVol = leftVolume + rightVolume;
  const stronger = Math.max(leftVolume, rightVolume);
  const legBalancePct = totalVol > 0 ? round((stronger / totalVol) * 100) : 50;
  return { ...kpis, inflows, margin, companyFund, network: { ...network, leftVolume, rightVolume }, marginPct, legBalancePct };
}

function finiteNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

export function marginStatus(pct) {
  if (pct < 0) return 'critical';
  if (pct < 20) return 'warning';
  return 'healthy';
}

function round(n) { return Math.round(n * 100) / 100; }

export function sortAlerts(alerts) {
  const rank = { critical: 0, warning: 1, info: 2 };
  return [...(alerts ?? [])].sort((a, b) => (rank[a.severity] ?? 3) - (rank[b.severity] ?? 3));
}
