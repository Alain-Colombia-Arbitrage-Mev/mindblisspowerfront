import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as values from '../../lib/personal-company-payment-values.mjs';
import { translateMessage } from '../../i18n/translate.mjs';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('./PersonalWalletBalance.jsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
const address = `0x${'1'.repeat(40)}`, other = `0x${'2'.repeat(40)}`;
let state, locale = 'es', expected, selectedNetwork, stateByNetwork;
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)(id => {
  if (id === 'react/jsx-runtime') return require(id);
  if (id === 'lucide-react') return { RefreshCw: () => null };
  if (id === '@/i18n/LanguageProvider') return { useI18n: () => ({ locale, t: key => translateMessage(locale, key) }) };
  if (id === '@/hooks/usePersonalWalletBalance') return { usePersonalWalletBalance: (value, network) => { expected = value; selectedNetwork = network; return stateByNetwork?.[network] || state; } };
  if (id === '@/lib/personal-company-payment-values.mjs') return values;
  if (id.endsWith('.module.css')) return { default: new Proxy({}, { get: (_target, name) => name }) };
  assert.fail(`Unexpected balance dependency ${id}`);
}, module, module.exports);
const Balance = module.exports.default;
const wrapperCode = ts.transpileModule(readFileSync(new URL('./PersonalWalletBalances.jsx', import.meta.url), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
const wrapperModule = { exports: {} };
new Function('require', 'module', 'exports', wrapperCode)(id => {
  if (id === 'react/jsx-runtime') return require(id);
  if (id === './PersonalWalletBalance') return { default: Balance };
  if (id === '@/i18n/LanguageProvider') return { useI18n: () => ({ locale, t: key => translateMessage(locale, key) }) };
  if (id.endsWith('.module.css')) return { default: new Proxy({}, { get: (_target, name) => name }) };
  assert.fail(`Unexpected balance group dependency ${id}`);
}, wrapperModule, wrapperModule.exports);
const Balances = wrapperModule.exports.default;
const findAll = (node, predicate) => [...(predicate(node) ? [node] : []), ...React.Children.toArray(node?.props?.children).flatMap(child => findAll(child, predicate))];
const fixture = patch => ({ walletAddress: address, balanceAtomic: '10000000', nativeBalanceAtomic: '1', loading: false, error: '', updatedAt: '2026-11-11T03:00:00Z', refresh() {}, ...patch });

test('verified balances display exact Ethereum USDT, distinguishing ten USDT, true zero and the smallest unit', () => {
  for (const [balanceAtomic, shown] of [['10000000', '10 USDT'], ['0', '0 USDT'], ['1', '0.000001 USDT'], ['9007199254740993123456', '9007199254740993.123456 USDT']]) {
    state = fixture({ balanceAtomic });
    const tree = Balance({ expectedAddress: address });
    assert.equal(tree.props['data-wallet-balance'], 'ready');
    assert.equal(expected, address);
    assert.equal(selectedNetwork, 'ethereum');
    const html = renderToStaticMarkup(tree).replaceAll('<span>', '').replaceAll('</span>', '');
    assert.ok(html.includes(shown), html);
    assert.match(html, /Ethereum · ERC-20/);
    assert.doesNotMatch(html, /Polygon|Reown|MELD/);
  }
});

test('loading, transport failure, malformed data and a different wallet never display a stale or invented zero balance', () => {
  for (const patch of [{ loading: true }, { error: 'internal_provider_failure' }, { balanceAtomic: null }, { balanceAtomic: 'not-a-number' }, { walletAddress: other }]) {
    state = fixture(patch);
    const tree = Balance({ expectedAddress: address });
    assert.notEqual(tree.props['data-wallet-balance'], 'ready');
    const html = renderToStaticMarkup(tree);
    assert.match(html, /— <span>USDT/);
    assert.doesNotMatch(html, /10 <span>USDT|0 <span>USDT|internal_provider_failure/);
    assert.ok(html.includes(translateMessage('es', patch.loading ? 'funding.personalBalanceLoading' : 'funding.personalBalanceUnavailable')));
  }
  state = fixture();
  assert.equal(Balance({ expectedAddress: other }).props['data-wallet-balance'], 'unavailable');
  state = fixture({ walletAddress: other, balanceAtomic: '15000000' });
  assert.equal(Balance({ expectedAddress: other }).props['data-wallet-balance'], 'ready');
});

test('the refresh control is read-only, explicit and disabled while loading; an unlinked wallet receives clear guidance', () => {
  let refreshed = 0;
  state = fixture({ refresh: () => refreshed++ });
  const tree = Balance({ compact: true });
  assert.equal(refreshed, 0);
  const button = findAll(tree, node => node?.type === 'button')[0];
  assert.equal(button.props.type, 'button');
  assert.equal(button.props['aria-label'], translateMessage('es', 'funding.personalBalanceRefresh') + ' · ' + translateMessage('es', 'funding.personalBalanceNetwork'));
  button.props.onClick(); assert.equal(refreshed, 1);
  state = fixture({ loading: true });
  assert.equal(findAll(Balance({}), node => node?.type === 'button')[0].props.disabled, true);
  state = fixture({ walletAddress: '', balanceAtomic: null });
  const empty = Balance({});
  assert.equal(empty.props['data-wallet-balance'], 'unlinked');
  assert.ok(renderToStaticMarkup(empty).includes(translateMessage('es', 'funding.personalBalanceNoWallet')));
  for (const error of ['unauthenticated', 'company_payment_wallet_not_linked']) {
    state = fixture({ walletAddress: '', balanceAtomic: null, error });
    const unavailable = Balance({});
    assert.equal(unavailable.props['data-wallet-balance'], 'unlinked');
    assert.ok(renderToStaticMarkup(unavailable).includes(translateMessage('es', 'funding.personalBalanceNoWallet')));
  }
  assert.doesNotMatch(source, /@reown|ethers|eth_sendTransaction|requestAccounts|writeCompanyPayment/);
});

test('all locales distinguish spendable USDT from the ETH needed for the network fee', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    state = fixture({ nativeBalanceAtomic: '0' });
    const html = renderToStaticMarkup(Balance({ expectedAddress: address }));
    assert.ok(html.includes(translateMessage(locale, 'funding.personalBalanceGas')));
    assert.doesNotMatch(html, /funding\./);
    assert.ok(!renderToStaticMarkup(Balance({ compact: true, showGasNotice: false })).includes(translateMessage(locale, 'funding.personalBalanceGas')));
  }
  locale = 'es';
});

