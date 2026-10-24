import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { verifyIdToken, verifyIdTokenWith } from "./verify-id-token.js";

const userPoolId = "us-east-1_QaSafety123";
const issuer = `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`;
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const verifier = CognitoJwtVerifier.create({ userPoolId, tokenUse: "id", clientId: "qa-client" });
verifier.cacheJwks({ keys: [{ ...publicKey.export({ format: "jwk" }), kid: "local-test", alg: "RS256", use: "sig" }] });
const claims = { iss: issuer, aud: "qa-client", token_use: "id", sub: "qa-fixture", email: "Member@Example.Invalid", exp: Math.floor(Date.now() / 1000) + 300 };
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
function token(payload = claims) {
  const input = `${encode({ alg: "RS256", kid: "local-test" })}.${encode(payload)}`;
  return `${input}.${sign("RSA-SHA256", Buffer.from(input), privateKey).toString("base64url")}`;
}
test("updated JWT dependency verifies a real RSA signature with local JWKS, without network", async () => {
  assert.equal((await verifyIdTokenWith(verifier, token())).email, "member@example.invalid");
});
test("updated JWT dependency rejects a modified identity with the original signature", async () => {
  const original = token().split(".");
  original[1] = encode({ ...claims, email: "attacker@example.invalid" });
  assert.equal(await verifyIdTokenWith(verifier, original.join(".")), null);
});
for (const [label, change] of [["audience", { aud: "other-client" }], ["issuer", { iss: "https://invalid.example.test" }], ["token use", { token_use: "access" }], ["expiry", { exp: 1 }], ["missing expiry", { exp: undefined }]]) test(`signed JWT with invalid ${label} is rejected`, async () => {
  assert.equal(await verifyIdTokenWith(verifier, token({ ...claims, ...change })), null);
});
test("missing client configuration cannot disable audience verification", async () => {
  const keys = ["COGNITO_USER_POOL_ID", "COGNITO_CLIENT_ID", "DEMO_LOGIN_ENABLED"];
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.env.COGNITO_USER_POOL_ID = userPoolId;
    delete process.env.COGNITO_CLIENT_ID;
    delete process.env.DEMO_LOGIN_ENABLED;
    assert.equal(await verifyIdToken(token()), null);
  } finally {
    for (const key of keys) if (previous[key] == null) delete process.env[key]; else process.env[key] = previous[key];
  }
});
