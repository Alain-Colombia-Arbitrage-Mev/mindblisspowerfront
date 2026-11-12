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
function assertMerchantPresentation(html) {
  assert.ok(!html.toLowerCase().includes(values.LEGACY_POLYGON_COMPANY_PAYMENT.recipientAddress.slice(2)),
    'The merchant address must be absent from all rendered text and attributes, including hidden content');
  assert.match(html, />Mindbliss</);
  assert.ok(html.includes(translateMessage(locale, 'companyPayment.recipientLabel')));
}
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
    capabilities: { transferEnabled: true }, preview: { ...values.LEGACY_POLYGON_COMPANY_PAYMENT, walletAddress: wallet, amountAtomic: '28433366' },
    setAmount: amount => calls.push(['amount', amount]), review: () => calls.push('review'), confirm: () => calls.push('confirm'), cancelReview() {},
    newPayment: () => calls.push('new'), verifyPayment: () => calls.push('verify'), resume: () => calls.push('resume'), refresh() {}, connect: () => calls.push('connect'), calls, ...patch };
}
test('Sponsored Polygon form identifies Mindbliss without its address and preserves its balance, Max and sponsorship', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    const state = flow(), tree = SponsoredTransferForm({ flow: state }), html = renderToStaticMarkup(tree);
    assert.ok(html.includes('28.433366 USDT')); assertMerchantPresentation(html);
    assert.match(html, /Polygon/);
    assert.ok(html.includes(translateMessage(locale, 'walletTransfer.sponsored')));
    assert.ok(!html.includes(translateMessage(locale, 'companyPayment.polygonGasCopy')));
    all(tree, node => node?.type === 'button' && node.props.className === 'max')[0].props.onClick();
    assert.deepEqual(state.calls, [['amount', '28.433366']]);
    tree.props.onSubmit({ preventDefault() {} }); assert.deepEqual(state.calls, [['amount', '28.433366'], 'review']);
  }
});
test('Unavailable sponsorship, insufficient funds and disconnected wallet never expose an enabled send path', () => {
  locale = 'es';
  for (const patch of [{ capabilities: { transferEnabled: false } }, { capabilities: { transferEnabled: true, loading: true } },
    { capabilities: { transferEnabled: true, error: 'walletTransfer.unavailable' } }, { loadingBalance: true }, { amount: '28.433367' }, { connected: false }]) {
    const state = flow(patch), tree = SponsoredTransferForm({ flow: state });
    tree.props.onSubmit({ preventDefault() {} }); assert.deepEqual(state.calls, []);
    assert.ok(all(tree, node => node?.type === 'button' && node.props.type === 'submit').every(node => node.props.disabled));
  }
});

test('unactivated Pagar exposes one explicit activation CTA in every locale without reviewing or paying', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    const state = flow({ connected: false, verified: false, walletState: 'activate', balanceAtomic: null,
      capabilities: { loading: false, transferEnabled: false } });
    let tree = SponsoredTransferForm({ flow: state }), html = renderToStaticMarkup(tree);
    const action = all(tree, node => node?.type === 'button' && node.props.className?.includes('primary'))[0];
    assert.ok(html.includes(translateMessage(locale, 'funding.activateWalletCopy')));
    assert.ok(renderToStaticMarkup(action).includes(translateMessage(locale, 'funding.activateWallet')));
    assert.ok(!html.includes(translateMessage(locale, 'companyPayment.verifyWallet')));
    assert.ok(!html.includes(translateMessage(locale, 'companyPayment.reconnectCopy')));
    assertMerchantPresentation(html); assert.equal(action.props.type, 'button'); assert.equal(action.props.disabled, false);
    assert.deepEqual(state.calls, []); tree.props.onSubmit({ preventDefault() {} }); assert.deepEqual(state.calls, []);
    action.props.onClick(); assert.deepEqual(state.calls, ['connect']);
    state.busy = true; state.walletState = 'activating'; tree = SponsoredTransferForm({ flow: state });
    const pending = all(tree, node => node?.type === 'button' && node.props.className?.includes('primary'))[0];
    assert.ok(renderToStaticMarkup(pending).includes(translateMessage(locale, 'funding.activatingWallet')));
    assert.equal(pending.props.disabled, true); pending.props.onClick(); assert.deepEqual(state.calls, ['connect']);
  }
  locale = 'es';
});

