import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as values from '../../../../lib/personal-company-payment-values.mjs';
import { companyPaymentView } from '../../../../lib/company-payment-contract.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';

const require = createRequire(import.meta.url);
const icons = new Proxy({}, { get: () => () => null });
const styles = { default: new Proxy({}, { get: (_target, name) => name }) };
let locale = 'es';
let activeFlow;
const reown = { linkStatus: 'linked' };
const i18n = { useI18n: () => ({ locale, t: (key, variables) => translateMessage(locale, key, variables) }) };

function load(filename, mocks) {
  const source = readFileSync(new URL(filename, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === 'react' || id === 'react/jsx-runtime') return require(id);
    if (id === 'lucide-react') return icons;
    if (id === '@/i18n/LanguageProvider') return i18n;
    if (id === '@/lib/personal-company-payment-values.mjs') return values;
    if (id.endsWith('.module.css')) return styles;
    assert.fail(`Presentation unexpectedly imports ${id}`);
  }, module, module.exports);
  return module.exports;
}
const forms = load('CompanyPaymentForm.jsx', {});
const { CompanyPaymentStatus, PersonalCompanyPayment } = load('CompanyPaymentPage.jsx', {
  'next/dynamic': { default: () => ({ children }) => React.createElement(React.Fragment, null, children) },
  'next/link': { default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
  '@/components/reown/ReownContext': { useReownWallet: () => reown },
  '@/hooks/useCompanyPayment': { useCompanyPayment: () => activeFlow },
  '@/lib/company-payment-contract.mjs': { companyPaymentView }, './CompanyPaymentForm': forms,
  './CompanyPaymentActivity': { default: () => null },
});
const findAll = (node, predicate) => [...(predicate(node) ? [node] : []), ...React.Children.toArray(node?.props?.children).flatMap(child => findAll(child, predicate))];
const text = node => typeof node === 'string' ? node : React.Children.toArray(node?.props?.children).map(text).join('');
const labels = tree => findAll(tree, node => node?.type === 'button').map(node => text(node));
const button = (tree, key) => findAll(tree, node => node?.type === 'button' && text(node) === translateMessage(locale, `companyPayment.${key}`))[0];
const t = key => translateMessage(locale, `companyPayment.${key}`);
const hash = `0x${'a'.repeat(64)}`;
const blockHash = `0x${'b'.repeat(64)}`;
function payment(status = 'prepared', patch = {}) {
  const created = Date.now() - 1000;
  return { paymentId: 'd8a4c010-cc33-44da-a297-8b3c6440f491', walletKind: 'personal', walletAddress: `0x${'1'.repeat(40)}`,
    ...values.PERSONAL_COMPANY_PAYMENT, amountAtomic: '25123456', status, createdAt: new Date(created).toISOString(),
    expiresAt: new Date(created + 15 * 60000).toISOString(), abandonedAt: null,
    transactionHash: status === 'prepared' ? null : hash,
    blockHash: status === 'confirmed' ? blockHash : null, blockNumber: status === 'confirmed' ? '70000000' : null,
    confirmations: status === 'confirmed' ? 12 : 0, requiredConfirmations: 12,
    failureReason: status === 'failed' ? 'transaction_reverted' : null, membershipAssignment: 'pending', ...patch };
}
function flow(value, patch = {}) {
  const calls = [];
  const method = name => () => calls.push(name);
  return { connected: true, verified: true, chainId: value?.chainId || 1, chainBalances: [], changeNetwork: method('changeNetwork'), busy: false, payment: value, stage: 'status', transfer: null, recovery: null,
    manualHash: '', errorKey: '', history: [], historyLoading: false, balanceAtomic: '100000000', amount: '25.123456', loadingBalance: false,
    confirm: method('confirm'), resume: method('resume'), newPayment: method('newPayment'), abandon: method('abandon'),
    verifyPayment: method('verifyPayment'), review: method('review'), refresh: method('refresh'), connect: method('connect'),
    switchNetwork: method('switchNetwork'), setManualHash: method('setManualHash'), setAmount: method('setAmount'), selectHistory: method('selectHistory'),
    calls, ...patch };
}

test('a submitted transaction remains pending even when its former preparation was abandoned', () => {
  const record = payment('submitted', { abandonedAt: new Date().toISOString(), confirmations: 5 });
  assert.ok(companyPaymentView(record));
  const state = flow(record);
  const tree = CompanyPaymentStatus({ flow: state });
  const html = renderToStaticMarkup(tree);
  assert.equal(tree.props['aria-label'], t('submittedTitle'));
  assert.ok(html.includes(t('pendingCopy')));
  assert.ok(!html.includes(t('abandonedTitle')));
  assert.ok(!html.includes(t('confirmedTitle')));
  assert.deepEqual(labels(tree), [t('verify')]);
  button(tree, 'verify').props.onClick();
  assert.deepEqual(state.calls, ['verifyPayment']);
});

test('invalid confirmation proofs never display payment received in either the status or the page', () => {
  for (const patch of [{ transactionHash: null }, { blockHash: null }, { blockNumber: null }, { confirmations: 11 },
    { requiredConfirmations: 1 }, { failureReason: 'transaction_mismatch' }, { membershipAssignment: 'active' },
    { recipientAddress: `0x${'2'.repeat(40)}` }, { tokenAddress: `0x${'2'.repeat(40)}` }, { walletKind: 'administrative' }]) {
    activeFlow = flow(payment('confirmed', patch));
    assert.equal(CompanyPaymentStatus({ flow: activeFlow }), null);
    const html = renderToStaticMarkup(PersonalCompanyPayment());
    assert.ok(!html.includes(t('confirmedTitle')), JSON.stringify(patch));
    assert.ok(!html.includes(t('confirmedCopy')), JSON.stringify(patch));
    assert.deepEqual(activeFlow.calls, []);
  }
});

test('a signing operation or persisted recovery marker replaces review with recovery controls and offers no resend action', () => {
  for (const patch of [
    { busy: true, transfer: { paymentId: payment().paymentId, phase: 'signing', transactionMayExist: true } },
    { recovery: { paymentId: payment().paymentId, phase: 'signing', transactionHash: null } },
  ]) {
    activeFlow = flow(payment(), { stage: 'review', ...patch });
    const page = PersonalCompanyPayment();
    assert.equal(findAll(page, node => node?.type === forms.CompanyPaymentReview).length, 0);
    assert.equal(findAll(page, node => node?.type === forms.CompanyPaymentForm).length, 0);
    assert.equal(findAll(page, node => node?.type === CompanyPaymentStatus).length, 1);
    const tree = CompanyPaymentStatus({ flow: activeFlow });
    assert.equal(tree.props['aria-label'], t('ambiguousTitle'));
    assert.equal(button(tree, 'resume'), undefined);
    assert.equal(button(tree, 'confirmInWallet'), undefined);
    assert.equal(button(tree, 'newPayment'), undefined);
    assert.equal(button(tree, 'registerHash').props.disabled, true);
    assert.deepEqual(activeFlow.calls, []);
  }
});

test('an abandoned recovery with a known hash only enables registration and keeps a new payment disabled', () => {
  const record = payment('prepared', { abandonedAt: new Date().toISOString() });
  const state = flow(record, { recovery: { paymentId: record.paymentId, phase: 'broadcast', transactionHash: hash } });
  const tree = CompanyPaymentStatus({ flow: state });
  assert.equal(tree.props['aria-label'], t('ambiguousTitle'));
  assert.equal(button(tree, 'resume'), undefined);
  assert.equal(button(tree, 'confirmInWallet'), undefined);
  assert.equal(button(tree, 'newPayment').props.disabled, true);
  assert.equal(button(tree, 'registerHash').props.disabled, false);
  button(tree, 'registerHash').props.onClick();
  assert.deepEqual(state.calls, ['verifyPayment']);
});

test('verified receipt copy leaves membership allocation pending, including transfers registered after abandonment', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    for (const abandonedAt of [null, new Date().toISOString()]) {
      const state = flow(payment('confirmed', { abandonedAt }));
      const tree = CompanyPaymentStatus({ flow: state });
      const html = renderToStaticMarkup(tree);
      assert.equal(tree.props['aria-label'], t('confirmedTitle'));
      assert.ok(html.includes(t('confirmedCopy')));
      assert.ok(html.includes(t('allocationPending')));
      assert.ok(html.includes('25.123456 USDT'));
      assert.ok(html.includes(values.PERSONAL_COMPANY_PAYMENT.recipientAddress));
      assert.equal(button(tree, 'confirmInWallet'), undefined);
      assert.equal(button(tree, 'resume'), undefined);
      assert.deepEqual(state.calls, []);
    }
  }
  locale = 'es';
});

