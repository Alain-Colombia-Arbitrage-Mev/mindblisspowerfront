import { AsyncLocalStorage } from 'node:async_hooks';

// Shared only as a scope carrier across OpenNext's separately bundled modules.
// Connections, fetch promises and session data belong to a request, never an isolate.
const scopeKey = Symbol.for('mindbliss.cloudflare.request-context');
const scopes = globalThis[scopeKey] ??= new AsyncLocalStorage();
const privateHosts = new Set(['auth.core.internal', 'core.internal', 'payments.core.internal', 'withdrawals.core.internal', 'engine.core.internal']);

export const getCloudflareScope = () => scopes.getStore();
export const runtimeEnvironment = () => getCloudflareScope()?.env || process.env;

/** Private, server-to-server transport. Workers never fall back to public DNS. */
export async function coreFetch(input, init) {
  const scope = getCloudflareScope();
  if (!scope) {
    if (typeof globalThis.WebSocketPair === 'function') throw new Error('worker_request_scope_required');
    return fetch(input, init);
  }
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash || !privateHosts.has(url.hostname)
    || typeof scope.env.CORE_API?.fetch !== 'function') throw new Error('private_api_unavailable');
  return scope.env.CORE_API.fetch(input, { ...init, redirect: 'manual', cache: 'no-store' });
}

async function closeResources(scope) {
  if (scope.closed) return;
  scope.closed = true;
  await Promise.allSettled([...scope.resources.values()].map(resource => resource?.end?.({ timeout: 2 })));
}

/** Keep resources alive for streaming SSR; close at EOF, cancellation or failure. */
export async function runCloudflareRequest(request, env, ctx, handler) {
  // Bindings omit Node's process environment. Never silently enable development
  // URL/IP relaxations when a Worker binding does not contain NODE_ENV.
  const scope = { env: { ...env, NODE_ENV: 'production' }, resources: new Map(), closed: false };
  const close = () => { const completion = closeResources(scope); ctx.waitUntil(completion); return completion; };
  return scopes.run(scope, async () => {
    try {
      const response = await handler(request, env, ctx);
      if (!response.body) { await close(); return response; }
      const reader = response.body.getReader();
      const stream = new ReadableStream({
        async pull(controller) {
          try {
            const result = await scopes.run(scope, () => reader.read());
            if (result.done) { controller.close(); await close(); }
            else controller.enqueue(result.value);
          } catch (error) { controller.error(error); await close(); }
        },
        async cancel(reason) { try { await reader.cancel(reason); } finally { await close(); } },
      });
      return new Response(stream, { status: response.status, statusText: response.statusText, headers: response.headers });
    } catch (error) { await close(); throw error; }
  });
}

export function cloudflareReadiness(env) {
  let origin;
  try { origin = new URL(env.AUTH_PUBLIC_ORIGIN); } catch { return false; }
  return env.CLOUDFLARE_DEPLOYMENT_READY === 'true' && env.AUTH_PROVIDER === 'better-auth'
    && origin.protocol === 'https:' && !origin.username && !origin.password
    && origin.href === `${origin.origin}/` && env.AUTH_PUBLIC_ORIGIN === origin.origin
    && env.MEMBER_DB_PROVIDER === 'hyperdrive'
    && env.MEMBER_DB_QUERY_CACHE_DISABLED === 'true'
    && Boolean(env.HYPERDRIVE_MEMBER_FRESH?.connectionString)
    && typeof env.CORE_API?.fetch === 'function';
}