test('Pagar distinguishes canonical lookup, failed lookup, configuration and reconnect states with guarded explicit actions', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    for (const [walletState, key, disabled, expected] of [
      ['checking', 'walletPage.checking', true, []], ['error', 'walletPage.retryCheck', false, ['refresh']],
      ['unavailable', 'funding.activateWallet', true, []], ['unexpected', 'walletPage.checking', true, []],
      ['reconnect', 'companyPayment.reconnect', false, ['connect']],
    ]) {
      const state = flow({ connected: false, verified: walletState === 'reconnect', walletState, balanceAtomic: null });
      state.refresh = () => state.calls.push('refresh');
      const tree = SponsoredTransferForm({ flow: state }), action = all(tree, node => node?.type === 'button' && node.props.className?.includes('primary'))[0];
      assert.ok(renderToStaticMarkup(action).includes(translateMessage(locale, key)), walletState);
      assert.equal(action.props.type, 'button'); assert.equal(Boolean(action.props.disabled), disabled);
      assert.deepEqual(state.calls, []); action.props.onClick(); assert.deepEqual(state.calls, expected);
      tree.props.onSubmit({ preventDefault() {} }); assert.deepEqual(state.calls, expected);
      if (walletState === 'reconnect') assert.ok(!renderToStaticMarkup(tree).includes(translateMessage(locale, 'funding.activateWalletCopy')));
    }
  }
  locale = 'es';
});

test('initial sponsorship checks are distinct from unavailable coverage and do not claim a failure before verification', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    for (const transferEnabled of [false, true]) {
      const html = renderToStaticMarkup(SponsoredTransferForm({ flow: flow({ capabilities: { loading: true, transferEnabled } }) }));
      assert.ok(html.includes(translateMessage(locale, 'walletTransfer.checkingSponsorship')));
      assert.ok(!html.includes(translateMessage(locale, 'walletTransfer.sponsorUnavailable')));
      assert.ok(!html.includes(translateMessage(locale, 'walletTransfer.sponsored')));
    }
    const failed = renderToStaticMarkup(SponsoredTransferForm({ flow: flow({ capabilities: { loading: false, transferEnabled: false, error: 'walletTransfer.unavailable' } }) }));
    assert.ok(failed.includes(translateMessage(locale, 'walletTransfer.sponsorCheckFailed')));
    const unverified = renderToStaticMarkup(SponsoredTransferForm({ flow: flow({ verified: false, connected: false, capabilities: { loading: false, transferEnabled: false } }) }));
    assert.ok(!unverified.includes(translateMessage(locale, 'walletTransfer.sponsorUnavailable')));
  }
  locale = 'es';
});