test('the current wallet shows only Polygon while retaining the Ethereum balance component for historical reads', () => {
  stateByNetwork = { ethereum: fixture(), polygon: fixture({ balanceAtomic: '7000000' }) };
  const group = Balances({ expectedAddress: address });
  const children = React.Children.toArray(group.props.children);
  assert.deepEqual(children.filter(child => child.type === Balance).map(child => [child.props.network, child.props.expectedAddress]), [['polygon', address]]);
  const html = renderToStaticMarkup(group).replaceAll('<span>', '').replaceAll('</span>', '');
  assert.ok(!html.includes('10 USDT'));
  assert.ok(html.includes('7 USDT'));
  assert.doesNotMatch(html, /data-wallet-network="ethereum"/);
  assert.match(html, /data-wallet-network="polygon"/);
  assert.doesNotMatch(html, /Ethereum · ERC-20/);
  assert.ok(html.includes(translateMessage('es', 'funding.personalBalancePolygonNetwork')));
  assert.ok(!html.includes('17 USDT'));
  assert.ok(!html.includes('10 ETH'));
  assert.ok(html.includes(translateMessage('es', 'funding.personalBalanceTransferNetwork')));
  stateByNetwork = null;
});

test('an unavailable Ethereum read never hides Polygon funds, and each chain retains its own zero and refresh state', () => {
  const refreshed = [];
  stateByNetwork = { ethereum: fixture({ balanceAtomic: '10000000', error: 'company_payment_unavailable', refresh: () => refreshed.push('ethereum') }),
    polygon: fixture({ balanceAtomic: '7000000', refresh: () => refreshed.push('polygon') }) };
  let group = Balances({ expectedAddress: address, compact: true });
  let html = renderToStaticMarkup(group);
  assert.doesNotMatch(html, /data-wallet-network="ethereum"/);
  assert.match(html, /data-wallet-balance="ready" data-wallet-network="polygon"/);
  assert.match(html, /7 <span>USDT/);
  assert.doesNotMatch(html, /10 <span>USDT|0 <span>USDT/);
  const polygon = Balance({ expectedAddress: address, network: 'polygon' });
  findAll(polygon, node => node?.type === 'button')[0].props.onClick();
  assert.deepEqual(refreshed, ['polygon']);
  stateByNetwork.ethereum = fixture({ balanceAtomic: '0' });
  stateByNetwork.polygon = fixture({ balanceAtomic: null, loading: true });
  group = Balances({ expectedAddress: address }); html = renderToStaticMarkup(group);
  assert.doesNotMatch(html, /data-wallet-network="ethereum"/);
  assert.doesNotMatch(html, /0 <span>USDT/);
  assert.match(html, /data-wallet-balance="loading" data-wallet-network="polygon"/);
  stateByNetwork = null;
});

test('Polygon notices name POL while Ethereum notices name ETH in every locale', () => {
  for (locale of ['es', 'en', 'ar', 'zh']) {
    state = fixture({ nativeBalanceAtomic: '0' });
    const html = renderToStaticMarkup(Balance({ expectedAddress: address, network: 'polygon' }));
    assert.ok(html.includes(translateMessage(locale, 'funding.personalBalancePolygonGas')));
    assert.ok(!html.includes(translateMessage(locale, 'funding.personalBalanceGas')));
    assert.ok(html.includes(translateMessage(locale, 'funding.personalBalancePolygonNetwork')));
    assert.equal(selectedNetwork, 'polygon');
  }
  locale = 'es';
});
