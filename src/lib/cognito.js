import { createHmac } from "node:crypto";

const DEFAULT_SCOPES = ["openid", "email", "profile"];

export function normalizeCognitoDomain(domain) {
  const trimmed = String(domain || "").trim().replace(/\/+$/, "");
  if (!trimmed) {
    throw new Error("COGNITO_DOMAIN is required");
  }

  return trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;
}

export function getRequiredCognitoConfig(env = {}) {
  const domain = env.COGNITO_DOMAIN;
  const clientId = env.COGNITO_CLIENT_ID;

  if (!domain) {
    throw new Error("COGNITO_DOMAIN is required");
  }

  if (!clientId) {
    throw new Error("COGNITO_CLIENT_ID is required");
  }

  return {
    domain: normalizeCognitoDomain(domain),
    clientId,
    clientSecret: env.COGNITO_CLIENT_SECRET || "",
    redirectUri: env.COGNITO_REDIRECT_URI || "",
    logoutUri: env.COGNITO_LOGOUT_URI || "",
    scopes: parseScopes(env.COGNITO_SCOPES),
  };
}

export function getCognitoIdentityProviderConfig(env = {}) {
  const clientId = String(env.COGNITO_CLIENT_ID || "").trim();
  const userPoolId = normalizeCognitoUserPoolId(env.COGNITO_USER_POOL_ID);
  const domain = env.COGNITO_DOMAIN ? normalizeCognitoDomain(env.COGNITO_DOMAIN) : "";
  const region = normalizeCognitoRegion(
    env.COGNITO_REGION ||
      inferRegionFromUserPoolId(userPoolId) ||
      (domain ? inferRegionFromDomain(domain) : "")
  );

  if (!clientId) {
    throw new Error("COGNITO_CLIENT_ID is required");
  }

  if (!region) {
    throw new Error("COGNITO_REGION or COGNITO_USER_POOL_ID is required for direct Cognito API auth");
  }

  const issuer = userPoolId ? `https://cognito-idp.${region}.amazonaws.com/${userPoolId}` : "";

  return {
    domain,
    clientId,
    clientSecret: env.COGNITO_CLIENT_SECRET || "",
    redirectUri: env.COGNITO_REDIRECT_URI || "",
    logoutUri: env.COGNITO_LOGOUT_URI || "",
    scopes: parseScopes(env.COGNITO_SCOPES),
    userPoolId,
    identityPoolId: normalizeCognitoIdentityPoolId(env.COGNITO_IDENTITY_POOL_ID),
    region,
    issuer,
    jwksUrl: issuer ? `${issuer}/.well-known/jwks.json` : "",
    endpoint: `https://cognito-idp.${region}.amazonaws.com/`,
  };
}

export function buildCognitoAuthorizeUrl({
  domain,
  clientId,
  redirectUri,
  state,
  nonce,
  scopes = DEFAULT_SCOPES,
  loginHint = "",
}) {
  const url = new URL("/oauth2/authorize", normalizeCognitoDomain(domain));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", normalizeScopes(scopes).join(" "));
  url.searchParams.set("state", state);

  if (nonce) {
    url.searchParams.set("nonce", nonce);
  }

  if (loginHint) {
    url.searchParams.set("login_hint", String(loginHint).trim());
  }

  return url.toString();
}

export function buildCognitoPasswordAuthPayload({ clientId, clientSecret = "", username, password }) {
  const normalizedUsername = normalizeUsername(username);
  const authParameters = {
    USERNAME: normalizedUsername,
    PASSWORD: String(password || ""),
  };

  if (clientSecret) {
    authParameters.SECRET_HASH = buildCognitoSecretHash({
      username: normalizedUsername,
      clientId,
      clientSecret,
    });
  }

  return {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: clientId,
    AuthParameters: authParameters,
  };
}

export function buildCognitoEmailOtpStartPayload({ clientId, clientSecret = "", username }) {
  const normalizedUsername = normalizeUsername(username);
  const authParameters = {
    USERNAME: normalizedUsername,
    PREFERRED_CHALLENGE: "EMAIL_OTP",
  };

  if (clientSecret) {
    authParameters.SECRET_HASH = buildCognitoSecretHash({
      username: normalizedUsername,
      clientId,
      clientSecret,
    });
  }

  return {
    AuthFlow: "USER_AUTH",
    ClientId: clientId,
    AuthParameters: authParameters,
  };
}

