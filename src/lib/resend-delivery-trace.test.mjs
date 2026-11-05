import test from 'node:test';
import assert from 'node:assert/strict';
import { persistResendDelivery, DELIVERY_TRACE_TIMEOUT_MS } from './resend-delivery-trace.mjs';

const secret = 'synthetic-auth-shared-key-at-least-32-characters';
const input = { type: 'email.delivered', emailId: '00000000-0000-4000-8000-000000000071', webhookId: 'msg_synthetic',
  occurredAt: '2026-11-04T12:00:00.000Z', now: Date.parse('2026-11-04T12:00:00.000Z') };

test('disabled trace does not read a binding or any secret', async () => {
  const env = {};
  for (const name of ['AUTH_BFF_SHARED_SECRET', 'CORE_EMAIL_TELEMETRY']) Object.defineProperty(env, name, { get() { assert.fail(name); } });
  assert.equal(await persistResendDelivery({ ...input, env }), 'disabled');
});

test('RPC that ignores cancellation cannot hold a webhook open indefinitely and never causes a second write', async () => {
  let calls = 0;
  const env = { RESEND_TRACE_ENABLED: 'true', AUTH_BFF_SHARED_SECRET: secret,
    CORE_EMAIL_TELEMETRY: { recordDelivery() { calls++; return new Promise(() => {}); } } };
  await assert.rejects(persistResendDelivery({ ...input, env, timeoutMs: 5 }), /delivery_trace_unavailable/);
  assert.equal(calls, 1); assert.equal(DELIVERY_TRACE_TIMEOUT_MS, 2000);
});

test('caller cancellation and invalid event time fail closed without a retry or private errors', async () => {
  const controller = new AbortController(); controller.abort();
  const env = { RESEND_TRACE_ENABLED: 'true', AUTH_BFF_SHARED_SECRET: secret,
    CORE_EMAIL_TELEMETRY: { recordDelivery() { assert.fail('unexpected storage write'); } } };
  await assert.rejects(persistResendDelivery({ ...input, env, signal: controller.signal }), /delivery_trace_unavailable/);
  for (const occurredAt of ['invalid', null, '2027-11-04T12:00:00.000Z']) {
    await assert.rejects(persistResendDelivery({ ...input, env, occurredAt }), /delivery_trace_unavailable/);
  }
});
