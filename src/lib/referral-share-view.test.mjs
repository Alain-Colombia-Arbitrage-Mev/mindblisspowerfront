import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registrationViewHarness, findRegistrationNode as find } from '../app/register/registration-view-test-harness.mjs';
import * as links from './referral-links.mjs';
import * as effects from './member-view-effects.mjs';

const data = { positioned: true, code: 'OpaqueHandle', link: 'https://app.mindblisspower.com/register?ref=wrong',
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

function view(filename) {
  return registrationViewHarness(`../../components/${filename}`, {
    'next/link': { default: ({ children, ...attributes }) => React.createElement('a', attributes, children) },
    'lucide-react': icons, 'framer-motion': { motion, AnimatePresence: ({ children }) => children },
    '@/lib/referral-links.mjs': links, '@/lib/member-view-effects.mjs': effects,
    '@/lib/member-read.mjs': { validMemberReferral: () => true, readMemberJson: async () => data },
    '@/i18n/LanguageProvider': { useI18n: () => ({ t: (key, values) => ({
      'referralCard.title': 'Tu enlace de red', 'referralCard.code': `Código: ${values?.code || ''}`,
      'referralCard.loading': 'Consultando enlaces de red…', 'referralCard.ready': 'Comparte un solo enlace.',
      'referralCard.pending': 'Pendiente de activación', 'referralCard.signIn': 'Iniciar sesión', 'referralCard.retry': 'Reintentar enlace',
      'referralCard.automatic': 'Enlace automático', 'referralCard.automaticHint': 'El backend elige la posición',
      'referralCard.inputLabel': 'Enlace automático', 'referralCard.copyLabel': 'Copiar enlace automático',
      'referralCard.loadingValue': 'Cargando enlace…', 'referralCard.unavailable': 'No disponible en este momento',
      'referralCard.pendingValue': 'Pendiente de activación',
    }[key] || key) }) },
  });
}

test('overview copies the canonical automatic link and reports a denied clipboard instead of claiming success', async t => {
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
