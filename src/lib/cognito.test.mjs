import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCognitoAuthorizeUrl,
  buildCognitoPasswordAuthPayload,
  buildCognitoLogoutUrl,
  buildCognitoSecretHash,
  buildCognitoSignUpPayload,
  buildTokenRequestBody,
  getCognitoIdentityProviderConfig,
  getRequiredCognitoConfig,
  normalizeCognitoDomain,
} from "./cognito.js";

test("normalizes Cognito domain with HTTPS", () => {
  assert.equal(
    normalizeCognitoDomain("demo.auth.us-east-1.amazoncognito.com"),
    "https://demo.auth.us-east-1.amazoncognito.com"
  );
});

test("builds Cognito hosted UI authorization URL", () => {
  const url = new URL(
    buildCognitoAuthorizeUrl({
      domain: "https://demo.auth.us-east-1.amazoncognito.com",
      clientId: "client-123",
      redirectUri: "https://app.vicion.test/api/auth/cognito/callback",
      state: "state-123",
      nonce: "nonce-456",
      scopes: ["openid", "email", "profile"],
    })
  );

  assert.equal(url.origin, "https://demo.auth.us-east-1.amazoncognito.com");
  assert.equal(url.pathname, "/oauth2/authorize");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("client_id"), "client-123");
  assert.equal(url.searchParams.get("redirect_uri"), "https://app.vicion.test/api/auth/cognito/callback");
  assert.equal(url.searchParams.get("state"), "state-123");
  assert.equal(url.searchParams.get("nonce"), "nonce-456");
  assert.equal(url.searchParams.get("scope"), "openid email profile");
});

test("adds login_hint for passwordless email entry", () => {
  const url = new URL(
    buildCognitoAuthorizeUrl({
      domain: "https://demo.auth.us-east-1.amazoncognito.com",
      clientId: "client-123",
      redirectUri: "https://app.vicion.test/api/auth/cognito/callback",
      state: "state-123",
      loginHint: "Miembro@Vicion.test",
    })
  );

  assert.equal(url.searchParams.get("login_hint"), "Miembro@Vicion.test");
});

test("builds Cognito logout URL", () => {
  const url = new URL(
    buildCognitoLogoutUrl({
      domain: "demo.auth.us-east-1.amazoncognito.com",
      clientId: "client-123",
      logoutUri: "https://app.vicion.test/login",
    })
  );

  assert.equal(url.pathname, "/logout");
  assert.equal(url.searchParams.get("client_id"), "client-123");
  assert.equal(url.searchParams.get("logout_uri"), "https://app.vicion.test/login");
});

test("infers Cognito identity provider endpoint from hosted UI domain", () => {
  const config = getCognitoIdentityProviderConfig({
    COGNITO_DOMAIN: "demo.auth.us-east-1.amazoncognito.com",
    COGNITO_CLIENT_ID: "client-123",
  });

  assert.equal(config.region, "us-east-1");
  assert.equal(config.endpoint, "https://cognito-idp.us-east-1.amazonaws.com/");
});

test("builds USER_PASSWORD_AUTH payload with secret hash", () => {
  const payload = buildCognitoPasswordAuthPayload({
    clientId: "client-123",
    clientSecret: "secret-456",
    username: "Miembro@Mindbliss.test",
    password: "StrongPassword123!",
  });

  assert.equal(payload.AuthFlow, "USER_PASSWORD_AUTH");
  assert.equal(payload.ClientId, "client-123");
  assert.equal(payload.AuthParameters.USERNAME, "miembro@mindbliss.test");
  assert.equal(payload.AuthParameters.PASSWORD, "StrongPassword123!");
  assert.equal(
    payload.AuthParameters.SECRET_HASH,
    buildCognitoSecretHash({
      username: "miembro@mindbliss.test",
      clientId: "client-123",
      clientSecret: "secret-456",
    })
  );
});

test("builds SignUp payload without storing empty attributes", () => {
  const payload = buildCognitoSignUpPayload({
    clientId: "client-123",
    username: "Miembro@Mindbliss.test",
    password: "StrongPassword123!",
    attributes: [
      { Name: "email", Value: "miembro@mindbliss.test" },
      { Name: "name", Value: "Miembro Mindbliss" },
      { Name: "phone_number", Value: "" },
    ],
  });

  assert.equal(payload.Username, "miembro@mindbliss.test");
  assert.equal(payload.Password, "StrongPassword123!");
  assert.deepEqual(payload.UserAttributes, [
    { Name: "email", Value: "miembro@mindbliss.test" },
    { Name: "name", Value: "Miembro Mindbliss" },
  ]);
});

test("builds authorization code token request body", () => {
  const body = buildTokenRequestBody({
    code: "auth-code",
    clientId: "client-123",
    redirectUri: "https://app.vicion.test/api/auth/cognito/callback",
  });

  assert.equal(body.get("grant_type"), "authorization_code");
  assert.equal(body.get("code"), "auth-code");
  assert.equal(body.get("client_id"), "client-123");
  assert.equal(body.get("redirect_uri"), "https://app.vicion.test/api/auth/cognito/callback");
});

test("requires Cognito domain and client id", () => {
  assert.throws(
    () => getRequiredCognitoConfig({ COGNITO_DOMAIN: "", COGNITO_CLIENT_ID: "" }),
    /COGNITO_DOMAIN/
  );
});
