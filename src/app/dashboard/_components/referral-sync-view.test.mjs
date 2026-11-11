import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { registrationViewHarness, findRegistrationNode as find } from '../../register/registration-view-test-harness.mjs';
import { translateMessage } from '../../../i18n/translate.mjs';

const email = 'member@example.test';
const session = { authenticated: true, mode: 'better-auth', email, subject: 'synthetic-owner' };
const ack = (ref = '', preferred_side = '', positioned = false) => ({ ok: true, ref, preferred_side, positioned });
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
    '@/lib/member-navigation.mjs': { memberPageKeysFor: () => ({ titleKey: 'pages.summary', sectionKey: '' }) },
    '@/i18n/LanguageProvider': { useI18n: () => ({ locale: 'es', dir: 'ltr', t: (key, values) => translateMessage('es', key, values) }) },
    '@/components/reown/DashboardWalletProvider': { default: ({ children }) => children },
    '@/components/reown/PostAuthWalletSetup': { default: () => null, usePostAuthWalletSetup: () => ({ request: null, finish() {} }) },
    '@/lib/member-session-context': { MemberSessionContext: { Provider: ({ children }) => children } },
    '@/lib/referral-sync.mjs': sync, '@/components/panel/panel-shell.css': {},
  });
}

test('private dashboard checks durable attribution only after canonical authentication and retries only from an explicit duplicate-locked action', async t => {
  browser(t);
  let reads = 0, saves = 0, complete;
  t.mock.method(globalThis, 'fetch', async () => Response.json(session));
  const harness = view({ pendingVerifiedReferral: owner => owner === email ? { ref: 'CurrentVisit', preferred_side: 'L' } : null,
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
  complete(ack('CurrentVisit', 'L')); await pending;
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
      readVerifiedReferral: async () => { reads++; return ack('', '', true); },
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

test('a browser-only backup is shown with its owner and sponsor while placement stays automatic', async t => {
  browser(t);
  const choice = { email, code: 'BrowserBackup', side: 'L' }, saves = [];
  t.mock.method(globalThis, 'fetch', async () => Response.json(session));
  const harness = view({ pendingVerifiedReferral: () => null, readVerifiedReferral: async () => ({ ok: true, ref: '', positioned: false }),
    browserReferralChoice: () => choice,
    chooseBrowserReferral: async (...args) => { saves.push(args); return ack('BrowserBackup', 'L'); },
    retryVerifiedReferral: () => assert.fail('an expired marker must not be replayed'),
  });
  harness.render(); await settle();
  const tree = harness.render(), markup = renderToStaticMarkup(tree);
  assert.match(markup, /sólo en este dispositivo, sin confirmar en el servidor/);
  assert.match(markup, /member@example\.test/); assert.match(markup, /Sponsor: BrowserBackup/); assert.match(markup, /Ubicación binaria: automática/);
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

test('a dashboard GET that precedes the background save gets one bounded recheck and clears the obsolete warning', async t => {
  browser(t); t.mock.timers.enable({ apis: ['setTimeout'] });
  let reads = 0, marker = { ref: 'CurrentVisit', preferred_side: 'L' };
  t.mock.method(globalThis, 'fetch', async () => Response.json(session));
  const harness = view({ pendingVerifiedReferral: () => marker,
    readVerifiedReferral: async () => { reads++; return reads === 1 ? ack('OlderDurable', 'R') : ack('CurrentVisit', 'L'); },
    browserReferralChoice: () => assert.fail('the local backup must not override the durable response'),
    retryVerifiedReferral: () => assert.fail('a background recheck must never send a POST'),
  });
  harness.render(); await settle();
  assert.match(renderToStaticMarkup(harness.render()), /Reintentar guardar enlace/);
  marker = null;
  t.mock.timers.tick(5000); await settle();
  assert.equal(reads, 2);
  assert.doesNotMatch(renderToStaticMarkup(harness.render()), /role="alert"/);
  t.mock.timers.tick(60000); await settle();
  assert.equal(reads, 2, 'there is no polling loop');
  harness.unmount();
});

test('an expired marker retry that reads an empty server offers the exact browser backup instead of falsely hiding the warning', async t => {
  browser(t);
  let marker = { ref: 'BrowserBackup', preferred_side: 'L' }, saves = 0;
  const choice = { email, code: 'BrowserBackup', side: 'L' };
  t.mock.method(globalThis, 'fetch', async () => Response.json(session));
  const harness = view({ pendingVerifiedReferral: () => marker, readVerifiedReferral: async () => ({ ok: false }),
    browserReferralChoice: () => choice,
    retryVerifiedReferral: async () => ack(),
    chooseBrowserReferral: async (owner, displayed) => { assert.equal(owner, email); assert.equal(displayed, choice); saves++; return ack('BrowserBackup', 'L'); },
  });
  harness.render(); await settle();
  marker = null;
  await find(harness.render(), node => node?.props?.children === 'Reintentar guardar enlace').props.onClick();
  const markup = renderToStaticMarkup(harness.render());
  assert.match(markup, /sin confirmar en el servidor/); assert.match(markup, /Sponsor: BrowserBackup/);
  assert.match(markup, /Guardar este enlace como mi elección/); assert.equal(saves, 0);
  await find(harness.render(), node => node?.props?.children === 'Guardar este enlace como mi elección').props.onClick();
  assert.equal(saves, 1);
  assert.doesNotMatch(renderToStaticMarkup(harness.render()), /role="alert"/);
  harness.unmount();
});

test('an unavailable initial lookup keeps a retry action and later exposes the backup only after a confirmed empty server response', async t => {
  browser(t);
  const choice = { email, code: 'BrowserBackup', side: 'R' }; let saves = 0, reads = 0;
  t.mock.method(globalThis, 'fetch', async () => Response.json(session));
  const harness = view({ pendingVerifiedReferral: () => null, readVerifiedReferral: async () => ++reads === 1 ? { ok: false } : ack(),
    browserReferralChoice: () => choice, retryVerifiedReferral: () => assert.fail('a read retry must never save a newly appearing marker'),
    chooseBrowserReferral: async () => { saves++; return ack('BrowserBackup', 'R'); },
  });
  harness.render(); await settle();
  let markup = renderToStaticMarkup(harness.render());
  assert.match(markup, /No pudimos consultar tu enlace de referido/);
  assert.match(markup, /Reintentar comprobación/); assert.doesNotMatch(markup, /Sponsor: BrowserBackup|Reintentar guardar enlace|confirmar el guardado/);
  await find(harness.render(), node => node?.props?.children === 'Reintentar comprobación').props.onClick();
  markup = renderToStaticMarkup(harness.render());
  assert.match(markup, /Sponsor: BrowserBackup/); assert.match(markup, /Ubicación binaria: automática/);
  assert.match(markup, /Guardar este enlace como mi elección/); assert.equal(saves, 0);
  harness.unmount();
});

test('a failed GET without a pending choice offers only a read retry and never claims that a save or placement failed', async t => {
  browser(t);
  let reads = 0, complete;
  t.mock.method(globalThis, 'fetch', async () => Response.json(session));
  const harness = view({ pendingVerifiedReferral: () => null,
    readVerifiedReferral: async () => { reads++; return reads === 1 ? { ok: false } : new Promise(resolve => { complete = resolve; }); },
    browserReferralChoice: () => null,
    retryVerifiedReferral: () => assert.fail('a displayed read retry must never replay a write'),
    chooseBrowserReferral: () => assert.fail('a read failure cannot select a sponsor'),
  });
  harness.render(); await settle();
  let tree = harness.render(), markup = renderToStaticMarkup(tree);
  assert.match(markup, /No pudimos consultar tu enlace de referido/);
  assert.match(markup, /esta consulta no guarda enlaces ni cambia tu posición/);
  assert.doesNotMatch(markup, /Reintentar guardar enlace|confirmar el guardado|antes de comprar|posición asignada/);
  const retry = find(tree, node => node?.props?.children === 'Reintentar comprobación').props.onClick;
  const pending = retry(); await retry();
  assert.equal(reads, 2, 'one initial read and one explicit duplicate-locked read');
  assert.match(renderToStaticMarkup(harness.render()), /Comprobando enlace/);
  complete(ack('', '', true)); await pending;
  markup = renderToStaticMarkup(harness.render());
  assert.doesNotMatch(markup, /role="alert"|Reintentar|Guardando/);
  harness.unmount();
});

test('only the complete canonical positioned contract suppresses a pending-save warning, never a local node or malformed flag', async t => {
  browser(t);
  for (const result of [ack('', '', true), { ok: true, positioned: true }, ack('PendingSponsor', 'L', true)]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ ...session, referralCode: 'MP32031', affiliate_id: 32031 }));
    const harness = view({ pendingVerifiedReferral: () => ({ ref: 'PendingSponsor', preferred_side: 'L' }),
      readVerifiedReferral: async () => result,
      retryVerifiedReferral: () => assert.fail('no automatic save'),
      browserReferralChoice: () => assert.fail('an immutable placement cannot be chosen from a local backup'),
    });
    harness.render(); await settle();
    const markup = renderToStaticMarkup(harness.render());
    if (result.ref === '' && result.preferred_side === '') assert.doesNotMatch(markup, /role="alert"|Reintentar guardar/);
    else assert.match(markup, /No pudimos confirmar que tu enlace de referido quedó guardado/);
    harness.unmount();
  }
});

test('a failed session HTTP response cannot trigger an authenticated referral lookup from its JSON fields', async t => {
  browser(t);
  t.mock.method(globalThis, 'fetch', async () => Response.json(session, { status: 503 }));
  const harness = view({ readVerifiedReferral: () => assert.fail('non-OK session is not canonical authentication'),
    pendingVerifiedReferral: () => assert.fail('non-OK session must not inspect a recipient hint'),
  });
  harness.render(); await settle();
  assert.doesNotMatch(renderToStaticMarkup(harness.render()), /role="alert"|Referido:/);
  harness.unmount();
});

test('a displayed read retry stays read-only if a pending marker appears before the click', async t => {
  browser(t);
  let marker = null, reads = 0;
  t.mock.method(globalThis, 'fetch', async () => Response.json(session));
  const harness = view({ pendingVerifiedReferral: () => marker,
    readVerifiedReferral: async () => ++reads === 1 ? { ok: false } : ack('', '', true),
    browserReferralChoice: () => null,
    retryVerifiedReferral: () => assert.fail('a read action must not replay an unseen pending choice'),
    chooseBrowserReferral: () => assert.fail('a read action must not choose a sponsor'),
  });
  harness.render(); await settle();
  const retry = find(harness.render(), node => node?.props?.children === 'Reintentar comprobación').props.onClick;
  marker = { ref: 'NewerUnseenChoice', preferred_side: 'R' };
  await retry();
  assert.equal(reads, 2);
  assert.doesNotMatch(renderToStaticMarkup(harness.render()), /role="alert"|Reintentar guardar enlace/);
  harness.unmount();
});

test('a delayed reconciliation GET cannot overwrite the ACK of a later explicit save', async t => {
  browser(t); t.mock.timers.enable({ apis: ['setTimeout'] });
  let reads = 0, complete, marker = { ref: 'CurrentVisit', preferred_side: 'L' };
  t.mock.method(globalThis, 'fetch', async () => Response.json(session));
  const harness = view({ pendingVerifiedReferral: () => marker,
    readVerifiedReferral: async () => { reads++; return reads === 1 ? ack('OlderDurable', 'R') : new Promise(resolve => { complete = resolve; }); },
    retryVerifiedReferral: async () => { marker = null; return ack('CurrentVisit', 'L'); },
    browserReferralChoice: () => assert.fail('a stale reply must not offer to overwrite the confirmed choice'),
  });
  harness.render(); await settle();
  t.mock.timers.tick(5000); await settle();
  assert.equal(reads, 2);
  await find(harness.render(), node => node?.props?.children === 'Reintentar guardar enlace').props.onClick();
  assert.doesNotMatch(renderToStaticMarkup(harness.render()), /role="alert"/);
  complete(ack()); await settle();
  assert.doesNotMatch(renderToStaticMarkup(harness.render()), /role="alert"/);
  harness.unmount();
});

test('reconciliation is cancelled on unmount and late replies never update an abandoned view', async t => {
  browser(t); t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const startRecheck of [false, true]) {
    let reads = 0, complete;
    t.mock.method(globalThis, 'fetch', async () => Response.json(session));
    const harness = view({ pendingVerifiedReferral: () => ({ ref: 'CurrentVisit', preferred_side: 'L' }),
      readVerifiedReferral: async () => { reads++; return reads === 1 ? ack('OlderDurable', 'R') : new Promise(resolve => { complete = resolve; }); },
      retryVerifiedReferral: () => assert.fail('no automatic POST'),
    });
    harness.render(); harness.replayEffects(); await settle();
    assert.equal(reads, 1);
    if (startRecheck) { t.mock.timers.tick(5000); await settle(); assert.equal(reads, 2); }
    harness.unmount(); const state = JSON.stringify(harness.state);
    t.mock.timers.tick(60000); await settle();
    assert.equal(reads, startRecheck ? 2 : 1);
    if (startRecheck) { complete(ack('CurrentVisit', 'L')); await settle(); }
    assert.equal(JSON.stringify(harness.state), state);
  }
});
