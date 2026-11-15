import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { translateMessage } from '../../i18n/translate.mjs';
import { historicalPackageRights, HISTORICAL_PACKAGE_RIGHTS_POLICY } from '../../lib/historical-package-rights-contract.mjs';

const require = createRequire(import.meta.url);
const compiled = ts.transpileModule(readFileSync(new URL('./HistoricalPackageRightsCard.jsx', import.meta.url), 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const nodes = node => [node, ...React.Children.toArray(node?.props?.children).flatMap(nodes)];
const Link = ({ children, ...props }) => React.createElement('a', props, children);
const item = (number = 1, changes = {}) => {
  const recognizedAt = `2026-11-14T15:4${number}:00.000Z`;
  return { id: `11800000-0000-4000-8000-${String(number).padStart(12, '0')}`,
    packageName: `PRIVATE-RAW-PACKAGE-${number}001`, sourcePackageId: `${number}001`, packageBaseUsd: '100.00',
    boughtAt: `2024-03-0${number}T00:30:00.000Z`, recognizedAt, status: 'active', source: 'stripe_import',
    term: { type: 'until_revoked', startsAt: recognizedAt, endsAt: null }, ...changes };
};
const snapshot = (data, changes = {}) => ({ data, visible: true, loading: false, error: '', canRefresh: true, refresh() {}, ...changes });
const rights = (items = [item(), item(2, { packageBaseUsd: '2500.00' })], changes = {}) => ({
  rightsOnly: true, economicActivation: false, roiEnabled: false, commissionsEnabled: false,
  policy: HISTORICAL_PACKAGE_RIGHTS_POLICY, activeCount: items.filter(value => value.status === 'active').length,
  totalCount: items.length, items, ...changes,
});

function card(locale = 'es') {
  const module = { exports: {} };
  const mocks = {
    'react/jsx-runtime': require('react/jsx-runtime'),
    'lucide-react': new Proxy({}, { get: () => () => null }),
    'next/link': { default: Link },
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale, t: (key, values) => translateMessage(locale, key, values) }) },
    '@/lib/historical-package-rights-contract.mjs': { historicalPackageRights },
    './historical-package-rights.module.css': { default: new Proxy({}, { get: (_target, key) => key }) },
  };
  new Function('require', 'module', 'exports', compiled)(id => {
    assert.ok(Object.hasOwn(mocks, id), `historical presentation must not import an API, auth helper or payment SDK: ${id}`);
    return mocks[id];
  }, module, module.exports);
  return props => module.exports.default(props);
}

test('all four locales label packages from their USD base value and preserve distinct original purchase and recognition dates in UTC', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('rendering historical records cannot query a provider or create a payment'));
  const data = rights();
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const tree = card(locale)({ snapshot: snapshot(data) }), all = nodes(tree), html = renderToStaticMarkup(tree);
    const headings = all.filter(node => node?.type === 'h3');
    assert.equal(headings.length, data.items.length);
    for (const [index, record] of data.items.entries()) {
      const amount = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(record.packageBaseUsd));
      assert.equal(headings[index].props.children, translateMessage(locale, 'historicalPackage.packageLabel', { amount: `${amount} USD` }));
      const times = all.filter(node => node?.type === 'time').slice(index * 2, index * 2 + 2);
      assert.deepEqual(times.map(node => node.props.dateTime), [record.boughtAt, record.recognizedAt]);
      for (const [position, instant] of [record.boughtAt, record.recognizedAt].entries()) {
        const formatted = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(instant));
        assert.equal(times[position].props.children, `${formatted} UTC`);
      }
      for (const privateValue of [record.id, record.packageName, record.sourcePackageId]) assert.ok(!html.includes(privateValue), privateValue);
    }
    assert.ok(html.includes(translateMessage(locale, 'historicalPackage.boughtAt')));
    assert.ok(html.includes(translateMessage(locale, 'historicalPackage.recognizedAt')));
    assert.ok(html.includes(translateMessage(locale, 'historicalPackage.copy')));
    assert.doesNotMatch(html, /economicActivation|roiEnabled|commissionsEnabled|person_id|payment_intent_id/);
  }
});

test('separate receipts remain separate, including equal package values, and counters come from the full backend snapshot', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('presentation cannot start an API or payment request'));
  const items = [item(), item(2), item(3, { packageBaseUsd: '2500.00' })];
  const tree = card()({ snapshot: snapshot(rights(items)) });
  assert.equal(nodes(tree).filter(node => node?.type === 'li').length, 3);
  const labels = nodes(tree).filter(node => node?.type === 'h3').map(node => node.props.children);
  assert.equal(labels.length, 3);
  assert.equal(labels[0], labels[1], 'two equal package prices still have two separate receipt rows');
  assert.notEqual(labels[0], labels[2], 'the higher package never replaces the lower receipts');
  const limited = rights(items.slice(0, 2), { activeCount: 37, totalCount: 125 });
  const html = renderToStaticMarkup(card()({ snapshot: snapshot(limited) }));
  assert.ok(html.includes(translateMessage('es', 'historicalPackage.activeCount', { count: 37 })));
  assert.ok(html.includes(translateMessage('es', 'historicalPackage.recentCount', { count: 2, total: 125 })));
});

