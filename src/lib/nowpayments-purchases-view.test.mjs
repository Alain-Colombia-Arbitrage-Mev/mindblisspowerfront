import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as RealAlertDialog from '@radix-ui/react-alert-dialog';
import ts from 'typescript';
import * as policy from './nowpayments-purchases.mjs';
import * as balances from './nowpayments-balances.mjs';
import * as checkoutPolicy from './checkout-policy.mjs';
import * as purchaseCheck from './nowpayments-purchase-check.mjs';
import * as checkoutIntent from './checkout-intent.mjs';

const require = createRequire(import.meta.url), orderId = 'a02f5a55-5fa3-4239-845b-ac6b699110ee', secondId = 'a02f5a55-5fa3-4239-845b-ac6b699110ef';
const icons = new Proxy({}, { get: () => () => React.createElement('svg', { 'aria-hidden': 'true' }) });
const cssModule = { default: new Proxy({}, { get: (_target, key) => String(key) }) };
const row = (change = {}) => ({ order_id: orderId, package_id: 1, package_name: 'Synthetic plan', total_usd: '100.00', fee_usd: '0.00',
  created_at: '2026-10-31T12:00:00Z', updated_at: '2026-10-31T12:00:00Z', payment_status: 'awaiting_payment',
  fulfillment_status: 'awaiting_payment', can_resume: true, can_cancel: true, cancelled_at: null, ...change });
const list = rows => ({ provider: 'nowpayments', purpose: 'membership', purchases: rows, has_more: false });
const receipt = (change = {}, id = orderId) => ({ provider: 'nowpayments', order_id: id, state: 'pending', payment_confirmed: false,
  signature_validated: false, provider_verified: false, persisted: false, fulfillment_status: 'awaiting_payment', ...change });
const confirmedReceipt = (change = {}, id = orderId) => receipt({ state: 'completed', payment_confirmed: true,
  signature_validated: true, provider_verified: true, persisted: true, ...change }, id);
