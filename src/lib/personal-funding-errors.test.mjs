import test from 'node:test';
import assert from 'node:assert/strict';
import { personalFundingFailure } from './personal-funding-errors.mjs';

test('personal recovery distinguishes verification, request persistence and provider checkout', () => {
  const failure = new Error('temporary service failure');
  assert.equal(personalFundingFailure(failure, 'link'), 'link_unavailable');
  assert.equal(personalFundingFailure(failure, 'intent'), 'intent');
  assert.equal(personalFundingFailure(failure, 'checkout'), 'provider');
  for (const phase of ['link', 'intent', 'checkout']) {
    assert.equal(personalFundingFailure(new Error('unauthenticated'), phase), 'session');
    assert.equal(personalFundingFailure(new Error('ACTION_REJECTED'), phase), 'rejected');
    assert.equal(personalFundingFailure(new Error('wallet_funding_method_unavailable'), phase), 'method');
    assert.equal(personalFundingFailure(new Error('wallet_funding_invalid_country'), phase), 'method');
    assert.equal(personalFundingFailure(new Error('wallet_identity_unavailable'), phase), 'identity');
    assert.equal(personalFundingFailure(new Error('wallet_funding_valuation_unavailable'), phase), 'valuation');
    assert.equal(personalFundingFailure(Object.assign(new Error('reown_connection_timeout'), { name: 'TimeoutError' }), phase), 'connection_timeout');
  }
});
