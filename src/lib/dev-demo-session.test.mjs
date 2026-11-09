import assert from 'node:assert/strict';
import test from 'node:test';

import { issueDevDemoIdToken, verifyDevDemoIdToken } from './dev-demo-session.mjs';

const development = { NODE_ENV: 'development', AUTH_PROVIDER: 'cognito', DEV_DEMO_SESSION_SECRET: 'test-only-secret' };
const production = { ...development, NODE_ENV: 'production' };
const now = Date.UTC(2026, 10, 9, 15, 0, 0);

test('local demo token is signed, normalized and expires after one hour', () => {
  const token = issueDevDemoIdToken(' Demo@Example.Test ', development, now);
  const claims = verifyDevDemoIdToken(token, development, now + 1000);
  assert.equal(claims.email, 'demo@example.test');
  assert.equal(claims.sub, 'demo:demo@example.test');
  assert.equal(claims.email_verified, true);
  assert.equal(verifyDevDemoIdToken(token, development, now + 60 * 60 * 1000), null);
});

test('demo proof is never issued or accepted in production or Better Auth mode', () => {
  assert.throws(() => issueDevDemoIdToken('demo@example.test', production, now), /disabled/);
  const token = issueDevDemoIdToken('demo@example.test', development, now);
  assert.equal(verifyDevDemoIdToken(token, production, now), null);
  assert.equal(verifyDevDemoIdToken(token, { ...development, AUTH_PROVIDER: 'better-auth' }, now), null);
});

test('tampered demo proof is rejected', () => {
  const token = issueDevDemoIdToken('demo@example.test', development, now);
  const [header, payload, sig] = token.split('.');
  const changed = Buffer.from(JSON.stringify({ email: 'attacker@example.test' })).toString('base64url');
  assert.equal(verifyDevDemoIdToken(`${header}.${changed}.${sig}`, development, now), null);
  assert.equal(verifyDevDemoIdToken(`${header}.${payload}.${sig.slice(0, -1)}x`, development, now), null);
});

