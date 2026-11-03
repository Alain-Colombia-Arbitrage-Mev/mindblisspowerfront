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

test('email sign-in never grants network access from unbound or malformed session states', async () => {
  for (const identity of [{ authenticated: false, state: 'claim_required' }, { authenticated: false, state: 'review_required' },
    { authenticated: 'true', mode: 'better-auth' }, { authenticated: true, mode: 'cognito' }, {}]) {
    const result = await betterAuthAccess(async () => Response.json(identity));
    assert.equal(result.ready, false);
    assert.ok(result.notice.includes('vinculación'));
  }
});

test('only the canonical verified session permits navigation and it is never cached', async () => {
  const result = await betterAuthAccess(async (path, options) => {
    assert.equal(path, '/api/auth/session');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    return Response.json({ authenticated: true, mode: 'better-auth' });
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
  for (const actual of ['other@example.test', undefined, null]) {
    const result = await betterAuthAccess(async () => Response.json({ authenticated: true, mode: 'better-auth', email: actual }), 'member@example.test');
    assert.equal(result.ready, false);
    assert.match(result.error, /no corresponde al correo verificado/);
  }
  assert.deepEqual(await betterAuthAccess(async () => Response.json({ authenticated: true, mode: 'better-auth', email: 'MEMBER@EXAMPLE.TEST' }), 'member@example.test'), { ready: true });
});
