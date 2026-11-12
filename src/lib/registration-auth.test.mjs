import assert from 'node:assert/strict';
import test from 'node:test';
import { handleRegistration } from './registration-auth.mjs';

const env = { AUTH_PROVIDER: 'better-auth', NODE_ENV: 'production', AUTH_PUBLIC_ORIGIN: 'https://portal.example.test',
  BETTER_AUTH_BACKEND_URL: 'https://auth.example.test', AUTH_BFF_SHARED_SECRET: 'synthetic-proxy-signature-secret-longer-than-32' };
const form = { fullName: 'Synthetic Member', email: ' MEMBER@example.test ', acceptsPrivacy: true,
  referralCode: 'MP-SYNTHETIC', preferredSide: 'L', is_admin: true, personId: 'other', emailVerified: true };
const request = (body = form, origin = env.AUTH_PUBLIC_ORIGIN) => new Request(`${env.AUTH_PUBLIC_ORIGIN}/api/auth/register`, {
  method: 'POST', headers: { origin, 'cf-connecting-ip': '192.0.2.10', 'content-type': 'application/json', cookie: 'unrelated=private' }, body: JSON.stringify(body),
});
const email = 'member@example.test';
const user = { id: 'synthetic-user', email, emailVerified: true };
const token = 'synthetic-private-native-session';
const sessionCookie = '__Secure-better-auth.session_token=synthetic-native-session.signature';
const verifiedResponse = (data = { status: true, token, user }, cookies = [`${sessionCookie}; Secure; HttpOnly; Domain=.auth.example.test; Path=/api/auth; Max-Age=604800`], status = 200) => {
  const headers = new Headers({ 'set-auth-jwt': 'synthetic-private-jwt' });
  for (const cookie of cookies) headers.append('set-cookie', cookie);
  return Response.json(data, { status, headers });
};
const canonical = (changes = {}) => ({ session: { id: 'synthetic-session', token, userId: user.id,
  expiresAt: new Date(Date.now() + 3600000).toISOString() }, user, ...changes });

test('registration validates provider, origin, body, consent and bounded fields before contacting auth', async () => {
  const dependencies = { env, fetchImpl: () => assert.fail('invalid request contacted auth') };
  assert.equal((await handleRegistration(request(), 'register', { ...dependencies, env: {} })).status, 404);
  assert.equal((await handleRegistration(request(form, 'https://attacker.example.test'), 'register', dependencies)).status, 403);
  for (const body of [null, [], {}, { ...form, fullName: 'a' }, { ...form, password: 'short' }, { ...form, password: 'a'.repeat(129) },
    { ...form, acceptsPrivacy: false }, { ...form, email: 'invalid' }, { ...form, preferredSide: 'ROOT' }, { ...form, referralCode: 'x'.repeat(65) }]) {
    assert.equal((await handleRegistration(request(body), 'register', dependencies)).status, 400);
  }
  assert.equal((await handleRegistration(request({ ...form, fullName: 'a'.repeat(33000) }), 'register', dependencies)).status, 413);
});

test('passwordless signup generates a fresh server-only credential and never exposes session or tree permissions', async () => {
  const generated = new Set();
  for (let attempt = 0; attempt < 2; attempt++) {
  let credential;
  const response = await handleRegistration(request(), 'register', { env, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://auth.example.test/api/auth/sign-up/email');
    const { password, ...body } = JSON.parse(options.body);
    assert.deepEqual(body, { name: form.fullName, email });
    assert.match(password, /^[A-Za-z0-9_-]{64}$/);
    credential = password; generated.add(password);
    assert.equal(options.headers.cookie, '');
    assert.match(options.headers['x-vp-auth-signature'], /^[0-9a-f]{64}$/);
    return Response.json({ token: null, user: { id: 'synthetic', email: 'member@example.test', emailVerified: false, role: 'not-trusted' } }, {
      headers: { 'set-cookie': 'better-auth.session_token=must-not-leak; Secure; HttpOnly', 'set-auth-jwt': 'must-not-leak' },
    });
  } });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(response.headers.get('set-auth-jwt'), null);
  const body = await response.json();
  assert.equal(body.userConfirmed, false);
  assert.equal(body.resendAfter, 300);
  assert.equal(body.referralReviewRequired, true);
  assert.doesNotMatch(JSON.stringify(body), /must-not-leak|password|personId|role|not-trusted/);
  assert.equal(JSON.stringify(body).includes(credential), false);
  }
  assert.equal(generated.size, 2, 'separate signups never share a caller-known or fixed placeholder password');
});

