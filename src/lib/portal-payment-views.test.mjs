import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as paymentDisplay from './payment-display.mjs';

const require = createRequire(import.meta.url);
const iconStub = () => React.createElement('svg', { 'aria-hidden': 'true' });
const icons = new Proxy({}, { get: () => iconStub });
const cssModule = { default: new Proxy({}, { get: (_target, key) => String(key) }) };
// Compile the actual JSX in memory: no generated source files or browser/API calls.
function component(relative, mocks) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id === 'lucide-react' ? icons : id.endsWith('.module.css') ? cssModule
    : Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
  return module.exports.default;
}
const SalesHistory = component('../app/dashboard/packages/StripeSalesHistory.jsx', { '@/lib/payment-display.mjs': paymentDisplay });
const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, props));

test('Stripe history distinguishes missing/malformed data from a verified empty history without crashing', () => {
  for (const sales of [undefined, null, {}, [null], [{ payment_intent_id: {} }]]) {
    const html = render(SalesHistory, { sales });
    assert.match(html, /role="alert"/); assert.match(html, /No se pudo cargar/);
    assert.doesNotMatch(html, /No hay ventas Stripe verificadas/);
  }
  const empty = render(SalesHistory, { sales: [] });
  assert.match(empty, /No hay ventas Stripe verificadas/); assert.doesNotMatch(empty, /role="alert"/);
});

test('Stripe history tolerates numeric IDs accepted by the read validator and safely escapes references', () => {
  for (const id of [1234567890123, 'pi_<script>unsafe']) {
    const html = render(SalesHistory, { sales: [{ payment_intent_id: id, total_usd: null, charged_at: null, status: 'unknown' }] });
    assert.match(html, /Pendiente de cálculo/); assert.match(html, /Bajo revisión/);
    assert.doesNotMatch(html, /<script>/);
  }
});

function payments(state, reload = () => {}) {
  return component('../app/dashboard/packages/MyPaymentsPanel.jsx', {
    '@/lib/member-read.mjs': { isRecoverySummary: () => false },
    '@/hooks/useMemberSummary': { useMemberSummary: () => ({ state, reload }) },
    '@/lib/payment-display.mjs': paymentDisplay, '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' ') },
    './StripeSalesHistory': { default: () => null }, './WithdrawalRequest': { default: () => null },
    './NOWPaymentsPurchases': { default: () => null },
    '@/components/panel/NOWPaymentsBalances': { default: () => null },
  });
}

test('payment loading is announced and never renders an unconfirmed zero balance', () => {
  const html = render(payments({ loading: true, data: null, error: '' }));
  assert.match(html, /role="status"/); assert.match(html, /aria-busy="true"/); assert.match(html, /Cargando pagos/);
  assert.doesNotMatch(html, /\$0\.00/);
});

test('payment errors and absent payloads provide an operable retry instead of a crash or dead end', () => {
  for (const error of ['Servicio no disponible', '']) {
    let retries = 0;
    const Component = payments({ loading: false, data: null, error }, () => { retries++; });
    const html = render(Component);
    assert.match(html, /role="alert"/); assert.match(html, /Reintentar pagos/); assert.doesNotMatch(html, /\$0\.00/);
    const summary = React.Children.toArray(Component().props.children)[0];
    const card = summary.type(summary.props);
    const retry = React.Children.toArray(card.props.children).find(child => child.type === 'button');
    retry.props.onClick(); assert.equal(retries, 1);
  }
});

test('summary loading/error/refresh leaves the history sibling at one stable React identity and one synthetic mount GET', () => {
  const state = { loading: true, data: null, error: '' };
  const Component = payments(state);
  let previous, syntheticHistoryGETs = 0;
  for (const next of [{ loading: true, data: null, error: '' },
    { loading: false, data: { active_packages: 0, payments: [], withdrawals: [] }, error: '' },
    { loading: true, data: null, error: '' }, { loading: false, data: null, error: 'Temporary error' },
    { loading: false, data: { active_packages: 1, payments: [], withdrawals: [] }, error: '' }]) {
    Object.assign(state, next);
    const tree = Component();
    assert.equal(tree.type, React.Fragment);
    const siblings = React.Children.toArray(tree.props.children);
    assert.equal(siblings.length, 2);
    const identity = { parent: tree.type, index: 1, type: siblings[1].type, key: siblings[1].key };
    // React preserves a sibling's mounted effects when parent/type/key/index
    // stay fixed. The real history loads only in its stable mount effect.
    if (!previous || Object.keys(identity).some(key => identity[key] !== previous[key])) syntheticHistoryGETs++;
    previous = identity;
  }
  assert.equal(syntheticHistoryGETs, 1);
});
