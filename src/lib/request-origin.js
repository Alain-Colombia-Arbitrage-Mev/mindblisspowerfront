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
