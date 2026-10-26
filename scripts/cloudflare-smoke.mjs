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
      assert.match(body, /No necesitas contraseña/);
      assert.doesNotMatch(body, /Recuperar contraseña/);
      assert.match(response.headers.get('cache-control'), /no-store/);
    }
    probes++;
  }
  for (const path of ['/register?email=fixture%40example.test&ref=MP123', '/forgot-password?email=fixture%40example.test']) {
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
  const metrics = await (await fetch('http://127.0.0.1:8787/__synthetic_metrics')).json();
  assert.equal(metrics.privateCalls, 3, 'OpenNext routes must see the same request-local private binding, not a global pool or public fetch');
  console.log(JSON.stringify({ workerd: 'passed', probes, privateCalls: metrics.privateCalls, externalNetwork: 'disabled', databaseQueries: 0, realMessages: 0 }));
} finally {
  worker.kill('SIGTERM');
}
