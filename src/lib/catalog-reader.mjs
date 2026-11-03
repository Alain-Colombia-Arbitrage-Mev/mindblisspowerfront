import { createSingleFlight } from './single-flight.mjs';

// Definitions only: neither loader reads a session, member balance nor tree.
// Keep the two catalogs independent so a packages-only view never queries ranks
// (and the ranks endpoint never queries packages).
export function createCatalogReader({ database, requestScope, cache }) {
  async function loadPackages() {
    const sql = database();
    const rows = await sql`SELECT id, name, amount_usd, pv, type
      FROM mlm.package WHERE is_active ORDER BY amount_usd ASC`;
    return rows.map(row => ({ id: row.id, name: row.name, amount_usd: row.amount_usd, pv: row.pv, type: row.type }));
  }
  async function loadRanks() {
    const sql = database();
    const rows = await sql`SELECT code, name_es, required_points, bonus_amount_usd
      FROM mlm.rank ORDER BY display_order ASC`;
    return rows.map(row => ({ code: row.code, name_es: row.name_es,
      required_points: row.required_points, bonus_amount_usd: row.bonus_amount_usd }));
  }
  function resource(name, load) {
    const key = `catalog-${name}-v3`;
    const flight = createSingleFlight(load);
    const cached = cache(() => flight.read(), [key], { revalidate: 300, tags: ['catalog'] });
    return {
      read() {
        const scope = requestScope();
        if (!scope) return cached();
        // Worker I/O is request-owned. No cross-request pending SQL promises,
        // shared identities, new edge cache or changes to freshness policy.
        if (!scope.resources.has(key)) scope.resources.set(key, load());
        return scope.resources.get(key);
      },
      invalidate() {
        flight.invalidate();
        requestScope()?.resources.delete(key);
      },
    };
  }
  const packages = resource('packages', loadPackages);
  const ranks = resource('ranks', loadRanks);
  return {
    async packages() { return { packages: await packages.read() }; },
    async ranks() { return { ranks: await ranks.read() }; },
    async all() {
      const [packageRows, rankRows] = await Promise.all([packages.read(), ranks.read()]);
      return { packages: packageRows, ranks: rankRows };
    },
    // The existing admin endpoint also expires the Next Data Cache tag.
    invalidate() { packages.invalidate(); ranks.invalidate(); },
  };
}
