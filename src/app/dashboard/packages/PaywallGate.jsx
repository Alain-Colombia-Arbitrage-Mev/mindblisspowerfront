"use client";

import { useState } from "react";
import { BadgeDollarSign, CheckCircle2, ChevronDown, ChevronUp, ReceiptText } from "lucide-react";
import Link from "next/link";
import { useMemberSummary } from "@/hooks/useMemberSummary";
import { useI18n } from "@/i18n/LanguageProvider";

const PLAN_LABEL = {
  starter: "Starter",
  basic: "Básico",
  pro: "Pro",
  premium: "Premium",
  elite: "Elite",
};

/**
 * Active memberships do not prevent independent purchases. Keep the checkout
 * children mounted while the summary loads or the catalog is toggled, so an
 * in-flight request never loses its identity or pending guard.
 */
export default function PaywallGate({ children, initialShowPlans = false }) {
  const { t } = useI18n();
  const { state } = useMemberSummary({ fresh: true });
  const [showPlans, setShowPlans] = useState(initialShowPlans === true);

  const active = !state.loading && !state.error && Number(state.data?.active_packages) > 0;
  const d = state.data;
  const plan = d?.plan ? (d.plan === "basic" ? t("membershipGate.basic") : PLAN_LABEL[d.plan] || d.plan) : null;
  const rank = d?.rank && d.rank !== "—" ? d.rank : null;

  return (
    <div>
      {active ? <div
        className="rounded-3xl p-8 text-center sm:p-10"
        style={{
          background: "var(--vp-surface)",
          border: "1px solid var(--vp-amber-border, rgba(250,204,21,0.35))",
          boxShadow: "0 20px 70px rgba(0,0,0,0.30)",
        }}
      >
        <span
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "rgba(250, 204, 21, 0.12)", border: "1px solid rgba(250, 204, 21, 0.32)" }}
        >
          <CheckCircle2 size={32} style={{ color: "var(--vp-accent)" }} />
        </span>
        <h2 className="m-0 text-2xl font-bold" style={{ color: "var(--vp-text)" }}>
          {t("membershipGate.activeTitle")}
        </h2>
        <p className="mt-3 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          {t("membershipGate.activeCopy")}
        </p>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          {t("membershipGate.extraCopy")}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Stat label={t("membershipGate.activeMemberships")} value={String(d?.active_packages ?? 1)} accent />
          <Stat label={t("membershipGate.plan")} value={plan || t("membershipGate.active")} />
          <Stat label={t("membershipGate.rank")} value={rank || t("membershipGate.inProgress")} />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard/bonificaciones" className="executive-button primary justify-center no-underline">
            <BadgeDollarSign size={16} /> {t("membershipGate.referralBonus")}
          </Link>
          <Link href="/dashboard/referrals" className="executive-button justify-center no-underline">
            <ReceiptText size={16} /> {t("membershipGate.referral")}
          </Link>
        </div>
      </div> : null}

      {active ? <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setShowPlans((v) => !v)}
          aria-expanded={showPlans}
          className="executive-button ghost"
        >
          {showPlans ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {showPlans ? t("membershipGate.hidePlans") : t("membershipGate.buyAnother")}
        </button>
      </div> : null}

      <div hidden={active && !showPlans} className={active ? "mt-6" : undefined}>{children}</div>
    </div>
  );
}

function Stat({ label, value, accent = false }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
      <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
        {label}
      </div>
      <div className="mt-1 text-lg font-bold" style={{ color: accent ? "var(--vp-accent)" : "var(--vp-text)" }}>
        {value}
      </div>
    </div>
  );
}