test('confirmation validates a new native session for the OTP owner before exposing only the exact public session acknowledgement', async () => {
  const calls = [];
  const response = await handleRegistration(request({ email: 'member@example.test', code: '001-234' }), 'confirm', {
    env, fetchImpl: async (url, options) => {
      calls.push(url);
      if (url.endsWith('/get-session')) {
        assert.equal(options.method, 'GET'); assert.equal(options.body, undefined);
        assert.equal(options.headers.cookie, sessionCookie, 'only the newly issued session token is used, never incoming browser cookies or cache');
        assert.equal(options.cache, 'no-store');
        assert.match(options.headers['x-vp-auth-signature'], /^[0-9a-f]{64}$/);
        return Response.json(canonical(), { headers: { 'set-cookie': 'unrelated=private-canonical-cookie' } });
      }
      assert.equal(url, 'https://auth.example.test/api/auth/email-otp/verify-email');
      assert.deepEqual(JSON.parse(options.body), { email: 'member@example.test', otp: '001234' });
      assert.equal(options.headers.cookie, '');
      return verifiedResponse({ status: true, token, user: { ...user, role: 'admin', personId: 'untrusted' } }, [
        `${sessionCookie}; Secure; HttpOnly; Domain=.auth.example.test; Path=/api/auth; Max-Age=604800`,
        '__Secure-better-auth.session_data=synthetic-cache; Secure; HttpOnly', 'unrelated=private-cookie',
      ]);
    },
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, { ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: false, sessionEstablished: true });
  assert.deepEqual(calls, ['https://auth.example.test/api/auth/email-otp/verify-email', 'https://auth.example.test/api/auth/get-session']);
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  for (const cookie of cookies) {
    assert.match(cookie, /; Path=\/; HttpOnly; SameSite=Lax; Secure$/);
    assert.doesNotMatch(cookie, /Domain=|Path=\/api|unrelated/);
  }
  assert.equal(response.headers.get('set-auth-jwt'), null);
  assert.doesNotMatch(JSON.stringify(body), /synthetic|token|emailVerified|personId|admin|redirectTo/);
});

test('a native registration commit after the former 8s deadline still proves its new session without replaying the OTP', async () => {
  const paths = [];
  let committed = false;
  const response = await handleRegistration(request({ email, code: '001234' }), 'confirm', {
    env, fetchImpl: async (url, options) => {
      paths.push(new URL(url).pathname);
      if (url.endsWith('/get-session')) {
        assert.equal(committed, true);
        assert.equal(options.headers.cookie, sessionCookie);
        return Response.json(canonical());
      }
      // Real abortable transport timing reproduces the consumed-code failure:
      // the native transaction can commit even if its HTTP caller has timed out.
      return new Promise((resolve, reject) => {
        const aborted = () => reject(options.signal.reason);
        options.signal.addEventListener('abort', aborted, { once: true });
        setTimeout(() => {
          committed = true;
          options.signal.removeEventListener('abort', aborted);
          resolve(verifiedResponse());
        }, 8300);
      });
    },
  });
  assert.equal(committed, true);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, mode: 'better-auth', userConfirmed: true, needsLogin: false, sessionEstablished: true });
  assert.deepEqual(paths, ['/api/auth/email-otp/verify-email', '/api/auth/get-session']);
  assert.equal(response.headers.getSetCookie().filter(value => value.startsWith('__Secure-better-auth.session_token=')).length, 1);
  assert.equal(response.headers.get('set-auth-jwt'), null);
});

