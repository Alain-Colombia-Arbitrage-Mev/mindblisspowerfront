import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as RealDialog from '@radix-ui/react-dialog';
import ts from 'typescript';
import * as policy from './nowpayments-receipt.mjs';

const require = createRequire(import.meta.url);
const orderId = 'a02f5a55-5fa3-4239-845b-ac6b699110ee';
const complete = { provider: 'nowpayments', order_id: orderId, state: 'completed', payment_confirmed: true,
  signature_validated: true, provider_verified: true, persisted: true, fulfillment_status: 'not_activated' };
function component(receipt) {
  let dismiss = ''; const destinations = [];
  const source = readFileSync(new URL('../app/dashboard/packages/NOWPaymentsReceiptPopup.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  // Keep the real Radix dialog, title, description and close implementations;
  // only Portal is inlined for server rendering without a browser DOM.
  const mocks = { react: { ...React, useState: () => [dismiss, value => { dismiss = value; }] },
    '@radix-ui/react-dialog': { ...RealDialog, Portal: ({ children }) => children }, 'lucide-react': { CheckCircle2: () => React.createElement('svg') },
    'next/navigation': { useRouter: () => ({ replace: href => destinations.push(href) }) },
    '@/hooks/useNOWPaymentsReceipt': { useNOWPaymentsReceipt: () => receipt }, '@/lib/nowpayments-receipt.mjs': policy };
  new Function('require', 'module', 'exports', code)(id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
  return { Component: module.exports.default, destinations };
}

test('the real Radix receipt dialog renders only completed owner-scoped proof, with accessible title/description and no activation claim', () => {
  const { Component } = component(complete);
  const html = renderToStaticMarkup(React.createElement(Component, { orderId }));
  assert.match(html, /role="dialog"/); assert.match(html, /aria-labelledby=/); assert.match(html, /aria-describedby=/);
  assert.match(html, /Pago recibido y verificado/); assert.match(html, /guardamos su comprobante/);
  assert.match(html, /no activa una membresía ni genera rendimientos, comisiones o retiros/);
  assert.match(html, /Cerrar confirmación/); assert.doesNotMatch(html, /Membresía activa|Ver mi red|Activación completada/);
  for (const value of [null, { ...complete, payment_confirmed: false }, { ...complete, persisted: false },
    { ...complete, signature_validated: false }, { ...complete, provider_verified: false }, { ...complete, state: 'under_review' },
    { ...complete, order_id: '00000000-0000-4000-8000-000000000001' }, { received: true, mode: 'capture_only', state: 'captured' }]) {
    const View = component(value).Component;
    assert.equal(renderToStaticMarkup(React.createElement(View, { orderId })), '');
  }
});

test('closing the controlled dialog clears only the return URL and cannot send a message, payment or activation', () => {
  const { Component, destinations } = component(complete);
  const tree = Component({ orderId });
  tree.props.onOpenChange(false);
  assert.deepEqual(destinations, ['/dashboard/packages']);
  assert.equal(Component({ orderId }), null);
});

test('real return modal treats payment/status/paid query parameters only as an owner-scoped lookup hint', () => {
  for (const query of [`payment_provider=nowpayments&order_id=${orderId}&paid=1&status=finished`,
    'payment_provider=nowpayments&paid=1&status=completed', `payment_provider=nowpayments&order_id=${orderId}&order_id=${orderId}`]) {
    const source = readFileSync(new URL('../app/dashboard/packages/PaymentResultModal.jsx', import.meta.url), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
    const module = { exports: {} }; let activationEnabled;
    const mocks = { react: { ...React, useState: () => [null, () => {}], useRef: () => ({ current: null }), useEffect() {} },
      'next/navigation': { useRouter: () => ({}), useSearchParams: () => new URLSearchParams(query) },
      'lucide-react': new Proxy({}, { get: () => () => null }), '@/lib/utils': { cn: (...values) => values.join(' ') },
      '@/hooks/useCheckoutActivation': { useCheckoutActivation: options => { activationEnabled = options.enabled; return {}; } },
      '@/lib/checkout-status.mjs': { checkoutStatusCopy: () => ({}) }, '@/hooks/useMemberSummary': { useMemberSummary: () => ({ reload() {} }) },
      './NOWPaymentsReceiptPopup': { default: () => null } };
    new Function('require', 'module', 'exports', code)(id => Object.hasOwn(mocks, id) ? mocks[id] : require(id), module, module.exports);
    const tree = module.exports.default();
    assert.equal(activationEnabled, false, 'NOW redirect cannot start membership/tree activation polling');
    assert.equal(tree.props.orderId, query.includes('&status=finished') ? orderId : '');
    assert.equal(renderToStaticMarkup(tree), '', 'no persisted owner confirmation, no popup');
  }
});
