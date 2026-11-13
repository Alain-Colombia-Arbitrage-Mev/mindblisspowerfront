import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { translateMessage } from '../i18n/translate.mjs';
import { matchesRoute } from './member-navigation.mjs';

const require = createRequire(import.meta.url);
const icon = () => null, icons = new Proxy({}, { get: () => icon });
const link = ({ children, ...props }) => React.createElement('a', props, children);
const label = ({ label: text, children }) => React.createElement('label', null, text, children);
const i18n = locale => ({ useI18n: () => ({ locale, t: (key, values) => translateMessage(locale, key, values) }) });
function compile(file, mocks) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (id === 'react/jsx-runtime') return require(id);
    assert.ok(Object.hasOwn(mocks, id), `Unexpected administrative UI dependency: ${id}`);
    return mocks[id];
  }, module, module.exports);
  return module.exports;
}

test('wallet sidebar preserves the assigned administrative address component and never advertises community or personal wallet routes', () => {
  const Sidebar = compile('../components/panel/PanelSidebar.jsx', {
    'lucide-react': icons, './SidebarLogo': { default: () => null }, './SidebarUserCard': { default: () => null },
    './SidebarNavItem': { default: ({ label, href, active }) => React.createElement('a', { href, 'aria-current': active ? 'page' : undefined }, label) },
    './SidebarAdministrativeWalletCard': { default: () => React.createElement('section', { 'data-wallet': 'administrative' }, 'Assigned administrative address') },
    './LogoutButton': { default: ({ children }) => React.createElement('button', null, children) },
    '@/lib/member-navigation.mjs': { matchesRoute }, '@/i18n/LanguageProvider': i18n('es'),
  }).default;
  const html = renderToStaticMarkup(React.createElement(Sidebar, { pathname: '/dashboard/wallet-administrative', member: { subject: 'owner', email: 'member@example.test' } }));
  assert.match(html, /Assigned administrative address/);
  assert.match(html, /href="\/dashboard\/wallet-administrative" aria-current="page"/);
  assert.match(html, /href="\/dashboard\/profile"/);
  assert.doesNotMatch(html, /Comunidad|Referidos|Rangos|Membresías|wallet-personal|companyPayment|\/dashboard\/(?:packages|network|team|rank|referrals|communications)/i);
});

test('wallet profile hides referral, sponsor and rank metadata while preserving account and password controls', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('server rendering a profile must not issue a request'));
  const Profile = compile('../app/dashboard/_components/executive-pages/ProfileDashboardPage.jsx', {
    react: React, 'next/link': { default: link }, 'lucide-react': icons,
    '@/lib/member-session-context': { useMemberSession: () => ({ name: 'Member', email: 'member@example.test', referralCode: 'PRIVATE-REFERRAL' }) },
    '@/lib/payment-display.mjs': { formatPaymentMoney: () => '—' },
    '../../profile/profile-model.mjs': { requestProfile: () => assert.fail('profile effects must not run during rendering') },
    '@/lib/browser-request-deadline.mjs': { browserRequestDeadline: () => assert.fail('no automatic side effects during rendering') },
    './executive-ui': { PageHeader: ({ title }) => React.createElement('h1', null, title), Field: label },
    './member-defaults.mjs': { member: { referralCode: 'FALLBACK-REFERRAL', sponsor: 'PRIVATE-SPONSOR', rank: 'PRIVATE-RANK', joined: '2026', plan: 'Plan vigente' } },
    '@/i18n/LanguageProvider': i18n('es'),
  }).ProfileDashboardPage;
  const html = renderToStaticMarkup(React.createElement(Profile, { authMode: 'better-auth' }));
  assert.match(html, /member@example.test/); assert.match(html, /href="\/forgot-password"/);
  assert.match(html, /Crear o cambiar contraseña/); assert.match(html, /Información personal/);
  assert.doesNotMatch(html, /PRIVATE-|FALLBACK-REFERRAL|Referid|Sponsor|Patrocinador|PRIVATE-RANK/i);
});

test('administrative authentication identity is wallet focused in every supported language', () => {
  for (const locale of ['es', 'en', 'ar', 'zh']) {
    const Identity = compile('../app/_components/AuthLocalizedContent.jsx', { 'lucide-react': icons, '@/i18n/LanguageProvider': i18n(locale) }).AuthIdentityCopy;
    const html = renderToStaticMarkup(React.createElement(Identity));
    for (const key of ['hero', 'heroCopy', 'benefitWallet', 'benefitHistory', 'capabilityWallet', 'capabilityWalletCopy']) {
      const value = translateMessage(locale, `auth.${key}`);
      assert.notEqual(value, `auth.${key}`, `${locale}:${key}`);
    }
    assert.doesNotMatch(html, /comunidad|community|network|المجتمع|مجتمعك|شبكتك|社区|网络|auth\./i, locale);
    assert.ok(html.includes(translateMessage(locale, 'auth.capabilityWallet')), locale);
  }
});
