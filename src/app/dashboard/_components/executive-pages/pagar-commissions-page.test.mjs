import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { findRegistrationNode, registrationViewHarness } from '../../../register/registration-view-test-harness.mjs';
import { translateMessage } from '../../../../i18n/translate.mjs';

const firstOwner = { subject: 'member-a', email: 'member-a@example.test' };
const secondOwner = { subject: 'member-b', email: 'member-b@example.test' };
const period = { weekEnd: '2026-11-16', binaryUsdMinor: 150, rankUsdMinor: 50 };
const snapshot = { virtualBalanceUsdMinor: 425, periods: [period], nextBefore: '2026-11-16' };
const older = { weekEnd: '2026-11-09', binaryUsdMinor: 45, rankUsdMinor: 0 };
const empty = { virtualBalanceUsdMinor: 0, periods: [], nextBefore: null };
const settle = () => new Promise(resolve => setImmediate(resolve));

function fixture(t, read, locale = 'es') {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const browser = new EventTarget(), calls = [], subscriptions = new Set();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  const subscribe = callback => { subscriptions.add(callback); return () => subscriptions.delete(callback); };
  let owner = null;
  const harness = registrationViewHarness('../dashboard/_components/executive-pages/PagarCommissionsPage.jsx', {
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale, t: key => translateMessage(locale, key) }) },
    '@/lib/member-session-context': { useMemberSession: () => owner },
    '@/lib/member-session-sync.mjs': { subscribeMemberSessionReplacement: subscribe },
    '@/lib/member-logout-sync.mjs': { subscribeMemberLogout: subscribe },
    '@/lib/pagar-commissions-client.mjs': { readPagarCommissions: (subject, options) => {
      calls.push({ subject, ...options });
      return read(subject, options);
    } },
    './executive-ui': { PageHeader: ({ title }) => title },
    './pagar-commissions.module.css': { default: {} },
    'lucide-react': { Coins: () => null },
  });
  t.after(() => {
    harness.unmount();
    if (original) Object.defineProperty(globalThis, 'window', original);
    else delete globalThis.window;
  });
  return {
    render(nextOwner = firstOwner) { owner = nextOwner; return harness.render(); },
    browser, subscriptions, calls,
  };
}

test('shows a USD virtual balance and PV bonus closes in the four portal locales', async t => {
  for (const locale of ['es', 'en', 'ar', 'zh']) await t.test(locale, async t => {
    const view = fixture(t, async () => snapshot, locale);
    const loading = renderToStaticMarkup(view.render());
    assert.ok(loading.includes(translateMessage(locale, 'pagarCommissions.loading')));
    assert.ok(!loading.includes(translateMessage(locale, 'rechargePackage.bonus')));
    await settle();
    const html = renderToStaticMarkup(view.render());
    for (const key of ['nav.commissions', 'rechargePackage.bonus', 'pagarCommissions.history', 'pagarCommissions.binary', 'pagarCommissions.rank']) {
      assert.ok(html.includes(translateMessage(locale, key)), key);
    }
    assert.ok(html.includes(new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', currencyDisplay: 'code' }).format(4.25)));
    assert.ok(html.includes(new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date('2026-11-16'))));
    assert.ok(!html.includes('/dashboard/payments'));
    assert.equal(view.calls.length, 1);
  });
});

test('loads earlier closes once per button press and preserves a visible history on temporary failure', async t => {
  let reject = true;
  const view = fixture(t, async (_subject, { before }) => {
    if (!before) return snapshot;
    if (reject) throw new Error('temporary');
    return { ...snapshot, periods: [older], nextBefore: null };
  });
  view.render();
  await settle();
  const action = findRegistrationNode(view.render(), node => node?.type === 'button');
  action.props.onClick();
  action.props.onClick();
  await settle();
  const failed = renderToStaticMarkup(view.render());
  assert.match(failed, /No pudimos cargar los cierres anteriores/);
  assert.match(failed, /dateTime="2026-11-16"/i);
  assert.equal(view.calls.length, 2);
  reject = false;
  findRegistrationNode(view.render(), node => node?.type === 'button').props.onClick();
  await settle();
  const restored = renderToStaticMarkup(view.render());
  assert.match(restored, /dateTime="2026-11-16"/i);
  assert.match(restored, /dateTime="2026-11-09"/i);
  assert.doesNotMatch(restored, /Ver cierres anteriores/);
  view.browser.dispatchEvent(new Event('focus'));
  await settle();
  assert.equal(view.calls.length, 3);
  assert.deepEqual(view.calls.map(entry => entry.before), [null, period.weekEnd, period.weekEnd]);
});

test('reloads only on first-page focus, masks existing data on owner change and discards late results', async t => {
  let resolveLate, firstReads = 0;
  const late = new Promise(resolve => { resolveLate = resolve; });
  const view = fixture(t, async subject => subject === secondOwner.subject ? empty : ++firstReads === 1 ? snapshot : late);
  assert.doesNotMatch(renderToStaticMarkup(view.render(null)), /USD/);
  assert.equal(view.calls.length, 0);
  view.render();
  await settle();
  view.browser.dispatchEvent(new Event('focus')); view.browser.dispatchEvent(new Event('focus'));
  assert.equal(view.calls.length, 2);
  assert.doesNotMatch(renderToStaticMarkup(view.render(secondOwner)), /dateTime="2026-11-16"/i);
  assert.equal(view.calls[1].signal.aborted, true);
  resolveLate(snapshot);
  await settle();
  const nextOwner = renderToStaticMarkup(view.render(secondOwner));
  assert.match(nextOwner, /Aún no tienes bonos por PV acreditados/);
  assert.doesNotMatch(nextOwner, /dateTime="2026-11-16"/i);
  for (const retire of view.subscriptions) retire();
  view.browser.dispatchEvent(new Event('focus'));
  assert.doesNotMatch(renderToStaticMarkup(view.render(secondOwner)), /USD/);
  assert.equal(view.calls.length, 3);
});
