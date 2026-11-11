"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { CreditCard, Loader2, MapPin, Network, RefreshCw, ShieldAlert, UserCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";

import NetworkSummaryCard from "@/components/panel/network/NetworkSummaryCard";
import NetworkTabs, { NETWORK_TABS } from "@/components/panel/network/NetworkTabs";
import PositionCard from "@/components/panel/network/PositionCard";
import { treeRefreshFailure } from "@/lib/tree-read-model.mjs";
import { createMemberNetworkReader } from "@/lib/member-network-reader.mjs";
import { useI18n } from "@/i18n/LanguageProvider";

// Keep the route shell and the data requests small. A view is downloaded only
// when selected; the initial one is warmed alongside the reads below so the
// tree request does not have to finish before its JavaScript starts loading.
const BinaryTreeView = dynamic(() => import("@/components/panel/network/BinaryTreeView"), { loading: NetworkViewLoading });
const GenerationView = dynamic(() => import("@/components/panel/network/GenerationView"), { loading: NetworkViewLoading });
const RankView = dynamic(() => import("@/components/panel/network/RankView"), { loading: NetworkViewLoading });
const OperativeListView = dynamic(() => import("@/components/panel/network/OperativeListView"), { loading: NetworkViewLoading });

function NetworkViewLoading() {
  const { t } = useI18n();
  return <section className="flex min-h-80 items-center justify-center gap-3 rounded-2xl border p-6"
    style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)", color: "var(--vp-muted)" }}
    role="status" aria-busy="true">
    <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
    <span className="text-sm font-semibold">{t("networkPage.loadingView")}</span>
  </section>;
}

function warmNetworkView(tab) {
  const pending = tab === "generation" ? import("@/components/panel/network/GenerationView")
    : tab === "rank" ? import("@/components/panel/network/RankView")
    : tab === "list" ? import("@/components/panel/network/OperativeListView")
    : import("@/components/panel/network/BinaryTreeView");
  // A failed warm-up is not a data error. The dynamic component retains the
  // normal route error boundary/retry behavior when it is actually rendered.
  void pending.catch(() => {});
}

function StatusCard({ children }) {
  return (
    <section
      className="flex items-center gap-3 rounded-2xl border p-6"
      style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
    >
      {children}
    </section>
  );
}