const settle = () => new Promise(resolve => setImmediate(resolve));
function hooks() {
  const states = [], refs = [], effects = []; let stateIndex, refIndex;
  return { reset() { stateIndex = refIndex = 0; }, states, refs, effects,
    react: { ...React, useState: initial => {
      const index = stateIndex++; if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    }, useRef: initial => { const index = refIndex++; return refs[index] || (refs[index] = { current: initial }); },
    useCallback: fn => fn, useEffect: effect => { if (!effects.length) effects.push(effect); }, useId: () => 'synthetic-checkout' },
  };
}
function loadComponent(relative, mocks) {
  const source = readFileSync(new URL(relative, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => Object.hasOwn(mocks, id) ? mocks[id] : id === 'lucide-react' ? icons
    : id.endsWith('.module.css') ? cssModule : id === '@/lib/utils' ? { cn: (...values) => values.filter(Boolean).join(' ') } : require(id), module, module.exports);
  return module.exports.default;
}
function nodes(tree) { return tree && typeof tree === 'object' ? [tree, ...React.Children.toArray(tree.props?.children).flatMap(nodes)] : []; }
const button = (tree, text) => nodes(tree).find(node => node.type === 'button' && node.props.children === text);
function historyView(overrides = {}) {
  const state = hooks(), calls = { reads: 0, resumes: [], cancels: [], statuses: [], summaryReloads: 0 };
  let data = list([row()]), failure = null;
  const component = loadComponent('../app/dashboard/packages/NOWPaymentsPurchases.jsx', { react: state.react,
    '@radix-ui/react-alert-dialog': { ...RealAlertDialog, Portal: ({ children }) => children },
    '@/lib/nowpayments-balances.mjs': balances,
    '@/lib/nowpayments-purchase-check.mjs': purchaseCheck,
    '@/lib/nowpayments-purchases.mjs': { ...policy,
      readNOWPaymentsPurchases: async () => { calls.reads++; if (failure) throw failure; return data; },
      resumeNOWPaymentsPurchase: async id => { calls.resumes.push(id); return { url: 'https://nowpayments.io/payment/?iid=12345' }; },
      cancelNOWPaymentsPurchase: async id => { calls.cancels.push(id); data = list([row({ payment_status: 'cancelled_local', can_resume: false, can_cancel: false, cancelled_at: '2026-10-31T12:01:00Z' })]); },
      ...overrides.purchaseMocks },
    '@/lib/nowpayments-receipt.mjs': { readNOWPaymentsReceipt: async id => { calls.statuses.push(id); return receipt({}, id); }, ...overrides.receiptMocks },
  });
  return { ...state, calls, setData: value => { data = value; }, fail: value => { failure = value; },
    tree() { state.reset(); return component({ onChange: () => { calls.summaryReloads++; } }); },
    async mount() { this.tree(); state.effects[0](); await settle(); },
  };
}

test('purchase history starts honestly, renders independent same-SKU memberships and uses only server-owned action capabilities', async () => {
  const view = historyView();
  let html = renderToStaticMarkup(view.tree());
  assert.match(html, /Consultando compras NOWPayments/); assert.doesNotMatch(html, /\$0|No hay compras/); assert.equal(view.calls.reads, 0);
  view.setData(list([row(), row({ order_id: secondId, payment_status: 'completed', fulfillment_status: 'activated', can_resume: false, can_cancel: false })]));
  await view.mount(); html = renderToStaticMarkup(view.tree());
  assert.match(html, /Historial de compras NOWPayments/); assert.match(html, /Membresía activada/);
  assert.equal((html.match(/Continuar pago<\/button>/g) || []).length, 1); assert.equal((html.match(/Cancelar intención<\/button>/g) || []).length, 1);
  assert.equal((html.match(/\$100\.00 USD/g) || []).length, 2); assert.ok(html.includes(orderId)); assert.ok(html.includes(secondId));
  assert.equal(view.calls.reads, 1); assert.deepEqual(view.calls.statuses, []); assert.deepEqual(view.calls.resumes, []); assert.deepEqual(view.calls.cancels, []);
});

test('failed history is never empty success, stale rows cannot be acted upon and denied sessions discard old private rows', async () => {
  const view = historyView(); await view.mount();
  view.fail(new Error('private@example.test')); await button(view.tree(), 'Actualizar historial').props.onClick(); await settle();
  let tree = view.tree(), html = renderToStaticMarkup(tree);
  assert.match(html, /role="alert"/); assert.match(html, /no confirman el estado actual/); assert.match(html, /Synthetic plan/);
  assert.doesNotMatch(html, /private@example|No hay compras/); assert.equal(button(tree, 'Continuar pago').props.disabled, true);
  view.fail(Object.assign(new Error('denied'), { status: 401 })); await button(view.tree(), 'Actualizar historial').props.onClick(); await settle();
  html = renderToStaticMarkup(view.tree()); assert.doesNotMatch(html, /Synthetic plan|Continuar pago|No hay compras/);
  const empty = historyView(); empty.setData(list([])); await empty.mount(); assert.match(renderToStaticMarkup(empty.tree()), /No hay compras de membresías NOWPayments registradas/);
});

test('cancel requires an accessible explicit confirmation and never changes a row optimistically or revokes the external invoice', async () => {
  let finish, cancellationCalls = 0;
  const waiting = new Promise(resolve => { finish = resolve; });
  const view = historyView({ purchaseMocks: { cancelNOWPaymentsPurchase: async () => { cancellationCalls++; await waiting; } } });
  await view.mount(); let focused = 0;
  button(view.tree(), 'Cancelar intención').props.onClick({ currentTarget: { focus: () => { focused++; } } });
  let tree = view.tree(), html = renderToStaticMarkup(tree);
  assert.match(html, /role="alertdialog"/); assert.match(html, /aria-labelledby=/); assert.match(html, /aria-describedby=/);
  assert.match(html, /La factura externa de NOWPayments no se puede borrar ni se revoca/);
  assert.match(html, /pago tardío requerirá revisión manual/); assert.match(html, /Si ya pagaste, no canceles/);
  assert.equal(cancellationCalls, 0, 'opening confirmation is not a mutation');
  const confirmation = button(tree, 'Confirmar cancelación local'); let prevented = 0;
  confirmation.props.onClick({ preventDefault() { prevented++; } });
  confirmation.props.onClick({ preventDefault() { prevented++; } });
  await settle(); assert.equal(cancellationCalls, 1); assert.equal(prevented, 2);
  html = renderToStaticMarkup(view.tree()); assert.match(html, /Pendiente de pago/); assert.doesNotMatch(html, /Intención cancelada localmente/);
  view.setData(list([row({ payment_status: 'cancelled_local', can_resume: false, can_cancel: false, cancelled_at: '2026-10-31T12:01:00Z' })]));
  finish(); await settle(); await settle();
  html = renderToStaticMarkup(view.tree()); assert.match(html, /Intención cancelada localmente/); assert.match(html, /factura externa no fue revocada/);
  assert.doesNotMatch(html, /role="alertdialog"|Continuar pago<\/button>|Cancelar intención<\/button>/);
  assert.equal(view.calls.reads, 2); assert.equal(focused, 0, 'focus callback is invoked only by Radix after a DOM close');
});

test('resume is explicit, reuses the owner invoice once and status reads cannot generate a checkout or turn payment receipt into activation', async () => {
  const originalWindow = globalThis.window, navigations = [];
  globalThis.window = { location: { assign: value => navigations.push(value) } };
  try {
    const view = historyView(); await view.mount();
    button(view.tree(), 'Continuar pago').props.onClick(); await settle();
    assert.deepEqual(view.calls.resumes, [orderId]); assert.deepEqual(navigations, ['https://nowpayments.io/payment/?iid=12345']);
    button(view.tree(), 'Ver estado').props.onClick(); await settle(); await settle();
    assert.deepEqual(view.calls.statuses, [orderId]); assert.equal(view.calls.summaryReloads, 0);
    assert.match(renderToStaticMarkup(view.tree()), /servidor todavía no confirma el pago/);
    const paid = historyView({ receiptMocks: { readNOWPaymentsReceipt: async () => confirmedReceipt() } });
    await paid.mount(); button(paid.tree(), 'Ver estado').props.onClick(); await settle(); await settle();
    assert.match(renderToStaticMarkup(paid.tree()), /membresía aún no figura activada; no vuelvas a pagar/); assert.equal(paid.calls.summaryReloads, 0);
    const active = historyView({ receiptMocks: { readNOWPaymentsReceipt: async () => confirmedReceipt({ fulfillment_status: 'activated' }) } });
    await active.mount(); button(active.tree(), 'Ver estado').props.onClick(); await settle(); await settle();
    assert.equal(active.calls.summaryReloads, 1); assert.match(renderToStaticMarkup(active.tree()), /No es una confirmación de rendimientos cobrados ni retiros/);
  } finally { if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; }
});

test('an uncertain cancellation keeps its dialog and old order, announcing a safe error inside the accessible confirmation', async () => {
  let mutations = 0;
  const view = historyView({ purchaseMocks: { cancelNOWPaymentsPurchase: async () => {
    mutations++; throw Object.assign(new Error('private postgres://password@host'), { code: 'purchase_cannot_cancel' });
  } } });
  await view.mount(); button(view.tree(), 'Cancelar intención').props.onClick({ currentTarget: null });
  button(view.tree(), 'Confirmar cancelación local').props.onClick({ preventDefault() {} }); await settle();
  const html = renderToStaticMarkup(view.tree());
  assert.match(html, /role="alertdialog"/); assert.match(html, /role="alert"/); assert.match(html, /No se puede cancelar esta intención en su estado actual/);
  assert.match(html, /Pendiente de pago/); assert.doesNotMatch(html, /Intención cancelada localmente|postgres|password|host/);
  assert.equal(mutations, 1); assert.equal(view.calls.reads, 1); assert.deepEqual(view.calls.resumes, []);
});

test('checkout retains a purchase UUID after an ambiguous failure, and a processed intention needs a separate explicit new-purchase action', async () => {
  const state = hooks(), bodies = [], originalFetch = globalThis.fetch, originalWindow = globalThis.window;
  const stored = new Map();
  globalThis.window = { sessionStorage: { getItem: key => stored.get(key) ?? null,
    setItem: (key, value) => { stored.set(key, value); }, removeItem: key => { stored.delete(key); } } };
  let code = 'upstream_unavailable';
  const Component = loadComponent('../app/dashboard/packages/ActivatePackageButton.jsx', { react: state.react,
    'lucide-react': { ArrowRight: () => null, Loader2: () => null }, '@/lib/referral-attribution': { referralForCheckout: () => ({ code: '', email: '' }) },
    '@/lib/member-session-context': { useMemberSession: () => null },
    '@/lib/checkout-policy.mjs': checkoutPolicy, '@/lib/checkout-intent.mjs': checkoutIntent,
    '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' ') } });
  const tree = () => { state.reset(); return Component({ packageId: 1, nowpaymentsEnabled: true }); };
  globalThis.fetch = async (target, options) => {
    if (target === '/api/auth/session') return Response.json({ authenticated: true, subject: 'synthetic-verified-owner', email: 'member@example.test' });
    assert.equal(target, '/api/payments/checkout'); bodies.push(JSON.parse(options.body)); return Response.json({ error: code }, { status: 409 });
  };
  const primary = value => nodes(value).find(node => node.type === 'button' && node.props.onClick?.name === 'activate');
  try {
    await primary(tree()).props.onClick(); await primary(tree()).props.onClick();
    assert.equal(bodies.length, 2); assert.equal(bodies[0].purchase_request_id, bodies[1].purchase_request_id);
    assert.equal(bodies[0].purchase_subject, 'synthetic-verified-owner');
    code = 'membership_purchase_already_processed'; await primary(tree()).props.onClick();
    assert.equal(bodies.length, 3); assert.equal(primary(tree()).props.disabled, true);
    const fresh = button(tree(), 'Iniciar otra compra de esta membresía'); assert.ok(fresh); fresh.props.onClick();
    assert.equal(bodies.length, 3, 'resetting the intent does not create or pay an invoice');
    code = 'upstream_unavailable'; await primary(tree()).props.onClick();
    assert.equal(bodies.length, 4); assert.notEqual(bodies[3].purchase_request_id, bodies[0].purchase_request_id);
  } finally { globalThis.fetch = originalFetch; if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; }
});

test('history stays independent of recovered/loading/failed summary and no purchase action can submit customer money or provider URLs', () => {
  const source = readFileSync(new URL('../app/dashboard/packages/MyPaymentsPanel.jsx', import.meta.url), 'utf8');
  assert.equal((source.match(/<NOWPaymentsPurchases onChange=\{load\}/g) || []).length, 1);
  assert.doesNotMatch(source, /!recovered\s*&&\s*<NOWPaymentsPurchases/);
  const view = readFileSync(new URL('../app/dashboard/packages/NOWPaymentsPurchases.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(view, /\/api\/payments\/checkout|purchase_request_id|setInterval|localStorage|sessionStorage/);
});

test('history action names identify same-SKU orders and server capabilities remain authoritative in review states', async () => {
  const view = historyView();
  view.setData(list([row({ payment_status: 'under_review', can_resume: false, can_cancel: true }),
    row({ order_id: secondId, payment_status: 'completed', fulfillment_status: 'activated', can_resume: false, can_cancel: false })]));
  await view.mount();const tree=view.tree(),html=renderToStaticMarkup(tree);
  assert.equal((html.match(/>Cancelar intención<\/button>/g)||[]).length,1);
  assert.doesNotMatch(html,/>Continuar pago<\/button>/);
  for (const id of [orderId,secondId]) assert.ok(html.includes(`aria-label="Consultar estado de Synthetic plan, orden ${id}"`));
  assert.ok(html.includes(`aria-label="Cancelar intención de Synthetic plan, orden ${orderId}"`));
  assert.match(html,/<ul[^>]*role="list"/);assert.equal((html.match(/<article[^>]*aria-label="Compra de Synthetic plan"/g)||[]).length,2);
  const references=nodes(tree).filter(node=>node.type==='details');assert.equal(references.length,2);
  for(const reference of references) {
    assert.notEqual(reference.props.open,true,'long references start collapsed, not hidden behind a custom inaccessible control');
    assert.ok(React.Children.toArray(reference.props.children).some(child=>child.type==='summary'));
  }
  assert.equal((html.match(/<time dateTime="2026-10-31T12:00:00Z"/g)||[]).length,2);
  for(const element of nodes(tree).filter(node=>node.type==='button')) assert.equal(element.props.type,'button');
  assert.deepEqual(view.calls.resumes,[]);assert.deepEqual(view.calls.cancels,[]);assert.deepEqual(view.calls.statuses,[]);
});

const orderButton = (tree, action, id = orderId) => nodes(tree).find(node => node.type === 'button'
  && node.props['aria-label'] === `${action} de Synthetic plan, orden ${id}`);
const orderArticle = (tree, id = orderId) => nodes(tree).find(node => node.type === 'article'
  && nodes(node).some(child => child.type === 'code' && child.props.children === id));

test('status checking announces progress and its timestamp inline for only the selected same-SKU order, with no duplicate requests or payment mutation', async () => {
  let finish, reads = 0;
  const pending = new Promise(resolve => { finish = resolve; });
  const view = historyView({ receiptMocks: { readNOWPaymentsReceipt: async id => {
    reads++; assert.equal(id, secondId); await pending; return receipt({}, id);
  } } });
  view.setData(list([row(), row({ order_id: secondId })])); await view.mount();
  const initial = view.tree(), check = orderButton(initial, 'Consultar estado', secondId);
  assert.equal(check.props['aria-describedby'], undefined);
  check.props.onClick(); check.props.onClick();
  let tree = view.tree(), first = renderToStaticMarkup(orderArticle(tree)), second = renderToStaticMarkup(orderArticle(tree, secondId));
  assert.equal(reads, 1); assert.match(second, /Consultando estado de esta compra/);
  assert.match(second, /No se está iniciando ni repitiendo un pago/); assert.match(second, /role="status"/);
  assert.equal(orderButton(tree, 'Consultar estado', secondId).props['aria-busy'], true);
  assert.equal(orderButton(tree, 'Consultar estado', secondId).props['aria-describedby'], `payment-check-${secondId}`);
  assert.doesNotMatch(first, /payment-check-|Consultando estado de esta compra|Consulta realizada/);
  const before = Date.now(); finish(); await settle(); await settle();
  tree = view.tree(); first = renderToStaticMarkup(orderArticle(tree)); second = renderToStaticMarkup(orderArticle(tree, secondId));
  assert.match(second, /Pendiente de confirmación/); assert.match(second, /servidor todavía no confirma el pago/);
  assert.match(second, /Estado registrado por el servidor; no es una consulta en vivo a NOWPayments/);
  assert.match(second, /Consulta realizada:/); assert.match(second, /\(Bogotá\).*Esta no es la fecha del pago/s);
  assert.ok(second.includes(`id="payment-check-${secondId}"`)); assert.match(second, /aria-atomic="true"/);
  const times = [...second.matchAll(/<time dateTime="([^"]+)"/g)].map(match => match[1]);
  assert.equal(times[0], row().created_at); assert.equal(times.length, 2);
  assert.ok(Date.parse(times[1]) >= before && Date.parse(times[1]) <= Date.now());
  assert.doesNotMatch(first, /payment-check-|Pendiente de confirmación|Consulta realizada/);
  assert.match(first, /Pendiente de pago/); assert.match(second, /Pendiente de pago/);
  assert.equal(reads, 1); assert.equal(view.calls.reads, 2); assert.equal(view.calls.summaryReloads, 0);
  assert.deepEqual(view.calls.resumes, []); assert.deepEqual(view.calls.cancels, []);
});

test('a verified paid result blocks stale-history payment actions through refresh and later query errors without rewriting the stored badge or inventing activation', async () => {
  let statusCalls = 0;
  const view = historyView({ receiptMocks: { readNOWPaymentsReceipt: async () => {
    if (++statusCalls === 1) return confirmedReceipt();
    throw new DOMException('private diagnostic must-not-leak', 'TimeoutError');
  } } });
  await view.mount(); orderButton(view.tree(), 'Consultar estado').props.onClick(); await settle(); await settle();
  let tree = view.tree(), html = renderToStaticMarkup(orderArticle(tree));
  assert.match(html, /Pago confirmado · activación pendiente/); assert.match(html, /membresía aún no figura activada/);
  assert.match(html, /Pendiente de pago/, 'the fresh receipt is separate from the unchanged historical badge');
  assert.doesNotMatch(html, /Membresía activada/); assert.equal(view.calls.summaryReloads, 0);
  assert.equal(orderButton(tree, 'Continuar pago').props.disabled, true);
  assert.equal(orderButton(tree, 'Cancelar intención').props.disabled, true);
  orderButton(tree, 'Continuar pago').props.onClick(); await settle(); assert.deepEqual(view.calls.resumes, []);
  button(tree, 'Actualizar historial').props.onClick(); await settle();
  assert.equal(orderButton(view.tree(), 'Continuar pago').props.disabled, true);
  orderButton(view.tree(), 'Consultar estado').props.onClick(); await settle();
  tree = view.tree(); html = renderToStaticMarkup(orderArticle(tree));
  assert.match(html, /La consulta tardó demasiado/); assert.match(html, /role="alert"/);
  assert.doesNotMatch(html, /must-not-leak|private diagnostic|Consulta realizada:/);
  assert.equal(orderButton(tree, 'Continuar pago').props.disabled, true);
  assert.equal(orderButton(tree, 'Cancelar intención').props.disabled, true);
  assert.equal(orderButton(tree, 'Consultar estado').props.disabled, false);
  assert.equal(view.calls.summaryReloads, 0); assert.equal(statusCalls, 2);
  assert.deepEqual(view.calls.resumes, []); assert.deepEqual(view.calls.cancels, []);
});

test('query failures remain local, specific and non-financial while denied sessions erase previous private rows and query results', async () => {
  const cases = [
    [{ status: 404 }, /No pudimos consultar esta compra/, /Esto no confirma si el pago se realizó/],
    [{ status: 429, retryAfterMs: 60000 }, /Demasiadas consultas/, /este límite no indica el estado del pago/],
    [{ name: 'TimeoutError' }, /La consulta tardó demasiado/, /no repitas el pago por este error/],
    [{ name: 'AbortError' }, /La consulta tardó demasiado/, /no repitas el pago por este error/],
    [{ status: 503 }, /Estado temporalmente no disponible/, /No vuelvas a pagar sin comprobarlo/],
  ];
  for (const [metadata, title, description] of cases) {
    let requests = 0;
    const view = historyView({ receiptMocks: { readNOWPaymentsReceipt: async () => {
      requests++; throw Object.assign(new Error('postgres://private:secret@host must-not-leak'), metadata);
    } } });
    await view.mount(); orderButton(view.tree(), 'Consultar estado').props.onClick(); await settle();
    const tree = view.tree(), article = renderToStaticMarkup(orderArticle(tree));
    assert.match(article, title); assert.match(article, description); assert.match(article, /role="alert"/);
    assert.match(article, /La consulta no confirma el estado del pago/);
    assert.doesNotMatch(article, /private|secret|must-not-leak|Consulta realizada:|Membresía activada/);
    assert.equal(orderButton(tree, 'Consultar estado').props.disabled, false);
    assert.equal(requests, 1); assert.equal(view.calls.reads, 1); assert.equal(view.calls.summaryReloads, 0);
    assert.deepEqual(view.calls.resumes, []); assert.deepEqual(view.calls.cancels, []);
  }
  for (const status of [401, 403]) {
    let requests = 0;
    const view = historyView({ receiptMocks: { readNOWPaymentsReceipt: async () => {
      if (++requests === 1) return receipt();
      throw Object.assign(new Error('must-not-leak'), { status });
    } } });
    await view.mount(); orderButton(view.tree(), 'Consultar estado').props.onClick(); await settle(); await settle();
    assert.match(renderToStaticMarkup(view.tree()), /Consulta realizada:/);
    orderButton(view.tree(), 'Consultar estado').props.onClick(); await settle();
    const html = renderToStaticMarkup(view.tree());
    assert.match(html, /role="alert"/); assert.match(html, /Vuelve a iniciar sesión/);
    assert.doesNotMatch(html, /Synthetic plan|payment-check-|Consulta realizada:|must-not-leak|Continuar pago/);
  }
});

test('invalid, cross-order or unsigned activation claims cannot create an inline paid success or change historical action capabilities', async () => {
  for (const value of [confirmedReceipt({ fulfillment_status: 'activated', signature_validated: false }),
    confirmedReceipt({ fulfillment_status: 'activated' }, secondId),
    { received: true, mode: 'capture_only', state: 'captured', fulfillment_status: 'not_activated' }]) {
    const view = historyView({ receiptMocks: { readNOWPaymentsReceipt: async () => value } });
    await view.mount(); orderButton(view.tree(), 'Consultar estado').props.onClick(); await settle();
    const tree = view.tree(), html = renderToStaticMarkup(orderArticle(tree));
    assert.match(html, /Estado temporalmente no disponible/); assert.match(html, /role="alert"/);
    assert.match(html, /Pendiente de pago/); assert.doesNotMatch(html, /Membresía activada|Pago confirmado ·|Consulta realizada:/);
    assert.equal(orderButton(tree, 'Continuar pago').props.disabled, false);
    assert.equal(view.calls.summaryReloads, 0); assert.equal(view.calls.reads, 1);
  }
});

test('a cancelled intention keeps its no-pay warning and disabled server capabilities when its status requires security review', async () => {
  const view = historyView({ receiptMocks: { readNOWPaymentsReceipt: async () => receipt({ state: 'under_review', fulfillment_status: 'security_blocked' }) } });
  view.setData(list([row({ payment_status: 'cancelled_local', can_resume: false, can_cancel: false, cancelled_at: '2026-10-31T12:01:00Z' })]));
  await view.mount(); orderButton(view.tree(), 'Consultar estado').props.onClick(); await settle(); await settle();
  const tree = view.tree(), html = renderToStaticMarkup(orderArticle(tree));
  assert.match(html, /Intención cancelada localmente/); assert.match(html, /Compra en revisión/);
  assert.match(html, /No pagues la factura anterior/); assert.match(html, /no uses los enlaces de la factura anterior/);
  assert.equal(orderButton(tree, 'Continuar pago'), undefined); assert.equal(orderButton(tree, 'Cancelar intención'), undefined);
  assert.equal(view.calls.summaryReloads, 0); assert.deepEqual(view.calls.resumes, []); assert.deepEqual(view.calls.cancels, []);
});

test('a stale history after 503 still permits the safe owner-status read but never enables payment mutations or presents the old badge as fresh proof', async () => {
  const view = historyView(); await view.mount();
  view.fail(Object.assign(new Error('private unavailable diagnostic'), { status: 503 }));
  button(view.tree(), 'Actualizar historial').props.onClick(); await settle();
  let tree = view.tree();
  assert.equal(orderButton(tree, 'Consultar estado').props.disabled, false);
  assert.equal(orderButton(tree, 'Continuar pago').props.disabled, true);
  assert.equal(orderButton(tree, 'Cancelar intención').props.disabled, true);
  orderButton(tree, 'Consultar estado').props.onClick(); await settle(); await settle();
  tree = view.tree(); const html = renderToStaticMarkup(orderArticle(tree));
  assert.match(html, /Estado del historial/); assert.match(html, /Pendiente de pago/);
  assert.match(html, /Pendiente de confirmación/); assert.match(html, /Consulta realizada:/);
  assert.match(renderToStaticMarkup(tree), /Los registros anteriores, si aparecen, no confirman el estado actual/);
  assert.doesNotMatch(renderToStaticMarkup(tree), /private unavailable diagnostic|Membresía activada/);
  assert.equal(orderButton(tree, 'Consultar estado').props.disabled, false);
  assert.equal(orderButton(tree, 'Continuar pago').props.disabled, true);
  assert.equal(orderButton(tree, 'Cancelar intención').props.disabled, true);
  assert.deepEqual(view.calls.statuses, [orderId]); assert.equal(view.calls.reads, 3); assert.equal(view.calls.summaryReloads, 0);
  assert.deepEqual(view.calls.resumes, []); assert.deepEqual(view.calls.cancels, []);
});
