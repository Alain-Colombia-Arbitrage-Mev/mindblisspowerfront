import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as balances from './nowpayments-balances.mjs';
import * as origins from './compensation-origin.mjs';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../components/panel/ManualMembershipBalances.jsx', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
const module = { exports: {} };
new Function('require', 'module', 'exports', code)(id => id === '@/lib/nowpayments-balances.mjs' ? balances
  : id === '@/lib/compensation-origin.mjs' ? origins
  : id === 'lucide-react' ? new Proxy({}, { get: () => () => React.createElement('svg', { 'aria-hidden': 'true' }) })
  : id.endsWith('.module.css') ? { default: new Proxy({}, { get: (_target, key) => String(key) }) } : require(id), module, module.exports);
const render = data => renderToStaticMarkup(React.createElement(module.exports.default, { data }));
const model = () => ({ provider: 'manual', read_model_status: 'operational', withdrawals_enabled: false,
  commissions: { pending_usd: '4.85', available_usd: '0.00', funding_held_usd: '0.00', credited_usd: '4.85', paid_external_usd: '0.00',
    items: [{ amount_usd: '4.85', credited_usd: '4.85', funding_held_usd: '0.00', cap_excluded_usd: '0.00', generated_at: '2026-11-05T15:00:00Z', available_at: '2026-12-05T15:00:00Z', status: 'pending_maturity' }] },
  membership: { principal_locked_usd: '100.00', principal_available_usd: '0.00', roi_locked_usd: '0.00', roi_available_usd: '0.00',
    items: [{ principal_usd: '100.00', gross_usd: '100.00', fee_usd: '3.00', net_usd: '97.00', pv: '100', started_at: '2026-11-05T15:00:00Z', lock_until: '2027-11-05T15:00:00Z', eligibility: 'locked', roi_locked_usd: '0.00', roi_available_usd: '0.00' }] } });

test('manual membership displays server principal, fee, net and PV separately without creating a provider receipt', () => {
  const data = model(), before = JSON.stringify(data), html = render(data);
  for (const text of ['Registro manual', 'Base de comisiones', '$100.00 USD', '$3.00 USD', '$97.00 USD', '365 días', '1 mes calendario']) assert.ok(html.includes(text), text);
  assert.match(html, /Retiros externos siguen deshabilitados/i);
  assert.doesNotMatch(html, /Membresías y comisiones NOWPayments|<button|<form|href=|pago automático garantizado/);
  assert.equal(JSON.stringify(data), before);
  assert.doesNotMatch(source, /Date\.now|setInterval|fetch\s*\(|parseFloat|Number\s*\(/);
});
test('missing optional feature is hidden; unknown or malformed manual money never becomes a zero balance', () => {
  assert.equal(render(undefined), '');
  for (const value of [{ provider: 'manual', read_model_status: 'unavailable' }, { ...model(), provider: 'nowpayments' },
    { ...model(), membership: { ...model().membership, items: [{ ...model().membership.items[0], net_usd: 'NaN' }] } }]) {
    const html = render(value);
    assert.match(html, /No pudimos consultar tus registros manuales/);
    assert.doesNotMatch(html, /\$0|<table|NaN/);
  }
});
test('empty manual ledger is not an extra zero-money panel and browser dates never promote server eligibility', () => {
  const empty = model(); empty.membership.items = []; empty.commissions.items = [];
  assert.equal(render(empty), '');
  const data = model(); data.membership.items[0].eligibility = 'risk_review'; data.membership.items[0].lock_until = '2020-01-01T15:00:00Z';
  assert.match(render(data), /En revisión de seguridad/);
});
test('overview, payments and finance mount only the explicit manual projection', () => {
  for (const path of ['../components/panel/overview/OverviewDashboard.jsx', '../app/dashboard/packages/MyPaymentsPanel.jsx', '../app/dashboard/_components/executive-pages/FinanceDashboardPage.jsx']) {
    const content = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(content, /ManualMembershipBalances/); assert.match(content, /manual_memberships/);
  }
});
