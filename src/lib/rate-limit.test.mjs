import test from "node:test";
import assert from "node:assert/strict";

import { rateLimit, __resetRateLimit } from "./rate-limit.js";

test("allows up to the limit then blocks within the window", () => {
  __resetRateLimit();
  const t0 = 1_000_000;
  const rule = (now) => rateLimit([{ key: "a", limit: 3, windowMs: 60_000 }], now);

  assert.equal(rule(t0).allowed, true);
  assert.equal(rule(t0 + 1).allowed, true);
  assert.equal(rule(t0 + 2).allowed, true);

  const blocked = rule(t0 + 3);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec >= 1);
});

test("slides: frees capacity once old hits leave the window", () => {
  __resetRateLimit();
  const t0 = 2_000_000;
  const win = 60_000;
  const call = (now) => rateLimit([{ key: "b", limit: 2, windowMs: win }], now);

  assert.equal(call(t0).allowed, true);
  assert.equal(call(t0 + 10_000).allowed, true);
  assert.equal(call(t0 + 20_000).allowed, false); // 2 en ventana

  // Tras expirar el primer hit (t0), vuelve a haber cupo.
  assert.equal(call(t0 + 61_000).allowed, true);
});

test("multi-rule is atomic: a blocked email rule does not consume the IP rule", () => {
  __resetRateLimit();
  const now = 3_000_000;
  const rules = [
    { key: "ip:1.2.3.4", limit: 100, windowMs: 60_000 },
    { key: "email:x@y.z", limit: 1, windowMs: 60_000 },
  ];

  assert.equal(rateLimit(rules, now).allowed, true); // email llega a 1
  assert.equal(rateLimit(rules, now + 1).allowed, false); // email al tope → bloquea

  // La IP no debió contar el 2º intento: aún tiene 99 de cupo.
  let allowed = 0;
  for (let i = 0; i < 99; i += 1) {
    if (rateLimit([{ key: "ip:1.2.3.4", limit: 100, windowMs: 60_000 }], now + 2 + i).allowed) allowed += 1;
  }
  assert.equal(allowed, 99);
});

test("separate keys are independent", () => {
  __resetRateLimit();
  const now = 4_000_000;
  assert.equal(rateLimit([{ key: "k1", limit: 1, windowMs: 60_000 }], now).allowed, true);
  assert.equal(rateLimit([{ key: "k1", limit: 1, windowMs: 60_000 }], now + 1).allowed, false);
  assert.equal(rateLimit([{ key: "k2", limit: 1, windowMs: 60_000 }], now + 1).allowed, true);
});
