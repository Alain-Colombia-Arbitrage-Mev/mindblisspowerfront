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
import LocalizedText from "@/i18n/LocalizedText";

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
            <LocalizedText as="h1" id="membershipsPage.title" htmlId="memberships-title" tabIndex={-1} className="executive-title" />
            <LocalizedText as="p" id="membershipsPage.subtitle" className="executive-subtitle" />
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
            <LocalizedText id="membershipsPage.catalogSyncing" />
          </div>
        ) : (
          <PaywallGate initialShowPlans>
          <div className="executive-grid three">
            {packages.map((pkg, index) => {
              const featured = index === 0;
              const quote = membershipPriceQuote(pkg.amount_usd);
              return (
                <article
                  key={pkg.id}
                  id={`plan-${pkg.id}`}
                  data-selected-plan={String(pkg.id) === selectedPlan || undefined}
                  className="executive-card flex scroll-mt-24 flex-col"
                  style={{
                    borderColor: featured ? "var(--vp-amber-border)" : "var(--vp-border)",
                  }}
                >
                  {featured && (
                    <span className="executive-status warning mb-4 w-fit">
                      <Sparkles size={11} />
                      <LocalizedText id="membershipsPage.recommended" />
                    </span>
                  )}
                  <h2 className="executive-card-label">{pkg.name}</h2>
                  <div className="executive-card-value" style={{ color: featured ? "var(--vp-amber)" : "var(--vp-text)" }}>
                    {quote ? quote.baseUSD : <LocalizedText id="membershipsPage.priceUnavailable" />}
                  </div>
                  <div className="mt-2 text-xs font-semibold" style={{ color: "var(--vp-muted)" }}>
                    {Number(pkg.pv).toLocaleString("en-US")} PV · {pkg.type}
                  </div>

                  <ul className="mt-5 space-y-3 text-sm leading-6" style={{ color: "var(--vp-text-soft)" }}>
                    <li className="flex items-start gap-2">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: "var(--vp-accent)" }} />
                      <LocalizedText id="membershipsPage.commissionTerm" />
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: "var(--vp-accent)" }} />
                      <LocalizedText id="membershipsPage.capitalTerm" />
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: "var(--vp-accent)" }} />
                      <LocalizedText id="membershipsPage.maturedCapital" />
                    </li>
                  </ul>

                  {quote ? <>
                    <dl className="mt-5 space-y-2 text-sm" aria-label={`Desglose del precio de ${pkg.name}`}>
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1" style={{ color: "var(--vp-text-soft)" }}>
                        <LocalizedText as="dt" id="membershipsPage.planPrice" /><dd className="font-semibold">{quote.baseUSD}</dd>
                      </div>
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1" style={{ color: "var(--vp-text-soft)" }}>
                        <LocalizedText as="dt" id="membershipsPage.processingFee" /><dd className="font-semibold">{quote.feeUSD}</dd>
                      </div>
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1" style={{ color: "var(--vp-text-soft)" }}>
                        <LocalizedText as="dt" id="membershipsPage.commissionBase" /><dd className="font-semibold">{quote.commissionBaseUSD}</dd>
                      </div>
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 border-t pt-2 font-semibold" style={{ color: "var(--vp-text)", borderColor: "var(--vp-border)" }}>
                        <LocalizedText as="dt" id="membershipsPage.total" /><dd>{quote.totalUSD}</dd>
                      </div>
                    </dl>
                    <LocalizedText as="p" id="membershipsPage.feeIncluded" className="mt-2 text-xs leading-5" style={{ color: "var(--vp-muted)" }} />
                    <LocalizedText as="p" id="membershipsPage.refundNotice" className="mt-2 text-xs leading-5" style={{ color: "var(--vp-muted)" }} />
                    <ActivatePackageButton packageId={pkg.id} featured={featured} stripeEnabled={stripeEnabled} nowpaymentsEnabled={nowpaymentsEnabled} />
                  </> : <p role="status" className="mt-5 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
                    <LocalizedText id="membershipsPage.priceFailure" />
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
              <LocalizedText id="membershipsPage.rankPath" />
            </h2>
            <div className="executive-table-wrap">
              <table className="executive-table">
                <thead>
                  <tr>
                    <LocalizedText as="th" id="rankPage.rank" />
                    <LocalizedText as="th" id="rankPage.points" />
                    <LocalizedText as="th" id="rankPage.bonus" />
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
