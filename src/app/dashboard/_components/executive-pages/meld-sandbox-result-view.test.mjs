import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { registrationViewHarness } from '../../../register/registration-view-test-harness.mjs';
import * as contract from '../../../../lib/wallet-funding-contract.mjs';
import { walletFundingOwnerKey } from '../../../../lib/wallet-funding-owner.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';

const require = createRequire(import.meta.url), icons = new Proxy({}, { get: () => () => null });
const styles = { default: new Proxy({}, { get: (_target, key) => key }) };
const i18n = { useI18n: () => ({ locale: 'es', t: (key, values) => translateMessage('es', key, values) }) };
const reference = 'd8a4c010-cc33-44da-a297-8b3c6440f491', otherReference = 'd8a4c010-cc33-44da-a297-8b3c6440f492';
const proof = changes => ({ state: 'confirmed', source: 'meld_sandbox_api', testMode: true, transactionId: 'synthetic-test-transaction', providerStatus: 'SETTLED',
  receivedAmount: '97.123456', confirmedAt: '2026-11-12T15:10:00Z', ...changes });
const rawStatus = confirmation => ({ walletKind: 'administrative', environment: 'sandbox', provider: 'meld', checkoutReference: reference, country: 'MX', requestedAmount: 200,
  sourceCurrencyCode: 'MXN', paymentMethodType: 'CREDIT_DEBIT_CARD', requestStatus: 'session_created', destination: { address: `0x${'a'.repeat(40)}`, asset: 'USDT', network: 'polygon', chainId: 137 }, confirmation });
const row = confirmation => ({ checkoutReference: reference, requestedAmount: 200, sourceCurrencyCode: 'MXN', status: 'session_created', createdAt: '2026-11-12T15:00:00Z', confirmation });
const all = node => [node, ...React.Children.toArray(node?.props?.children).flatMap(all)];
const settle = () => new Promise(resolve => setImmediate(resolve));
function loadStatus() {
  const module = { exports: {} }, source = readFileSync(new URL('./WalletFundingStatus.jsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const mocks = { react: React, 'lucide-react': icons, '@/i18n/LanguageProvider': i18n,
    '@/lib/wallet-funding-contract.mjs': contract, '@/lib/wallet-funding-client.mjs': { readWalletFundingStatus: () => assert.fail('presentation cannot request a payment') },
    '@/lib/member-session-context': { useMemberSession: () => ({ subject: 'owner', email: 'member@example.test' }) },
    '@/lib/wallet-funding-owner.mjs': { walletFundingOwnerKey }, './wallet-funding.module.css': styles };
  new Function('require', 'module', 'exports', code)(id => { if (id === 'react/jsx-runtime') return require(id); assert.ok(Object.hasOwn(mocks, id), id); return mocks[id]; }, module, module.exports);
  return module.exports;
}

test('verified test pending, confirmed and failed views never claim real funds or commissions', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('rendering a verified result cannot call a provider'));
  const { currentFundingView, WalletFundingStatusView } = loadStatus();
  for (const [confirmation, label] of [[proof(), 'Prueba confirmada'], [proof({ state: 'pending', providerStatus: 'SETTLING', receivedAmount: undefined, confirmedAt: undefined }), 'Prueba en proceso'],
    [proof({ state: 'failed', providerStatus: 'REFUNDED', receivedAmount: undefined, confirmedAt: undefined }), 'Prueba no completada']]) {
    const view = currentFundingView(rawStatus(confirmation), 'administrative', reference);
    const html = renderToStaticMarkup(WalletFundingStatusView({ view }));
    assert.match(html, new RegExp(label)); assert.match(html, /No acredita fondos ni comisiones reales/); assert.match(html, /Transacción de prueba/);
    assert.match(html, /MX/); assert.doesNotMatch(html, /Recarga confirmada|Comisión cobrada|saldo acreditado/);
    if (confirmation.state === 'confirmed') { assert.match(html, /97\.123456 USDT/); assert.match(html, /USDT recibidos en la prueba/); }
    else assert.doesNotMatch(html, /97\.123456/);
  }
});

test('success URL fields and incomplete visual proof cannot promote a checkout or reveal a received amount', () => {
  const { currentFundingView, WalletFundingStatusView } = loadStatus();
  const base = currentFundingView({ ...rawStatus({ state: 'unconfirmed', source: 'none', testMode: true }), success: true, paid: true }, 'administrative', reference);
  assert.equal(base.state, 'checkout_ready');
  assert.equal(currentFundingView(rawStatus(proof()), 'administrative', otherReference), null);
  for (const changes of [{ confirmationSource: 'return_url' }, { transactionId: undefined }, { providerStatus: 'PENDING' }, { receivedAmount: '0' }]) {
    const html = renderToStaticMarkup(WalletFundingStatusView({ view: { ...base, state: 'confirmed', confirmationSource: 'meld_sandbox_api', transactionId: 'synthetic-test', providerStatus: 'SETTLED',
      receivedAmount: '97.123456', confirmedAt: '2026-11-12T15:10:00Z', ...changes } }));
    assert.doesNotMatch(html, /Prueba confirmada|97\.123456/); assert.match(html, /Pago sin confirmar/);
  }
});

test('cached history shows explicit test results, refreshes only manually and drops old owner callbacks and late results', async t => {
  let member = { subject: 'owner-A', email: 'a@example.test' }; const calls = [];
  t.mock.method(globalThis, 'fetch', () => assert.fail('the history component cannot open a provider or request OTP/gas'));
  const h = registrationViewHarness('../dashboard/_components/executive-pages/WalletFundingHistory.jsx', {
    'lucide-react': icons, '@/i18n/LanguageProvider': i18n, './wallet-funding.module.css': styles,
    '@/lib/member-session-context': { useMemberSession: () => member }, '@/lib/wallet-funding-owner.mjs': { walletFundingOwnerKey },
    '@/lib/wallet-funding-contract.mjs': contract,
    '@/lib/wallet-funding-client.mjs': { readWalletFundingHistory: (kind, { signal }) => new Promise(resolve => calls.push({ kind, signal, resolve })) },
  }); t.after(() => h.unmount());
  const props = { walletKind: 'administrative', refreshKey: 0 };
  h.render(props); assert.equal(calls.length, 1); calls[0].resolve({ records: [row(proof())] }); await settle();
  let tree = h.render(props), html = renderToStaticMarkup(tree);
  assert.match(html, /Prueba confirmada/); assert.match(html, /no acredita fondos ni comisiones reales/);
  const refresh = all(tree).find(node => node?.type === 'button' && React.Children.toArray(node.props.children).includes('Actualizar historial'));
  assert.ok(refresh); h.render(props); await settle(); assert.equal(calls.length, 1);
  refresh.props.onClick(); h.render(props); assert.equal(calls.length, 2);
  member = { subject: 'owner-B', email: 'b@example.test' }; tree = h.render(props);
  assert.doesNotMatch(renderToStaticMarkup(tree), /Prueba confirmada/);
  refresh.props.onClick(); h.render(props); assert.equal(calls.length, 3);
  calls[1].resolve({ records: [row(proof())] }); await settle(); assert.doesNotMatch(renderToStaticMarkup(h.render(props)), /Prueba confirmada/);
  calls[2].resolve({ records: [row({ ...proof(), source: 'return_url' })] }); await settle(); html = renderToStaticMarkup(h.render(props));
  assert.doesNotMatch(html, /Prueba confirmada/); assert.ok(html.includes(translateMessage('es', 'funding.sessionCreated')));
});
