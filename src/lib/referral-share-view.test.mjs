import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { translateMessage } from '../i18n/translate.mjs';
import { renderToStaticMarkup } from 'react-dom/server';
import { registrationViewHarness, findRegistrationNode as find } from '../app/register/registration-view-test-harness.mjs';
import * as links from './referral-links.mjs';
import * as effects from './member-view-effects.mjs';

const data = { positioned: false, code: 'OpaqueHandle', link: 'https://app.mindblisspower.com/register?ref=wrong',
  links: { left: 'https://old.example/left', right: 'https://old.example/right' } };
const icons = new Proxy({}, { get: () => () => null });
const motion = new Proxy({}, { get: () => ({ children }) => React.createElement('div', null, children) });
const button = (tree, label) => find(tree, node => node?.type === 'button'
  && React.Children.toArray(node.props.children).some(child => child?.props?.children === label));
const flush = () => new Promise(resolve => setImmediate(resolve));

function navigator(t, writeText) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText } } });
  t.after(() => { if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor); else delete globalThis.navigator; });
}

function view(filename, referralState = { data, error: null, busy: false, canShare: () => true, refresh() {} }) {
  return registrationViewHarness(`../../components/${filename}`, {
    'next/link': { default: ({ children, ...attributes }) => React.createElement('a', attributes, children) },
    'lucide-react': icons, 'framer-motion': { motion, AnimatePresence: ({ children }) => children },
    '@/lib/referral-links.mjs': links, '@/lib/member-view-effects.mjs': effects,
    '@/components/member/useMemberReferral': { default: () => referralState },
    './useMemberReferral': { default: () => referralState },
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale: 'es', t: (key, values) => translateMessage('es', key, values) }) },
  });
}

test('overview copies a canonical code before positioning and reports a denied clipboard instead of claiming success', async t => {
  const copied = [];
  navigator(t, async value => { copied.push(value); });
  const harness = view('panel/overview/ReferralLinkCard.jsx');
  harness.render(); await flush();
  await find(harness.render(), node => node?.props?.label === 'Enlace automático').props.onCopy();
  assert.equal(copied.at(-1), links.buildReferralLink(data.code));
  globalThis.navigator.clipboard.writeText = async () => { throw new Error('private-clipboard-detail'); };
  await find(harness.render(), node => node?.props?.label === 'Enlace automático').props.onCopy();
  const html = renderToStaticMarkup(harness.render());
  assert.match(html, /role="alert"/); assert.match(html, /manualmente/);
  assert.doesNotMatch(html, /private-clipboard-detail|old\.example|app\.mindblisspower/);
  harness.unmount();
});

test('the tree position card never reports copied after clipboard rejection and does not share an obsolete API URL', async t => {
  navigator(t, async () => { throw new Error('private-copy-denial'); });
  const harness = view('panel/network/PositionCard.jsx'), props = { referral: data };
  const tree = harness.render(props);
  await find(tree, node => node?.type === 'button' && typeof node.props.onClick === 'function').props.onClick();
  const html = renderToStaticMarkup(harness.render(props));
  assert.match(html, /mindblisspower\.com\/register\?ref=OpaqueHandle/);
  assert.match(html, /manualmente/); assert.doesNotMatch(html, /Copiado|private-copy-denial|app\.mindblisspower/);
  harness.unmount();
});

test('the share modal uses one automatic link for clipboard, WhatsApp and email without trusting a supplied URL', async t => {
  const copied = [], opened = [], previous = globalThis.window;
  globalThis.window = { location: { origin: 'https://mindblisspower.com' }, open: (...args) => opened.push(args) };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  navigator(t, async value => { copied.push(value); });
  const harness = view('member/ReferralShareModal.jsx'), props = { isOpen: true, onClose() {}, code: data.code, link: 'https://evil.example?email=private@example.test' };
  await button(harness.render(props), 'Copiar Enlace').props.onClick();
  assert.deepEqual(copied, [links.buildReferralLink(data.code)]);
  button(harness.render(props), 'WhatsApp').props.onClick();
  button(harness.render(props), 'Email').props.onClick();
  assert.equal(opened.length, 2);
  for (const [url, target, features] of opened) {
    const destination = new URL(url), message = destination.searchParams.get(destination.protocol === 'mailto:' ? 'body' : 'text');
    assert.match(message, /automáticamente tu posición/); assert.doesNotMatch(message, /[?&]side=/);
    assert.doesNotMatch(message, /evil\.example|private@example/);
    assert.equal(target, '_blank'); assert.equal(features, 'noopener,noreferrer');
  }
  assert.doesNotMatch(renderToStaticMarkup(harness.render(props)), /evil\.example|private@example/);
  harness.unmount();
});

