import test from "node:test";
import assert from "node:assert/strict";

import { presetRules, PRESETS } from "../../../../lib/rate-limit-presets.mjs";
import { rateLimit, __resetRateLimit } from "../../../../lib/rate-limit.js";

test("token extraction accepts query and form body", async () => {
  const { extractToken } = await import("./token.mjs");
  assert.equal(extractToken({ t: "abc" }, null), "abc");
  assert.equal(extractToken({}, { token: "xyz" }), "xyz");
  assert.equal(extractToken({ t: "a b" }, null), "");           // espacios no válidos
  assert.equal(extractToken({ t: "x".repeat(600) }, null), ""); // demasiado largo
});

// Ejercita la MISMA ruta de código que el guardia HTTP (presetRules + rateLimit),
// sin `next/server`, que no resuelve bajo `node --test`.
function hit({ ip, token }) {
  return rateLimit(presetRules({ name: "unsubscribe", preset: "unsubscribe", ip, email: token }));
}

// I1: la baja usaba el preset "send" (20/min por IP + cooldown de 45 s por
// "email"). Un comunicado a toda la base concentra las bajas en los primeros
// minutos y, detrás de un CGNAT o del proxy de Gmail, comparten IP: el 21.º
// clic recibía 429 y la persona quedaba suscrita. El preset propio es holgado
// por IP y estricto por token (anti fuerza-bruta del mismo enlace).
test("preset unsubscribe existe y es holgado por IP", () => {
  assert.ok(PRESETS.unsubscribe, "falta el preset unsubscribe");
  assert.equal(PRESETS.unsubscribe.ip.limit, 600);
  assert.equal(PRESETS.unsubscribe.email.limit, 5);

  __resetRateLimit();
  // 30 bajas seguidas desde la MISMA IP con tokens distintos: ninguna limitada.
  for (let i = 0; i < 30; i += 1) {
    assert.equal(hit({ ip: "10.0.0.1", token: `tok-${i}` }).allowed, true, `la baja #${i + 1} desde la misma IP no debe limitarse`);
  }
});

test("preset unsubscribe: estricto por token (5/min)", () => {
  __resetRateLimit();
  for (let i = 0; i < 5; i += 1) {
    assert.equal(hit({ ip: "10.0.0.2", token: "tok-fijo" }).allowed, true, `intento ${i + 1} con el mismo token debe pasar`);
  }
  const blocked = hit({ ip: "10.0.0.2", token: "tok-fijo" });
  assert.equal(blocked.allowed, false, "el 6.º intento con el mismo token debe limitarse");
  assert.ok(blocked.retryAfterSec >= 1);
});

// El cooldown de 45 s de OTP solo debe aplicar al preset "send": si se colara
// en "unsubscribe", dos clics seguidos del mismo enlace darían 429 en vez de
// ser idempotentes.
test("otpSendRules no se aplica al preset unsubscribe", () => {
  __resetRateLimit();
  assert.equal(hit({ ip: "10.0.0.3", token: "t1" }).allowed, true);
  assert.equal(hit({ ip: "10.0.0.3", token: "t1" }).allowed, true);

  const keys = presetRules({ name: "unsubscribe", preset: "unsubscribe", ip: "1.2.3.4", email: "t1" }).map((r) => r.key);
  assert.ok(!keys.some((k) => k.startsWith("otp-send:")), `no debe incluir reglas de OTP: ${keys.join(", ")}`);

  // Contraste: con el preset "send" el cooldown sí está presente y bloquea.
  __resetRateLimit();
  const send = (email) => rateLimit(presetRules({ name: "otp", preset: "send", ip: "10.0.0.4", email }));
  assert.equal(send("a@x.com").allowed, true);
  assert.equal(send("a@x.com").allowed, false, "el preset send mantiene el cooldown de 45 s");
});