test('resend is explicit, purpose-bound and preserves server cooldown without hidden retries', async () => {
  let calls = 0;
  const response = await handleRegistration(request({ email: 'member@example.test', resend: true }), 'confirm', { env, fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, 'https://auth.example.test/api/auth/email-otp/send-verification-otp');
    assert.deepEqual(JSON.parse(options.body), { email: 'member@example.test', type: 'email-verification' });
    return Response.json({ message: 'private provider detail' }, { status: 429, headers: { 'retry-after': '450' } });
  } });
  assert.equal(calls, 1);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '450');
  assert.equal((await response.json()).retryAfter, 450);
});

test('only native confirmation503 preserves the retryable verification code without cookies or verification claims', async () => {
  for (const [action, body, status] of [
    ['confirm', { email, code: '001234' }, 503], ['confirm', { email, code: '001234' }, 500],
    ['confirm', { email, code: '001234' }, 400], ['confirm', { email, resend: true }, 503], ['register', form, 503],
  ]) {
    let calls = 0;
    const response = await handleRegistration(request(body), action, { env, fetchImpl: async () => {
      calls++;
      return Response.json({ code: 'EMAIL_VERIFICATION_UNAVAILABLE', message: 'Synthetic private transaction diagnostic',
        status: true, token, user, emailVerified: true, needsLogin: true, userConfirmed: true, sessionEstablished: true }, {
        status, headers: { 'set-cookie': `${sessionCookie}; Secure; HttpOnly`, 'set-auth-jwt': 'synthetic-private-jwt' },
      });
    } });
    const result = await response.json();
    assert.equal(calls, 1); assert.equal(response.headers.get('set-cookie'), null); assert.equal(response.headers.get('set-auth-jwt'), null);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(Object.keys(result).sort(), ['code', 'error']);
    assert.doesNotMatch(JSON.stringify(result), /Synthetic|synthetic|emailVerified|userConfirmed|sessionEstablished|token|needsLogin/);
    if (action === 'confirm' && body.resend !== true && status === 503) {
      assert.equal(response.status, 503); assert.equal(result.code, 'EMAIL_VERIFICATION_UNAVAILABLE');
    } else assert.notEqual(result.code, 'EMAIL_VERIFICATION_UNAVAILABLE');
  }
});

test('client-supplied credentials are rejected before signup, including malformed and previously valid-looking passwords', async () => {
  for (const field of ['password', 'confirmPassword']) for (const value of [null, false, 123456, {}, [], '', 'attacker-known-password-123', 'x'.repeat(129)]) {
    const response = await handleRegistration(request({ ...form, [field]: value }), 'register', {
      env, fetchImpl() { assert.fail('caller-selected credential reached native signup'); },
    });
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('set-cookie'), null);
    const payload = await response.json(); assert.equal(payload.field, 'password');
    assert.doesNotMatch(JSON.stringify(payload), /attacker-known|123456|token/);
  }
});

test('no send or malformed verification acknowledgement can establish a session, even with a plausible existing browser cookie', async () => {
  for (const data of [{ success: true }, { status: true, token: null, user }, { status: true, token, user: { ...user, emailVerified: false } },
    { status: true, token, user: { ...user, email: 'other@example.test' } }, { status: true, token, user: { ...user, id: '' } },
    { status: true, token, user, error: 'private-upstream-error' }, { status: false, token, user }]) {
    let calls = 0;
    const response = await handleRegistration(request({ email, code: '001234' }), 'confirm', { env, fetchImpl: async () => {
      calls++; return verifiedResponse(data);
    } });
    assert.equal(response.status, 503); assert.equal(calls, 1);
    assert.equal(response.headers.get('set-cookie'), null);
    const payload = await response.json();
    assert.equal(payload.code, 'REGISTRATION_UNAVAILABLE');
    assert.equal(payload.emailVerified, undefined); assert.equal(payload.needsLogin, undefined);
    assert.doesNotMatch(JSON.stringify(payload), /private-|synthetic|sessionEstablished|userConfirmed/);
  }
  for (const status of [201, 202]) {
    let calls = 0;
    const response = await handleRegistration(request({ email, code: '001234' }), 'confirm', { env, fetchImpl: async () => {
      calls++; return verifiedResponse(undefined, undefined, status);
    } });
    assert.equal(response.status, 503); assert.equal(calls, 1); assert.equal(response.headers.get('set-cookie'), null);
    const payload = await response.json(); assert.equal(payload.code, 'REGISTRATION_UNAVAILABLE');
    assert.equal(payload.emailVerified, undefined);
  }
});

