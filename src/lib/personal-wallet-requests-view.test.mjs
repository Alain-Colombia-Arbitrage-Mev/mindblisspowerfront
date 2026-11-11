import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { translateMessage } from '../i18n/translate.mjs';
import { matchesRoute, memberPageFor, memberPageKeysFor } from './member-navigation.mjs';
import { FUNDING_UUID } from './wallet-funding-contract.mjs';

const require = createRequire(import.meta.url);
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const path = '/dashboard/wallet-personal/requests';
const Link = ({ children, prefetch: _prefetch, ...props }) => React.createElement('a', props, children);
const icon = () => React.createElement('svg', { 'aria-hidden': true });
function moduleAt(relative, locale = 'es', overrides = {}) {
  const source = read(relative), cache = new Map();
  function load(url, raw = readFileSync(url, 'utf8')) {
    if (cache.has(url.href)) return cache.get(url.href);
    const module = { exports: {} }; cache.set(url.href, module.exports);
    const compiled = ts.transpileModule(raw, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
    new Function('require', 'module', 'exports', compiled)(id => {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id === 'lucide-react') return new Proxy({}, { get: () => icon });
      if (['next/link', './IntentLink'].includes(id)) return { default: Link };
      if (id === '@/i18n/LanguageProvider') return { useI18n: () => ({ locale, dir: locale === 'ar' ? 'rtl' : 'ltr', t: (key, values) => translateMessage(locale, key, values) }) };
      if (id === '@/lib/member-navigation.mjs') return { matchesRoute };
      if (id === '@/lib/wallet-funding-contract.mjs') return { FUNDING_UUID };
      if (id === '@/lib/wallet-funding-client.mjs') return {
        readWalletFundingHistory: () => assert.fail('server render fetched funding history'), readWalletFundingStatus: () => assert.fail('server render fetched status'),
      };
      if (['./SidebarLogo', './SidebarUserCard', './SidebarWalletCard', './LogoutButton'].includes(id)) return { default: () => null };
      if (id.endsWith('.module.css')) return { default: new Proxy({}, { get: (_object, key) => key }) };
      if (id.startsWith('.')) return load(new URL(/\.(?:jsx|mjs|js)$/.test(id) ? id : `${id}.jsx`, url));
      return require(id);
    }, module, module.exports);
    cache.set(url.href, module.exports); return module.exports;
  }
  return load(new URL(relative, import.meta.url), source);
}

test('the actual shared sidebar places personal requests under wallet, keeps transfers and hides membership promotion in all four languages', () => {
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const { default: Sidebar } = moduleAt('../components/panel/PanelSidebar.jsx', locale);
    const html = renderToStaticMarkup(React.createElement(Sidebar, { pathname: path, member: null }));
    assert.match(html, new RegExp(`href="${path}"[^>]*aria-current="page"`));
    assert.ok(html.includes(translateMessage(locale, 'funding.history')));
    assert.ok(html.indexOf('href="/dashboard/payments"') < html.indexOf(`href="${path}"`));
    assert.ok(html.indexOf(`href="${path}"`) < html.indexOf('href="/dashboard/wallet-personal/pay"'));
    assert.doesNotMatch(html, /href="\/dashboard\/packages|nav\.memberships|funding\.history|wallet-administrative|Sandbox|MELD/);
  }
  const shell = read('../app/dashboard/_components/DashboardShell.jsx');
  assert.equal((shell.match(/<PanelSidebar\b/g) || []).length, 2, 'desktop and mobile drawer must share the same navigation');
  assert.match(shell, /<NavigationDrawer\b/);
});

test('the separate requests page renders real personal history without wallet SDK, setup, funding form or administrative data', () => {
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const { default: Page } = moduleAt('../app/dashboard/_components/executive-pages/PersonalWalletRequestsPage.jsx', locale);
    const html = renderToStaticMarkup(React.createElement(Page));
    assert.match(html, /<h1/); assert.ok(html.includes(translateMessage(locale, 'funding.history')));
    assert.ok(html.includes(translateMessage(locale, 'funding.personalHistoryCopy')));
    assert.equal((html.match(/<h[1-6][^>]*>[^<]*Solicitudes de recarga/g) || []).length, locale === 'es' ? 1 : 0);
    assert.match(html, /href="\/dashboard\/payments"/);
    assert.doesNotMatch(html, /<form|<input|<select|Sandbox|MELD|wallet-administrative|Reown/);
  }
  const route = read('../app/dashboard/wallet-personal/requests/page.jsx');
  assert.match(route, /dynamic\s*=\s*["']force-dynamic["']/);
  assert.match(route, /PersonalWalletRequestsPage/); assert.doesNotMatch(route, /Reown|MELD|administrative|searchParams/);
  assert.equal(memberPageFor(path).title, 'Solicitudes de recarga');
  assert.equal(memberPageKeysFor(`${path}/detail`).title, 'funding.history');
});

test('selecting a request opens only its owned personal status and rejects malformed or administrative selectors', () => {
  const states = []; let cursor = 0;
  const { default: Page } = moduleAt('../app/dashboard/_components/executive-pages/PersonalWalletRequestsPage.jsx', 'es', {
    react: { ...React, useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; } },
  });
  const render = () => { cursor = 0; return Page(); };
  const first = render();
  const history = React.Children.toArray(first.props.children)[0].props.children;
  assert.equal(history.props.walletKind, 'personal');
  history.props.onSelectRequest('administrative:other'); history.props.onSelectRequest(null);
  assert.equal(states[0], '');
  const reference = '11111111-1111-4111-8111-111111111111';
  history.props.onSelectRequest(reference);
  const status = React.Children.toArray(render().props.children)[1];
  assert.equal(status.props.walletKind, 'personal'); assert.equal(status.props.checkoutReference, reference); assert.equal(status.props.focusKey, 1);
  history.props.onSelectRequest(reference); assert.equal(states[1], 2);
});

test('the wallet form and active overview no longer embed request history or promote new memberships; retained records remain routable', () => {
  const form = read('../app/dashboard/_components/executive-pages/PersonalWalletFundingPage.jsx');
  assert.doesNotMatch(form, /WalletFundingHistory/); assert.match(form, /\/dashboard\/wallet-personal\/requests/);
  const overview = read('../components/panel/overview/OverviewDashboard.jsx'), discovery = read('../components/panel/overview/OverviewDiscoveryCard.jsx');
  assert.doesNotMatch(overview, /href="\/dashboard\/packages"/); assert.doesNotMatch(discovery, /href="\/dashboard\/packages"|overview\.plansFrom/);
  assert.match(discovery, /\/dashboard\/wallet-personal\/requests/);
  assert.ok(existsSync(new URL('../app/dashboard/packages/page.jsx', import.meta.url)), 'membership history/bookmarks are retained');
});
