import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shapeSummary, marginStatus, sortAlerts } from './commandCenter.transform.mjs';

test('shapeSummary derives margin pct and leg balance', () => {
  const out = shapeSummary({
    kpis: { inflows: 1000, bonusOutflows: 300, withdrawals: 50, margin: 700, byKind: [] },
    companyFund: 5000,
    network: { totalMembers: 10, activeMembers: 8, leftVolume: 60, rightVolume: 40, leftCount: 5, rightCount: 4 },
  });
  assert.equal(out.marginPct, 70);
  assert.equal(out.legBalancePct, 60); // stronger leg share
});

test('shapeSummary treats decimal strings as numbers when combining binary volumes', () => {
  const out = shapeSummary({
    kpis: { inflows: '1000.00', margin: '700.00' },
    network: { leftVolume: '60.00', rightVolume: '40.00' },
  });
  assert.equal(out.marginPct, 70);
  assert.equal(out.legBalancePct, 60);
  assert.equal(out.network.leftVolume, 60);
  assert.equal(out.network.rightVolume, 40);
});

test('shapeSummary tolerates missing summary sections', () => {
  for (const raw of [undefined, null, {}, { kpis: null, network: null }]) {
    const out = shapeSummary(raw);
    assert.equal(out.marginPct, 0);
    assert.equal(out.legBalancePct, 50);
  }
});

test('marginStatus thresholds', () => {
  assert.equal(marginStatus(70), 'healthy');
  assert.equal(marginStatus(15), 'warning');
  assert.equal(marginStatus(-5), 'critical');
});

test('sortAlerts puts critical first', () => {
  const out = sortAlerts([
    { severity: 'warning', signal: 'leg_skew' },
    { severity: 'critical', signal: 'theta' },
  ]);
  assert.equal(out[0].signal, 'theta');
});