test('recovery hashes are presented only as external explorer links without changing payment state', () => {
  const state = flow(payment('submitted'));
  const tree = CompanyPaymentStatus({ flow: state });
  const link = findAll(tree, node => node?.type === 'a')[0];
  assert.equal(link.props.href, `https://etherscan.io/tx/${hash}`);
  assert.equal(link.props.target, '_blank');
  assert.equal(link.props.rel, 'noreferrer noopener');
  assert.deepEqual(state.calls, []);
  assert.equal(state.payment.status, 'submitted');
});

const legacyPayment = (status, patch = {}) => payment(status, { chainId: 137, tokenAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', ...patch });

test('historical Polygon transfers keep their original network, explorer and confirmation wording in every locale', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    const state = flow(legacyPayment('confirmed'));
    assert.ok(companyPaymentView(state.payment));
    const tree = CompanyPaymentStatus({ flow: state });
    const html = renderToStaticMarkup(tree);
    assert.ok(html.includes(t('legacyNetwork')));
    assert.ok(html.includes(t('legacyConfirmedCopy')));
    assert.ok(!html.includes(t('confirmedCopy')));
    assert.equal(findAll(tree, node => node?.type === 'a')[0].props.href, 'https://polygonscan.com/tx/' + hash);
    assert.equal(button(tree, 'legacyVerify').props.disabled, false);
    assert.equal(button(tree, 'resume'), undefined);
    assert.equal(button(tree, 'confirmInWallet'), undefined);
    assert.deepEqual(state.calls, []);
  }
  locale = 'es';
});