test('full history starts collapsed without a nested scroll or any payment mutation controls', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('presentation cannot start an API or payment request'));
  let refreshes = 0;
  const tree = card()({ snapshot: snapshot(rights(), { refresh() { refreshes++; } }) }), all = nodes(tree);
  const detail = all.find(node => node?.type === 'details');
  assert.ok(detail); assert.equal(detail.props.open, undefined);
  assert.equal(all.filter(node => node?.type === 'summary').length, 1);
  assert.equal(refreshes, 0);
  assert.deepEqual(all.filter(node => ['form', 'input', 'select', 'textarea'].includes(node?.type)), []);
  assert.equal(all.filter(node => node?.type === 'button').length, 1, 'only the explicit read refresh is available');
  const html = renderToStaticMarkup(tree);
  assert.doesNotMatch(html, /<details[^>]*\bopen|<form|action=|\/api\/|Pagar|Confirmar transferencia|eth_sendTransaction|sendRawTransaction/);
  const css = readFileSync(new URL('./historical-package-rights.module.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /overflow(?:-y)?\s*:\s*(?:auto|scroll)|max-height\s*:/);
});

test('compact overview links only to the profile detail and does not expose records, timestamps or private identifiers', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('presentation cannot start an API or payment request'));
  const data = rights(), tree = card('en')({ snapshot: snapshot(data), compact: true }), all = nodes(tree);
  const link = all.find(node => node?.type === Link);
  assert.equal(link.props.href, '/dashboard/profile#historical-package-rights');
  assert.equal(tree.props.id, undefined, 'the profile owns the only historical detail anchor');
  assert.equal(all.some(node => ['details', 'li', 'time', 'h3'].includes(node?.type)), false);
  const html = renderToStaticMarkup(tree);
  for (const record of data.items) for (const value of [record.id, record.packageName, record.sourcePackageId, record.boughtAt, record.recognizedAt]) assert.ok(!html.includes(value));
});

test('revoked, suspended and review-only records never claim active historical access or a new financial entitlement', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('presentation cannot start an API or payment request'));
  for (const status of ['revoked', 'suspended', 'review_required']) {
    const tree = card()({ snapshot: snapshot(rights([item(1, { status })])) }), html = renderToStaticMarkup(tree);
    assert.ok(html.includes(translateMessage('es', 'historicalPackage.noCurrentAccess')));
    assert.ok(html.includes(translateMessage('es', `historicalPackage.status_${status}`)));
    assert.ok(!html.includes(translateMessage('es', 'historicalPackage.activeUntilRevoked')));
    assert.ok(html.includes(translateMessage('es', 'historicalPackage.copy')));
  }
  const empty = renderToStaticMarkup(card()({ snapshot: snapshot(rights([])) }));
  assert.ok(empty.includes(translateMessage('es', 'historicalPackage.noItems')));
  const forged = renderToStaticMarkup(card()({ snapshot: snapshot(rights(undefined, { economicActivation: true })) }));
  assert.ok(!forged.includes(translateMessage('es', 'historicalPackage.activeUntilRevoked')));
  assert.doesNotMatch(forged, /<h3|PRIVATE-RAW/);
});

test('loading and failed reads hide record details and offer only an explicit permitted refresh without automatic calls', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('presentation cannot start an API or payment request'));
  let refreshes = 0;
  const View = card(), data = rights(), refresh = () => { refreshes++; };
  const loading = View({ snapshot: snapshot(data, { loading: true, refresh }) });
  assert.equal(refreshes, 0); assert.equal(nodes(loading).find(node => node?.type === 'button').props.disabled, true);
  assert.match(renderToStaticMarkup(loading), /role="status"/);
  assert.equal(nodes(loading).some(node => node?.type === 'li'), false);
  const failed = View({ snapshot: snapshot(data, { error: 'private-provider-diagnostic', refresh }) });
  const html = renderToStaticMarkup(failed);
  assert.match(html, /role="alert"/); assert.doesNotMatch(html, /private-provider|PRIVATE-RAW|<time/);
  const button = nodes(failed).find(node => node?.type === 'button');
  assert.equal(refreshes, 0); assert.equal(button.props.disabled, false); button.props.onClick(); assert.equal(refreshes, 1);
  const retired = View({ snapshot: snapshot(null, { error: 'unavailable', canRefresh: false, refresh }) });
  assert.equal(nodes(retired).find(node => node?.type === 'button').props.disabled, true);
  assert.equal(View({ snapshot: snapshot(data, { visible: false, refresh }) }), null); assert.equal(refreshes, 1);
});

test('the full native USD amount bound preserves exact cents instead of rounding through a floating-point number', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('formatting cannot query a financial service'));
  const data = rights([item(1, { packageBaseUsd: '99999999999999.99' })]);
  assert.ok(historicalPackageRights(data));
  const tree = card('en')({ snapshot: snapshot(data) });
  const label = nodes(tree).find(node => node?.type === 'h3').props.children;
  assert.equal(label, '$99,999,999,999,999.99 USD package');
  assert.ok(!label.includes('.98'), 'binary floating-point cents must not enter the historical price label');
});
