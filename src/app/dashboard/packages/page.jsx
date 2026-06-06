import Link from "next/link";
import { ArrowRight, Package, ShieldCheck, Sparkles } from "lucide-react";

import { memberDb } from "@/lib/member-db";

export const dynamic = "force-dynamic";

/**
 * Catálogo de paquetes de inversión (mlm.package, migrado del legacy).
 * Activar un paquete coloca al miembro en el árbol binario y enciende su red.
 */
export default async function PackagesPage() {
  let packages = [];
  let unavailable = false;

  try {
    const sql = memberDb();
    packages = await sql`
      SELECT id, name, amount_usd, pv, type
        FROM mlm.package
       WHERE is_active
       ORDER BY amount_usd ASC`;
  } catch {
    unavailable = true;
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--vp-subtle)" }}>
          <Package size={13} />
          Panel · Inversión
        </div>
        <h1 className="vp-display text-3xl" style={{ color: "var(--vp-text)" }}>
          Paquetes de inversión
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          Activa tu paquete para tomar tu posición en el árbol binario, encender tu red y
          empezar a generar con el plan Mindbliss Power.
        </p>
      </div>

      {unavailable || packages.length === 0 ? (
        <div
          className="rounded-xl p-6 text-sm font-semibold"
          style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-muted)" }}
        >
          El catálogo estará disponible al finalizar la sincronización de datos.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {packages.map((pkg, index) => {
            const featured = index === Math.min(2, packages.length - 1);
            return (
              <article
                key={pkg.id}
                className="flex flex-col rounded-xl p-5"
                style={{
                  background: "var(--vp-surface)",
                  border: featured ? "1px solid var(--vp-amber-border)" : "1px solid var(--vp-border)",
                  boxShadow: "var(--vp-shadow)",
                }}
              >
                {featured && (
                  <span
                    className="mb-3 inline-flex w-fit items-center gap-1 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider"
                    style={{ background: "var(--vp-amber-muted)", border: "1px solid var(--vp-amber-border)", color: "var(--vp-amber)" }}
                  >
                    <Sparkles size={11} />
                    Recomendado
                  </span>
                )}
                <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--vp-muted)" }}>
                  {pkg.name}
                </h2>
                <div className="vp-display mt-2 text-3xl" style={{ color: featured ? "var(--vp-amber)" : "var(--vp-text)" }}>
                  ${Number(pkg.amount_usd).toLocaleString("en-US")}
                </div>
                <div className="mt-1 text-xs font-semibold" style={{ color: "var(--vp-subtle)" }}>
                  {Number(pkg.pv).toLocaleString("en-US")} PV · {pkg.type}
                </div>

                <ul className="mt-4 space-y-2 text-xs leading-5" style={{ color: "var(--vp-text-soft)" }}>
                  <li className="flex items-start gap-2">
                    <ShieldCheck size={13} className="mt-0.5 shrink-0" style={{ color: "var(--vp-accent)" }} />
                    ROI 25% anual — 50% al calificar con 2 directos
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck size={13} className="mt-0.5 shrink-0" style={{ color: "var(--vp-accent)" }} />
                    Posición inmediata en el árbol binario
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldCheck size={13} className="mt-0.5 shrink-0" style={{ color: "var(--vp-accent)" }} />
                    Fundador 2.0: 10% referidos + 10% binario
                  </li>
                </ul>

                <Link
                  href={`/dashboard/support?topic=activar-paquete&package=${encodeURIComponent(pkg.name)}`}
                  className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-black transition hover:opacity-90"
                  style={
                    featured
                      ? { background: "var(--vp-amber)", color: "#0b0b0c", border: "1px solid var(--vp-amber-border)" }
                      : { background: "var(--vp-surface-raised)", color: "var(--vp-text)", border: "1px solid var(--vp-border)" }
                  }
                >
                  Activar paquete
                  <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
