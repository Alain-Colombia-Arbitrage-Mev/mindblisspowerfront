import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { readMemberJson } from '../../../../lib/member-read.mjs';
import * as model from './rank-page-model.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';

const bronze = { positioned: true, me: { affiliateId: '123', rank: { code: 'BRONZE', name: 'Bronce' } }, tree: [] };
const catalog = { ranks: [{ code: 'BRONZE', name_es: 'Bronce', required_points: '100', bonus_amount_usd: '50.00' },
  { code: 'GOLD', name_es: 'Oro', required_points: '500', bonus_amount_usd: '100.00' }] };
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const tick = () => new Promise(resolve => setImmediate(resolve));

// Run the real component/effects against local transports only. Private reads
// use the production validator and no-store reader; no server or account is used.
function view({ readCatalog = async () => catalog, fetchImpl = async () => Response.json(bronze) } = {}) {
  const state = [], effects = [], requests = [];
  let index = 0, effectIndex = 0, updates = 0;
  const hooks = { useState(initial) {
    const slot = index++;
    if (!(slot in state)) state[slot] = typeof initial === 'function' ? initial() : initial;
    return [state[slot], value => { updates++; state[slot] = typeof value === 'function' ? value(state[slot]) : value; }];
  }, useEffect(effect) { const slot = effectIndex++; if (!effects[slot]) effects[slot] = { effect }; } };
  const mocks = {
    react: hooks,
    '@/lib/rank-catalog.mjs': { readRankCatalog: readCatalog },
    '@/lib/member-read.mjs': { readMemberJson: (url, options) => readMemberJson(url, { ...options, fetchImpl: async (target, init) => {
      requests.push({ target, init }); return fetchImpl(target, init);
    } }) },
    './rank-page-model.mjs': model,
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale: 'es', dir: 'ltr', t: (key, values) => translateMessage('es', key, values) }) },
    'lucide-react': new Proxy({}, { get: () => () => null }),
    './executive-ui': { ExecutiveModulePage: () => null },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
  };
  const compiled = ts.transpileModule(readFileSync(new URL('./RankDashboardPage.jsx', import.meta.url), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const result = { exports: {} };
  new Function('require', 'module', 'exports', compiled)(name => {
    assert.ok(Object.hasOwn(mocks, name), `Unexpected rank-page dependency: ${name}`); return mocks[name];
  }, result, result.exports);
  return {
    render() {
      index = 0; effectIndex = 0;
      const config = result.exports.RankDashboardPage().props.config;
      for (const item of effects) if (!item.started) { item.started = true; item.cleanup = item.effect(); }
      return config;
    },
    unmount() { for (const item of effects) item.cleanup?.(); }, requests, updates: () => updates,
  };
}

test('real rank page publishes private rank despite catalog outage instead of false no-rank and maximum', async () => {
  const harness = view({ readCatalog: async () => { throw new Error('Synthetic private provider detail'); } });
  harness.render(); await tick();
  const config = harness.render();
  assert.equal(config.metrics[0].value, 'Bronce');
  assert.equal(config.metrics[1].value, 'No disponible');
  assert.doesNotMatch(JSON.stringify(config), /Máximo|Sin rango|Synthetic private/);
  assert.equal(harness.requests.length, 1);
  assert.equal(harness.requests[0].target, '/api/member/tree?view=position');
  assert.equal(harness.requests[0].init.cache, 'no-store');
  assert.ok(harness.requests[0].init.signal instanceof AbortSignal);
  harness.unmount();
});

for (const status of [401, 403, 503]) test(`real rank page displays private read HTTP ${status} as unavailable without discarding the safe catalog`, async () => {
  const harness = view({ fetchImpl: async () => Response.json({ error: 'Private provider detail' }, { status }) });
  harness.render(); await tick();
  const config = harness.render();
  assert.equal(config.metrics[0].value, 'No disponible');
  assert.equal(config.metrics[1].value, 'No disponible');
  assert.equal(config.metrics[3].value, '2');
  assert.equal(config.rows.every(row => row[1] === 'Sin confirmar'), true);
  assert.doesNotMatch(JSON.stringify(config), /Máximo|Sin rango|Private provider detail/);
  harness.unmount();
});

test('real rank page publishes either read independently while the other is slow', async () => {
  const pending = deferred();
  const harness = view({ fetchImpl: () => pending.promise });
  harness.render(); await tick();
  let config = harness.render();
  assert.equal(config.metrics[0].value, '—');
  assert.equal(config.metrics[3].value, '2');
  pending.resolve(Response.json(bronze)); await tick();
  config = harness.render();
  assert.equal(config.metrics[0].value, 'Bronce');
  assert.equal(config.metrics[1].value, 'Oro');
  harness.unmount();
});

test('real rank page rejects incomplete private payloads instead of claiming no rank or maximum', async () => {
  const harness = view({ fetchImpl: async () => Response.json({ positioned: true, me: { affiliateId: '123' }, tree: [] }) });
  harness.render(); await tick();
  const config = harness.render();
  assert.equal(config.metrics[0].value, 'No disponible');
  assert.equal(config.metrics[1].value, 'No disponible');
  harness.unmount();
});

test('unmount aborts the private read and late independent results cannot restore member state or trigger another request', async () => {
  const pendingCatalog = deferred(), pendingPosition = deferred();
  const harness = view({ readCatalog: () => pendingCatalog.promise, fetchImpl: () => pendingPosition.promise });
  harness.render();
  harness.unmount();
  const updates = harness.updates();
  assert.equal(harness.requests[0].init.signal.aborted, true);
  pendingCatalog.resolve(catalog); pendingPosition.resolve(Response.json(bronze));
  await tick();
  assert.equal(harness.updates(), updates);
  assert.equal(harness.requests.length, 1);
});
