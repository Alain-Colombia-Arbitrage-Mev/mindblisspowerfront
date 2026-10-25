import test from 'node:test';
import assert from 'node:assert/strict';
import { memberMutationError } from './member-mutation-policy.mjs';

const env = { AUTH_PUBLIC_ORIGIN: 'https://portal.example.test' };
const request = (method = 'POST', extra = {}, path = '/api/member/profile') => new Request(`${env.AUTH_PUBLIC_ORIGIN}${path}`, {
  method, headers: { origin: env.AUTH_PUBLIC_ORIGIN, 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', ...extra },
});
test('member/payment mutation origin and JSON checks reject sibling-site forms before transport', () => {
  assert.equal(memberMutationError(request(), env), null);
  for (const path of ['/api/member/profile', '/api/payments/withdraw', '/api/network/analyze']) {
    assert.equal(memberMutationError(request('POST', { origin: 'https://sibling.example.test', 'sec-fetch-site': 'same-site' }, path), env).status, 403);
    assert.equal(memberMutationError(request('POST', { 'content-type': 'text/plain' }, path), env).status, 415);
    assert.equal(memberMutationError(request('POST', { origin: '' }, path), env).status, 403);
  }
  assert.equal(memberMutationError(request('GET'), env), null);
  assert.equal(memberMutationError(request('POST', {}, '/api/other'), env), null);
});
