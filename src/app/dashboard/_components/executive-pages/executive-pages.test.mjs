import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as paymentDisplay from '../../../../lib/payment-display.mjs';
import * as deadline from '../../../../lib/browser-request-deadline.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';
import * as fundingContract from '../../../../lib/wallet-funding-contract.mjs';
import * as paymentValues from '../../../../lib/personal-company-payment-values.mjs';
import * as profileModel from '../../profile/profile-model.mjs';

const require = createRequire(import.meta.url);
const pageNames = [
  'DashboardOverviewPage', 'CommunicationsDashboardPage', 'FinanceDashboardPage', 'ProfileDashboardPage',
  'NetworkDashboardPage', 'ReferralsDashboardPage', 'TeamDashboardPage', 'AiAdvisorDashboardPage',
  'AutoModeDashboardPage', 'RankDashboardPage', 'ActivityDashboardPage', 'BonusesDashboardPage',
  'ProductsDashboardPage', 'SupportDashboardPage', 'LegalDashboardPage', 'KycDashboardPage',
];
const routes = {
  activity: 'ActivityDashboardPage', ai: 'AiAdvisorDashboardPage', 'ai-analysis': 'AiAdvisorDashboardPage',
  auto: 'AutoModeDashboardPage', bonificaciones: 'BonusesDashboardPage', legal: 'LegalDashboardPage',
  products: 'ProductsDashboardPage', profile: 'ProfileDashboardPage', rank: 'RankDashboardPage',
  ranks: 'RankDashboardPage', referrals: 'ReferralsDashboardPage',
  team: 'TeamDashboardPage', 'team-pro': 'TeamDashboardPage', payments: 'FinanceDashboardPage',
};
const iconStub = () => React.createElement('svg', { 'aria-hidden': 'true' });
const icons = new Proxy({}, { get: () => iconStub });
const emptyComponent = () => null;

