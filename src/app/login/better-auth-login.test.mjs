import assert from 'node:assert/strict';
import test from 'node:test';
import { betterAuthPasswordRequest, betterAuthPasswordFailure, betterAuthAccess, verifiedEmailSignIn } from './better-auth-login.mjs';

test('Better Auth password sign-in uses only the new same-origin endpoint and preserves exact password', () => {
  assert.deepEqual(betterAuthPasswordRequest(' MEMBER@EXAMPLE.TEST ', ' Secret with spaces '), {
    path: '/api/auth/sign-in/email', body: { email: 'member@example.test', password: ' Secret with spaces ' },
  });
  for (const [email, password] of [['invalid', 'valid'], ['member@example.test', ''], ['member@example.test', 'a'.repeat(129)]]) {
    assert.throws(() => betterAuthPasswordRequest(email, password));
  }
});

test('anonymous canonical sessions do not invent manual approval, a ban or network permission', async () => {
  for (const identity of [{ authenticated: false, mode: 'better-auth' },
    { authenticated: false, mode: 'better-auth', state: 'claim_required' }, { authenticated: false, mode: 'better-auth', state: 'review_required' }]) {
    const result = await betterAuthAccess(async () => Response.json(identity));
    assert.equal(result.ready, false);
    assert.match(result.notice, /no pudimos confirmar una sesión/);
    assert.doesNotMatch(result.notice, /aprobación|vinculación|bloquead|suspendid/);
  }
});

test('malformed canonical success responses are unavailable rather than an invented approval requirement', async () => {
  for (const identity of [{ authenticated: 'true', mode: 'better-auth' }, { authenticated: true, mode: 'cognito' }, {}, [], null,
    { authenticated: false }, { authenticated: true, mode: 'better-auth' }, { authenticated: false, mode: 'better-auth', error: 'private' }]) {
    const result = await betterAuthAccess(async () => Response.json(identity));
    assert.equal(result.ready, false); assert.ok(result.error); assert.equal(result.notice, undefined);
    assert.doesNotMatch(result.error, /private|aprobación|vinculación/);
  }
});

test('only the canonical verified session permits navigation and it is never cached', async () => {
  const result = await betterAuthAccess(async (path, options) => {
    assert.equal(path, '/api/auth/session?view=access');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    return Response.json({ authenticated: true, mode: 'better-auth', email: 'member@example.test' });
  });
  assert.deepEqual(result, { ready: true });
  assert.ok((await betterAuthAccess(async () => new Response(null, { status: 503 }))).error);
  assert.ok((await betterAuthAccess(async () => { throw new Error('private provider diagnostics'); })).error);
});

test('password errors remain safe, actionable and do not echo upstream diagnostics', () => {
  assert.ok(betterAuthPasswordFailure(403, 'EMAIL_NOT_VERIFIED').includes('Verifica'));
  assert.ok(betterAuthPasswordFailure(429).includes('Espera'));
  assert.ok(betterAuthPasswordFailure(503).includes('no está disponible'));
  assert.ok(!betterAuthPasswordFailure(400, 'private_provider_diagnostics').includes('private_provider'));
});

test('password help separates creation by recovery OTP from password login limits and never exposes account state', () => {
  const failed = betterAuthPasswordFailure(401, 'private-provider-diagnostic');
  assert.match(failed, /Si no tienes contraseña o la olvidaste/);
  assert.match(failed, /Crear o cambiar contraseña.*correo original/);
  assert.match(betterAuthPasswordFailure(403, 'EMAIL_NOT_VERIFIED'), /código de registro, no el de inicio de sesión ni el de recuperación/);
  for (const status of [400, 401, 403, 429, 503]) {
    assert.doesNotMatch(betterAuthPasswordFailure(status, 'private-provider-diagnostic'), /private-provider|te quedan|24 horas|5 solicitudes|10 intentos|cuenta existe|cuenta bloqueada/);
  }
  assert.match(betterAuthPasswordFailure(429), /Espera antes de volver a entrar/);
});

