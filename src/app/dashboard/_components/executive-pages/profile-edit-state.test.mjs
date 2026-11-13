import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { getCountries } from 'libphonenumber-js/min';
import * as profileModel from '../../profile/profile-model.mjs';
import * as deadline from '../../../../lib/browser-request-deadline.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';

const require = createRequire(import.meta.url), owner = { subject: 'owner-A', email: 'owner@example.test', name: 'Cached Session Name', referralCode: 'UNCONFIRMED-SESSION' };
const stored = { name: 'Persona Prueba', phone: '+525551234567', country: 'México', payout_wallet_usdc: '', sponsor_name: 'Patrocinador Real', sponsor_referral_code: 'SPONSOR-CANONICAL', referral_code: 'OWN-CANONICAL' };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const all = node => [node, ...React.Children.toArray(node?.props?.children).flatMap(all), ...React.Children.toArray(node?.props?.action).flatMap(all)];
const input = (tree, name) => all(tree).find(node => node?.type === 'input' && node.props.autoComplete === name);
const save = tree => all(tree).find(node => node?.type === 'button' && node.props.children === translateMessage('es', 'profilePage.saveChanges'));
function fixture(t, { api = async () => stored, exportName = 'ProfileDashboardView' } = {}) {
  const cells = [], effects = [], calls = [], events = []; let cursor = 0, dirty = true, tree, attributes, session = owner;
  const changed = (a, b) => !a || !b || a.length !== b.length || a.some((value, i) => !Object.is(value, b[i]));
  const hooks = { useRef(initial) { return cells[cursor++] ??= { current: initial }; }, useState(initial) {
    const at = cursor++, cell = cells[at] ??= { value: typeof initial === 'function' ? initial() : initial };
    cell.set ??= update => { const next = typeof update === 'function' ? update(cell.value) : update; if (!Object.is(next, cell.value)) { cell.value = next; dirty = true; } }; return [cell.value, cell.set]; },
    useCallback(callback, deps) { const at = cursor++, cell = cells[at] ??= {}; if (changed(cell.deps, deps)) { cell.deps = deps; cell.value = callback; } return cell.value; },
    useEffect(callback, deps) { const at = cursor++, cell = cells[at] ??= {}; if (changed(cell.deps, deps)) { cell.deps = deps; effects.push(() => { cell.cleanup?.(); cell.cleanup = callback(); }); } },
  };
  function Field({ children, label }) { return React.createElement('label', null, label, children); }
  function PageHeader({ title, action }) { return React.createElement('header', null, React.createElement('h1', null, title), action); }
  const mocks = { react: hooks, 'react/jsx-runtime': require('react/jsx-runtime'), 'libphonenumber-js/min': { getCountries },
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) }, 'lucide-react': new Proxy({}, { get: () => () => null }),
    '@/lib/member-session-context': { useMemberSession: () => session }, '@/lib/payment-display.mjs': { formatPaymentMoney: () => null },
    '../../profile/profile-model.mjs': { ...profileModel, requestProfile: async (...args) => { calls.push(args); return api(...args); } },
    '@/lib/browser-request-deadline.mjs': deadline, './executive-ui': { Field, PageHeader, StatusPill: ({ children }) => children },
    './member-defaults.mjs': { member: { email: '', referralCode: '', rank: '', joined: '', plan: '', username: '', sponsor: 'STATIC-MUST-NOT-SHOW' } },
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale: 'es', t: (key, values) => translateMessage('es', key, values) }) },
  };
  t.mock.method(globalThis, 'fetch', async path => { assert.equal(path, '/api/payments/me', 'No OTP, payment mutation or additional contact reads allowed'); return Response.json({}); });
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'window'); Object.defineProperty(globalThis, 'window', { configurable: true, value: { dispatchEvent: event => events.push(event) } });
  t.after(() => { if (saved) Object.defineProperty(globalThis, 'window', saved); else delete globalThis.window; });
  const module = { exports: {} }, code = ts.transpileModule(readFileSync(new URL('./ProfileDashboardPage.jsx', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', code)(name => { assert.ok(Object.hasOwn(mocks, name), name); return mocks[name]; }, module, module.exports);
  const render = (props = attributes) => { attributes = props; cursor = 0; dirty = false; tree = module.exports[exportName](props); return tree; };
  const flush = async () => { for (let count = 0, quiet = 0; count < 50; count++) { if (dirty) render(); while (effects.length) effects.shift()(); await new Promise(resolve => setImmediate(resolve));
    if (dirty || effects.length) quiet = 0; else if (++quiet === 2) return tree; } assert.fail('Profile did not settle'); };
  const stop = () => cells.forEach(cell => cell?.cleanup?.()); t.after(stop);
  return { render, flush, stop, calls, events, get tree() { return tree; }, owner(next) { session = next; return render(); } };
}
const viewProps = () => ({ authMode: 'better-auth', session: owner });

test('profile keeps full name and international phone editable after the owned GET, with canonical sponsor and referral only', async t => {
  const h = fixture(t); h.render(viewProps()); assert.equal(input(h.tree, 'name').props.disabled, true); await h.flush();
  assert.equal(input(h.tree, 'name').props.disabled, false); assert.equal(input(h.tree, 'tel').props.disabled, false);
  assert.equal(input(h.tree, 'tel').props.value, stored.phone); assert.equal(save(h.tree).props.disabled, true);
  assert.equal(h.calls[0][2].subject, owner.subject);
  const html = renderToStaticMarkup(h.tree); assert.ok(html.includes(stored.name)); assert.ok(html.includes(stored.sponsor_name)); assert.ok(html.includes(stored.sponsor_referral_code));
  assert.ok(html.includes(stored.referral_code)); assert.ok(!html.includes('Cached Session Name')); assert.ok(!html.includes('UNCONFIRMED-SESSION')); assert.ok(!html.includes('STATIC-MUST-NOT-SHOW'));
  assert.ok(!html.includes('Enviar SMS')); assert.equal(h.calls.length, 1);
});

test('native profile form is keyed by subject and email; logout never keeps another account form mounted', async t => {
  const h = fixture(t, { exportName: 'ProfileDashboardPage' }); const first = h.render({ authMode: 'better-auth' });
  const second = h.owner({ ...owner, subject: 'owner-B' }); assert.notEqual(first.key, second.key);
  const anonymous = h.owner(null); assert.equal(anonymous.type, 'section'); assert.ok(!all(anonymous).some(node => node?.type?.name === 'ProfileDashboardView')); await h.flush(); assert.equal(h.calls.length, 0);
});

test('explicit name/phone save preserves digits and omits an unchanged legacy country and all referral/identity fields', async t => {
  const h = fixture(t, { api: async (method, body) => method === 'GET' ? stored : { ...stored, name: body.name, phone: body.phone } });
  h.render(viewProps()); await h.flush(); input(h.tree, 'name').props.onChange({ target: { value: 'Persona Nombre Completo' } }); await h.flush();
  input(h.tree, 'tel').props.onChange({ target: { value: '+52 (555) 765-4321' } }); await h.flush();
  assert.ok(renderToStaticMarkup(h.tree).includes(translateMessage('es', 'profilePage.unsavedChanges')));
  assert.ok(!renderToStaticMarkup(h.tree).includes('<h2 class="m-0 text-2xl font-bold" style="color:var(--vp-text)">Persona Nombre Completo</h2>'), 'Unsaved edits are not a committed identity label');
  save(h.tree).props.onClick(); await h.flush();
  assert.deepEqual(h.calls[1][1], { name: 'Persona Nombre Completo', phone: '+525557654321' }); assert.equal(h.calls.length, 2);
  assert.equal(h.calls[1][2].subject, owner.subject);
  assert.equal(input(h.tree, 'tel').props.value, '+525557654321'); assert.equal(save(h.tree).props.disabled, true);
  assert.ok(renderToStaticMarkup(h.tree).includes(translateMessage('es', 'profilePage.saved')));
});

test('a selected country is serialized as ISO2; an invalid national-only phone never issues a save or invents a prefix', async t => {
  const h = fixture(t); h.render(viewProps()); await h.flush();
  input(h.tree, 'tel').props.onChange({ target: { value: '5557654321' } }); await h.flush(); save(h.tree).props.onClick(); await h.flush(); assert.equal(h.calls.length, 1);
  input(h.tree, 'tel').props.onChange({ target: { value: '+525557654321' } }); await h.flush();
  all(h.tree).find(node => node?.type === 'select').props.onChange({ target: { value: 'MX' } }); await h.flush();
  save(h.tree).props.onClick(); await h.flush(); assert.deepEqual(h.calls[1][1], { name: stored.name, phone: '+525557654321', country: 'MX' });
});

test('failed save leaves the entered phone untouched and never claims success or repeats the request', async t => {
  const h = fixture(t, { api: async method => { if (method === 'GET') return stored; throw Error('profile_outcome_unconfirmed'); } });
  h.render(viewProps()); await h.flush(); input(h.tree, 'tel').props.onChange({ target: { value: '+525557654321' } }); await h.flush(); save(h.tree).props.onClick(); await h.flush();
  assert.equal(input(h.tree, 'tel').props.value, '+525557654321'); assert.ok(renderToStaticMarkup(h.tree).includes(translateMessage('es', 'profilePage.saveFailed')));
  assert.ok(!renderToStaticMarkup(h.tree).includes(translateMessage('es', 'profilePage.saved'))); await h.flush(); assert.equal(h.calls.length, 2);
});

test('full name accepts a real curly apostrophe but punctuation alone cannot issue a save', async t => {
  const h = fixture(t, { api: async (method, body) => method === 'GET' ? stored : { ...stored, name: body.name } }); h.render(viewProps()); await h.flush();
  for (const value of ['---', '...', '’']) {
    input(h.tree, 'name').props.onChange({ target: { value } }); await h.flush(); save(h.tree).props.onClick(); await h.flush(); assert.equal(h.calls.length, 1);
    assert.ok(renderToStaticMarkup(h.tree).includes(translateMessage('es', 'profilePage.nameInvalid')));
  }
  input(h.tree, 'name').props.onChange({ target: { value: 'Persona D’Angelo' } }); await h.flush(); save(h.tree).props.onClick(); await h.flush();
  assert.equal(h.calls.length, 2); assert.equal(h.calls[1][1].name, 'Persona D’Angelo');
});

test('old save handlers and unmounted views cannot submit prior owner values, and a pending save aborts on unmount', async t => {
  const pending = deferred(), h = fixture(t, { api: async method => method === 'GET' ? stored : pending.promise });
  h.render(viewProps()); await h.flush(); input(h.tree, 'name').props.onChange({ target: { value: 'Primer Cambio' } }); await h.flush(); const stale = save(h.tree).props.onClick;
  input(h.tree, 'tel').props.onChange({ target: { value: '+525557654321' } }); await h.flush(); stale(); await h.flush(); assert.equal(h.calls.length, 1);
  const current = save(h.tree).props.onClick; current(); current(); await h.flush(); assert.equal(h.calls.length, 2); h.stop(); assert.equal(h.calls[1][2].signal.aborted, true);
  pending.resolve({ ...stored, name: 'Primer Cambio', phone: '+525557654321' }); await h.flush(); current(); await h.flush(); assert.equal(h.calls.length, 2); assert.equal(h.events.length, 0);
});

test('a modern email-only context without a valid native subject cannot mount or load a private profile', async t => {
  const h = fixture(t, { exportName: 'ProfileDashboardPage' }); h.render({ authMode: 'better-auth' }); h.owner({ email: owner.email, name: owner.name }); await h.flush();
  assert.equal(h.calls.length, 0); assert.ok(!all(h.tree).some(node => node?.type?.name === 'ProfileDashboardView'));
  assert.equal(input(h.tree, 'name'), undefined);
});

test('a changed native cookie owner retires the old mounted form and forbids every captured save without automatic reload or retry', async t => {
  const h = fixture(t, { api: async method => {
    if (method === 'GET') return stored;
    throw Object.assign(Error('member_profile_owner_changed'), { status: 409 });
  } }); h.render(viewProps()); await h.flush();
  input(h.tree, 'tel').props.onChange({ target: { value: '+525557654321' } }); await h.flush(); const oldSave = save(h.tree).props.onClick;
  oldSave(); await h.flush(); assert.equal(h.calls.length, 2); assert.equal(h.calls[1][2].signal.aborted, true);
  const html = renderToStaticMarkup(h.tree); assert.ok(html.includes(translateMessage('es', 'profilePage.ownerChanged')));
  for (const oldValue of [stored.name, stored.phone, stored.sponsor_name, stored.sponsor_referral_code, stored.referral_code, owner.name]) assert.ok(!html.includes(oldValue));
  assert.equal(input(h.tree, 'name'), undefined); assert.equal(input(h.tree, 'tel'), undefined);
  assert.equal(all(h.tree).find(node => node?.type === 'a').props.href, '/dashboard/profile');
  oldSave(); await h.flush(); assert.equal(h.calls.length, 2); assert.equal(h.events.length, 0);
});

test('an owner mismatch on the initial native read reveals no stored form and does not request another owner automatically', async t => {
  const h = fixture(t, { api: async () => { throw Object.assign(Error('member_profile_owner_changed'), { status: 409 }); } });
  h.render(viewProps()); await h.flush(); assert.equal(h.calls.length, 1); assert.equal(h.calls[0][2].subject, owner.subject);
  assert.equal(input(h.tree, 'name'), undefined); assert.ok(renderToStaticMarkup(h.tree).includes(translateMessage('es', 'profilePage.reopenProfile')));
  await h.flush(); assert.equal(h.calls.length, 1);
});
