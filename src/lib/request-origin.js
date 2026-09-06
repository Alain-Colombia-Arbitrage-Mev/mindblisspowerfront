/**
 * Resuelve el origen público real de la petición.
 *
 * Detrás de Caddy/Next standalone, `new URL(request.url)` toma el host interno
 * (127.0.0.1:3000) y los redirects salen a localhost. Aquí preferimos los
 * headers del proxy (x-forwarded-host/proto) para que todo apunte al dominio.
 */
export function resolveOrigin(request) {
  const headers = request.headers;
  const forwardedHost = headers.get("x-forwarded-host") || headers.get("host");
  const forwardedProto = headers.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // Último recurso: lo que venga en la URL (dev local sin proxy).
  return new URL(request.url).origin;
}

export function originUrl(request, path) {
  return new URL(path, resolveOrigin(request));
}

/**
 * Defensa CSRF para mutaciones autenticadas por cookie. Los navegadores envían
 * Origin en fetch POST/PUT; exigimos que coincida con el origen público real.
 */
export function hasSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const supplied = new URL(origin);
    const expected = new URL(resolveOrigin(request));
    if (supplied.host !== expected.host) return false;
    // En desarrollo no hay x-forwarded-proto y el helper histórico asume HTTPS;
    // si el proxy sí declara protocolo, también debe coincidir exactamente.
    const forwardedProto = request.headers.get("x-forwarded-proto");
    return !forwardedProto || supplied.protocol === `${forwardedProto}:`;
  } catch {
    return false;
  }
}
