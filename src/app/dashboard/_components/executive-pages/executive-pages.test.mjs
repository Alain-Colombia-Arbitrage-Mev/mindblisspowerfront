import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as paymentDisplay from '../../../../lib/payment-display.mjs';

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
  ranks: 'RankDashboardPage', referrals: 'ReferralsDashboardPage', support: 'SupportDashboardPage',
  team: 'TeamDashboardPage', 'team-pro': 'TeamDashboardPage', withdrawals: 'FinanceDashboardPage',
};
const iconStub = () => React.createElement('svg', { 'aria-hidden': 'true' });
const icons = new Proxy({}, { get: () => iconStub });
const emptyComponent = () => null;

// Compile the real split JSX in memory. Effects never run during this server
// render, and all API-facing dependencies below are synthetic and local.
function loadPages({ summary = { loading: true, data: null, error: '' }, health = { loading: true }, session = null } = {}) {
  const cache = new Map();
  const mocks = {
    'react': React,
    'lucide-react': icons,
    '@/lib/member-session-context': { useMemberSession: () => session },
    '@/hooks/useMemberSummary': { useMemberSummary: () => ({ state: summary, reload: () => {} }) },
    '@/lib/payment-display.mjs': paymentDisplay,
    '@/lib/member-read.mjs': { isRecoverySummary: data => data?.recovery_mode === true },
    '@/lib/useNetworkHealth': { useNetworkHealth: () => health },
    '@/lib/useSustainability': { useSustainability: () => ({ loading: false, data: null, error: '' }) },
    '@/lib/rank-catalog.mjs': { readRankCatalog: async () => { throw Error('Unexpected render-time request'); } },
    '@/components/member/ReferralModule': { default: emptyComponent },
    '@/components/panel/NOWPaymentsBalances': { default: emptyComponent },
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
      if (id.endsWith('/StripeSalesHistory') || id.endsWith('/SupportTicketForm')) return { default: emptyComponent };
      if (id.endsWith('/profile-model.mjs')) return { requestProfile: async () => { throw Error('Unexpected render-time request'); } };
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
  const pages = loadPages({ session: { name: 'Persona Prueba', email: 'verified@example.test', referralCode: 'REF-123' } });
  const html = render(pages.ProfileDashboardPage, { authMode: 'better-auth' });
  assert.match(html, /Persona Prueba/);
  assert.match(html, /verified@example.test/);
  assert.match(html, /REF-123/);
  assert.match(html, /autenticación de tu cuenta se realiza por correo electrónico/);
  assert.match(html, /disabled="">Guardar cambios/);
  assert.match(html, /Cargando los datos guardados de tu perfil/);
  assert.doesNotMatch(html, /Enviar SMS|Código SMS|Validación del teléfono/);
});

test('legacy Cognito profile presentation is retained without issuing verification requests', () => {
  const html = render(loadPages().ProfileDashboardPage, { authMode: 'cognito' });
  assert.match(html, /Validación del teléfono/);
  assert.match(html, /Enviar SMS/);
});

test('finance loading and failures do not invent an available zero balance', () => {
  const loading = render(loadPages().FinanceDashboardPage);
  assert.match(loading, /Cargando tu saldo/);
  assert.doesNotMatch(loading, /\$0\.00/);
  const failure = render(loadPages({ summary: { loading: false, error: 'unavailable', data: null } }).FinanceDashboardPage);
  assert.match(failure, /Reintentar/);
  assert.doesNotMatch(failure, /\$0\.00|Cargando tu saldo/);
});

test('advisor failure and member support loading still render their existing states after extraction', () => {
  const pages = loadPages({ health: { loading: false, data: null, error: 'Servicio no disponible' } });
  assert.match(render(pages.AiAdvisorDashboardPage), /Error al cargar datos: Servicio no disponible/);
  const support = render(pages.SupportDashboardPage);
  assert.match(support, /Cargando tus tickets/);
  assert.doesNotMatch(support, /Aún no tienes tickets/);
});