test('a rejected code copy in the share modal has a visible manual-copy fallback without a false confirmation', async t => {
  navigator(t, async () => { throw new Error('private-rejection'); });
  const harness = view('member/ReferralShareModal.jsx'), props = { isOpen: true, code: data.code, side: 'left', onClose() {} };
  await find(harness.render(props), node => node?.props?.['aria-label'] === 'Copiar código').props.onClick();
  const html = renderToStaticMarkup(harness.render(props));
  assert.match(html, /manualmente/); assert.doesNotMatch(html, /Copiado|private-rejection/);
  harness.unmount();
});


test('community keeps its own canonical unpositioned link copyable after a reported transient refresh failure', async t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('presentation delegates reads to the shared hook'));
  const copied = []; let refreshes = 0;
  navigator(t, async value => { copied.push(value); });
  const state = { data, busy: false, error: { status: 503 }, canShare: () => true, refresh() { refreshes++; } };
  const harness = view('../app/dashboard/_components/executive-pages/CommunityInviteCard.jsx', state);
  const tree = harness.render();
  const copy = find(tree, node => node?.type === 'button' && node.props.className.includes('mb-community-copy'));
  assert.equal(copy.props.disabled, false); await copy.props.onClick();
  assert.deepEqual(copied, [links.buildReferralLink(data.code)]);
  const html = renderToStaticMarkup(harness.render());
  assert.match(html, /OpaqueHandle/); assert.ok(html.includes(translateMessage('es', 'referralCard.refreshFailed')));
  assert.doesNotMatch(html, /old\.example|app\.mindblisspower|ref=wrong/);
  find(tree, node => node?.type === 'button' && node.props.className === 'mb-community-refresh').props.onClick();
  assert.equal(refreshes, 1); harness.unmount();
});

test('the referral module presents an unpositioned backend code as copyable without sessions, placement or financial actions', t => {
  t.mock.method(globalThis, 'fetch', () => assert.fail('a referral presentation cannot perform its own API or provider request'));
  const require = createRequire(import.meta.url), module = { exports: {} };
  const compiled = ts.transpileModule(readFileSync(new URL('../components/member/ReferralModule.jsx', import.meta.url), 'utf8'),
    { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const mocks = { react: React, 'react/jsx-runtime': require('react/jsx-runtime'), 'lucide-react': icons,
    'framer-motion': { motion }, './ReferralShareModal': { default: () => null },
    './useMemberReferral': { default: () => ({ data, busy: false, error: null, canShare: () => true, refresh() {} }) },
    '@/lib/member-view-effects.mjs': effects, '@/lib/referral-links.mjs': links,
    '@/i18n/LanguageProvider': { useI18n: () => ({ t: (key, values) => translateMessage('es', key, values) }) } };
  new Function('require', 'module', 'exports', compiled)(id => {
    assert.ok(Object.hasOwn(mocks, id), `referral presentation unexpectedly imported ${id}`); return mocks[id];
  }, module, module.exports);
  const html = renderToStaticMarkup(React.createElement(module.exports.default));
  assert.match(html, /OpaqueHandle/); assert.match(html, /register\?ref=OpaqueHandle/);
  for (const label of ['Copiar código', 'Copiar', 'Compartir']) {
    const button = [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(match => match[0]).find(value => value.includes(label));
    assert.ok(button, label); assert.doesNotMatch(button, /disabled/);
  }
  assert.doesNotMatch(html, /old\.example|app\.mindblisspower|ref=wrong/);
});


test('captured referral copy callbacks cannot expose a retired owner after the shared live share fence closes', async t => {
  const copied = []; navigator(t, async value => { copied.push(value); });
  for (const filename of ['panel/overview/ReferralLinkCard.jsx', '../app/dashboard/_components/executive-pages/CommunityInviteCard.jsx']) {
    let allowed = true;
    const harness = view(filename, { data, busy: false, error: null, canShare: () => allowed, refresh() {} });
    const tree = harness.render();
    const callback = filename.includes('ReferralLinkCard')
      ? find(tree, node => node?.props?.label === 'Enlace automático').props.onCopy
      : find(tree, node => node?.type === 'button' && node.props.className.includes('mb-community-copy')).props.onClick;
    allowed = false;
    await callback(); assert.deepEqual(copied, [], filename);
    harness.unmount();
  }
});
