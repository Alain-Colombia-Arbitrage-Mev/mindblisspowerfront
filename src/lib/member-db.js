/**
 * Server-only Postgres client (read-only role vp_web → app_read).
 * Singleton against Next.js dev hot-reload. NUNCA exponer columnas de
 * volumen (left/right_pv_*, *_carry) hacia el cliente — directiva árbol 2.0.
 */
import postgres from "postgres";
import { memberDbOptions } from "./member-db-config.js";
import { getCloudflareScope } from "./cloudflare-runtime.mjs";

const globalRef = globalThis;

export function memberDb() {
  const scope = getCloudflareScope();
  if (scope) {
    if (scope.closed || scope.env.MEMBER_DB_PROVIDER !== 'hyperdrive'
      || scope.env.MEMBER_DB_QUERY_CACHE_DISABLED !== 'true'
      || !scope.env.HYPERDRIVE_MEMBER_FRESH?.connectionString) throw new Error('member_database_unavailable');
    if (!scope.resources.has('member-db')) {
      // Hyperdrive owns the origin pool. Never reuse a Worker TCP client across requests.
      // Origin TLS verification and query-cache disabling are required provisioning gates.
      scope.resources.set('member-db', postgres(scope.env.HYPERDRIVE_MEMBER_FRESH.connectionString, {
        max: 1, connect_timeout: 5, idle_timeout: 5, max_lifetime: 30, prepare: true,
        // Do not modify session state through a transaction pool. The origin
        // login must be SELECT-only, with statement_timeout enforced by its role.
      }));
    }
    return scope.resources.get('member-db');
  }
  if (process.env.MEMBER_DB_PROVIDER === 'hyperdrive' || typeof globalThis.WebSocketPair === 'function') throw new Error('worker_request_scope_required');
  const url = process.env.MEMBER_DATABASE_URL;
  if (!url) throw new Error("MEMBER_DATABASE_URL not set");

  if (!globalRef.__vpMemberDb) {
    globalRef.__vpMemberDb = postgres(url, memberDbOptions(process.env));
  }
  return globalRef.__vpMemberDb;
}
