import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registrationViewHarness, findRegistrationNode as find } from '../../register/registration-view-test-harness.mjs';

const email = 'member@example.test';
const session = { authenticated: true, mode: 'better-auth', email, subject: 'synthetic-owner' };
const settle = () => new Promise(resolve => setImmediate(resolve));
function browser(t) {
  const previous = globalThis.window, events = new EventTarget();
  globalThis.window = { addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) };
  t.after(() => { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; });
}
function view(sync) {
  return registrationViewHarness('../dashboard/_components/DashboardShell.jsx', {
    'next/navigation': { usePathname: () => '/dashboard' },
    '@/components/panel/PanelHeader': { default: () => null },
    '@/components/panel/PanelSidebar': { default: () => null },
    '@/components/panel/NavigationDrawer': { default: ({ children }) => children },
    '@/lib/member-navigation.mjs': { memberPageFor: () => ({ title: 'Resumen', section: '' }) },
    '@/lib/member-session-context': { MemberSessionContext: { Provider: ({ children }) => children } },
    '@/lib/referral-sync.mjs': sync, '@/components/panel/panel-shell.css': {},
  });
}

test('private dashboard checks durable attribution only after canonical authentication and retries only from an explicit duplicate-locked action', async t => {
  browser(t);
  let reads = 0, saves = 0, complete;
  t.mock.method(globalThis, 'fetch', async () => Response.json(session));
  const harness = view({ pendingVerifiedReferral: owner => owner === email ? { ref: 'CurrentVisit' } : null,
    readVerifiedReferral: async owner => { assert.equal(owner, email); reads++; return { ok: false }; },
    retryVerifiedReferral: owner => { assert.equal(owner, email); saves++; return new Promise(resolve => { complete = resolve; }); },
  });
  harness.render(); harness.replayEffects(); await settle();
  let tree = harness.render(), markup = renderToStaticMarkup(tree);
  assert.equal(reads, 1); assert.equal(saves, 0);
  assert.match(markup, /role="alert"/); assert.match(markup, /No pudimos confirmar que tu enlace de referido quedó guardado/);
  assert.match(markup, /antes de comprar/); assert.doesNotMatch(markup, /guardado correctamente|posición asignada/);
  const retry = find(tree, node => node?.props?.children === 'Reintentar guardar enlace').props.onClick;
  const pending = retry(); await retry();
  assert.equal(saves, 1);
  assert.match(renderToStaticMarkup(harness.render()), /Guardando enlace/);
  complete({ ok: true }); await pending;
  markup = renderToStaticMarkup(harness.render());
  assert.doesNotMatch(markup, /Reintentar guardar enlace|Guardando enlace|role="alert"/);
  assert.equal(reads, 1); assert.equal(saves, 1);
  harness.unmount();
});

test('unbound sessions never read or save attribution, and positioned users do not receive a movement or retry prompt', async t => {
  browser(t);
  for (const identity of [{ ...session, authenticated: false }, { ...session, mode: 'unknown' }, session]) {
    let reads = 0;
    t.mock.method(globalThis, 'fetch', async () => Response.json(identity));
    const harness = view({ pendingVerifiedReferral: () => ({ ref: 'LocalVisit' }),
      readVerifiedReferral: async () => { reads++; return { ok: true, positioned: true }; },
      retryVerifiedReferral: () => assert.fail('mount must not persist old browser attribution'),
    });
    harness.render(); await settle();
    assert.equal(reads, identity.authenticated === true && identity.mode === 'better-auth' ? 1 : 0);
    assert.doesNotMatch(renderToStaticMarkup(harness.render()), /Reintentar guardar enlace|posición asignada/);
    harness.unmount();
  }
});

test('an abandoned explicit retry cannot update the next view when a late success or failure arrives', async t => {
  browser(t);
  for (const result of [{ ok: true }, { ok: false }]) {
    let complete;
    t.mock.method(globalThis, 'fetch', async () => Response.json(session));
    const harness = view({ pendingVerifiedReferral: () => ({ ref: 'LocalVisit' }), readVerifiedReferral: async () => ({ ok: false }),
      retryVerifiedReferral: () => new Promise(resolve => { complete = resolve; }),
    });
    harness.render(); await settle();
    const retry = find(harness.render(), node => node?.props?.children === 'Reintentar guardar enlace').props.onClick;
    const pending = retry(); harness.unmount();
    const state = JSON.stringify(harness.state);
    complete(result); await pending;
    assert.equal(JSON.stringify(harness.state), state);
  }
});

test('a browser-only backup is shown with its owner, code and branch and is saved only as the exact explicit choice displayed', async t => {
  browser(t);
  const choice = { email, code: 'BrowserBackup', side: 'L' }, saves = [];
  t.mock.method(globalThis, 'fetch', async () => Response.json(session));
  const harness = view({ pendingVerifiedReferral: () => null, readVerifiedReferral: async () => ({ ok: true, ref: '', positioned: false }),
    browserReferralChoice: () => choice,
    chooseBrowserReferral: async (...args) => { saves.push(args); return { ok: true }; },
    retryVerifiedReferral: () => assert.fail('an expired marker must not be replayed'),
  });
  harness.render(); await settle();
  const tree = harness.render(), markup = renderToStaticMarkup(tree);
  assert.match(markup, /sólo en este dispositivo, sin confirmar en el servidor/);
  assert.match(markup, /member@example\.test/); assert.match(markup, /Referido: BrowserBackup/); assert.match(markup, /Rama: izquierda/);
  assert.equal(saves.length, 0);
  await find(tree, node => node?.props?.children === 'Guardar este enlace como mi elección').props.onClick();
  assert.deepEqual(saves, [[email, choice]]);
  assert.doesNotMatch(renderToStaticMarkup(harness.render()), /Guardar este enlace como mi elección/);
  harness.unmount();
});

test('a durable server hint takes precedence and never prompts to replay an old browser-only backup', async t => {
  browser(t);
  t.mock.method(globalThis, 'fetch', async () => Response.json(session));
  const harness = view({ pendingVerifiedReferral: () => null,
    readVerifiedReferral: async () => ({ ok: true, ref: 'NewDeviceSponsor', preferred_side: 'R', positioned: false }),
    browserReferralChoice: () => assert.fail('old backup must not supersede an existing durable choice'),
  });
  harness.render(); await settle();
  assert.doesNotMatch(renderToStaticMarkup(harness.render()), /Guardar este enlace|Reintentar guardar enlace/);
  harness.unmount();
});
