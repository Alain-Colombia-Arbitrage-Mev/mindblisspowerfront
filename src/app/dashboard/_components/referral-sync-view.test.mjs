import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { registrationViewHarness } from '../../register/registration-view-test-harness.mjs';
import { translateMessage } from '../../../i18n/translate.mjs';

const session = { authenticated: true, mode: 'better-auth', email: 'member@example.test', subject: 'synthetic-owner', name: 'Original name', referralCode: 'hidden-referral' };
const settle = () => new Promise(resolve => setImmediate(resolve));
function browser(t) {
  const previous = globalThis.window, events = new EventTarget();
  globalThis.window = { addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
  return events;
}
function view() {
  // Only the isolated Wallet project and shared binding wrappers are allowed.
  // Production funding, old pool assignment, referral and payment imports fail.
  return registrationViewHarness('../dashboard/_components/DashboardShell.jsx', {
    'next/navigation': { usePathname: () => '/dashboard/wallet-administrative' },
    '@/components/panel/PanelHeader': { default: () => null },
    '@/components/panel/PanelSidebar': { default: () => null },
    '@/components/panel/NavigationDrawer': { default: ({ children }) => children },
    '@/components/reown/WalletReownProvider': { default: ({ children }) => children },
    '@/components/reown/SandboxWalletBindingProvider': { default: ({ children }) => children },
    '@/lib/member-navigation.mjs': { memberPageKeysFor: () => ({ title: 'nav.administrativeWallet', section: 'pages.account' }) },
    '@/i18n/LanguageProvider': { useI18n: () => ({ t: (key, values) => translateMessage('es', key, values) }) },
    '@/lib/member-session-context': { MemberSessionContext: { Provider: ({ children }) => children } },
    '@/components/panel/panel-shell.css': {},
  });
}

test('wallet shell reads one native session and never starts funding, pool assignment, referral, OTP or sponsorship operations', async t => {
  const events = browser(t), calls = [];
  t.mock.timers.enable({ apis: ['setTimeout'] });
  t.mock.method(globalThis, 'fetch', async (path, options) => {
    calls.push({ path, options }); assert.equal(path, '/api/auth/session');
    assert.equal(options.cache, 'no-store'); assert.equal(options.credentials, 'same-origin');
    assert.equal(options.redirect, 'error'); assert.equal(options.method, undefined);
    return Response.json(session);
  });
  const harness = view(); harness.render(); await settle();
  assert.deepEqual(harness.render().props.value, { email: session.email, subject: session.subject, name: session.name });
  for (const type of ['focus', 'pageshow', 'vp:personal-wallet-linked']) events.dispatchEvent(new Event(type));
  t.mock.timers.tick(60000); await settle();
  assert.equal(calls.length, 1);
  assert.doesNotMatch(renderToStaticMarkup(harness.render()), /hidden-referral|referido|community|billetera personal|role="alert"/i);
  harness.unmount();
});

test('saved profile name updates the administrative shell without additional network calls or owner changes', async t => {
  const events = browser(t); let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return Response.json(session); });
  const harness = view(); harness.render(); await settle();
  const event = new Event('vp:profile-updated'); Object.defineProperty(event, 'detail', { value: { name: 'Saved name' } });
  events.dispatchEvent(event);
  assert.deepEqual(harness.render().props.value, { email: session.email, subject: session.subject, name: 'Saved name' });
  assert.equal(calls, 1); harness.unmount();
});

test('session data from an abandoned administrative shell never updates the next view', async t => {
  browser(t); let complete, signal;
  t.mock.method(globalThis, 'fetch', (_path, options) => { signal = options.signal; return new Promise(resolve => { complete = resolve; }); });
  const harness = view(); harness.render(); harness.unmount();
  assert.equal(signal.aborted, true); const state = JSON.stringify(harness.state);
  complete(Response.json(session)); await settle();
  assert.equal(JSON.stringify(harness.state), state);
});

test('failed or unauthenticated session reads cannot seed member presentation or automatic retry loops', async t => {
  browser(t); t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const response of [() => Promise.reject(Error('unavailable')), () => Promise.resolve(Response.json({ ...session, authenticated: false }))]) {
    let calls = 0; t.mock.method(globalThis, 'fetch', () => { calls++; return response(); });
    const harness = view(); harness.render(); await settle(); t.mock.timers.tick(60000); await settle();
    assert.equal(harness.render().props.value, null); assert.equal(calls, 1); harness.unmount();
  }
});
