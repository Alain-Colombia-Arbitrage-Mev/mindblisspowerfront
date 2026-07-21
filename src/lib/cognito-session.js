export function setCognitoSessionCookies(response, tokens, requestUrl) {
  const accessMaxAge = Number(tokens?.ExpiresIn || 3600);
  setSessionCookie(response, "vp_access_token", tokens?.AccessToken, requestUrl, accessMaxAge);
  setSessionCookie(response, "vp_id_token", tokens?.IdToken, requestUrl, accessMaxAge);

  if (tokens?.RefreshToken) {
    setSessionCookie(response, "vp_refresh_token", tokens.RefreshToken, requestUrl, 60 * 60 * 24 * 30);
  }
}

export function setSessionCookie(response, name, value, requestUrl, maxAge) {
  if (!value) return;

  // En producción la app va detrás de Caddy (TLS); request.url interno es http,
  // así que no podemos depender de su protocolo para marcar Secure.
  const secure = process.env.NODE_ENV === "production" || requestUrl?.protocol === "https:";

  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge,
  });
}

export function clearCookie(response, name) {
  response.cookies.set(name, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export function buildUserFromIdToken(idToken, fallbackEmail) {
  const claims = decodeJwtPayload(idToken);
  const email = claims.email || fallbackEmail;
  const name = claims.name || claims.given_name || email;
  const id = claims.sub || `member-${Date.now()}`;

  return {
    id,
    name,
    email,
    phone: claims.phone_number || "",
    country: claims.address?.country || "",
    company: "Mindbliss Power",
    rank: "Miembro",
    role: "user",
    type: "user",
    user_type: "DIRECT",
    path: "member",
  };
}

export function buildDemoUser(email) {
  return {
    id: `member-${email.replace(/[^a-z0-9]/gi, "_")}`,
    name: "Miembro Mindbliss",
    email,
    company: "Mindbliss Power",
    rank: "Miembro",
    role: "user",
    type: "user",
    user_type: "DIRECT",
    path: "member",
  };
}

/**
 * Decodifica (SIN verificar firma) el payload de un id token.
 *
 * Sólo es aceptable aquí porque el token viene RECIÉN emitido por Cognito en la
 * respuesta del login (InitiateAuth / RespondToAuthChallenge), no de una cookie
 * enviada por el cliente: no es una frontera de confianza, sólo se usa para
 * pintar el perfil en la UI. NO usar esta función para autorizar nada — para eso
 * está @/lib/verify-id-token.
 *
 * Aun así, exigimos `exp`: un token sin caducidad se considera inválido.
 */
function decodeJwtPayload(token) {
  try {
    const payload = String(token).split(".")[1];
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof claims.exp !== "number") return {};
    return claims;
  } catch {
    return {};
  }
}