// Compile the real split JSX in memory. Effects never run during this server
// render, and all API-facing dependencies below are synthetic and local.
function loadPages({ summary = { loading: true, data: null, error: '' }, health = { loading: true }, session = null, walletBalances = null,
  walletBalance = { loading: true, error: '', walletAddress: '', balanceAtomic: null, refresh() {} } } = {}) {
  const cache = new Map();
  const mocks = {
    'react': React,
    'lucide-react': icons,
    '@/lib/member-session-context': { useMemberSession: () => session },
    '@/hooks/useMemberSummary': { useMemberSummary: () => ({ state: summary, reload: () => {} }) },
    '@/lib/payment-display.mjs': paymentDisplay,
    '@/lib/personal-company-payment-values.mjs': paymentValues,
    '@/hooks/usePersonalWalletBalance': { usePersonalWalletBalance: (_address, network = 'ethereum') => walletBalances?.[network] || walletBalance },
    '@/lib/browser-request-deadline.mjs': deadline,
    '@/lib/member-read.mjs': { isRecoverySummary: data => data?.recovery_mode === true },
    '@/lib/personal-wallet.mjs': {
      MINDBLISS_ONRAMP_FEE_PERCENT: 1,
      PERSONAL_WALLET_ASSET: 'USDT',
      PERSONAL_WALLET_NETWORK: 'Polygon',
      PERSONAL_WALLET_MINIMUM_USD: 50,
    },
    '@/lib/administrative-wallet.mjs': {
      ADMINISTRATIVE_WALLET_ASSET: 'USDT',
      ADMINISTRATIVE_WALLET_MINIMUM_USD: 50,
      ADMINISTRATIVE_WALLET_PROVIDERS: ['TOPPER', 'SWAPPED'],
      readAdministrativeWallet: async () => { throw Error('Unexpected render-time request'); },
      ensureAdministrativeWallet: async () => { throw Error('Unexpected render-time request'); },
    },
    '@/lib/administrative-onramp-client.mjs': {
      startAdministrativeMeldOnramp: async () => { throw Error('Unexpected render-time request'); },
    },
    '@/lib/wallet-funding-contract.mjs': fundingContract,
    '@/lib/wallet-funding-client.mjs': { fundingRequestId: () => 'd8a4c010-cc33-44da-a297-8b3c6440f491',
      readAdministrativeSandboxOptions: async () => { throw Error('Unexpected render-time request'); },
      readWalletFundingHistory: async () => { throw Error('Unexpected render-time request'); } },
    '@/lib/meld-onramp.mjs': { browserOnrampRegion: () => 'CO' },
    '@/lib/meld-onramp-client.mjs': {
      ONRAMP_COUNTRIES: [['CO', 'Colombia']],
      ONRAMP_CRYPTO: 'USDT_POLYGON',
      readOnrampAvailability: async () => { throw Error('Unexpected render-time request'); },
      createOnrampQuote: async () => { throw Error('Unexpected render-time request'); },
    },
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale: 'es', dir: 'ltr', t: (key, values) => translateMessage('es', key, values) }) },
    '@/lib/useNetworkHealth': { useNetworkHealth: () => health },
    '@/lib/useSustainability': { useSustainability: () => ({ loading: false, data: null, error: '' }) },
    '@/lib/rank-catalog.mjs': { readRankCatalog: async () => { throw Error('Unexpected render-time request'); } },
    '@/components/member/ReferralModule': { default: emptyComponent },
    './CommunityInviteCard': { default: emptyComponent },
    '@/components/panel/NOWPaymentsBalances': { default: emptyComponent },
    '@/components/wallet/PersonalWalletBalance': { default: props => React.createElement(load(new URL('../../../../components/wallet/PersonalWalletBalance.jsx', import.meta.url)).default, props) },
    '@/components/wallet/PersonalWalletBalances': { default: props => React.createElement(load(new URL('../../../../components/wallet/PersonalWalletBalances.jsx', import.meta.url)).default, props) },
    '@/components/reown/ReownContext': {
      useReownWallet: () => ({ configured: true, isConnected: false, isLinked: false, startOnramp: async () => {}, openOnramp: async () => {} }),
    },
    'next/dynamic': { default: () => ({ children }) => children },
    'next/link': { default: ({ children, prefetch: _prefetch, ...props }) => React.createElement('a', props, children) },
  };
  function load(url) {
    const key = url.href;
    if (cache.has(key)) return cache.get(key);
    const source = readFileSync(url, 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
    const module = { exports: {} };
    cache.set(key, module.exports);
    new Function('require', 'module', 'exports', code)(id => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id.endsWith('.module.css')) return { default: new Proxy({}, { get: (_target, key) => key }) };
      if (id.endsWith('/StripeSalesHistory') || id.endsWith('/SupportTicketForm')) return { default: emptyComponent };
      if (id.endsWith('/profile-model.mjs')) return { ...profileModel, requestProfile: async () => { throw Error('Unexpected render-time request'); } };
      if (id.startsWith('.')) return load(new URL(/\.(?:mjs|jsx)$/.test(id) ? id : `${id}.jsx`, url));
      return require(id);
    }, module, module.exports);
    cache.set(key, module.exports);
    return module.exports;
  }
  return load(new URL('../ExecutiveDashboardPages.jsx', import.meta.url));
}
const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, props));

test('all 16 public page exports remain compatible and render without fetching', () => {
  const pages = loadPages();
  assert.deepEqual(Object.keys(pages).sort(), [...pageNames].sort());
  for (const name of pageNames) {
    const html = render(pages[name], { authMode: 'better-auth' });
    assert.match(html, /executive-page/, name);
    assert.match(html, /<h1/, name);
  }
});

test('server route entries import only their individual client page, not the compatibility barrel', () => {
  for (const [route, name] of Object.entries(routes)) {
    const source = readFileSync(new URL(`../../${route}/page.jsx`, import.meta.url), 'utf8');
    assert.match(source, new RegExp(`_components/executive-pages/${name}["']`), route);
    assert.doesNotMatch(source, /["'][^"']*ExecutiveDashboardPages["']/, route);
  }
  const support = readFileSync(new URL('../../support/page.jsx', import.meta.url), 'utf8');
  assert.match(support, /redirect\("\/dashboard"\)/);
  assert.doesNotMatch(support, /SupportDashboardPage/);
  const profile = readFileSync(new URL('../../profile/page.jsx', import.meta.url), 'utf8');
  assert.match(profile, /betterAuthEnabled\(\) \? 'better-auth' : 'cognito'/);
});

