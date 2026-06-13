export function shapeSummary(raw) {
  const { kpis, companyFund, network } = raw;
  const marginPct = kpis.inflows > 0 ? round((kpis.margin / kpis.inflows) * 100) : 0;
  const totalVol = network.leftVolume + network.rightVolume;
  const stronger = Math.max(network.leftVolume, network.rightVolume);
  const legBalancePct = totalVol > 0 ? round((stronger / totalVol) * 100) : 50;
  return { ...kpis, companyFund, network, marginPct, legBalancePct };
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
