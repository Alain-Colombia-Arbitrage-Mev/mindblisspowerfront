/**
 * Server-only Postgres client (read-only role vp_web → app_read).
 * Singleton against Next.js dev hot-reload. NUNCA exponer columnas de
 * volumen (left/right_pv_*, *_carry) hacia el cliente — directiva árbol 2.0.
 */
import postgres from "postgres";

const globalRef = globalThis;

export function memberDb() {
  const url = process.env.MEMBER_DATABASE_URL;
  if (!url) throw new Error("MEMBER_DATABASE_URL not set");

  if (!globalRef.__vpMemberDb) {
    globalRef.__vpMemberDb = postgres(url, {
      max: 4,
      idle_timeout: 30,
      max_lifetime: 60 * 15,
      ssl: "require",
    });
  }
  return globalRef.__vpMemberDb;
}
