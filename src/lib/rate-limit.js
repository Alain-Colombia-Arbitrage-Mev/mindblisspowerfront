/**
 * Rate limiter en memoria (sliding window) para los endpoints de auth.
 * In-memory sliding-window rate limiter for the auth endpoints.
 *
 * mindbliss-web corre como un solo nodo, así que un Map local al proceso es
 * suficiente (mismo supuesto que el limitador previo de /register). Si algún
 * día se escala a varios nodos, mover esto a Redis con la MISMA forma de API.
 *
 * mindbliss-web runs as a single node, so a process-local Map is enough. If it
 * ever scales to multiple nodes, move this to Redis keeping the same API shape.
 */

const buckets = new Map(); // key -> number[] (timestamps de hits dentro de la ventana)
let lastSweep = 0;

const HOUR_MS = 3_600_000;
const SWEEP_EVERY_MS = 60_000;
const SWEEP_SIZE = 20_000;

function prune(key, windowMs, now) {
  let hits = buckets.get(key);
  if (!hits) {
    hits = [];
    buckets.set(key, hits);
    return hits;
  }
  const cutoff = now - windowMs;
  // Los timestamps entran en orden creciente, así que basta con recortar el frente.
  let i = 0;
  while (i < hits.length && hits[i] <= cutoff) i += 1;
  if (i > 0) hits.splice(0, i);
  return hits;
}

function maybeSweep(now) {
  if (now - lastSweep < SWEEP_EVERY_MS && buckets.size < SWEEP_SIZE) return;
  lastSweep = now;
  for (const [key, hits] of buckets) {
    if (hits.length === 0 || hits[hits.length - 1] <= now - HOUR_MS) buckets.delete(key);
  }
}

/**
 * Evalúa varias reglas de forma atómica: si CUALQUIERA está al tope, no cuenta
 * ningún hit y devuelve el retry-after más largo; si todas pasan, cuenta un hit
 * en cada una. JS es de un solo hilo y no hay await intermedio, así que la
 * evaluación + commit es atómica.
 *
 * Evaluate several rules atomically: if ANY is at its cap, no hit is recorded
 * and the longest retry-after is returned; if all pass, one hit is recorded per
 * rule. Single-threaded, no interleaving await → atomic.
 *
 * @param {{key:string,limit:number,windowMs:number}[]} rules
 * @returns {{allowed:boolean, retryAfterSec:number}}
 */
export function rateLimit(rules, now = Date.now()) {
  let blockedRetry = 0;
  for (const rule of rules) {
    const hits = prune(rule.key, rule.windowMs, now);
    if (hits.length >= rule.limit) {
      const retryAfterSec = Math.max(1, Math.ceil((hits[0] + rule.windowMs - now) / 1000));
      if (retryAfterSec > blockedRetry) blockedRetry = retryAfterSec;
    }
  }
  if (blockedRetry > 0) return { allowed: false, retryAfterSec: blockedRetry };

  for (const rule of rules) buckets.get(rule.key).push(now);
  maybeSweep(now);
  return { allowed: true, retryAfterSec: 0 };
}

/** IP del cliente detrás de proxy/CDN. Client IP behind proxy/CDN. */
export function clientIp(request) {
  const xff = request.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0].trim();
  return ip || request.headers.get("x-real-ip") || "unknown";
}

/** Solo para pruebas: reinicia el estado. Test-only: reset state. */
export function __resetRateLimit() {
  buckets.clear();
  lastSweep = 0;
}