test('validated native verification with an unavailable session handoff reports only non-authenticated email completion without retrying its consumed OTP', async () => {
  const failures = [
    { cookie: [], canonical: undefined, calls: 1 },
    { cookie: undefined, canonical: () => new Response('private-upstream-failure', { status: 503 }), calls: 2 },
    { cookie: undefined, canonical: () => Response.json(canonical({ user: { ...user, id: 'other-owner' } })), calls: 2 },
    { cookie: undefined, canonical: () => { throw new Error('private-transport-failure'); }, calls: 2 },
  ];
  for (const failure of failures) {
    const paths = [];
    const response = await handleRegistration(request({ email, code: '001234' }), 'confirm', { env,
      fetchImpl: async url => {
        paths.push(new URL(url).pathname);
        return url.endsWith('/get-session') ? failure.canonical() : verifiedResponse(undefined, failure.cookie);
      },
    });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('set-cookie'), null); assert.equal(response.headers.get('set-auth-jwt'), null);
    const payload = await response.json();
    assert.deepEqual(Object.keys(payload).sort(), ['code', 'emailVerified', 'error', 'needsLogin']);
    assert.equal(payload.code, 'REGISTRATION_SESSION_UNAVAILABLE');
    assert.equal(payload.emailVerified, true); assert.equal(payload.needsLogin, true);
    assert.match(payload.error, /No vuelvas a usar este código/);
    assert.doesNotMatch(JSON.stringify(payload), /private-|synthetic|other-owner|token|sessionEstablished|userConfirmed/);
    assert.equal(paths.length, failure.calls);
    assert.deepEqual(paths.filter(path => path.endsWith('/verify-email')), ['/api/auth/email-otp/verify-email']);
    assert.equal(paths.some(path => /send-verification|sign-in|sign-out/.test(path)), false);
  }
});

test('native errors, malformed acknowledgements and transport failure before verification cannot claim a verified email or relay credentials', async () => {
  for (const result of [
    new Response(JSON.stringify({ status: true, token, user }), { headers: { 'content-type': 'text/plain' } }),
    verifiedResponse({ status: true, token, user: { ...user, email: 'other@example.test' } }),
    verifiedResponse({ status: true, token: '', user }),
    Response.json({ code: 'INVALID_OTP', status: true, token, user, emailVerified: true, needsLogin: true }, { status: 400 }),
    Response.json({ code: 'REGISTRATION_SESSION_UNAVAILABLE', status: true, token, user, emailVerified: true, needsLogin: true }, { status: 503 }),
    undefined,
  ]) {
    let calls = 0;
    const response = await handleRegistration(request({ email, code: '001234' }), 'confirm', { env,
      fetchImpl: async () => { calls++; if (!result) throw new Error('private-transport-before-verification'); return result; },
    });
    assert.ok([400, 503].includes(response.status)); assert.equal(calls, 1);
    assert.equal(response.headers.get('set-cookie'), null);
    const payload = await response.json();
    assert.equal(payload.emailVerified, undefined); assert.equal(payload.needsLogin, undefined);
    assert.notEqual(payload.code, 'REGISTRATION_SESSION_UNAVAILABLE');
    assert.doesNotMatch(JSON.stringify(payload), /private-|synthetic|other@example|token|sessionEstablished|userConfirmed/);
  }
});

