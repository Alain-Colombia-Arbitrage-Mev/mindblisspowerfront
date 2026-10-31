import { ArrowUpRight, Package } from "lucide-react";
import Link from "next/link";

import { getCatalog } from "@/lib/catalog";

// Catalog prices are decimal USD, not browser-calculated balances. Reject an
// invalid row instead of rounding it or presenting an invented zero-dollar plan.
function planView(row) {
  if (!row || typeof row !== "object") throw new Error("Invalid catalog plan");
  const id = typeof row.id === "number" && Number.isSafeInteger(row.id) ? String(row.id) : row.id;
  const amount = typeof row.amount_usd === "number" && Number.isFinite(row.amount_usd)
    ? String(row.amount_usd) : row.amount_usd;
  if (typeof id !== "string" || !/^[1-9]\d*$/.test(id) || BigInt(id) > BigInt(Number.MAX_SAFE_INTEGER)
    || typeof row.name !== "string" || !row.name.trim() || row.name.trim().length > 160
    || Array.from(row.name).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
    || typeof amount !== "string" || !/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(amount)) {
    throw new Error("Invalid catalog plan");
  }
  const [whole, fraction = ""] = amount.split(".");
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (cents <= 0n || cents > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Invalid catalog price");
  return {
    id,
    name: row.name.trim(),
    price: `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction.padEnd(2, "0")} USD`,
  };
}

function PlansSection({ children }) {
  return <section aria-labelledby="overview-plans-title" className="min-w-0 space-y-5">
    <div>
      <h2 id="overview-plans-title" className="executive-section-title mb-2">
        <Package size={18} aria-hidden="true" style={{ color: "var(--vp-accent)" }} />
        Planes de membresía
      </h2>
      <p className="text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
        Consulta los planes y sus precios vigentes en dólares estadounidenses.
      </p>
    </div>
    {children}
  </section>;
}

export function OverviewPlansLoading() {
  return <PlansSection>
    <div className="executive-panel text-sm" role="status" aria-busy="true" style={{ color: "var(--vp-muted)" }}>
      Cargando planes de membresía…
    </div>
  </PlansSection>;
}

export default async function OverviewPlans() {
  let plans;
  try {
    const catalog = await getCatalog();
    if (!Array.isArray(catalog?.packages)) throw new Error("Invalid catalog");
    plans = catalog.packages.map(planView);
    if (new Set(plans.map(plan => plan.id)).size !== plans.length) throw new Error("Duplicate catalog plan");
  } catch {
    return <PlansSection>
      <div className="executive-panel text-sm leading-6" role="status" style={{ color: "var(--vp-muted)" }}>
        <p>No se pudieron consultar los planes. Intenta nuevamente más tarde.</p>
        <Link href="/dashboard/packages" prefetch={false} className="executive-button mt-4">Ver membresías</Link>
      </div>
    </PlansSection>;
  }

  return <PlansSection>
    {plans.length === 0 ? <p className="executive-panel text-sm leading-6" role="status" style={{ color: "var(--vp-muted)" }}>
      No hay planes de membresía publicados en este momento.
    </p> : <div className="executive-grid three">
      {plans.map(plan => <article key={plan.id} className="executive-card flex min-w-0 flex-col items-start gap-5">
        <h3 className="break-words text-base font-semibold" style={{ color: "var(--vp-text)" }}>{plan.name}</h3>
        <p className="executive-card-value break-words" style={{ color: "var(--vp-accent)", fontSize: "clamp(24px, 3vw, 32px)" }}>{plan.price}</p>
        <Link href={`/dashboard/packages?plan=${plan.id}#plan-${plan.id}`} prefetch={false} className="executive-button mt-auto w-full justify-center" aria-label={`Ver plan ${plan.name}`}>
          Ver plan <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </article>)}
    </div>}
  </PlansSection>;
}
