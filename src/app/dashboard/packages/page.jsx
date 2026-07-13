import { Package, ShieldCheck, Sparkles, Trophy } from "lucide-react";

import { Suspense } from "react";

import { getCatalog } from "@/lib/catalog";
import ActivatePackageButton from "./ActivatePackageButton";
import MyPaymentsPanel from "./MyPaymentsPanel";
import PaymentResultModal from "./PaymentResultModal";

export const dynamic = "force-dynamic";

/**
 * Catálogo de paquetes de inversión (mlm.package) + carrera de rangos (mlm.rank).
 * Activar un paquete habilita beneficios y seguimiento operativo del miembro.
 */
export default async function PackagesPage() {
  let packages = [];
  let ranks = [];
  let unavailable = false;

  try {
    const catalog = await getCatalog(); // cacheado 5 min (Next Data Cache, tag "catalog")
    packages = catalog.packages;
    ranks = catalog.ranks;
  } catch {
    unavailable = true;
  }

  return (
    <section className="executive-page">
      <Suspense fallback={null}>
        <PaymentResultModal />
      </Suspense>
      <div className="executive-container">
        <div className="executive-page-header">
          <div>
            <p className="executive-eyebrow">Inversion</p>
            <h1 className="executive-title">Paquetes</h1>
            <p className="executive-subtitle">
              Catalogo conectado a RDS para revisar paquetes activos, puntos y carrera de rangos de Mindbliss Power.
            </p>
          </div>
          <span className="executive-icon-badge">
            <Package size={20} />
          </span>
        </div>

        <div className="mb-6">
          <MyPaymentsPanel />
        </div>

        {unavailable || packages.length === 0 ? (
          <div className="executive-panel text-sm font-semibold" style={{ color: "var(--vp-muted)" }}>
            El catalogo estara disponible al finalizar la sincronizacion de datos.
          </div>
        ) : (
          <div className="executive-grid three">
            {packages.map((pkg, index) => {
              const featured = index === Math.min(2, packages.length - 1);
              return (
                <article
                  key={pkg.id}
                  className="executive-card flex flex-col"
                  style={{
                    borderColor: featured ? "var(--vp-amber-border)" : "var(--vp-border)",
                  }}
                >
                  {featured && (
                    <span className="executive-status warning mb-4 w-fit">
                      <Sparkles size={11} />
                      Recomendado
                    </span>
                  )}
                  <h2 className="executive-card-label">{pkg.name}</h2>
                  <div className="executive-card-value" style={{ color: featured ? "var(--vp-amber)" : "var(--vp-text)" }}>
                    ${Number(pkg.amount_usd).toLocaleString("en-US")}
                  </div>
                  <div className="mt-2 text-xs font-semibold" style={{ color: "var(--vp-muted)" }}>
                    {Number(pkg.pv).toLocaleString("en-US")} PV · {pkg.type}
                  </div>

                  <ul className="mt-5 space-y-3 text-sm leading-6" style={{ color: "var(--vp-text-soft)" }}>
                    <li className="flex items-start gap-2">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: "var(--vp-accent)" }} />
                      Beneficios del plan sujetos a reglas y aprobaciones vigentes.
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: "var(--vp-accent)" }} />
                      Seguimiento operativo desde perfil, referidos y actividad.
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: "var(--vp-accent)" }} />
                      No genera saldo disponible hasta que existan cierres publicados.
                    </li>
                  </ul>

                  <ActivatePackageButton packageId={pkg.id} featured={featured} />
                </article>
              );
            })}
          </div>
        )}

        {ranks.length > 0 && (
          <div className="executive-panel mt-8">
            <h2 className="executive-section-title">
              <Trophy size={18} style={{ color: "var(--vp-accent)" }} />
              Carrera de rangos
            </h2>
            <div className="executive-table-wrap">
              <table className="executive-table">
                <thead>
                  <tr>
                    <th>Rango</th>
                    <th>Puntos</th>
                    <th>Bono</th>
                  </tr>
                </thead>
                <tbody>
                  {ranks.map((r) => (
                    <tr key={r.code}>
                      <td>{r.name_es}</td>
                      <td>{Number(r.required_points).toLocaleString("en-US")}</td>
                      <td>${Number(r.bonus_amount_usd).toLocaleString("en-US")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