test('missing, deleted, unrelated or ambiguous new session cookies cannot be replaced by an old browser session', async () => {
  for (const cookies of [[], ['unrelated=private'], ['__Secure-better-auth.session_data=synthetic-cache'],
    ['__Secure-better-auth.session_token=; Max-Age=0'], [`${sessionCookie}; Max-Age=0`], [`${sessionCookie}; Max-Age=-1`],
    [`${sessionCookie}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`], [`${sessionCookie}; Max-Age=604800`, 'better-auth.session_token=another-session']]) {
    let calls = 0;
    const req = new Request(request({ email, code: '001234' }), { headers: {
      origin: env.AUTH_PUBLIC_ORIGIN, 'cf-connecting-ip': '192.0.2.10', 'content-type': 'application/json',
      cookie: 'better-auth.session_token=old-account; better-auth.session_data=old-cache',
    } });
    const response = await handleRegistration(req, 'confirm', { env, fetchImpl: async (_url, options) => {
      assert.equal(options.headers.cookie, ''); calls++; return verifiedResponse(undefined, cookies);
    } });
    assert.equal(response.status, 503); assert.equal(calls, 1); assert.equal(response.headers.get('set-cookie'), null);
  }
});

test('canonical native user, session owner, token and future expiry must all agree before any cookie is relayed', async () => {
  const original = canonical();
  for (const payload of [null, [], { user }, { session: original.session },
    canonical({ user: { ...user, id: 'another-user' } }), canonical({ user: { ...user, email: 'other@example.test' } }),
    canonical({ user: { ...user, emailVerified: false } }),
    ...[{ id: '' }, { userId: 'another-user' }, { token: 'another-token' }, { token: null },
      { expiresAt: new Date(Date.now() - 1).toISOString() }, { expiresAt: 'invalid' }, { expiresAt: Date.now() + 3600000 }]
      .map(change => canonical({ session: { ...original.session, ...change } }))]) {
    let calls = 0;
    const response = await handleRegistration(request({ email, code: '001234' }), 'confirm', { env, fetchImpl: async url => {
      calls++; return url.endsWith('/get-session') ? Response.json(payload) : verifiedResponse();
    } });
    assert.equal(response.status, 503); assert.equal(calls, 2); assert.equal(response.headers.get('set-cookie'), null);
    assert.doesNotMatch(await response.text(), /synthetic|another|sessionEstablished|userConfirmed/);
  }
  for (const result of [Response.json(canonical(), { status: 201 }), Response.json(canonical(), { status: 202 }),
    Response.json(canonical(), { status: 401 }), new Response('private-internal-error', { status: 503 }),
    new Response(JSON.stringify(canonical()), { headers: { 'content-type': 'text/plain' } })]) {
    const response = await handleRegistration(request({ email, code: '001234' }), 'confirm', { env,
      fetchImpl: async url => url.endsWith('/get-session') ? result : verifiedResponse(),
    });
    assert.equal(response.status, 503); assert.equal(response.headers.get('set-cookie'), null);
    assert.doesNotMatch(await response.text(), /private-|synthetic|sessionEstablished|userConfirmed/);
  }
});

test('cancelling the canonical recheck cannot acknowledge success, relay cookies, retry OTP or sign out a server session', async () => {
  const cancelled = new AbortController();
  let release, started;
  const checking = new Promise(resolve => { started = resolve; }), paths = [];
  const pending = handleRegistration(new Request(request({ email, code: '001234' }), { signal: cancelled.signal }), 'confirm', {
    env, fetchImpl: async (url, options) => {
      paths.push(new URL(url).pathname);
      if (url.endsWith('/get-session')) {
        assert.equal(options.signal.aborted, false); started(); return new Promise(resolve => { release = resolve; });
      }
      return verifiedResponse();
    },
  });
  await checking; cancelled.abort(); release(Response.json(canonical()));
  const response = await pending;
  assert.equal(response.status, 503); assert.equal(response.headers.get('set-cookie'), null);
  assert.deepEqual(paths, ['/api/auth/email-otp/verify-email', '/api/auth/get-session']);
  assert.doesNotMatch(await response.text(), /sessionEstablished|userConfirmed|synthetic/);
});

