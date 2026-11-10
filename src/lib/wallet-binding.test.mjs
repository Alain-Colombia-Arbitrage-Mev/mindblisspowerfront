import assert from "node:assert/strict";
import test from "node:test";

import { readWalletBinding, requestWalletLink, WalletBindingError, walletBindingFailure } from "./wallet-binding.mjs";

test("wallet binding accepts only a backend-confirmed EVM address", async () => {
  const address = "0x1111111111111111111111111111111111111111";
  const linked = await readWalletBinding({ fetchImpl: async (url, options) => {
    assert.equal(url, "/api/member/wallet-link");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.cache, "no-store");
    return Response.json({ linked: true, address });
  } });
  assert.deepEqual(linked, { linked: true, address });

  const unlinked = await readWalletBinding({ fetchImpl: async () => Response.json({ linked: false }) });
  assert.deepEqual(unlinked, { linked: false, address: "" });
});

test('ownership requests preserve native session boundaries and redact unexpected error bodies', async () => {
  const challenge = { linked: false, challengeId: 'd8a4c010-cc33-44da-a297-8b3c6440f491' };
  const result = await requestWalletLink('/api/member/wallet-link/challenge', { address: '0x' + '1'.repeat(40) }, {
    fetchImpl: async (path, init) => {
      assert.equal(path, '/api/member/wallet-link/challenge');
      assert.equal(init.method, 'POST'); assert.equal(init.credentials, 'same-origin');
      assert.equal(init.redirect, 'error'); assert.equal(init.cache, 'no-store');
      assert.ok(init.signal instanceof AbortSignal);
      return Response.json(challenge);
    },
  });
  assert.deepEqual(result, challenge);
  await assert.rejects(requestWalletLink('/api/member/wallet-link/challenge', {}, {
    fetchImpl: async () => Response.json({ error: 'private database details' }, { status: 503 }),
  }), error => error instanceof WalletBindingError && error.message === 'wallet_link_unavailable');
  await assert.rejects(requestWalletLink('/api/member/wallet-funding/personal/intent', {}, {
    fetchImpl: async () => assert.fail('ownership transport must not be a generic financial proxy'),
  }), { message: 'invalid_request' });
});

test('an aborted ownership read cannot publish a late connected address', async () => {
  const controller = new AbortController();
  const promise = readWalletBinding({ signal: controller.signal, fetchImpl: async () => {
    controller.abort(); return Response.json({ linked: true, address: '0x' + '1'.repeat(40) });
  } });
  await assert.rejects(promise, { name: 'AbortError' });
});

test("wallet binding fails closed for malformed success payloads", async () => {
  await assert.rejects(
    readWalletBinding({ fetchImpl: async () => Response.json({ linked: true, address: "not-an-address" }) }),
    error => error instanceof WalletBindingError && error.status === 502,
  );
});

test("wallet binding separates an expired session from a temporary service failure", async () => {
  for (const [status, code, expected] of [
    [401, "unauthenticated", "session"],
    [503, "wallet_link_unavailable", "unavailable"],
  ]) {
    let caught;
    try {
      await readWalletBinding({ fetchImpl: async () => Response.json({ error: code }, { status }) });
    } catch (error) { caught = error; }
    assert.equal(walletBindingFailure(caught), expected);
  }
});
