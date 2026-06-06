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

  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
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

function decodeJwtPayload(token) {
  try {
    const payload = String(token).split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return {};
  }
}
