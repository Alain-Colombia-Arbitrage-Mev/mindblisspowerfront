import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { createHmac } from 'node:crypto';

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
    ['/__overview_fixture/dashboard', {}, 307],
    ['/__overview_fixture/dashboard/packages', {}, 307],
    ['/__overview_fixture/dashboard/kyc', {}, 307],
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
      assert.match(body, /solicita un código con tu correo original/);
      assert.match(body, /verificar el correo no las vincula automáticamente/);
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
  assert.match(registrationHtml, /href="\/login\?mode=code(?:&amp;|&)/);
  assert.match(registrationHtml, /id="contactPhone-country"/);
  assert.match(registrationHtml, /id="contactWhatsapp-country"/);
  assert.match(registrationHtml, /WhatsApp/);
  assert.match(registrationHtml.replace(/<!--.*?-->/g, ''), /Colombia \(CO\) \+57/);
  assert.doesNotMatch(registrationHtml, /phoneConsent|validar teléfono|Enviar código SMS|account\/security/);
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
  const post = (path, body, cookie = '') => fetch(`http://127.0.0.1:8787${path}`, {
    method: 'POST', headers: { ...authHeaders, cookie }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000),
  });
  for (const [path, body] of [
    ['/api/auth/email-otp/send-verification-otp', { email: 'unregistered@example.test', type: 'sign-in' }],
    ['/api/auth/sign-in/email', { email: 'unregistered@example.test', password: 'Synthetic-Password-123' }],
  ]) {
    const missing = await post(path, body);
    assert.equal(missing.status, 400);
    assert.equal(missing.headers.get('set-cookie'), null);
    assert.equal(missing.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await missing.json(), { error: 'authentication_failed', code: 'REGISTRATION_REQUIRED' });
    probes++;
  }
  for (const path of ['/api/auth/register/phone/send', '/api/auth/register/phone/verify',
    '/__stale_sms/api/auth/register/phone/send', '/__stale_sms/api/auth/register/phone/verify',
    '/api/auth/registration/phone/send', '/api/auth/sign-in/phone-number']) {
    const removed = await post(path, { email: 'signup@example.test', phoneNumber: '+12025550123', code: '001234' });
    assert.equal(removed.status, 404, path); probes++;
  }
  const contactSignup = { fullName: 'Synthetic Registration', email: 'signup@example.test',
    password: 'Synthetic-Registration-123', acceptsPrivacy: true,
    contactPhone: '+573001234567', contactWhatsapp: '+390612345678',
    phoneNumberVerified: true, emailVerified: true, person_id: 1, role: 'superadmin' };
  for (const invalid of ['3001234567', '+573001234567 ext 1', null]) {
    assert.equal((await post('/api/auth/register', { ...contactSignup, contactPhone: invalid })).status, 400); probes++;
  }
  const contactRegistered = await post('/__stale_sms/api/auth/register', contactSignup,
    '__Secure-vp_registration_phone=obsolete-proof');
  assert.equal(contactRegistered.status, 201);
  assert.equal((await contactRegistered.json()).userConfirmed, false);
  assert.equal(contactRegistered.headers.get('set-cookie'), null); probes++;
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
  const passwordProof = await passwordLogin.json();
  assert.equal(passwordProof.user.emailVerified, true);
  assert.doesNotMatch(JSON.stringify(passwordProof), /must-not-leak/);
  probes++;
  const denied = await fetch('http://127.0.0.1:8787/api/auth/email-otp/send-verification-otp', { method: 'POST', headers: { ...authHeaders, origin: 'https://evil.example.test' }, body: '{}' });
  assert.equal(denied.status, 403);
  probes++;
  const sent = await fetch('http://127.0.0.1:8787/api/auth/email-otp/send-verification-otp', {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ email: 'fixture@example.test', type: 'sign-in' }),
  });
  assert.equal(sent.status, 200);
  assert.deepEqual(await sent.json(), { ok: true });
  probes++;
  const confirmed = await fetch('http://127.0.0.1:8787/api/auth/sign-in/email-otp', {
    method: 'POST', headers: authHeaders, body: JSON.stringify({ email: 'fixture@example.test', otp: '001234' }),
  });
  assert.equal(confirmed.status, 200);
  assert.match(confirmed.headers.get('set-cookie'), /Secure/);
  assert.match(confirmed.headers.get('set-cookie'), /HttpOnly/);
  assert.equal(confirmed.headers.get('cache-control'), 'private, no-store');
  const confirmedProof = await confirmed.json();
  assert.equal(confirmedProof.user.emailVerified, true);
  assert.equal(confirmedProof.user.email, 'fixture@example.test');
  assert.doesNotMatch(JSON.stringify(confirmedProof), /must-not-leak/);
  probes++;
  const cookie = confirmed.headers.get('set-cookie').split(';')[0];
  const sessionHeaders = { cookie, 'cf-connecting-ip': '192.0.2.10' };
  for (const path of ['/__overview_fixture/dashboard', '/__overview_fixture/dashboard/home']) {
    const overview = await fetch(`http://127.0.0.1:8787${path}`, {
      headers: sessionHeaders, redirect: 'manual', signal: AbortSignal.timeout(12000),
    });
    assert.equal(overview.status, 200, path);
    const html = await overview.text();
    assert.match(html, /Planes de membresía/);
    assert.doesNotMatch(html, /href="\/dashboard\/kyc"|Verificación de identidad/);
    for (let id = 1; id <= 13; id++) {
      assert.ok(html.includes(`>Plan Fixture ${id}<`), `server-rendered catalog name ${id}`);
      assert.ok(html.includes(`href="/dashboard/packages?plan=${id}#plan-${id}"`), `safe catalog destination ${id}`);
      assert.ok(html.includes(`aria-label="Comprar plan Plan Fixture ${id}"`), `purchase catalog label ${id}`);
    }
    assert.doesNotMatch(html, /999999|11001|postgres:\/\/synthetic/);
    assert.match(overview.headers.get('cache-control'), /no-store/);
    probes++;
  }
  for (const enabled of [false, true]) {
    const pricing = await fetch(`http://127.0.0.1:8787/__overview_fixture/dashboard/packages${enabled ? '-enabled' : ''}`, {
      headers: sessionHeaders, redirect: 'manual', signal: AbortSignal.timeout(12000),
    });
    assert.equal(pricing.status, 200);
    const html = await pricing.text();
    for (const amount of ['$100.00 USD', '$1.00 USD', '$99.00 USD']) assert.ok(html.includes(amount), `included NOWPayments quote ${amount}`);
    assert.doesNotMatch(html, /\$101\.00 USD|Stripe \(suspendido\)|postgres:\/\/synthetic/);
    assert.match(html, enabled ? /Continuar al pago/ : /Pagos no disponibles/);
    if (!enabled) assert.doesNotMatch(html, /Continuar al pago/);
    assert.match(pricing.headers.get('cache-control'), /no-store/);
    probes++;
  }
  const retiredKyc = await fetch('http://127.0.0.1:8787/__overview_fixture/dashboard/kyc', {
    headers: sessionHeaders, redirect: 'manual', signal: AbortSignal.timeout(12000),
  });
  if (retiredKyc.status === 307) {
    assert.equal(new URL(retiredKyc.headers.get('location'), 'https://app.mindblisspower.com').pathname, '/dashboard/profile');
  } else {
    // Next streams the authenticated layout before a nested page redirect;
    // its documented streaming redirect uses this exact meta target instead.
    assert.equal(retiredKyc.status, 200);
    const html = await retiredKyc.text();
    assert.match(html, /<meta id="__next-page-redirect" http-equiv="refresh" content="[01];url=\/dashboard\/profile"\s*\/>/);
    assert.doesNotMatch(html, /Verificación de identidad|Nombre legal completo|\/api\/member\/kyc\//);
  }
  assert.match(retiredKyc.headers.get('cache-control'), /no-store/);
  probes++;
  const receiptOrder = 'a02f5a55-5fa3-4239-845b-ac6b699110ee';
  for (const paymentStatus of ['waiting', 'finished']) {
    const payload = { order_id: receiptOrder, payment_status: paymentStatus };
    const body = JSON.stringify(payload);
    const signature = createHmac('sha512', 'synthetic-capture-ipn-secret').update(body).digest('hex');
    const captured = await fetch('http://127.0.0.1:8787/api/webhooks/nowpayments', { method: 'POST', body,
      headers: { 'content-type': 'application/json', 'x-nowpayments-sig': signature }, signal: AbortSignal.timeout(8000) });
    assert.equal(captured.status, 200);
    assert.deepEqual(await captured.json(), { received: true, mode: 'capture_only', state: 'captured', fulfillment_status: 'not_activated' });
    assert.equal(captured.headers.get('set-cookie'), null); probes++;
    const status = await fetch(`http://127.0.0.1:8787/api/payments/nowpayments/status?order_id=${receiptOrder}`, { headers: sessionHeaders, signal: AbortSignal.timeout(8000) });
    assert.equal(status.status, 200);
    const receipt = await status.json();
    assert.equal(receipt.payment_confirmed, paymentStatus === 'finished');
    assert.equal(receipt.state, paymentStatus === 'finished' ? 'completed' : 'pending');
    assert.equal(receipt.persisted, true); assert.equal(receipt.signature_validated, true); assert.equal(receipt.provider_verified, true);
    assert.equal(receipt.fulfillment_status, 'not_activated'); assert.match(status.headers.get('cache-control'), /no-store/); probes++;
  }
  for (const [id, headers, expected] of [[receiptOrder, {}, 401], ['00000000-0000-4000-8000-000000000002', sessionHeaders, 404]]) {
    const denied = await fetch(`http://127.0.0.1:8787/api/payments/nowpayments/status?order_id=${id}`, { headers, signal: AbortSignal.timeout(8000) });
    assert.equal(denied.status, expected); assert.doesNotMatch(await denied.text(), /payment_confirmed|completed/); probes++;
  }
  const operationalOrder = 'a02f5a55-5fa3-4239-845b-ac6b699110ef';
  for (const [state, confirmed, fulfillment] of [['pending', false, 'awaiting_payment'],
    ['completed', true, 'awaiting_payment'], ['completed', true, 'activated']]) {
    const response = await fetch(`http://127.0.0.1:8787/api/payments/nowpayments/status?order_id=${operationalOrder}`, {
      headers: sessionHeaders, signal: AbortSignal.timeout(8000),
    });
    assert.equal(response.status, 200);
    const receipt = await response.json();
    assert.equal(receipt.state, state); assert.equal(receipt.payment_confirmed, confirmed);
    assert.equal(receipt.fulfillment_status, fulfillment);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.doesNotMatch(JSON.stringify(receipt), /roi_earned|balance_usd|session_token/);
    probes++;
  }
  const cryptoPaused = await fetch('http://127.0.0.1:8787/__now_disabled/api/payments/checkout', {
    method: 'POST', headers: { ...authHeaders, ...sessionHeaders }, body: JSON.stringify({ package_id: 1, provider: 'nowpayments',
      NOWPAYMENTS_MEMBERSHIPS_ENABLED: 'true' }), signal: AbortSignal.timeout(8000),
  });
  assert.equal(cryptoPaused.status, 503);
  assert.deepEqual(await cryptoPaused.json(), { error: 'nowpayments_checkout_disabled' });
  assert.match(cryptoPaused.headers.get('cache-control'), /no-store/); probes++;
  for (const body of [{ package_id: 1 }, { package_id: 1, provider: 'stripe', STRIPE_CHECKOUT_ENABLED: 'true' }]) {
    const paused = await fetch('http://127.0.0.1:8787/api/payments/checkout', {
      method: 'POST', headers: { ...authHeaders, ...sessionHeaders }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000),
    });
    assert.equal(paused.status, 503); assert.deepEqual(await paused.json(), { error: 'stripe_checkout_disabled' });
    assert.match(paused.headers.get('cache-control'), /no-store/); probes++;
  }
  const resume = await fetch('http://127.0.0.1:8787/api/pay/resume?t=synthetic-never-consume', { redirect: 'manual', signal: AbortSignal.timeout(8000) });
  assert.equal(resume.status, 303);
  assert.equal(new URL(resume.headers.get('location'), 'http://127.0.0.1:8787').pathname, '/dashboard/packages');
  assert.match(resume.headers.get('cache-control'), /no-store/); probes++;
  const cryptoCheckout = await fetch('http://127.0.0.1:8787/api/payments/checkout', {
    method: 'POST', headers: { ...authHeaders, ...sessionHeaders }, body: JSON.stringify({ package_id: 1, provider: 'nowpayments' }), signal: AbortSignal.timeout(8000),
  });
  assert.equal(cryptoCheckout.status, 200);
  const cryptoPayload = await cryptoCheckout.json();
  assert.equal(cryptoPayload.provider, 'nowpayments');
  assert.equal(cryptoPayload.fulfillment_status, 'awaiting_payment');
  assert.equal(cryptoPayload.total_usd, '100.00');
  assert.equal(cryptoPayload.fee_usd, '0.00');
  assert.equal(cryptoPayload.url, 'https://nowpayments.io/payment/?iid=12345'); probes++;
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
  assert.equal(metrics.registrations, 2, 'email-only and optional-contact registrations both work');
  assert.equal(metrics.contactRegistrations, 1, 'optional contacts reach the private signed signup without granting authority');
  assert.equal(metrics.phoneCalls, 0, 'removed SMS routes never reach the private API, even with obsolete flags and credentials');
  assert.equal(metrics.stripeCheckoutCalls, 0, 'paused explicit/default Stripe requests never create an upstream checkout');
  assert.equal(metrics.stripeResumeCalls, 0, 'public resume links cannot bypass the Stripe pause');
  assert.equal(metrics.nowpaymentsCheckoutCalls, 1, 'the Stripe pause preserves only the admitted NOWPayments checkout');
  assert.equal(metrics.nowpaymentsCaptures, 2, 'signed waiting and finished callbacks are captured without a browser session');
  assert.equal(metrics.nowpaymentsStatusReads, 6, 'only verified users reach owner-scoped payment and activation reads');
  console.log(JSON.stringify({ workerd: 'passed', probes, privateCalls: metrics.privateCalls, realRsaVerified: true,
    tamperedAndWrongAudienceRejected: true, externalNetwork: 'disabled', databaseQueries: 0, realMessages: 0 }));
} finally {
  worker.kill('SIGTERM');
}
