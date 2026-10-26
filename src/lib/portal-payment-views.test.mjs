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
// Compile the actual JSX in memory: no generated source files or browser/API calls.
function component(relative, mocks) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id === 'lucide-react' ? icons : Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
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
    const retry = React.Children.toArray(Component().props.children).find(child => child.type === 'button');
    retry.props.onClick(); assert.equal(retries, 1);
  }
});