test('a Polygon draft keeps its selected network when reviewed or resumed, while recovery remains registration only', () => {
  const record = legacyPayment('prepared');
  activeFlow = flow(record, { stage: 'review' });
  const page = PersonalCompanyPayment();
  assert.equal(findAll(page, node => node?.type === forms.CompanyPaymentReview).length, 1);
  assert.equal(findAll(page, node => node?.type === CompanyPaymentStatus).length, 0);
  const tree = CompanyPaymentStatus({ flow: activeFlow });
  assert.ok(renderToStaticMarkup(tree).includes(t('preparedCopy')));
  assert.ok(button(tree, 'resume'));
  assert.equal(button(tree, 'connect'), undefined);
  assert.equal(button(tree, 'confirmInWallet'), undefined);
  assert.ok(button(tree, 'abandon'));
  assert.equal(button(tree, 'registerHash'), undefined);
  assert.equal(findAll(tree, node => node?.type === 'input').length, 0);
  const withHash = flow(record, { manualHash: hash, recovery: { paymentId: record.paymentId, transactionHash: hash } });
  const recovery = CompanyPaymentStatus({ flow: withHash });
  assert.equal(button(recovery, 'registerHash').props.disabled, false);
  button(recovery, 'registerHash').props.onClick();
  assert.deepEqual(withHash.calls, ['verifyPayment']);
});

test('legacy verification errors refer to the original Polygon network', () => {
  const tree = CompanyPaymentStatus({ flow: flow(legacyPayment('submitted'), { errorKey: 'companyPayment.networkUnavailable' }) });
  const html = renderToStaticMarkup(tree);
  assert.ok(html.includes(t('legacyNetworkUnavailable')));
  assert.ok(!html.includes(t('networkUnavailable')));
});

test('the active transfer page starts on sponsored Polygon without exposing an Ethereum selector or a new direct-payment form', () => {
  function SponsoredForm() { return null; }
  function PreviousPayments() { return null; }
  const relay = { stage: 'form', payment: null, preview: null, history: [], historyLoading: false, busy: false, refresh() {} };
  const Router = load('PersonalTransferRouter.jsx', {
    'next/link': { default: ({ children }) => React.createElement('a', null, children) },
    '@/components/reown/ReownContext': { useReownWallet: () => reown },
    '@/hooks/usePolygonRelay': { usePolygonRelay: () => relay },
    '@/lib/polygon-relay-contract.mjs': { polygonRelayView: () => null },
    './SponsoredTransferPanel': { SponsoredTransferForm: SponsoredForm, SponsoredTransferReview: () => null, SponsoredTransferStatus: () => null },
  }).default;
  const tree = Router({ DirectPayment: PreviousPayments });
  const forms = findAll(tree, node => node?.type === SponsoredForm);
  assert.equal(forms.length, 1); assert.equal(forms[0].props.network, 'polygon'); assert.equal(forms[0].props.flow, relay);
  assert.equal(findAll(tree, node => node?.props?.role === 'radiogroup').length, 0);
  assert.equal(findAll(tree, node => node?.type === PreviousPayments)[0].props.historyOnly, true);
});

test('previous direct payments remain readable and verifiable without a new payment or signature action', () => {
  for (const record of [payment(), payment('submitted'), payment('confirmed'), legacyPayment('submitted')]) {
    activeFlow = flow(record, { stage: 'review', history: [record] });
    const page = PersonalCompanyPayment({ historyOnly: true });
    assert.equal(findAll(page, node => node?.type === forms.CompanyPaymentForm || node?.type === forms.CompanyPaymentReview).length, 0);
    const status = findAll(page, node => node?.type === CompanyPaymentStatus)[0]; assert.equal(status.props.readOnly, true);
    const detail = CompanyPaymentStatus(status.props);
    assert.equal(button(detail, 'resume'), undefined); assert.equal(button(detail, 'reconnect'), undefined);
    assert.equal(button(detail, 'newPayment'), undefined); assert.equal(button(detail, 'confirmInWallet'), undefined);
    if (record.status !== 'prepared') { assert.ok(button(detail, record.chainId === 137 ? 'legacyVerify' : 'verify')); }
    assert.ok(renderToStaticMarkup(page).includes(t('legacyHistoryTitle')));
    assert.deepEqual(activeFlow.calls, []);
  }
});