test('split client modules do not import another page or bring all module configurations back', () => {
  for (const name of pageNames) {
    const file = `${name}.jsx`;
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
    assert.equal(parsed.parseDiagnostics.length, 0, file);
    const imports = parsed.statements.filter(ts.isImportDeclaration).map(item => item.moduleSpecifier.text);
    assert.ok(!imports.some(id => /ExecutiveDashboardPages|DashboardPage$|DashboardPage\.jsx$/.test(id)), file);
    const configs = parsed.statements.filter(ts.isVariableStatement)
      .flatMap(item => [...item.declarationList.declarations])
      .find(item => item.name.getText(parsed) === 'moduleConfigs');
    if (configs) assert.equal(configs.initializer.properties.length, 1, file);
    if (name !== 'ReferralsDashboardPage') assert.ok(!imports.includes('@/components/member/ReferralModule'), file);
    if (name !== 'FinanceDashboardPage') assert.ok(!imports.some(id => id.endsWith('/StripeSalesHistory')), file);
    if (name !== 'AiAdvisorDashboardPage') assert.ok(!imports.includes('@/lib/useSustainability'), file);
  }
});

test('shared presentation primitives have no API, auth, animation or page dependencies', () => {
  const source = readFileSync(new URL('executive-ui.jsx', import.meta.url), 'utf8');
  const parsed = ts.createSourceFile('executive-ui.jsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  const imports = parsed.statements.filter(ts.isImportDeclaration).map(item => item.moduleSpecifier.text);
  assert.deepEqual(imports, ['lucide-react']);
  assert.doesNotMatch(source, /fetch\(|useEffect\(|framer-motion|ExecutiveDashboardPages/);
});

test('Better Auth profile stays email-only, with saves disabled until the stored profile is loaded', () => {
  const pages = loadPages({ session: { subject: 'verified-owner', name: 'Persona Prueba', email: 'verified@example.test', referralCode: 'REF-123' } });
  const html = render(pages.ProfileDashboardPage, { authMode: 'better-auth' });
  assert.match(html, /Persona Prueba/);
  assert.match(html, /verified@example.test/);
  assert.doesNotMatch(html, /REF-123/);
  assert.match(html, /Patrocinador pendiente de asignación/);
  assert.match(html, /autenticación se realiza por correo electrónico/);
  assert.match(html, /href="\/forgot-password"/);
  assert.match(html, /Crear o cambiar contraseña/);
  assert.doesNotMatch(html, /profile-password-unavailable|Función pendiente de integración/);
  assert.match(html, /disabled="">Guardar cambios/);
  assert.match(html, /Cargando los datos guardados de tu perfil/);
  assert.doesNotMatch(html, /Enviar SMS|Código SMS|Validación del teléfono/);
});

test('legacy Cognito profile presentation is retained without issuing verification requests', () => {
  const html = render(loadPages().ProfileDashboardPage, { authMode: 'cognito' });
  assert.match(html, /Validación del teléfono/);
  assert.match(html, /Enviar SMS/);
});

test('phone verification keeps provider and configuration diagnostics out of the customer UI', () => {
  const profile = readFileSync(new URL('ProfileDashboardPage.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(profile, /text:\s*d\.(?:error|message)/);
  for (const route of ['../../../api/auth/cognito/phone/request/route.js', '../../../api/auth/cognito/phone/confirm/route.js']) {
    const source = readFileSync(new URL(route, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /error:\s*error\.message/);
    assert.match(source, /phone_verification_unavailable/);
  }
});

test('finance loading and failures do not invent an available zero balance', () => {
  const loading = render(loadPages().FinanceDashboardPage);
  assert.match(loading, /Cargando tu wallet/);
  assert.doesNotMatch(loading, /\$0\.00/);
  const failure = render(loadPages({ summary: { loading: false, error: 'unavailable', data: null } }).FinanceDashboardPage);
  assert.match(failure, /Reintentar/);
  assert.doesNotMatch(failure, /\$0\.00|Cargando tu wallet/);
});

test('financial summary offers only the personal wallet without mounting its funding form', () => {
  const page = loadPages().FinanceDashboardPage;
  const html = render(page);
  assert.match(html, /href="\/dashboard\/wallet-personal"/);
  assert.doesNotMatch(html, /wallet-administrative|Wallet administrativa|MELD/);
  assert.doesNotMatch(html, /<form|Proveedor de prueba|id="personal-wallet"|id="administrative-wallet"/);
});

test('finance renders only the independent Ethereum USDT read and never falls back to the internal USD ledger', () => {
  const summary = { loading: false, error: '', data: { wallet_balance_usd: '987654.32', active_packages: 2,
    payments: [{ purchase_id: 1, created_at: '2026-11-10T12:00:00Z', status: 'paid', total_usd: '25.00' }] } };
  const walletAddress = `0x${'1'.repeat(40)}`;
  for (const walletBalance of [
    { loading: true, error: '', walletAddress, balanceAtomic: null, refresh() {} },
    { loading: false, error: 'company_payment_rpc_unavailable', walletAddress, balanceAtomic: null, refresh() {} },
    { loading: false, error: '', walletAddress, balanceAtomic: '0', refresh() {} },
    { loading: false, error: '', walletAddress, balanceAtomic: '12345678', refresh() {} },
  ]) {
    const html = render(loadPages({ summary, walletBalance }).FinanceDashboardPage);
    assert.doesNotMatch(html, /987654|987,654/);
    assert.match(html, /USDT/);
    assert.match(html, /25\.00/); // Membership history retains its own USD price.
    if (walletBalance.balanceAtomic === null) assert.match(html, /<output[^>]*><bdi[^>]*>— <span>USDT/);
    else assert.match(html, new RegExp(`<output[^>]*><bdi[^>]*>${walletBalance.balanceAtomic === '0' ? '0' : '12\\.345678'} <span>USDT`));
  }
});

test('finance shows the active Polygon balance without adding or displaying historical Ethereum funds', () => {
  const walletAddress = `0x${'1'.repeat(40)}`;
  const base = { loading: false, error: '', walletAddress, nativeBalanceAtomic: '0', refresh() {} };
  const html = render(loadPages({ summary: { loading: false, error: '', data: { wallet_balance_usd: '987654.32' } },
    walletBalances: { ethereum: { ...base, balanceAtomic: '10000000' }, polygon: { ...base, balanceAtomic: '28433366' } } }).FinanceDashboardPage);
  assert.doesNotMatch(html, /data-wallet-network="ethereum"/);
  assert.match(html, /data-wallet-network="polygon"[^]*?28\.433366 <span>USDT/);
  assert.equal((html.match(/data-wallet-network="ethereum"/g) || []).length, 0);
  assert.equal((html.match(/data-wallet-network="polygon"/g) || []).length, 1);
  assert.equal((html.match(/class="executive-card-label"/g) || []).length, 3);
  assert.match(html, /class="executive-grid three mb-6"/);
  for (const label of ['walletPage.activeMemberships', 'walletPage.registeredPayments', 'walletPage.pendingPayments']) {
    assert.match(html, new RegExp(translateMessage('es', label)));
  }
  assert.doesNotMatch(html, /38\.433366|987654|987,654/);
});

test('advisor failure and member support loading still render their existing states after extraction', () => {
  const pages = loadPages({ health: { loading: false, data: null, error: 'Servicio no disponible' } });
  const advisor = render(pages.AiAdvisorDashboardPage);
  assert.match(advisor, /Análisis temporalmente no disponible/);
  assert.doesNotMatch(advisor, /Servicio no disponible|Error al cargar datos/);
  const support = render(pages.SupportDashboardPage);
  assert.match(support, /Cargando tus tickets/);
  assert.doesNotMatch(support, /Aún no tienes tickets/);
});