test('refreshing retains the last verified balance with an updating status while initial reads have no invented amount', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    const current = renderToStaticMarkup(SponsoredTransferForm({ flow: flow({ loadingBalance: true }) }));
    assert.ok(current.includes('28.433366 USDT'));
    assert.ok(current.includes(translateMessage(locale, 'walletTransfer.updatingBalance')));
    const initial = renderToStaticMarkup(SponsoredTransferForm({ flow: flow({ balanceAtomic: null, loadingBalance: true }) }));
    assert.ok(initial.includes(translateMessage(locale, 'companyPayment.loadingBalance')));
    assert.ok(!initial.includes('28.433366 USDT'));
  }
  locale = 'es';
});
test('Review identifies Mindbliss without its address and discloses exact amount and nonexpiring authorization before the signature action', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    const state = flow(), tree = SponsoredTransferReview({ flow: state }), html = renderToStaticMarkup(tree);
    assert.ok(html.includes(translateMessage(locale, 'walletTransfer.authorizationCopy')));
    assert.ok(html.includes('28.433366')); assert.ok(html.includes(wallet)); assert.ok(html.includes('0 POL'));
    assertMerchantPresentation(html); assert.match(html, /Polygon/);
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

test('a stale disconnected review or altered wallet/network/token/recipient never enables confirmation', () => {
  locale = 'es';
  for (const patch of [{ connected: false }, { preview: { ...flow().preview, walletAddress: `0x${'9'.repeat(40)}` } },
    { capabilities: { transferEnabled: true, loading: true } }, { capabilities: { transferEnabled: true, error: 'walletTransfer.unavailable' } },
    { preview: { ...flow().preview, chainId: 1 } }, { preview: { ...flow().preview, tokenAddress: `0x${'9'.repeat(40)}` } },
    { preview: { ...flow().preview, recipientAddress: `0x${'9'.repeat(40)}` } }]) {
    const state = flow(patch), tree = SponsoredTransferReview({ flow: state });
    const confirm = all(tree, node => node?.type === 'button' && node.props.className?.includes('primary'))[0];
    assert.equal(confirm.props.disabled, true); confirm.props.onClick(); assert.deepEqual(state.calls, []);
  }
});

test('every valid sponsored payment status omits the merchant address in every locale while retaining amount, network and receipts', () => {
  const records = [payment(), ...['authorized', 'broadcasting', 'reconciliation_required'].map(status => payment({ status, typedData: null })),
    ...['ambiguous', 'submitted'].map(status => payment({ status, typedData: null, userOperationHash: hash, transactionHash: hash })),
    payment({ status: 'confirmed', typedData: null, userOperationHash: hash, transactionHash: hash, blockNumber: '90000000', blockHash: hash,
      confirmations: 12, confirmedAt: new Date().toISOString() }),
    payment({ status: 'failed', typedData: null, failureReason: 'transaction_reverted' }),
    payment({ status: 'expired', typedData: null, failureReason: 'preparation_expired' })];
  for (locale of ['es', 'en', 'ar', 'zh']) {
    for (const record of records) {
      assert.ok(relay.polygonRelayView(record), `Valid ${record.status} fixture`);
      const state = flow({ payment: record }), tree = SponsoredTransferStatus({ flow: state });
      const html = renderToStaticMarkup(tree);
      assertMerchantPresentation(html); assert.ok(html.includes('28.433366 USDT')); assert.match(html, /Polygon/);
      const links = all(tree, node => node?.type === 'a');
      assert.equal(links.length, record.transactionHash ? 1 : 0);
      if (record.transactionHash) {
        assert.equal(links[0].props.href, `https://polygonscan.com/tx/${hash}`);
        assert.equal(links[0].props.rel, 'noreferrer noopener');
        assert.ok(html.includes(hash));
      }
      assert.deepEqual(state.calls, []);
    }
  }
  locale = 'es';
});

test('a receipt for another bound wallet is not displayed or given verification actions', () => {
  const state = flow({ wallet: `0x${'9'.repeat(40)}`, payment: payment() });
  assert.equal(SponsoredTransferStatus({ flow: state }), null); assert.deepEqual(state.calls, []);
});

test('an unsigned preparation reconnects the same wallet before explicitly resuming its review', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    const state = flow({ payment: payment(), connected: false });
    let tree = SponsoredTransferStatus({ flow: state });
    let action = all(tree, node => node?.type === 'button' && node.props.className?.includes('primary'))[0];
    assert.ok(renderToStaticMarkup(action).includes(translateMessage(locale, 'companyPayment.reconnect')));
    action.props.onClick(); assert.deepEqual(state.calls, ['connect']);
    state.connected = true; tree = SponsoredTransferStatus({ flow: state });
    action = all(tree, node => node?.type === 'button' && node.props.className?.includes('primary'))[0];
    action.props.onClick(); assert.deepEqual(state.calls, ['connect', 'resume']);
    assert.equal(state.calls.includes('confirm'), false);
  }
  locale = 'es';
});

test('a disconnected review offers only explicit reconnect and waits while the wallet is restoring or busy', () => {
  for (const needsVerification of [false, true]) {
    const state = flow({ connected: false, needsVerification });
    let tree = SponsoredTransferReview({ flow: state });
    const label = translateMessage(locale, needsVerification ? 'companyPayment.verifyWallet' : 'companyPayment.reconnect');
    let reconnect = all(tree, node => node?.type === 'button' && renderToStaticMarkup(node).includes(label))[0];
    assert.ok(reconnect); reconnect.props.onClick(); assert.deepEqual(state.calls, ['connect']);
    for (const patch of [{ restoring: true }, { busy: true }]) {
      Object.assign(state, { busy: false, restoring: false }, patch); tree = SponsoredTransferReview({ flow: state });
      reconnect = all(tree, node => node?.type === 'button' && node.props.className === 'executive-button' && node.props.disabled)[0];
      assert.ok(reconnect); reconnect.props.onClick(); assert.deepEqual(state.calls, ['connect']);
      const prepared = SponsoredTransferStatus({ flow: { ...state, payment: payment() } });
      const resume = all(prepared, node => node?.type === 'button' && node.props.className?.includes('primary'))[0];
      assert.equal(resume.props.disabled, true); resume.props.onClick(); assert.deepEqual(state.calls, ['connect']);
    }
  }
});
