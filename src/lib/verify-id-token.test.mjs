/**
 * Regresión de seguridad: el BFF NO debe aceptar id tokens forjados.
 *
 * Antes del fix, sessionEmail() decodificaba el payload con base64url sin
 * verificar la firma, así que este token bastaba para suplantar al super-admin:
 *
 *   TOKEN='x.'$(printf '{"email":"devfidubit@gmail.com"}' | base64 | tr '+/' '-_' | tr -d '=')'.x'
 *   curl https://app.mindblisspower.com/api/admin/finance -H "Cookie: vp_id_token=$TOKEN"
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { verifyIdToken, verifyIdTokenWith } from "./verify-id-token.js";

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");

/** Token forjado del exploit: firma basura, email de super-admin. */
const FORGED_TOKEN = `x.${b64url({ email: "devfidubit@gmail.com" })}.x`;

/** El payload que el decodificador inseguro sí extraía del token forjado. */
function insecureDecode(token) {
  const payload = JSON.parse(Buffer.from(String(token).split(".")[1], "base64url").toString("utf8"));
  return String(payload.email || "").trim().toLowerCase();
}

test("el token forjado SÍ engañaba al decodificador inseguro (baseline del exploit)", () => {
  assert.equal(insecureDecode(FORGED_TOKEN), "devfidubit@gmail.com");
});

test("token forjado ⇒ rechazado (firma inválida)", async () => {
  process.env.COGNITO_USER_POOL_ID = "us-east-1_8tLjOfPH1";
  process.env.COGNITO_CLIENT_ID = "client-123";
  assert.equal(await verifyIdToken(FORGED_TOKEN), null);
});

test("sin configuración de Cognito ⇒ fail-closed (null), nunca abierto", async () => {
  assert.equal(await verifyIdTokenWith(null, FORGED_TOKEN), null);
});

// --- camino feliz: verificador mockeado (no podemos firmar con la clave de Cognito) ---

const okVerifier = (payload) => ({ verify: async () => payload });
const futureExp = Math.floor(Date.now() / 1000) + 3600;

test("token legítimo ⇒ devuelve el email (camino feliz intacto)", async () => {
  const claims = await verifyIdTokenWith(
    okVerifier({ email: "Miembro@MindBliss.com", exp: futureExp, token_use: "id", name: "Ana" }),
    "token.legitimo.firmado"
  );
  assert.equal(claims.email, "miembro@mindbliss.com");
  assert.equal(claims.name, "Ana");
});

test("token sin claim exp ⇒ rechazado (un token sin exp nunca caducaría)", async () => {
  const claims = await verifyIdTokenWith(
    okVerifier({ email: "devfidubit@gmail.com", token_use: "id" }),
    "token.sin.exp"
  );
  assert.equal(claims, null);
});

test("token verificado pero sin email ⇒ rechazado", async () => {
  assert.equal(await verifyIdTokenWith(okVerifier({ exp: futureExp }), "t.o.k"), null);
});

test("verificador que lanza ⇒ null (fail-closed, no propaga la excepción)", async () => {
  const throwing = { verify: async () => { throw new Error("JwtExpiredError"); } };
  assert.equal(await verifyIdTokenWith(throwing, "t.o.k"), null);
});

test("token vacío o no-string ⇒ null", async () => {
  assert.equal(await verifyIdTokenWith(okVerifier({ email: "a@b.c", exp: futureExp }), ""), null);
  assert.equal(await verifyIdTokenWith(okVerifier({ email: "a@b.c", exp: futureExp }), undefined), null);
});
