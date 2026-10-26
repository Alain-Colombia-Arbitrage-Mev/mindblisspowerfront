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
  let staticChunk;
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
      staticChunk = body.match(/src="(\/_next\/static\/[^" ]+\.js(?:\?[^" ]*)?)"/)?.[1];
      assert.match(body, /Código al correo/);
      assert.match(body, /Usar mi contraseña/);
      assert.match(body, /Crear cuenta/);
      assert.doesNotMatch(body, /Recuperar contraseña/);
      assert.doesNotMatch(body, /SMS|WhatsApp|account\/security/);
      assert.doesNotMatch(body, /fonts\.googleapis|fonts\.gstatic|chatwoot|soporte\.mindbliss/i);
      assert.match(body, /rel="preload"[^>]*href="\/fonts\/montserrat-latin-wght\.woff2"/);
      assert.match(response.headers.get('cache-control'), /no-store/);
    }
    if (path === '/account/security') assert.equal(response.headers.get('location'), '/login');
    probes++;
  }
  assert.ok(staticChunk, 'the built page references a real uploaded JS chunk');
  for (const [path, expected] of [[staticChunk, 'public, max-age=31536000, immutable'],
    ['/mindbliss/mindbliss-symbol.png', 'public, max-age=3600, must-revalidate']]) {
    const asset = await fetch(`http://127.0.0.1:8787${path}`, { signal: AbortSignal.timeout(8000) });
    assert.equal(asset.status, 200, path);
    assert.equal(asset.headers.get('cache-control'), expected, 'static assets bypass the private Worker response wrapper');
    assert.equal(asset.headers.get('cdn-cache-control'), null);
    assert.equal(asset.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(asset.headers.get('etag'));
    await asset.arrayBuffer();
    const conditional = await fetch(`http://127.0.0.1:8787${path}`, { method: 'HEAD', headers: { 'If-None-Match': asset.headers.get('etag') }, signal: AbortSignal.timeout(8000) });
    assert.equal(conditional.status, 304, 'ETag revalidation does not download the asset again');
    probes += 2;
  }
  for (const path of ['/_next/static/missing-cache-fixture.js', '/mindbliss/missing-cache-fixture.png', '/fonts/missing-cache-fixture.woff2']) {
    const missing = await fetch(`http://127.0.0.1:8787${path}`, { signal: AbortSignal.timeout(8000) });
    assert.equal(missing.status, 404, path);
    assert.doesNotMatch(missing.headers.get('cache-control') || '', /immutable|max-age=[1-9]/, 'asset 404s must not inherit a long TTL');
    probes++;
  }
  const registrationPage = await fetch('http://127.0.0.1:8787/register?email=signup%40example.test&ref=MP123', { redirect: 'manual', signal: AbortSignal.timeout(8000) });
  assert.equal(registrationPage.status, 200);
  const registrationHtml = await registrationPage.text();
  assert.match(registrationHtml, /Crear cuenta y verificar correo/);
  assert.doesNotMatch(registrationHtml, /SMS|WhatsApp|account\/security/);
  probes++;
  for (const filename of ['montserrat-latin-wght.woff2', 'montserrat-latin-ext-wght.woff2']) {
    const response = await fetch(`http://127.0.0.1:8787/fonts/${filename}`, { signal: AbortSignal.timeout(8000) });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=3600, must-revalidate');
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'wOF2');
    probes++;
  }
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
  const smsInput = { email: 'signup@example.test', phoneNumber: '+12025550123', consent: true, consentVersion: 'registration-phone-v1' };
  const smsPost = (path, body, cookie = '') => fetch(`http://127.0.0.1:8787${path}`, {
    method: 'POST', headers: { ...authHeaders, cookie }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000),
  });
  const dormantSms = await smsPost('/api/auth/register/phone/send', smsInput);
  assert.equal(dormantSms.status, 404); probes++;
  const smsPage = await fetch('http://127.0.0.1:8787/__registration_sms/register');
  assert.equal(smsPage.status, 200);
  const smsPageHtml = await smsPage.text();
  assert.match(smsPageHtml, /id="phoneNumber"/); assert.match(smsPageHtml, /phoneConsent/); probes++;
  const smsLogin = await fetch('http://127.0.0.1:8787/__registration_sms/login');
  const smsLoginHtml = await smsLogin.text();
  assert.equal(smsLogin.status, 200); assert.match(smsLoginHtml, /Crear cuenta y validar teléfono/);
  assert.doesNotMatch(smsLoginHtml, /Solicitar código SMS|Enviar código SMS/); probes++;
  const smsSent = await smsPost('/__registration_sms/api/auth/register/phone/send', smsInput);
  assert.equal(smsSent.status, 200);
  const smsFlow = await smsSent.json(); assert.equal(smsFlow.ok, true); assert.equal(smsFlow.expiresIn, 300); probes++;
  const smsVerified = await smsPost('/__registration_sms/api/auth/register/phone/verify', { ...smsInput, flowId: smsFlow.flowId, code: '001234' });
  assert.equal(smsVerified.status, 200);
  const smsProof = await smsVerified.json(); assert.equal(smsProof.verified, true); assert.equal(smsProof.proof, undefined);
  assert.match(smsVerified.headers.get('set-cookie'), /HttpOnly/);
  assert.match(smsVerified.headers.get('set-cookie'), /SameSite=Strict/); probes++;
  const registrationCookie = smsVerified.headers.get('set-cookie').split(';')[0];
  const smsSignup = { fullName: 'Synthetic Registration', email: smsInput.email, phoneNumber: smsInput.phoneNumber,
    password: 'Synthetic-Registration-123', acceptsPrivacy: true };
  assert.equal((await smsPost('/__registration_sms/api/auth/register', smsSignup)).status, 400); probes++;
  assert.equal((await smsPost('/__registration_sms/api/auth/register', { ...smsSignup, phoneNumber: '+12025550124' }, registrationCookie)).status, 400); probes++;
  const smsRegistered = await smsPost('/__registration_sms/api/auth/register', smsSignup, registrationCookie);
  assert.equal(smsRegistered.status, 201); assert.equal((await smsRegistered.json()).userConfirmed, false); probes++;
  assert.equal((await smsPost('/__registration_sms/api/auth/register', smsSignup, registrationCookie)).status, 400); probes++;
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
  // Next may add stricter no-cache/max-age=0 directives to a disabled 404 route.
  const disabledPolicy = smsStatus.headers.get('cache-control');
  assert.match(disabledPolicy, /(?:^|,\s*)private(?:,|$)/);
  assert.match(disabledPolicy, /(?:^|,\s*)no-store(?:,|$)/);
  assert.doesNotMatch(disabledPolicy, /(?:^|,\s*)(?:public|s-maxage=)/);
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
  assert.ok(metrics.tokens >= 4, 'sessions still reach the current private token binding');
  assert.equal(metrics.jwks, 1, 'only public JWKS JSON is reused within its bounded 60s TTL');
  assert.equal(metrics.verifiedReferrals, 1, 'invalid identities must not reach a member data query');
  assert.equal(metrics.sensitiveJwksHeaders, 0, 'public-key reads must not carry browser sessions');
  assert.equal(metrics.registrationSmsSends, 1, 'only the explicit registration fixture may request a synthetic SMS');
  console.log(JSON.stringify({ workerd: 'passed', probes, privateCalls: metrics.privateCalls, realRsaVerified: true,
    tamperedAndWrongAudienceRejected: true, externalNetwork: 'disabled', databaseQueries: 0, realMessages: 0 }));
} finally {
  worker.kill('SIGTERM');
}
