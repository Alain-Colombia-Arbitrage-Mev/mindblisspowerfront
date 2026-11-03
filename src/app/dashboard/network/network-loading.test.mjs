import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('./page.jsx', import.meta.url), 'utf8');
const viewPaths = new Map([
  ['tree', '@/components/panel/network/BinaryTreeView'],
  ['generation', '@/components/panel/network/GenerationView'],
  ['rank', '@/components/panel/network/RankView'],
  ['list', '@/components/panel/network/OperativeListView'],
]);
const compile = value => ts.transpileModule(value, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const icon = () => React.createElement('svg', { 'aria-hidden': true });
const icons = new Proxy({}, { get: () => icon });
const empty = () => null;

function elements(tree) {
  if (Array.isArray(tree)) return tree.flatMap(elements);
  if (!React.isValidElement(tree)) return [];
  return [tree, ...elements(tree.props.children)];
}

// Run the real client route with local hook/module boundaries. The synthetic
// reader below cannot request production data, and effects run only on demand.
function networkView({ query = '', loading = false } = {}) {
  const effects = [], deferred = [], loaded = [], events = [];
  let stateIndex = 0;
  const state = {
    loading, refreshing: false, error: '', errorStatus: 0, refreshError: '',
    data: { positioned: true, me: { id: 1, name: 'Synthetic member' }, tree: [], meta: {} },
    summary: null, referral: null, summaryError: null, referralError: null, syncing: false,
  };
  const hooks = {
    useState: initial => [stateIndex++ === 3 ? state : typeof initial === 'function' ? initial() : initial, () => {}],
    useRef: current => ({ current }),
    useMemo: run => run(),
    useEffect: run => effects.push(run),
  };
  const mocks = {
    react: hooks,
    'next/link': { default: empty },
    'next/navigation': { useSearchParams: () => new URLSearchParams(query) },
    'lucide-react': icons,
    'next/dynamic': { default: (load, options) => {
      const Component = () => null;
      deferred.push({ Component, load, options });
      return Component;
    } },
    '@/lib/tree-read-model.mjs': { treeRefreshFailure: () => assert.fail('Unexpected read failure') },
    '@/lib/member-network-reader.mjs': { createMemberNetworkReader: () => ({
      refresh: async () => { events.push('reads-started'); },
      changeDepth: async () => {},
      dispose: () => { events.push('disposed'); },
    }) },
    '@/components/panel/network/NetworkTabs': { default: empty, NETWORK_TABS: [...viewPaths.keys()].map(id => ({ id })) },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compile(source))(id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if ([...viewPaths.values()].includes(id)) { loaded.push(id); return { default: empty }; }
    if (id.startsWith('@/components/panel/network/')) return { default: empty };
    if (id === 'react/jsx-runtime') return require(id);
    assert.fail(`Unexpected test dependency: ${id}`);
  }, module, module.exports);
  return { tree: module.exports.default(), deferred, loaded, effects, events };
}

test('network view implementations are split out of the route entry without disabling server rendering', () => {
  const parsed = ts.createSourceFile('page.jsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  assert.equal(parsed.parseDiagnostics.length, 0);
  const imports = parsed.statements.filter(ts.isImportDeclaration).map(item => item.moduleSpecifier.text);
  for (const path of viewPaths.values()) assert.ok(!imports.includes(path), `${path} must not be eager`);
  assert.match(source, /dynamic\(\(\) => import\("@\/components\/panel\/network\/BinaryTreeView"\)/);
  assert.doesNotMatch(source, /ssr\s*:\s*false/);
  const { deferred, loaded } = networkView();
  assert.equal(deferred.length, 4);
  assert.deepEqual(loaded, [], 'rendering the loading shell must not load a view');
  assert.ok(deferred.every(item => Object.keys(item.options).join(',') === 'loading'));
});

test('only the selected view is mounted, including direct tab links and the invalid-tab fallback', () => {
  for (const [index, tab] of [...viewPaths.keys()].entries()) {
    const view = networkView({ query: `tab=${tab}` });
    const active = elements(view.tree).filter(item => view.deferred.some(candidate => candidate.Component === item.type));
    assert.equal(active.length, 1, tab);
    assert.equal(active[0].type, view.deferred[index].Component, tab);
    assert.deepEqual(active[0].props.nodes, []);
  }
  const invalid = networkView({ query: 'tab=unknown' });
  assert.ok(elements(invalid.tree).some(item => item.type === invalid.deferred[0].Component));
});

test('the initial selected chunk warms alongside reads, without warming unselected views', async () => {
  for (const tab of viewPaths.keys()) {
    const view = networkView({ query: `tab=${tab}`, loading: true });
    assert.match(renderToStaticMarkup(view.tree), /Cargando tu posición en la red/);
    const cleanup = view.effects[1]();
    assert.deepEqual(view.events, ['reads-started'], tab);
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(view.loaded, [viewPaths.get(tab)], tab);
    cleanup();
    assert.deepEqual(view.events, ['reads-started', 'disposed']);
  }
});

test('the deferred view fallback is visible, accessible and reserves workspace height', () => {
  const { deferred } = networkView();
  for (const item of deferred) {
    const html = renderToStaticMarkup(React.createElement(item.options.loading));
    assert.match(html, /role="status"/);
    assert.match(html, /aria-busy="true"/);
    assert.match(html, /min-h-80/);
    assert.match(html, /Cargando vista de la red/);
    assert.doesNotMatch(html, /Synthetic member|Disponible|Activo|\$0/);
  }
});

test('overview network action uses a client transition and preserves its existing destination', () => {
  const overviewSource = readFileSync(new URL('../../../components/panel/overview/OverviewDashboard.jsx', import.meta.url), 'utf8');
  const pushed = [], components = new Map();
  const snapshots = [{}, { positioned: true, tree: [{ level: 1, name: 'Synthetic child', status: 'active' }] }, 'ready', 'ready', { summary: null, network: null }];
  let stateIndex = 0;
  const mocks = {
    react: { useCallback: fn => fn, useEffect: () => {}, useRef: current => ({ current }), useState: () => [snapshots[stateIndex++], () => {}] },
    'next/link': { default: empty },
    'next/navigation': { useRouter: () => ({ push: path => pushed.push(path) }) },
    'lucide-react': icons,
    '@/lib/member-read.mjs': {},
    '@/lib/payment-display.mjs': { formatPaymentMoney: () => 'Synthetic balance' },
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', compile(overviewSource))(id => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id === 'react/jsx-runtime') return require(id);
    if (id.startsWith('.') || id.startsWith('@/components/')) {
      const Component = () => null;
      components.set(id, Component);
      return { default: Component };
    }
    assert.fail(`Unexpected test dependency: ${id}`);
  }, module, module.exports);
  const tree = module.exports.default({});
  const recent = elements(tree).find(item => item.type === components.get('./RecentSignupsCard'));
  assert.ok(recent);
  recent.props.onSeeAll();
  assert.deepEqual(pushed, ['/dashboard/network']);
  assert.doesNotMatch(overviewSource, /window\.location\.assign/);
});
