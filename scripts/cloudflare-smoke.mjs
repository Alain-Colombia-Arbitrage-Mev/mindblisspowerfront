import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

// Run only inside the isolated build image, with --network none and tmpfs state.
const worker = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', 'cloudflare-smoke-worker.mjs',
  '--env', 'staging', '--local', '--port', '8787', '--ip', '127.0.0.1', '--persist-to', '/tmp/portal-worker-state', '--log-level', 'error'], {
  stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, WRANGLER_SEND_METRICS: 'false', XDG_CONFIG_HOME: '/tmp/config', WRANGLER_LOG_PATH: '/tmp/wrangler.log' },
});
let logs = '';
for (const output of [worker.stdout, worker.stderr]) output.on('data', chunk => { logs = (logs + chunk).slice(-32000); });
try {
  let ready = false;
  for (let attempt = 0; attempt < 150; attempt++) {
    if (worker.exitCode !== null) throw new Error(`workerd stopped: ${logs}`);
    try {
      const response = await fetch('http://127.0.0.1:8787/health', { signal: AbortSignal.timeout(500) });
      if (response.status === 200) { ready = true; break; }
    } catch {}
    await delay(200);
  }
  assert.ok(ready, `workerd was not ready: ${logs}`);
  let probes = 0;
  const cases = [
    ['/health', {}, 200], ['/login', {}, 200], ['/api/member/tree', {}, 401],
    ['/account/security', {}, 307], ['/api/auth/phone-number/opt-in', {}, 404],
    ['/api/admin/tree/roots', {}, 404], ['/dashboard/admin', {}, 308],
    ['/api/payments/checkout', { method: 'POST', body: '{}' }, 403],
    ['/api/member/profile', { method: 'POST', body: '{}', headers: { origin: 'https://evil.example', 'x-forwarded-host': 'evil.example', 'content-type': 'application/json' } }, 403],
    ['/api/member/tree', { headers: { cookie: 'better-auth.session_token=synthetic', 'cf-connecting-ip': '192.0.2.10' } }, 401],
  ];
  for (const [path, init, expected] of cases) {
    const response = await fetch(`http://127.0.0.1:8787${path}`, { ...init, redirect: 'manual', signal: AbortSignal.timeout(8000) });
    const body = await response.text();
    assert.equal(response.status, expected, `${path}: ${body.slice(0, 200)}\n${logs}`);
    if (path === '/login') {
      assert.match(body, /Código al correo/);
      assert.match(body, /Usar mi contraseña/);
      assert.match(body, /Crear cuenta/);
      assert.doesNotMatch(body, /Recuperar contraseña/);
      assert.doesNotMatch(body, /SMS|WhatsApp|account\/security/);
      assert.match(response.headers.get('cache-control'), /no-store/);
    }
    if (path === '/account/security') assert.equal(response.headers.get('location'), '/login');
    probes++;
  }
  const registrationPage = await fetch('http://127.0.0.1:8787/register?email=signup%40example.test&ref=MP123', { redirect: 'manual', signal: AbortSignal.timeout(8000) });
  assert.equal(registrationPage.status, 200);
  const registrationHtml = await registrationPage.text();
  assert.match(registrationHtml, /Crear cuenta y verificar correo/);
  assert.doesNotMatch(registrationHtml, /SMS|WhatsApp|account\/security/);
  probes++;
  for (const path of ['/forgot-password?email=fixture%40example.test']) {
    const response = await fetch(`http://127.0.0.1:8787${path}`, { redirect: 'manual', signal: AbortSignal.timeout(8000) });
    assert.equal(response.status, 307);
    assert.match(response.headers.get('location'), /^\/login\?/);
    probes++;
  }
  for (const path of ['/__disabled/login', '/__disabled/health', '/__disabled/_next/static/fixture.js']) {
    const response = await fetch(`http://127.0.0.1:8787${path}`, { signal: AbortSignal.timeout(8000) });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    probes++;
  }
  const authHeaders = { origin: 'https://app.mindblisspower.com', 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.10' };
  const signup = await fetch('http://127.0.0.1:8787/api/auth/register', { method: 'POST', headers: authHeaders,
    body: JSON.stringify({ fullName: 'Synthetic Registration', email: 'signup@example.test', password: 'Synthetic-Registration-123', acceptsPrivacy: true, referralCode: 'MP123' }) });
  assert.equal(signup.status, 201);
  assert.equal((await signup.json()).userConfirmed, false);
  assert.equal(signup.headers.get('set-cookie'), null);
  probes++;
  for (const body of [{ email: 'signup@example.test', resend: true }, { email: 'signup@example.test', code: '001234' }]) {
    const confirmation = await fetch('http://127.0.0.1:8787/api/auth/register/confirm', { method: 'POST', headers: authHeaders, body: JSON.stringify(body) });
    assert.equal(confirmation.status, 200);
    const payload = await confirmation.json();
    assert.equal(payload.ok, true);
    assert.equal(confirmation.headers.get('set-cookie'), null);
    assert.equal(payload.authenticated, undefined);
    if (body.code) assert.equal(payload.needsLogin, true);
    probes++;
  }
  const passwordLogin = await fetch('http://127.0.0.1:8787/api/auth/sign-in/email', { method: 'POST', headers: authHeaders,
    body: JSON.stringify({ email: 'fixture@example.test', password: 'Synthetic-Password-123' }) });
  assert.equal(passwordLogin.status, 200);
  assert.match(passwordLogin.headers.get('set-cookie'), /HttpOnly/);
  assert.match(passwordLogin.headers.get('set-cookie'), /Secure/);
  assert.doesNotMatch(await passwordLogin.text(), /must-not-leak/);
  probes++;
  const denied = await fetch('http://127.0.0.1:8787/api/auth/email-otp/send-verification-otp', { method: 'POST', headers: { ...authHeaders, origin: 'https://evil.example.test' }, body: '{}' });
  assert.equal(denied.status, 403);
  probes++;
  const sent = await fetch('http://127.0.0.1:8787/api/auth/email-otp/send-verification-otp', {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ email: 'fixture@example.test', type: 'sign-in' }),
  });
  assert.equal(sent.status, 200);
  assert.equal((await sent.json()).ok, true);
  probes++;
  const confirmed = await fetch('http://127.0.0.1:8787/api/auth/sign-in/email-otp', {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ email: 'fixture@example.test', otp: '001234' }),
  });
  assert.equal(confirmed.status, 200);
  assert.match(confirmed.headers.get('set-cookie'), /Secure/);
  assert.match(confirmed.headers.get('set-cookie'), /HttpOnly/);
  assert.equal(confirmed.headers.get('cache-control'), 'private, no-store');
  assert.doesNotMatch(await confirmed.text(), /must-not-leak/);
  probes++;
  const cookie = confirmed.headers.get('set-cookie').split(';')[0];
  const sessionHeaders = { cookie, 'cf-connecting-ip': '192.0.2.10' };
  const smsStatus = await fetch('http://127.0.0.1:8787/api/auth/phone-number/opt-in', { headers: sessionHeaders });
  assert.equal(smsStatus.status, 404);
  assert.deepEqual(await smsStatus.json(), { error: 'not_found' });
  assert.equal(smsStatus.headers.get('cache-control'), 'private, no-store');
  probes++;
  for (const [path, body, expected] of [
    ['/api/auth/sign-up/email', {}, 404],
    ['/api/auth/phone-number/send-otp', { phoneNumber: '+12025550123', consent: true, consentVersion: 'sms-auth-v1' }, 404],
    ['/api/auth/phone-number/verify', { phoneNumber: '+12025550123', code: '123456', updatePhoneNumber: true, disableSession: true }, 404],
    ['/api/auth/phone-number/revoke-consent', {}, 404],
  ]) {
    const deniedMutation = await fetch('http://127.0.0.1:8787' + path, { method: 'POST', headers: { ...authHeaders, ...sessionHeaders }, body: JSON.stringify(body) });
    assert.equal(deniedMutation.status, expected);
    probes++;
  }
  const signedIn = await fetch('http://127.0.0.1:8787/api/auth/session', { headers: sessionHeaders, signal: AbortSignal.timeout(8000) });
  assert.equal(signedIn.status, 200);
  const identity = await signedIn.json();
  assert.equal(identity.authenticated, true, `real RSA verification through the built Worker failed\n${logs}`);
  assert.equal(identity.email, 'fixture@example.test');
  assert.equal(identity.referralCode, 'SYNTHETIC-MEMBER');
  assert.equal(identity.isAdmin, false, 'customer portal never grants an administrative role');
  probes++;
  for (const cookieValue of ['', '__Secure-better-auth.session_token=synthetic-tampered', '__Secure-better-auth.session_token=synthetic-wrong-audience']) {
    const rejected = await fetch('http://127.0.0.1:8787/api/auth/session', {
      headers: { ...sessionHeaders, cookie: cookieValue }, signal: AbortSignal.timeout(8000),
    });
    assert.equal(rejected.status, 200);
    const session = await rejected.json();
    assert.equal(session.authenticated, false);
    assert.equal(session.email, null);
    probes++;
  }
  const metrics = await (await fetch('http://127.0.0.1:8787/__synthetic_metrics')).json();
  assert.ok(metrics.tokens >= 4 && metrics.jwks >= 3, 'session checks must reach the private JWT/JWKS binding');
  assert.equal(metrics.verifiedReferrals, 1, 'invalid identities must not reach a member data query');
  assert.equal(metrics.sensitiveJwksHeaders, 0, 'public-key reads must not carry browser sessions');
  console.log(JSON.stringify({ workerd: 'passed', probes, privateCalls: metrics.privateCalls, realRsaVerified: true,
    tamperedAndWrongAudienceRejected: true, externalNetwork: 'disabled', databaseQueries: 0, realMessages: 0 }));
} finally {
  worker.kill('SIGTERM');
}
