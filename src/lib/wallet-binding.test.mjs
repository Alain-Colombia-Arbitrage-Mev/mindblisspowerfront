import assert from "node:assert/strict";
import test from "node:test";

import { readWalletBinding, WalletBindingError, walletBindingFailure } from "./wallet-binding.mjs";

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
