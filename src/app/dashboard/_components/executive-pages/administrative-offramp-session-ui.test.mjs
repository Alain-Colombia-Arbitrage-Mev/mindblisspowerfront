import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import * as contract from '../../../../lib/administrative-offramp-session-contract.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';

const require = createRequire(import.meta.url), address = `0x${'1'.repeat(40)}`, reference = '11111111-1111-4111-8111-111111111111';
const options = { country: 'MX', destinationCurrencyCode: 'MXN', routes: [{ serviceProvider: 'TRANSAK', paymentMethods: [{ method: 'PAYOUT_TO_CARD', currencyCode: 'MXN', minimumAmount: 100, maximumAmount: 100000 }] }] };
const acknowledgement = { reference, sourceAmount: '100', destinationCurrencyCode: 'MXN', quotedDestinationAmount: 1900.25, checkoutUrl: 'https://sb.meldcrypto.com/?token=synthetic' };
const pending = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const all = (node, predicate) => [...(predicate(node) ? [node] : []), ...React.Children.toArray(node?.props?.children).flatMap(child => all(child, predicate))];
const action = (tree, key) => all(tree, node => node?.type === 'button' && React.Children.toArray(node.props.children).includes(translateMessage('es', `administrativeOfframp.${key}`)))[0];

function fixture(t, api = {}, search = '') {
  const cells = [], effects = [], calls = [], popups = [], opened = []; let cursor = 0, dirty = true, tree, attributes;
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { search }, open(url) {
    assert.equal(url, 'about:blank'); const popup = { closed: false, opener: {}, location: { replace(target) { opened.push(target); } }, close() { this.closed = true; } }; popups.push(popup); return popup;
  } } });
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'window', previous); else delete globalThis.window; });
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  const hooks = { useId: () => 'offramp-test', useRef(initial) { return cells[cursor++] ??= { current: initial }; },
    useState(initial) { const at = cursor++, cell = cells[at] ??= { value: typeof initial === 'function' ? initial() : initial };
      cell.set ??= update => { const next = typeof update === 'function' ? update(cell.value) : update; if (!Object.is(next, cell.value)) { cell.value = next; dirty = true; } }; return [cell.value, cell.set]; },
    useEffect(effect, deps) { const at = cursor++, cell = cells[at] ??= {}; if (changed(cell.deps, deps)) { cell.deps = deps; effects.push(() => { cell.cleanup?.(); cell.cleanup = effect(); }); } },
  };
  const mocks = { react: hooks, 'react/jsx-runtime': require('react/jsx-runtime'), 'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale: 'es', t: (key, vars) => translateMessage('es', key, vars) }) },
    '@/lib/member-session-context': {}, '@/lib/wallet-funding-owner.mjs': {}, '@/lib/administrative-offramp-client.mjs': {},
    '@/lib/administrative-offramp-session-contract.mjs': contract,
    '@/lib/administrative-offramp-session-client.mjs': { prepareAdministrativeOfframpSession: async (...args) => { calls.push({ action: 'prepare', args }); return api.prepare ? api.prepare(...args) : acknowledgement; },
      readAdministrativeOfframpSession: async (...args) => { calls.push({ action: 'status', args }); return api.status ? api.status(...args) : { reference, sourceAmount: '100', serviceProvider: 'TRANSAK', confirmation: { source: 'none', state: 'unconfirmed', testMode: true } }; },
      readAdministrativeOfframpSessionHistory: async (...args) => { calls.push({ action: 'history', args }); return api.history ? api.history(...args) : { records: [] }; } },
    './administrative-offramp.module.css': { default: new Proxy({}, { get: (_obj, key) => key }) },
  };
  const module = { exports: {} }, source = ts.transpileModule(readFileSync(new URL('./AdministrativeOfframpMethods.jsx', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', source)(key => { assert.ok(Object.hasOwn(mocks, key), `Unexpected SELL UI dependency: ${key}`); return mocks[key]; }, module, module.exports);
  assert.equal(typeof module.exports.OfframpExecution, 'function', 'Expose the pure UI boundary as a named export for regression testing');
  const render = (props = attributes) => { attributes = props; cursor = 0; dirty = false; tree = module.exports.OfframpExecution(props); return tree; };
  const flush = async () => { for (let count = 0, quiet = 0; count < 50; count++) { if (dirty) render(); while (effects.length) effects.shift()(); await new Promise(resolve => setImmediate(resolve));
    if (dirty || effects.length) quiet = 0; else if (++quiet === 2) return tree; } assert.fail('SELL UI did not settle'); };
  const stop = () => cells.forEach(cell => cell?.cleanup?.()); t.after(stop);
  return { render, flush, stop, calls, opened, popups, get tree() { return tree; } };
}
const props = overrides => ({ options, expectedAddress: address, disabled: false, signerReady: true, enabled: true, canPrepare: () => true, ...overrides });
async function ready(h, values = props()) {
  h.render(values); await h.flush();
  all(h.tree, node => node?.type === 'input')[0].props.onChange({ target: { value: '100' } }); await h.flush();
  all(h.tree, node => node?.type === 'select')[0].props.onChange({ target: { value: 'TRANSAK:PAYOUT_TO_CARD' } }); await h.flush();
}

test('SELL UI never prepares or reads automatically, even when a callback claims payment success', async t => {
  const h = fixture(t, {}, `?offrampReference=${reference}&paid=true&amount=999999`); h.render(props()); await h.flush();
  assert.equal(h.calls.length, 0); assert.equal(h.popups.length, 0); assert.ok(action(h.tree, 'refresh'));
  action(h.tree, 'refresh').props.onClick(); await h.flush(); assert.deepEqual(h.calls.map(call => call.action), ['status']);
  assert.deepEqual(h.calls[0].args.slice(0, 2), [reference, address]); await h.flush(); assert.equal(h.calls.length, 1);
});

test('a live parent expiry guard rejects a captured Prepare action before popup or POST', async t => {
  let allowed = true, rejected = 0; const h = fixture(t); await ready(h, props({ canPrepare: () => allowed, onSignerRequired: () => rejected++ }));
  const click = action(h.tree, 'prepare').props.onClick; allowed = false; click(); await h.flush();
  assert.equal(h.calls.length, 0); assert.equal(h.popups.length, 0); assert.equal(rejected, 1);
});

test('captured SELL Prepare/history actions perform zero transport after unmount', async t => {
  const h = fixture(t); await ready(h); const prepare = action(h.tree, 'prepare').props.onClick, history = action(h.tree, 'history').props.onClick;
  h.stop(); prepare(); history(); await new Promise(resolve => setImmediate(resolve)); assert.equal(h.calls.length, 0); assert.equal(h.popups.length, 0);
});

test('old amount and method callbacks cannot submit a previous selection after edits', async t => {
  const h = fixture(t); await ready(h); const click = action(h.tree, 'prepare').props.onClick;
  all(h.tree, node => node?.type === 'input')[0].props.onChange({ target: { value: '200' } }); await h.flush(); click(); await h.flush();
  assert.equal(h.calls.length, 0); assert.equal(h.popups.length, 0);
});

test('a captured route selection cannot prepare while its catalogue has been replaced or cleared', async t => {
  const h = fixture(t); await ready(h); const click = action(h.tree, 'prepare').props.onClick;
  h.render(props({ options: null })); await h.flush(); click(); await h.flush();
  assert.equal(h.calls.length, 0); assert.equal(h.popups.length, 0);
});

test('an in-flight SELL request is aborted and its blank window closed on a selection change or unmount', async t => {
  const operation = pending(), h = fixture(t, { prepare: () => operation.promise }); await ready(h);
  action(h.tree, 'prepare').props.onClick(); await h.flush(); assert.equal(h.calls.length, 1); assert.equal(h.popups.length, 1);
  all(h.tree, node => node?.type === 'input')[0].props.onChange({ target: { value: '200' } }); await h.flush();
  assert.equal(h.calls[0].args[2].signal.aborted, true); assert.equal(h.popups[0].closed, true);
  operation.resolve(acknowledgement); await h.flush(); assert.equal(h.opened.length, 0);
});

test('one explicit SELL click opens only its validated response after one manual request and never funds a provider', async t => {
  const operation = pending(), h = fixture(t, { prepare: () => operation.promise }); await ready(h);
  const click = action(h.tree, 'prepare').props.onClick; click(); click(); await h.flush(); assert.equal(h.calls.length, 1); assert.equal(h.popups.length, 1);
  assert.equal(h.popups[0].opener, null); const body = h.calls[0].args[0]; assert.equal(Object.keys(body).length, 6);
  assert.equal(body.amount, '100'); assert.equal(body.country, 'MX'); assert.equal(h.calls[0].args[1], address);
  operation.resolve(acknowledgement); await h.flush(); assert.deepEqual(h.opened, [acknowledgement.checkoutUrl]);
  assert.ok(renderToStaticMarkup(h.tree).includes(translateMessage('es', 'administrativeOfframp.noRealFunds'))); assert.equal(h.calls.length, 1);
});

test('a blocked provider window does not consume a sandbox preparation attempt', async t => {
  const h = fixture(t); await ready(h); window.open = () => null;
  action(h.tree, 'prepare').props.onClick(); await h.flush();
  assert.equal(h.calls.length, 0); assert.ok(renderToStaticMarkup(h.tree).includes(translateMessage('es', 'administrativeOfframp.popupBlocked')));
});

test('optional SELL reads require feature enabled but do not require local wallet permission or a signature', async t => {
  const h = fixture(t); h.render(props({ enabled: false, signerReady: false, canPrepare: () => false })); await h.flush();
  action(h.tree, 'history').props.onClick(); await h.flush(); assert.equal(h.calls.length, 0);
  h.render(props({ enabled: true, signerReady: false, canPrepare: () => false })); await h.flush(); action(h.tree, 'history').props.onClick(); await h.flush();
  assert.deepEqual(h.calls.map(call => call.action), ['history']); assert.equal(h.popups.length, 0);
});

test('a missing fiat quote does not become an invented zero-value payout estimate', async t => {
  const h = fixture(t, { prepare: async () => ({ ...acknowledgement, quotedDestinationAmount: null }) }); await ready(h); action(h.tree, 'prepare').props.onClick(); await h.flush();
  assert.ok(!renderToStaticMarkup(h.tree).includes('Importe estimado a recibir:'));
});

test('a failed fresh status read clears the old verified test result without polling or inventing a reversal', async t => {
  let count = 0; const h = fixture(t, { status: async () => {
    if (++count > 1) throw Error('administrative_offramp_unavailable');
    return { reference, sourceAmount: '100', serviceProvider: 'TRANSAK', destinationCurrencyCode: 'MXN', confirmation: { source: 'meld_sandbox_api', state: 'confirmed', testMode: true,
      destinationAmount: '1900.25', updatedAt: '2026-11-12T12:10:00.000Z' } };
  } }, `?offrampReference=${reference}`);
  h.render(props()); await h.flush(); action(h.tree, 'refresh').props.onClick(); await h.flush(); assert.ok(renderToStaticMarkup(h.tree).includes(translateMessage('es', 'administrativeOfframp.confirmed')));
  action(h.tree, 'refresh').props.onClick(); await h.flush(); assert.ok(!renderToStaticMarkup(h.tree).includes(translateMessage('es', 'administrativeOfframp.confirmed'))); assert.equal(count, 2);
  await h.flush(); assert.equal(count, 2);
});
