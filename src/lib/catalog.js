import { unstable_cache } from "next/cache";

import { memberDb } from "@/lib/member-db";

// getCatalog: paquetes activos + carrera de rangos (semi-estático). Cacheado en
// el Next Data Cache 5 min con tag "catalog" → 1 query a RDS cada 5 min en vez
// de una por request. Invalidar con revalidateTag("catalog") si cambian packs/ranks.
export const getCatalog = unstable_cache(
  async () => {
    const sql = memberDb();
    const [packages, ranks] = await Promise.all([
      sql`SELECT id, name, amount_usd, pv, type
            FROM mlm.package WHERE is_active ORDER BY amount_usd ASC`,
      sql`SELECT code, name_es, required_points, bonus_amount_usd
            FROM mlm.rank ORDER BY display_order ASC`,
    ]);
    // Plano y serializable (las filas de postgres traen props extra).
    return {
      packages: packages.map((p) => ({ id: p.id, name: p.name, amount_usd: p.amount_usd, pv: p.pv, type: p.type })),
      ranks: ranks.map((r) => ({ code: r.code, name_es: r.name_es, required_points: r.required_points, bonus_amount_usd: r.bonus_amount_usd })),
    };
  },
  ["catalog-v1"],
  { revalidate: 300, tags: ["catalog"] },
);
