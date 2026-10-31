import { Package, ShieldCheck, Sparkles, Trophy } from "lucide-react";

import { Suspense } from "react";

import { getCatalog } from "@/lib/catalog";
import { runtimeEnvironment } from "@/lib/cloudflare-runtime.mjs";
import { stripeCheckoutEnabled, nowpaymentsMembershipsEnabled } from "@/lib/checkout-policy.mjs";
import { membershipPriceQuote } from "@/lib/membership-price-quote.mjs";
import ActivatePackageButton from "./ActivatePackageButton";
import MyPaymentsPanel from "./MyPaymentsPanel";
import PaymentResultModal from "./PaymentResultModal";
import PaywallGate from "./PaywallGate";
import { MemberSummaryProvider } from "@/hooks/useMemberSummary";

export const dynamic = "force-dynamic";

/**
 * Catálogo de paquetes de inversión (mlm.package) + carrera de rangos (mlm.rank).
 * Activar una membresía habilita beneficios y seguimiento operativo del miembro.
 * @param {{ searchParams?: Promise<Record<string, string | string[] | undefined>> }} [props]
 */
export default async function PackagesPage({ searchParams } = {}) {
  const stripeEnabled = stripeCheckoutEnabled(runtimeEnvironment());
  const nowpaymentsEnabled = nowpaymentsMembershipsEnabled(runtimeEnvironment());
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
  const requestedPlan = (await searchParams)?.plan;
  // This is presentation-only: a URL hint can reveal an existing catalog card,
  // never enable a payment provider or establish a membership/payment state.
  const selectedPlan = typeof requestedPlan === "string" && /^[1-9]\d{0,15}$/.test(requestedPlan)
    && packages.some(pkg => String(pkg.id) === requestedPlan) ? requestedPlan : "";

  return (
    <section className="executive-page">
      <MemberSummaryProvider fresh>
      <Suspense fallback={null}>
        <PaymentResultModal />
      </Suspense>
      <div className="executive-container">
        <div className="executive-page-header">
          <div>
            <p className="executive-eyebrow">Inversion</p>
            <h1 id="memberships-title" tabIndex={-1} className="executive-title">Membresías</h1>
            <p className="executive-subtitle">
              Catalogo conectado a RDS para revisar membresías activas, puntos y carrera de rangos de Mindbliss Power.
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
          <PaywallGate key={selectedPlan || "catalog"} initialShowPlans={Boolean(selectedPlan)}>
          <div className="executive-grid three">
            {packages.map((pkg, index) => {
              const featured = index === Math.min(2, packages.length - 1);
              const quote = membershipPriceQuote(pkg.amount_usd);
              return (
                <article
                  key={pkg.id}
                  id={`plan-${pkg.id}`}
                  className="executive-card flex scroll-mt-24 flex-col"
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
                    {quote ? quote.baseUSD : "Precio no disponible"}
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

                  {quote ? <>
                    <dl className="mt-5 space-y-2 text-sm" aria-label={`Desglose del precio de ${pkg.name}`}>
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1" style={{ color: "var(--vp-text-soft)" }}>
                        <dt>Precio del plan</dt><dd className="font-semibold">{quote.baseUSD}</dd>
                      </div>
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1" style={{ color: "var(--vp-text-soft)" }}>
                        <dt>Comisión de procesamiento (1%, incluida)</dt><dd className="font-semibold">{quote.feeUSD}</dd>
                      </div>
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1" style={{ color: "var(--vp-text-soft)" }}>
                        <dt>Base para cálculo de comisiones (99%)</dt><dd className="font-semibold">{quote.commissionBaseUSD}</dd>
                      </div>
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t pt-2 font-semibold" style={{ color: "var(--vp-text)", borderColor: "var(--vp-border)" }}>
                        <dt>Total a pagar</dt><dd>{quote.totalUSD}</dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>La comisión está incluida; no se suma al precio.</p>
                    <ActivatePackageButton packageId={pkg.id} featured={featured} stripeEnabled={stripeEnabled} nowpaymentsEnabled={nowpaymentsEnabled} />
                  </> : <p role="status" className="mt-5 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
                    No se pudo confirmar el precio de este plan. No se puede iniciar un cobro. Intenta nuevamente más tarde.
                  </p>}
                </article>
              );
            })}
          </div>
          </PaywallGate>
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
      </MemberSummaryProvider>
    </section>
  );
}