test('only an exact authoritative existing-account 4xx becomes an account-exists decision', async () => {
  for (const [status, code, expected] of [[409, 'USER_ALREADY_EXISTS', 409], [400, 'EMAIL_ALREADY_EXISTS', 409],
    [503, 'USER_ALREADY_EXISTS', 503], [500, 'EMAIL_ALREADY_EXISTS', 503], [400, 'USER_ALREADY_EXISTS_EXTRA', 400]]) {
    const response = await handleRegistration(request(), 'register', { env, fetchImpl: async () => Response.json({ code,
      message: 'private-account-detail', email, token: 'private-token', accountExists: true }, { status }),
    });
    assert.equal(response.status, expected); assert.equal(response.headers.get('set-cookie'), null);
    const body = await response.json(); assert.equal(body.accountExists, expected === 409 ? true : undefined);
    assert.doesNotMatch(JSON.stringify(body), /private-|member@example/);
  }
});

test('unexpected successes and upstream diagnostics never become verified signup or exposed secrets', async () => {
  for (const upstream of [Response.json({ user: { id: 'synthetic', email: 'other@example.test', emailVerified: false } }),
    Response.json({ user: { id: 'synthetic', email: 'member@example.test', emailVerified: true } }),
    Response.json({ token: 'private-token', user: { id: 'synthetic', email: 'member@example.test', emailVerified: false } }),
    new Response('private-db-connection', { status: 503 }), new Response('private-redirect', { status: 302 })]) {
    const response = await handleRegistration(request(), 'register', { env, fetchImpl: async () => upstream });
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private-db|private-token|private-redirect/);
  }
});

test('a confirmed signup delivery failure preserves only the normalized pending registration and manual retry budget', async () => {
  let calls = 0;
  const response = await handleRegistration(request(), 'register', { env, fetchImpl: async () => {
    calls++;
    return Response.json({ code: 'AUTH_EMAIL_DELIVERY_UNAVAILABLE', message: 'private-provider-diagnostic', email: 'attacker@example.test',
      token: 'private-session', user: { id: 'private-user', role: 'admin' } }, { status: 503, headers: {
      'retry-after': '1', 'set-cookie': 'better-auth.session_token=private-session; HttpOnly', 'set-auth-jwt': 'private-jwt',
    } });
  } });
  assert.equal(calls, 1);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('retry-after'), '300');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(response.headers.get('set-auth-jwt'), null);
  const body = await response.json();
  assert.equal(body.code, 'EMAIL_DELIVERY_UNAVAILABLE');
  assert.equal(body.registrationPending, true);
  assert.equal(body.email, 'member@example.test');
  assert.equal(body.requiresConfirmation, true);
  assert.equal(body.retryAfter, 300);
  assert.equal(body.ok, undefined);
  assert.doesNotMatch(JSON.stringify(body), /private-|attacker|token|role|userConfirmed/);
});

test('only the exact signup 503 code offers pending recovery; resend never implies account creation', async () => {
  for (const [status, code] of [[500, 'AUTH_EMAIL_DELIVERY_UNAVAILABLE'], [400, 'AUTH_EMAIL_DELIVERY_UNAVAILABLE'],
    [503, 'AUTH_EMAIL_DELIVERY_UNAVAILABLE_EXTRA'], [503, 'authentication_unavailable']]) {
    const response = await handleRegistration(request(), 'register', { env, fetchImpl: async () => Response.json({ code, registrationPending: true,
      email: 'member@example.test', requiresConfirmation: true }, { status }) });
    const body = await response.json();
    assert.equal(body.registrationPending, undefined);
    assert.equal(body.email, undefined);
    assert.notEqual(body.code, 'EMAIL_DELIVERY_UNAVAILABLE');
  }
  const response = await handleRegistration(request({ email: 'member@example.test', resend: true }), 'confirm', {
    env, fetchImpl: async () => Response.json({ code: 'AUTH_EMAIL_DELIVERY_UNAVAILABLE' }, { status: 503 }),
  });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('retry-after'), '300');
  const body = await response.json();
  assert.equal(body.code, 'EMAIL_DELIVERY_UNAVAILABLE');
  assert.equal(body.registrationPending, undefined);
  assert.equal(body.email, undefined);
});
