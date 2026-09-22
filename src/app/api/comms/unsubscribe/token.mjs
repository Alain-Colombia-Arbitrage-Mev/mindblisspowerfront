// Extrae y valida superficialmente el token de baja desde la query (?t=) o el
// body JSON ({token}). La verificación real de firma ocurre en vp-payments;
// aquí solo se rechaza entrada mal formada (espacios, tipo incorrecto,
// longitud excesiva) antes de reenviarla al backend.
//
// Extracts and lightly validates the unsubscribe token from either the query
// string (?t=) or a JSON body ({token}). Real signature verification happens
// in vp-payments; here we only reject malformed input (whitespace, wrong
// type, oversized) before forwarding it to the backend.
const MAX_LEN = 500;

export function extractToken(query, body) {
  const raw = (query && query.t) || (body && body.token) || "";
  if (typeof raw !== "string" || !raw) return "";
  if (raw.length > MAX_LEN) return "";
  if (/\s/.test(raw)) return "";
  return raw;
}
