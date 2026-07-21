/**
 * verify-id-token.js — verificación REAL del id token de Cognito.
 *
 * server-only: NUNCA importar desde un componente cliente (aws-jwt-verify usa
 * APIs de Node y hace fetch del JWKS).
 *
 * Antes, el BFF decodificaba el payload del JWT con base64url y confiaba en el
 * claim `email` SIN verificar la firma. Cualquiera podía fabricar un token
 * (`x.<base64({"email":"admin@..."})>.x`) y suplantar a cualquier afiliado o
 * al super-admin. Este módulo verifica firma (JWKS del user pool) + issuer +
 * audience (client id) + token_use=id + expiración, y es FAIL-CLOSED: ante
 * cualquier fallo (incluida configuración ausente) devuelve null.
 */
import { CognitoJwtVerifier } from "aws-jwt-verify";

// Singleton perezoso: se construye en la primera llamada para que un env
// ausente en build time no rompa el build ni dispare red durante SSG.
let _verifier = null;
let _warned = false;

function normalizeUserPoolId(userPoolId) {
  const normalized = String(userPoolId || "").trim();
  return /^[a-z]{2}(?:-gov)?-[a-z]+-\d_[A-Za-z0-9]+$/.test(normalized) ? normalized : "";
}

function getVerifier() {
  if (_verifier) return _verifier;

  // Mismos nombres de env que ya usa growth-hub (src/lib/cognito.js).
  const userPoolId = normalizeUserPoolId(process.env.COGNITO_USER_POOL_ID);
  const clientId = String(process.env.COGNITO_CLIENT_ID || "").trim();

  if (!userPoolId) {
    if (!_warned) {
      _warned = true;
      console.error(
        "[verify-id-token] COGNITO_USER_POOL_ID ausente o inválido — toda sesión será rechazada (fail-closed)"
      );
    }
    return null;
  }

  // Sin client id no podemos validar `aud`. Fail-closed: preferimos rechazar a
  // aceptar tokens de otro cliente del mismo pool.
  if (!clientId) {
    if (!_warned) {
      _warned = true;
      console.error(
        "[verify-id-token] COGNITO_CLIENT_ID ausente — toda sesión será rechazada (fail-closed)"
      );
    }
    return null;
  }

  _verifier = CognitoJwtVerifier.create({ userPoolId, clientId, tokenUse: "id" });
  return _verifier;
}

/**
 * Verifica un id token de Cognito por completo (firma + iss + aud + token_use + exp).
 * @param {string} token id token crudo (JWT compacto)
 * @returns {Promise<Record<string, any> | null>} claims verificados con `email`
 *   normalizado, o null ante CUALQUIER fallo (fail-closed).
 */
export async function verifyIdToken(token) {
  return verifyIdTokenWith(getVerifier(), token);
}

/**
 * Núcleo testeable: misma lógica que verifyIdToken pero con el verificador
 * inyectado (permite probar el camino feliz sin firmar un token real).
 * @param {{verify: (t: string) => Promise<any>} | null} verifier
 * @param {string} token
 */
export async function verifyIdTokenWith(verifier, token) {
  if (!token || typeof token !== "string") return null;
  if (!verifier) return null;

  try {
    const payload = await verifier.verify(token);
    // `exp` obligatorio: un token sin exp jamás caduca. aws-jwt-verify valida
    // exp cuando está presente; aquí exigimos que esté.
    if (typeof payload.exp !== "number") return null;
    const email = String(payload.email || "").trim().toLowerCase();
    if (!email) return null;
    return { ...payload, email };
  } catch (err) {
    // Fail-closed. debug para no inundar logs con tokens expirados.
    console.debug("[verify-id-token] verificación fallida:", err?.message);
    return null;
  }
}

/**
 * Email verificado del id token, o "" si el token no es válido.
 * @param {string} token
 * @returns {Promise<string>}
 */
export async function verifiedEmailFromIdToken(token) {
  const claims = await verifyIdToken(token);
  return claims ? claims.email : "";
}