function money(value) {
  return `$${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function paymentStatusCopy(status, active, t) {
  if (active) {
    return {
      title: t("networkPage.activePendingTitle"), detail: t("networkPage.activePendingCopy"),
      tone: "var(--vp-amber)",
    };
  }
  const map = {
    created: {
      title: t("networkPage.checkoutStarted"), detail: t("networkPage.checkoutStartedCopy"),
      tone: "var(--vp-amber)",
    },
    paid: {
      title: t("networkPage.paymentReceived"), detail: t("networkPage.paymentReceivedCopy"),
      tone: "var(--vp-accent)",
    },
    activated: {
      title: t("networkPage.activationRecorded"), detail: t("networkPage.activationRecordedCopy"),
      tone: "var(--vp-accent)",
    },
    needs_placement: {
      title: t("networkPage.manualPlacement"), detail: t("networkPage.manualPlacementCopy"),
      tone: "var(--vp-amber)",
    },
    failed: {
      title: t("networkPage.paymentFailed"), detail: t("networkPage.paymentFailedCopy"),
      tone: "var(--vp-danger)",
    },
    expired: {
      title: t("networkPage.checkoutExpired"), detail: t("networkPage.checkoutExpiredCopy"),
      tone: "var(--vp-danger)",
    },
    refunded: {
      title: t("networkPage.paymentRefunded"), detail: t("networkPage.paymentRefundedCopy"),
      tone: "var(--vp-danger)",
    },
    security_blocked: {
      title: t("networkPage.securityBlocked"), detail: t("networkPage.securityBlockedCopy"),
      tone: "var(--vp-danger)",
    },
  };
  return map[status] || {
    title: status ? t("networkPage.positionPending") : t("networkPage.noPayment"),
    detail: status
      ? t("networkPage.positionPendingCopy") : t("networkPage.noPaymentCopy"),
    tone: status ? "var(--vp-amber)" : "var(--vp-muted)",
  };
}

function DetailTile({ icon: Icon, label, value, accent = false }) {
  const { t } = useI18n();
  return (
    <div
      className="flex min-w-0 items-start gap-3 rounded-xl border p-4"
      style={{ background: "var(--vp-surface)", borderColor: accent ? "var(--vp-accent-border)" : "var(--vp-border)" }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: accent ? "var(--vp-accent-muted)" : "var(--vp-bg)", color: accent ? "var(--vp-accent)" : "var(--vp-muted)" }}
      >
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="m-0 text-[10px] font-semibold uppercase" style={{ color: "var(--vp-muted)" }}>
          {label}
        </p>
        <p className="m-0 mt-1 truncate text-sm font-bold" style={{ color: "var(--vp-text)" }} title={String(value || t("networkPage.pending"))}>
          {value || t("networkPage.pending")}
        </p>
      </div>
    </div>
  );
}

function ReadIssues({ state, onRetry }) {
  const { t } = useI18n();
  const issues = [[t("networkPage.payments"), state.summaryError], [t("networkPage.networkLinks"), state.referralError]].filter(([, error]) => error);
  if (!issues.length) return null;
  return <div role="status" className="flex flex-wrap items-center gap-3 border-y py-3 text-sm" style={{ borderColor: "var(--vp-info-border)", color: "var(--vp-info)" }}>
    <ShieldAlert size={18} /><div className="min-w-0 flex-1">{issues.map(([label, error]) => <p key={label} className="m-0">{label}: {error.message}</p>)}</div>
    <button type="button" className="executive-button" onClick={onRetry} disabled={state.refreshing}><RefreshCw size={16} />{t("common.update")}</button>
  </div>;
}

function networkReadFailure(previous, error, t) {
  const next = treeRefreshFailure(previous, error.status, error.message);
  if (next.refreshError && error.status === 503 && error.code === "authentication_unavailable") {
    return { ...next, refreshError: `${error.message} ${t("networkPage.lastReadVisible")}` };
  }
  return next;
}

export default function NetworkPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const validTabs = useMemo(() => new Set(NETWORK_TABS.map((item) => item.id)), []);
  const [tab, setTab] = useState(() => validTabs.has(requestedTab) ? requestedTab : "tree");
  const initialTab = useRef(tab);
  const [treeDepth, setTreeDepth] = useState("4");
  const [refreshTick, setRefreshTick] = useState(0);
  const reader = useRef(null);
  const [state, setState] = useState({ loading: true, refreshing: false, error: "", errorStatus: 0, refreshError: "", data: null, summary: null, referral: null, summaryError: null, referralError: null, syncing: false });

  useEffect(() => {
    if (validTabs.has(requestedTab)) {
      setTab(requestedTab);
    }
  }, [requestedTab, validTabs]);

  useEffect(() => {
    warmNetworkView(initialTab.current);
    const current = createMemberNetworkReader({
      onStart: full => setState(prev => ({ ...prev, loading: !prev.data, refreshing: Boolean(prev.data), error: "", errorStatus: 0, refreshError: "",
        ...(full ? { summary: null, referral: null, summaryError: null, referralError: null } : {}), syncing: false })),
      onPart: (key, result) => setState(prev => key === "tree"
        ? result.error ? networkReadFailure(prev, result.error, t)
          : { ...prev, loading: false, refreshing: false, error: "", errorStatus: 0, refreshError: "", data: result.data }
        : { ...prev, [key]: result.data || null, [`${key}Error`]: result.error || null }),
      onDenied: error => setState(prev => networkReadFailure(prev, error, t)),
      onSync: syncing => setState(prev => ({ ...prev, syncing })),
    });
    reader.current = current;
    void current.refresh();
    return () => {
      current.dispose();
      if (reader.current === current) reader.current = null;
    };
  }, [t]);

  const previousRefresh = useRef(refreshTick);
  useEffect(() => {
    if (previousRefresh.current !== refreshTick) {
      previousRefresh.current = refreshTick;
      void reader.current?.refresh(treeDepth);
    } else {
      void reader.current?.changeDepth(treeDepth);
    }
  }, [treeDepth, refreshTick]);

  if (state.loading) {
    return (
      <div className="p-6">
        <StatusCard>
          <Loader2 className="animate-spin" size={16} style={{ color: "var(--vp-accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--vp-muted)" }}>
            {t("networkPage.loadingPosition")}
          </span>
        </StatusCard>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-6">
        <StatusCard>
          <span role="alert" className="text-sm font-semibold" style={{ color: "var(--vp-muted)" }}>
            {state.error === "account_suspended" ? t("networkPage.accountRestricted")
              : state.error === "tree-unavailable"
              ? t("networkPage.treeMigrating")
              : /^[a-z0-9_-]+$/.test(state.error)
                ? t("networkPage.loadFailed")
                : state.error}
          </span>
          {state.errorStatus === 401 ? <Link href="/login" className="executive-button">{t("dashboard.signIn")}</Link>
            : <button type="button" className="executive-button" onClick={() => setRefreshTick(tick => tick + 1)}><RefreshCw size={15} />{t("networkPage.retry")}</button>}
        </StatusCard>
      </div>
    );
  }

  if (!state.data?.positioned) {
    const latestPayment = state.summary?.payments?.[0];
    const latestStatus = state.summary?.payments?.[0]?.status;
    const active = Number(state.summary?.active_packages ?? 0) > 0;
    const paymentReceived = active || ["paid", "activated", "needs_placement"].includes(latestStatus);
    const needsPlacement = latestStatus === "needs_placement";
    const statusCopy = state.summary ? paymentStatusCopy(latestStatus, active, t) : {
      title: state.summaryError ? t("networkPage.paymentUnavailable") : t("networkPage.checkingPayment"),
      detail: state.summaryError ? t("networkPage.paymentUnavailableCopy") : t("networkPage.checkingPaymentCopy"),
      tone: "var(--vp-muted)",
    };
    const sponsorLabel =
      latestPayment?.sponsor_name ||
      latestPayment?.sponsor_email ||
      (latestPayment?.sponsor_affiliate_id ? `Afiliado #${latestPayment.sponsor_affiliate_id}` : "");
    const checkoutLabel = latestPayment
      ? t("networkPage.packageAmount", { id: latestPayment.package_id, amount: money(latestPayment.amount_usd) })
      : "";

    return (
      <div className="flex flex-col gap-4 p-6">
        <ReadIssues state={state} onRetry={() => setRefreshTick(tick => tick + 1)} />
        <StatusCard>
          {state.syncing ? (
            <Loader2 className="animate-spin" size={18} style={{ color: "var(--vp-accent)" }} />
          ) : (
            <Network size={18} style={{ color: statusCopy.tone }} />
          )}
          <div>
            <p className="m-0 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
              {needsPlacement
                ? t("networkPage.yourPaymentManual")
                : paymentReceived
                  ? t("networkPage.syncingPosition")
                  : statusCopy.title}
            </p>
            <p className="m-0 mt-1 text-xs" style={{ color: "var(--vp-muted)" }}>
              {needsPlacement
                ? t("networkPage.yourPaymentManualCopy")
                : paymentReceived
                  ? t("networkPage.syncingPositionCopy")
                  : statusCopy.detail}
            </p>
          </div>
        </StatusCard>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <DetailTile icon={CreditCard} label={t("networkPage.latestCheckout")} value={checkoutLabel} accent={Boolean(latestPayment)} />
          <DetailTile icon={UserCheck} label={t("networkPage.expectedSponsor")} value={sponsorLabel} accent={Boolean(sponsorLabel)} />
          <DetailTile icon={MapPin} label={t("networkPage.treeStatus")} value={latestStatus === "created" ? t("networkPage.waitingPayment") : t("networkPage.noActivePosition")} />
        </section>

        <section
          className="flex flex-col gap-3 rounded-2xl border p-5 md:flex-row md:items-center md:justify-between"
          style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
        >
          <div className="flex min-w-0 items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" style={{ color: statusCopy.tone }} />
            <div className="min-w-0">
              <p className="m-0 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
                {t("networkPage.noPositionUntilActive")}
              </p>
              <p className="m-0 mt-1 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
                {t("networkPage.noPositionUntilActiveCopy")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshTick((tick) => tick + 1)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold"
              style={{ background: "var(--vp-surface-raised)", borderColor: "var(--vp-border)", color: "var(--vp-text)" }}
            >
              <RefreshCw size={14} />
              {t("common.update")}
            </button>
            {state.summary && !paymentReceived ? (
              <Link href="/dashboard/wallet-personal/pay" className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-bold no-underline" style={{ background: "var(--vp-accent)", color: "var(--vp-on-accent)" }}>
                {t("companyPayment.transferAction")}
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    );
  }

  const { me, tree } = state.data;
  const directs = tree.filter((node) => node.level === 1);
  const leftDirect = directs.find((node) => node.side === "L");
  const rightDirect = directs.find((node) => node.side === "R");
  const leftCount = tree.filter((node) => node.rootSide === "L").length;
  const rightCount = tree.filter((node) => node.rootSide === "R").length;
  const maxGen = tree.reduce((max, node) => Math.max(max, node.level ?? 0), 0);
  const withRank = tree.filter((node) => node.rank).length;
  const withPackage = tree.filter((node) => node.activePackage).length;

  const summaryMetrics = [
    { label: t("networkPage.visible"), value: tree.length, tone: "positive" }, { label: t("networkPage.left"), value: leftCount, tone: "positive" }, { label: t("networkPage.right"), value: rightCount, tone: "accent" }, { label: t("networkPage.withPackage"), value: withPackage, tone: "accent" }, { label: t("networkPage.directs"), value: directs.length, tone: "default" }, { label: t("networkPage.maxGeneration"), value: maxGen, tone: "default" }, { label: t("networkPage.withRank"), value: withRank, tone: "default" }, { label: t("networkPage.myLevel"), value: me.depth, tone: "positive", span: 2 },
  ];

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <ReadIssues state={state} onRetry={() => setRefreshTick(tick => tick + 1)} />
      {state.refreshError ? <div role="alert" className="flex flex-wrap items-center gap-3 border-y py-3 text-sm" style={{ borderColor: "var(--vp-amber-border)", color: "var(--vp-amber)" }}><ShieldAlert size={18} /><span className="flex-1">{state.refreshError}</span><button type="button" className="executive-button" onClick={() => setRefreshTick((tick) => tick + 1)}><RefreshCw size={16} />{t("networkPage.retry")}</button></div> : null}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PositionCard
          rank={me.rank?.name}
          depth={t("networkPage.level", { level: me.depth })}
          side={me.side === "L" ? t("networkPage.left") : me.side === "R" ? t("networkPage.right") : t("networkPage.root")}
          sponsor={me.sponsor}
          parent={me.parent}
          affiliateId={me.affiliateId}
          activePackage={me.activePackage}
          rankProgress={me.rankProgress}
          commissions={{
            available: state.summary?.commission_available_usd,
            maturing: state.summary?.commission_maturing_usd,
            wallet: state.summary?.wallet_balance_usd,
          }}
          referral={state.referral}
          leftLeg={leftDirect ? leftDirect.name || t("networkPage.node", { id: leftDirect.id }) : null}
          rightLeg={rightDirect ? rightDirect.name || t("networkPage.node", { id: rightDirect.id }) : null}
          childSlotsKnown={me.childrenComplete === true}
        />
        <NetworkSummaryCard
          memberName={me.name || t("pages.network")}
          leftCount={leftCount}
          rightCount={rightCount}
          metrics={summaryMetrics}
        />
      </div>

      <NetworkTabs active={tab} onChange={setTab} />

      {tab === "tree" ? (
        <BinaryTreeView
          nodes={tree}
          me={me}
          meta={state.data.meta}
          depth={treeDepth}
          onDepthChange={setTreeDepth}
          onRefresh={() => setRefreshTick((tick) => tick + 1)}
          refreshing={state.refreshing}
        />
      ) : null}
      {tab === "generation" ? <GenerationView nodes={tree} /> : null}
      {tab === "rank" ? <RankView nodes={tree} /> : null}
      {tab === "list" ? <OperativeListView nodes={tree} /> : null}
    </div>
  );
}
