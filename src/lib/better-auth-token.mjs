import { JwtVerifier } from "aws-jwt-verify";

export function validBetterAuthClaims(payload, now = Math.floor(Date.now() / 1000)) {
  return Boolean(payload && typeof payload.sub === "string" && payload.sub.trim()
    && typeof payload.person_public_id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.person_public_id)
    && payload.email_verified === true && payload.authVerified === true
    && typeof payload.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
    && Number.isInteger(payload.iat) && Number.isInteger(payload.exp)
    && payload.iat <= now + 30 && payload.exp > now && payload.exp > payload.iat && payload.exp - payload.iat <= 300);
}

export function createBetterAuthVerifier(env = process.env) {
  const issuer = env.BETTER_AUTH_JWT_ISSUER;
  const audience = env.BETTER_AUTH_JWT_AUDIENCE;
  const uri = new URL(env.BETTER_AUTH_JWKS_URL || "");
  if (!issuer || !audience || uri.username || uri.password || uri.hash || uri.search
    || (uri.protocol !== "https:" && !(env.NODE_ENV !== "production" && ["127.0.0.1", "localhost", "[::1]"].includes(uri.hostname) && uri.protocol === "http:"))) {
    throw new Error("better_auth_verifier_configuration_invalid");
  }
  return JwtVerifier.create({ issuer, audience, jwksUri: uri.href,
    customJwtCheck: ({ header, payload }) => {
      if (header.alg !== "RS256" || !validBetterAuthClaims(payload)) throw new Error("invalid_auth_identity");
    },
  });
}
