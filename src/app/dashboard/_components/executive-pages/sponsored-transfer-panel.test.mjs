import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { Wallet, TypedDataEncoder } from 'ethers';
import * as values from '../../../../lib/personal-company-payment-values.mjs';
import * as relay from '../../../../lib/polygon-relay-contract.mjs';
import * as solana from '../../../../lib/solana-wallet-contract.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';
const require = createRequire(import.meta.url);
let locale = 'es';
const source = readFileSync(new URL('SponsoredTransferPanel.jsx', import.meta.url), 'utf8');
const module = { exports: {} };
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
new Function('require', 'module', 'exports', code)(id => {
  if (id === 'react') return { ...React, useId: () => 'test-amount' };
  if (id === 'react/jsx-runtime') return require(id);
  if (id === 'lucide-react') return new Proxy({}, { get: () => () => null });
  if (id === '@/i18n/LanguageProvider') return { useI18n: () => ({ t: key => translateMessage(locale, key) }) };
  if (id === '@/lib/personal-company-payment-values.mjs') return values;
  if (id === '@/lib/polygon-relay-contract.mjs') return relay;
  if (id === '@/lib/solana-wallet-contract.mjs') return solana;
  if (id.endsWith('.module.css')) return { default: new Proxy({}, { get: (_target, key) => key }) };
  assert.fail(`Unexpected dependency ${id}`);
}, module, module.exports);
const { SponsoredTransferForm, SponsoredTransferReview, SponsoredTransferStatus } = module.exports;
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...React.Children.toArray(node?.props?.children).flatMap(child => all(child, predicate))];
const signer = new Wallet(`0x${'24'.repeat(32)}`), wallet = signer.address.toLowerCase();
const id = 'd8a4c010-cc33-44da-a297-8b3c6440f491', hash = `0x${'12'.repeat(32)}`;
function payment(patch = {}) {
  const typedData = { domain: { ...relay.POLYGON_RELAY_DOMAIN }, primaryType: 'MetaTransaction', types: { MetaTransaction: relay.POLYGON_RELAY_META_FIELDS.map(item => ({ ...item })) },
    message: { nonce: '1', from: wallet, functionSignature: relay.polygonRelayTransferCall('28433366') } };
  return { paymentId: id, walletKind: 'personal', executionMode: 'polygon_native_meta_aa', ...values.LEGACY_POLYGON_COMPANY_PAYMENT, walletAddress: wallet,
    amountAtomic: '28433366', status: 'prepared', authorizationNonce: '1', authorizationDigest: TypedDataEncoder.hash(typedData.domain, typedData.types, typedData.message),
    authorizationHasOnchainExpiry: false, relayerAddress: `0x${'3'.repeat(40)}`, entryPointAddress: relay.POLYGON_RELAY_ENTRY_POINT,
    createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString(), userOperationHash: null, transactionHash: null, blockNumber: null, blockHash: null,
    confirmations: 0, requiredConfirmations: 12, confirmedAt: null, failureReason: null, membershipAssignment: 'pending', typedData, ...patch };
}
function flow(patch = {}) {
  const calls = [];
  return { wallet, amount: '28.433366', balanceAtomic: '28433366', connected: true, verified: true, busy: false, loadingBalance: false,
    capabilities: { transferEnabled: true }, preview: { walletAddress: wallet, recipientAddress: values.LEGACY_POLYGON_COMPANY_PAYMENT.recipientAddress, amountAtomic: '28433366' },
    setAmount: amount => calls.push(['amount', amount]), review: () => calls.push('review'), confirm: () => calls.push('confirm'), cancelReview() {},
    newPayment: () => calls.push('new'), verifyPayment: () => calls.push('verify'), resume: () => calls.push('resume'), refresh() {}, connect() {}, calls, ...patch };
}
test('Sponsored Polygon form uses only its balance, exact company recipient, Max and no POL purchase instruction', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    const state = flow(), tree = SponsoredTransferForm({ flow: state }), html = renderToStaticMarkup(tree);
    assert.ok(html.includes('28.433366 USDT')); assert.ok(html.includes(values.LEGACY_POLYGON_COMPANY_PAYMENT.recipientAddress));
    assert.ok(html.includes(translateMessage(locale, 'walletTransfer.sponsored')));
    assert.ok(!html.includes(translateMessage(locale, 'companyPayment.polygonGasCopy')));
    all(tree, node => node?.type === 'button' && node.props.className === 'max')[0].props.onClick();
    assert.deepEqual(state.calls, [['amount', '28.433366']]);
    tree.props.onSubmit({ preventDefault() {} }); assert.deepEqual(state.calls, [['amount', '28.433366'], 'review']);
  }
});
test('Unavailable sponsorship, insufficient funds and disconnected wallet never expose an enabled send path', () => {
  locale = 'es';
  for (const patch of [{ capabilities: { transferEnabled: false } }, { amount: '28.433367' }, { connected: false }]) {
    const state = flow(patch), tree = SponsoredTransferForm({ flow: state });
    tree.props.onSubmit({ preventDefault() {} }); assert.deepEqual(state.calls, []);
    assert.ok(all(tree, node => node?.type === 'button' && node.props.type === 'submit').every(node => node.props.disabled));
  }
});
test('Review discloses nonexpiring native authorization, exact amount and destination before the only explicit signature action', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    const state = flow(), tree = SponsoredTransferReview({ flow: state }), html = renderToStaticMarkup(tree);
    assert.ok(html.includes(translateMessage(locale, 'walletTransfer.authorizationCopy')));
    assert.ok(html.includes('28.433366')); assert.ok(html.includes(wallet)); assert.ok(html.includes('0 POL'));
    assert.deepEqual(state.calls, []);
    const confirm = all(tree, node => node?.type === 'button' && node.props.className?.includes('primary'))[0];
    assert.equal(confirm.props.disabled, false); confirm.props.onClick(); assert.deepEqual(state.calls, ['confirm']);
  }
});
test('Canonical confirmation enables another payment, while uncertain prepared authorization offers only state checks', () => {
  locale = 'es';
  const confirmed = payment({ status: 'confirmed', typedData: null, userOperationHash: hash, transactionHash: hash, blockNumber: '90000000', blockHash: hash, confirmations: 12, confirmedAt: new Date().toISOString() });
  const state = flow({ payment: confirmed }), tree = SponsoredTransferStatus({ flow: state });
  assert.ok(renderToStaticMarkup(tree).includes(translateMessage(locale, 'walletTransfer.confirmedPolygon')));
  const actions = all(tree, node => node?.type === 'button'); assert.equal(actions.length, 1); assert.equal(actions[0].props.disabled, false);
  actions[0].props.onClick(); assert.deepEqual(state.calls, ['new']);
  assert.equal(SponsoredTransferStatus({ flow: flow({ payment: { ...confirmed, confirmations: 11 } }) }), null);
  const uncertain = SponsoredTransferStatus({ flow: flow({ payment: payment(), recovery: { phase: 'authorizing' } }) });
  assert.ok(!all(uncertain, node => node?.type === 'button').some(node => node.props.className?.includes('primary')));
});
