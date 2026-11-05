import assert from 'node:assert/strict';
import test from 'node:test';
import { authRetryAfterSeconds, parseAuthRetryAfter } from './auth-retry-after.mjs';
import { registrationRetrySeconds } from '../app/register/registration-model.mjs';
import { otpConfirmationRetrySeconds } from './email-otp-client.mjs';

const now = Date.parse('Thu, 05 Nov 2026 12:00:00 GMT');
const later = 'Thu, 05 Nov 2026 12:15:00 GMT';

test('Retry-After accepts bounded numeric seconds and canonical future HTTP dates without arbitrary date coercion', () => {
  for (const value of ['900', ' 900 ', 900, later]) assert.equal(parseAuthRetryAfter(value, now), 900);
  assert.equal(parseAuthRetryAfter(later, now + 1), 900, 'fractional remaining seconds round up');
  for (const value of [9999999999, '9999999999', 'Fri, 06 Nov 2026 12:00:01 GMT']) assert.equal(parseAuthRetryAfter(value, now), 86400);
  for (const value of [undefined, null, true, {}, [], '0', 0, -1, '-1', '1.5', 1.5, '1e3', NaN, Infinity,
    'https://private.example.test', '900\r\nSet-Cookie: private', '9'.repeat(65), 'tomorrow', '2026-11-05',
    'Wed, 05 Nov 2026 12:15:00 GMT', 'Thu, 31 Nov 2026 12:15:00 GMT', 'Thu, 05 Nov 2026 11:59:59 GMT']) {
    assert.equal(parseAuthRetryAfter(value, now), null);
    assert.equal(authRetryAfterSeconds(value, 300, now), 300);
  }
});

test('send waits use the longest valid server budget, never under five minutes; redemption keeps its own shorter fallback', () => {
  const response = value => new Response(null, { headers: { 'Retry-After': value } });
  assert.equal(registrationRetrySeconds(response(later), { retryAfter: 300 }, now), 900);
  assert.equal(registrationRetrySeconds(response('600'), { resendAfter: 900 }, now), 900);
  assert.equal(registrationRetrySeconds(response('invalid'), { retryAfterSec: 600 }, now), 600);
  assert.equal(registrationRetrySeconds(response('1'), {}, now), 300);
  assert.equal(registrationRetrySeconds(response('9999999999'), {}, now), 86400);
  assert.equal(otpConfirmationRetrySeconds(response(later), now), 900);
  assert.equal(otpConfirmationRetrySeconds(response('1'), now), 1);
  assert.equal(otpConfirmationRetrySeconds(response('invalid'), now), 60);
});