test('email confirmation requires trusted sign-in proof for the same recipient, not a send or URL hint', () => {
  const proof = { ok: true, user: { id: 'synthetic', email: 'member@example.test', emailVerified: true } };
  assert.equal(verifiedEmailSignIn(proof, ' MEMBER@EXAMPLE.TEST '), true);
  for (const payload of [null, [], {}, { ok: true }, { ...proof, error: 'failed' }, { ...proof, ok: 'true' },
    { ...proof, user: { ...proof.user, emailVerified: false } }, { ...proof, user: { ...proof.user, emailVerified: 'true' } },
    { ...proof, user: { ...proof.user, id: '' } }, { ...proof, user: { ...proof.user, email: 'other@example.test' } },
    { ok: true, emailVerified: true }, { userConfirmed: true, registered: '1', verified: 'true' }]) {
    assert.equal(verifiedEmailSignIn(payload, 'member@example.test'), false);
  }
});

test('canonical access belongs to the just-verified recipient, not an older signed-in account', async () => {
  for (const actual of ['other@example.test']) {
    const result = await betterAuthAccess(async () => Response.json({ authenticated: true, mode: 'better-auth', email: actual }), 'member@example.test');
    assert.equal(result.ready, false);
    assert.match(result.error, /no corresponde al correo verificado/);
  }
  assert.deepEqual(await betterAuthAccess(async () => Response.json({ authenticated: true, mode: 'better-auth', email: 'MEMBER@EXAMPLE.TEST' }), 'member@example.test'), { ready: true });
});

test('cookie roundtrip distinguishes missing or inactive browser sessions from restricted access without reflecting diagnostics', async () => {
  for (const status of [401, 403]) {
    let calls = 0;
    const result = await betterAuthAccess(async () => {
      calls++;
      return Response.json({ error: status === 403 ? 'account_access_restricted' : 'unauthenticated',
        message: 'private-provider-message', email: 'other@example.test', token: 'private-token' }, { status });
    }, 'member@example.test');
    assert.equal(result.ready, false); assert.equal(calls, 1);
    const message = result.error || result.notice;
    assert.match(message, /Tu correo está verificado/);
    assert.doesNotMatch(message, /private-|other@example|bloquead|suspendid|aprobación|registrarte/);
    if (status === 401) { assert.ok(result.notice); assert.match(message, /misma pestaña de Safari/); }
    else { assert.ok(result.error); assert.match(message, /no pudimos autorizar/); }
  }
});

test('cookie roundtrip has one mobile-compatible bounded request and releases its resources on success, timeout or caller cancellation', async t => {
  const timers = new Map(), descriptors = new Map(['any', 'timeout'].map(key => [key, Object.getOwnPropertyDescriptor(AbortSignal, key)]));
  let nextTimer = 0;
  t.mock.method(globalThis, 'setTimeout', (callback, milliseconds) => { const id = ++nextTimer; timers.set(id, { callback, milliseconds }); return id; });
  t.mock.method(globalThis, 'clearTimeout', id => timers.delete(id));
  try {
    for (const key of descriptors.keys()) Object.defineProperty(AbortSignal, key, { configurable: true, value: undefined });
    assert.deepEqual(await betterAuthAccess(async () => Response.json({ authenticated: true, mode: 'better-auth', email: 'member@example.test' }), 'member@example.test'), { ready: true });
    assert.equal(timers.size, 0);
    for (const stalled of ['transport', 'body']) {
      let calls = 0, signal, bodyStarted;
      const decoding = new Promise(resolve => { bodyStarted = resolve; });
      const pending = betterAuthAccess(async (_path, options) => {
        calls++; signal = options.signal;
        if (stalled === 'transport') return new Promise(() => {});
        return { ok: true, status: 200, json() { bodyStarted(); return new Promise(() => {}); } };
      }, 'member@example.test');
      if (stalled === 'body') await decoding;
      assert.equal(calls, 1); assert.equal([...timers.values()][0].milliseconds, 12000);
      [...timers.values()][0].callback();
      const result = await pending;
      assert.equal(result.ready, false); assert.match(result.error, /No pudimos comprobar/);
      assert.equal(signal.aborted, true); assert.equal(timers.size, 0);
    }
    const parent = new AbortController(); let calls = 0;
    const pending = betterAuthAccess(async () => { calls++; return new Promise(() => {}); }, 'member@example.test', { signal: parent.signal });
    parent.abort(); assert.equal((await pending).ready, false); assert.equal(calls, 1); assert.equal(timers.size, 0);
    assert.equal((await betterAuthAccess(() => assert.fail('cancelled caller must not start a request'), 'member@example.test', { signal: parent.signal })).ready, false);
  } finally {
    for (const [key, descriptor] of descriptors) Object.defineProperty(AbortSignal, key, descriptor);
  }
});