export function buildCognitoChallengeResponsePayload({
  clientId,
  clientSecret = "",
  username,
  challengeName,
  session,
  responses = {},
}) {
  const normalizedUsername = normalizeUsername(username);
  const challengeResponses = {
    ...responses,
    USERNAME: normalizedUsername,
  };

  if (clientSecret) {
    challengeResponses.SECRET_HASH = buildCognitoSecretHash({
      username: normalizedUsername,
      clientId,
      clientSecret,
    });
  }

  const payload = {
    ClientId: clientId,
    ChallengeName: challengeName,
    ChallengeResponses: challengeResponses,
  };

  if (session) {
    payload.Session = String(session);
  }

  return payload;
}

export function buildCognitoSignUpPayload({
  clientId,
  clientSecret = "",
  username,
  password,
  attributes = [],
}) {
  const normalizedUsername = normalizeUsername(username);
  const payload = {
    ClientId: clientId,
    Username: normalizedUsername,
    Password: String(password || ""),
    UserAttributes: normalizeUserAttributes(attributes),
  };

  if (clientSecret) {
    payload.SecretHash = buildCognitoSecretHash({
      username: normalizedUsername,
      clientId,
      clientSecret,
    });
  }

  return payload;
}

export function buildCognitoSecretHash({ username, clientId, clientSecret }) {
  return createHmac("sha256", clientSecret)
    .update(`${normalizeUsername(username)}${clientId}`)
    .digest("base64");
}

export function buildCognitoLogoutUrl({ domain, clientId, logoutUri }) {
  const url = new URL("/logout", normalizeCognitoDomain(domain));
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("logout_uri", logoutUri);
  return url.toString();
}

export function buildTokenRequestBody({ code, clientId, redirectUri }) {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("client_id", clientId);
  body.set("redirect_uri", redirectUri);
  return body;
}

export function buildClientSecretAuthorization(clientId, clientSecret) {
  if (!clientSecret) return {};

  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  return { Authorization: `Basic ${encoded}` };
}

function parseScopes(scopes) {
  if (!scopes) return DEFAULT_SCOPES;
  return normalizeScopes(String(scopes).split(/[,\s]+/));
}

function normalizeScopes(scopes) {
  const normalized = Array.isArray(scopes) ? scopes : DEFAULT_SCOPES;
  const unique = normalized.map((scope) => String(scope).trim()).filter(Boolean);
  return unique.length > 0 ? [...new Set(unique)] : DEFAULT_SCOPES;
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function normalizeUserAttributes(attributes) {
  const unique = new Map();

  attributes.forEach((attribute) => {
    const name = String(attribute?.Name || "").trim();
    const value = String(attribute?.Value || "").trim();
    if (name && value) unique.set(name, value);
  });

  return [...unique.entries()].map(([Name, Value]) => ({ Name, Value }));
}

function inferRegionFromDomain(domain) {
  const normalized = normalizeCognitoDomain(domain);
  const host = new URL(normalized).hostname;
  const match = host.match(/\.auth\.([a-z]{2}(?:-gov)?-[a-z]+-\d)\.amazoncognito\.com$/i);
  return match?.[1] || "";
}

function normalizeCognitoRegion(region) {
  const normalized = String(region || "").trim();
  return /^[a-z]{2}(?:-gov)?-[a-z]+-\d$/.test(normalized) ? normalized : "";
}

function inferRegionFromUserPoolId(userPoolId) {
  const match = String(userPoolId || "").match(/^([a-z]{2}(?:-gov)?-[a-z]+-\d)_[A-Za-z0-9]+$/);
  return match?.[1] || "";
}

function normalizeCognitoUserPoolId(userPoolId) {
  const normalized = String(userPoolId || "").trim();
  return /^[a-z]{2}(?:-gov)?-[a-z]+-\d_[A-Za-z0-9]+$/.test(normalized) ? normalized : "";
}

function normalizeCognitoIdentityPoolId(identityPoolId) {
  const normalized = String(identityPoolId || "").trim();
  return /^[a-z]{2}(?:-gov)?-[a-z]+-\d:[0-9a-f-]{36}$/i.test(normalized) ? normalized : "";
}
