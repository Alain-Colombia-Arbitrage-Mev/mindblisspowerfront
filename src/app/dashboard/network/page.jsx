"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CreditCard, Loader2, MapPin, Network, RefreshCw, ShieldAlert, UserCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";

import BinaryTreeView from "@/components/panel/network/BinaryTreeView";
import GenerationView from "@/components/panel/network/GenerationView";
import NetworkSummaryCard from "@/components/panel/network/NetworkSummaryCard";
import NetworkTabs, { NETWORK_TABS } from "@/components/panel/network/NetworkTabs";
import OperativeListView from "@/components/panel/network/OperativeListView";
import PositionCard from "@/components/panel/network/PositionCard";
import RankView from "@/components/panel/network/RankView";

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

function paymentStatusCopy(status, active) {
  if (active) {
    return {
      title: "Membresía activa, posición pendiente",
      detail: "La cuenta tiene membresía activa, pero todavía no aparece una posición activa en el árbol.",
      tone: "var(--vp-amber)",
    };
  }
  const map = {
    created: {
      title: "Checkout iniciado, falta confirmación de pago",
      detail: "Cuando Stripe confirme el pago, el backend podrá activar la membresía y colocar la cuenta en el árbol.",
      tone: "var(--vp-amber)",
    },
    paid: {
      title: "Pago recibido, sincronizando árbol",
      detail: "El pago ya entró y la pantalla se actualizará mientras se confirma la colocación binaria.",
      tone: "var(--vp-accent)",
    },
    activated: {
      title: "Activación registrada, sincronizando posición",
      detail: "La activación existe y se está refrescando la lectura del árbol.",
      tone: "var(--vp-accent)",
    },
    needs_placement: {
      title: "Pago recibido, requiere colocación manual",
      detail: "Operaciones debe asignar sponsor o nodo antes de mostrar esta cuenta dentro del árbol.",
      tone: "var(--vp-amber)",
    },
    failed: {
      title: "Pago fallido",
      detail: "La cuenta no puede entrar al árbol con este intento. Debe iniciar un pago válido.",
      tone: "var(--vp-danger)",
    },
    expired: {
      title: "Checkout expirado",
      detail: "El intento venció antes de confirmar pago. Debe iniciar un checkout nuevo.",
      tone: "var(--vp-danger)",
    },
    refunded: {
      title: "Pago reembolsado",
      detail: "Un pago reembolsado no habilita colocación activa dentro del árbol.",
      tone: "var(--vp-danger)",
    },
    security_blocked: {
      title: "Bloqueado por seguridad",
      detail: "La cuenta fue retenida por reglas de seguridad y no debe colocarse en el árbol.",
      tone: "var(--vp-danger)",
    },
  };
  return map[status] || {
    title: status ? "Posición pendiente" : "Sin pago registrado",
    detail: status
      ? "La cuenta aún no tiene una ubicación activa en el árbol binario."
      : "La posición se habilita cuando se confirma la primera membresía.",
    tone: status ? "var(--vp-amber)" : "var(--vp-muted)",
  };
}

function DetailTile({ icon: Icon, label, value, accent }) {
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
        <p className="m-0 mt-1 truncate text-sm font-bold" style={{ color: "var(--vp-text)" }} title={String(value || "Pendiente")}>
          {value || "Pendiente"}
        </p>
      </div>
    </div>
  );
}

export default function NetworkPage() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const validTabs = useMemo(() => new Set(NETWORK_TABS.map((item) => item.id)), []);
  const [tab, setTab] = useState("tree");
  const [memberName, setMemberName] = useState("");
  const [treeDepth, setTreeDepth] = useState("8");
  const [refreshTick, setRefreshTick] = useState(0);
  const [state, setState] = useState({ loading: true, error: "", data: null, summary: null, referral: null, syncing: false });

  useEffect(() => {
    if (validTabs.has(requestedTab)) {
      setTab(requestedTab);
    }
  }, [requestedTab, validTabs]);

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    let tries = 0;
    const maxTries = 20; // ~60s para cubrir webhook + lag de RDS

    const load = async () => {
      const firstTry = tries === 0;
      tries += 1;
      if (firstTry) {
        setState((prev) => ({ ...prev, loading: true, error: "", syncing: false }));
      }
      try {
        const treeQuery = new URLSearchParams({
          depth: treeDepth,
          limit: treeDepth === "all" ? "5000" : "1500",
        });
        const [session, treeResponse, summaryResponse, referralResponse] = await Promise.all([
          fetch("/api/auth/session", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
          fetch(`/api/member/tree?${treeQuery.toString()}`, { cache: "no-store" }),
          fetch("/api/payments/me?fresh=1", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
          fetch("/api/member/referral", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        ]);
        const payload = await treeResponse.json().catch(() => ({}));
        if (cancelled) return;
        if (session?.name) setMemberName(session.name);
        if (!treeResponse.ok) {
          setState({ loading: false, error: payload.error || "No se pudo cargar tu posición.", data: null, summary: summaryResponse, referral: referralResponse, syncing: false });
          return;
        }

        const active = Number(summaryResponse?.active_packages ?? 0) > 0;
        const latestStatus = summaryResponse?.payments?.[0]?.status;
        const paymentReceived = active || ["paid", "activated", "needs_placement"].includes(latestStatus);
        const shouldPoll = paymentReceived && !payload?.positioned && latestStatus !== "needs_placement" && tries < maxTries;

        setState({
          loading: false,
          error: "",
          data: payload,
          summary: summaryResponse,
          referral: referralResponse,
          syncing: shouldPoll,
        });

        if (shouldPoll) {
          timer = setTimeout(load, 3000);
        }
      } catch {
        if (!cancelled) setState({ loading: false, error: "Sin conexión con el árbol.", data: null, summary: null, referral: null, syncing: false });
      }
    };

    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [treeDepth, refreshTick]);

  if (state.loading) {
    return (
      <div className="p-6">
        <StatusCard>
          <Loader2 className="animate-spin" size={16} style={{ color: "var(--vp-accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--vp-muted)" }}>
            Cargando tu posición en la red…
          </span>
        </StatusCard>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-6">
        <StatusCard>
          <span className="text-sm font-semibold" style={{ color: "var(--vp-muted)" }}>
            {state.error === "tree-unavailable"
              ? "El árbol estará disponible cuando finalice la migración."
              : /^[a-z0-9-]+$/.test(state.error)
                ? "No se pudo cargar tu red en este momento. Intenta de nuevo más tarde."
                : state.error}
          </span>
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
    const statusCopy = paymentStatusCopy(latestStatus, active);
    const sponsorLabel =
      latestPayment?.sponsor_name ||
      latestPayment?.sponsor_email ||
      (latestPayment?.sponsor_affiliate_id ? `Afiliado #${latestPayment.sponsor_affiliate_id}` : "");
    const checkoutLabel = latestPayment
      ? `Paquete ${latestPayment.package_id} · ${money(latestPayment.amount_usd)}`
      : "";

    return (
      <div className="flex flex-col gap-4 p-6">
        <StatusCard>
          {state.syncing ? (
            <Loader2 className="animate-spin" size={18} style={{ color: "var(--vp-accent)" }} />
          ) : (
            <Network size={18} style={{ color: statusCopy.tone }} />
          )}
          <div>
            <p className="m-0 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
              {needsPlacement
                ? "Tu pago requiere colocación manual"
                : paymentReceived
                  ? "Estamos sincronizando tu posición"
                  : statusCopy.title}
            </p>
            <p className="m-0 mt-1 text-xs" style={{ color: "var(--vp-muted)" }}>
              {needsPlacement
                ? "Operaciones debe asignar tu patrocinador o nodo antes de mostrarte en el árbol binario."
                : paymentReceived
                  ? "Tu pago ya fue recibido. Esta pantalla se actualiza sola mientras el backend termina de reflejar tu ubicación."
                  : statusCopy.detail}
            </p>
          </div>
        </StatusCard>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <DetailTile icon={CreditCard} label="Último checkout" value={checkoutLabel} accent={Boolean(latestPayment)} />
          <DetailTile icon={UserCheck} label="Sponsor previsto" value={sponsorLabel} accent={Boolean(sponsorLabel)} />
          <DetailTile icon={MapPin} label="Estado de árbol" value={latestStatus === "created" ? "Esperando pago" : "Sin posición activa"} />
        </section>

        <section
          className="flex flex-col gap-3 rounded-2xl border p-5 md:flex-row md:items-center md:justify-between"
          style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
        >
          <div className="flex min-w-0 items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" style={{ color: statusCopy.tone }} />
            <div className="min-w-0">
              <p className="m-0 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
                No se muestra una ubicación hasta que exista activación real
              </p>
              <p className="m-0 mt-1 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
                Esto evita que un checkout fallido, expirado o abierto genere puntos, comisiones o una posición falsa dentro del árbol.
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
              Actualizar
            </button>
            {!paymentReceived ? (
              <Link href="/dashboard/packages" className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-xs font-bold no-underline" style={{ background: "var(--vp-accent)", color: "#000000" }}>
                Completar membresía
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
    { label: "Visible", value: tree.length, tone: "positive" },
    { label: "Izquierda", value: leftCount, tone: "positive" },
    { label: "Derecha", value: rightCount, tone: "accent" },
    { label: "Con paquete", value: withPackage, tone: "accent" },
    { label: "Directos", value: directs.length, tone: "default" },
    { label: "Gen Max", value: maxGen, tone: "default" },
    { label: "Con Rango", value: withRank, tone: "default" },
    { label: "Mi Nivel", value: me.depth, tone: "positive", span: 2 },
  ];

  return (
    <div className="flex min-h-full flex-col gap-6 p-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PositionCard
          rank={me.rank?.name}
          depth={`Nivel ${me.depth}`}
          side={me.side === "L" ? "Izquierda" : me.side === "R" ? "Derecha" : "Raíz"}
          sponsor={me.sponsor}
          parent={me.parent}
          affiliateId={me.affiliateId}
          activePackage={me.activePackage}
          rankProgress={me.rankProgress}
          commissions={{
            available: state.summary?.commission_available_usd,
            maturing: state.summary?.commission_maturing_usd,
            withdrawable: state.summary?.available_for_withdrawal_usd,
            wallet: state.summary?.wallet_balance_usd,
          }}
          referral={state.referral}
          leftLeg={leftDirect?.name}
          rightLeg={rightDirect?.name}
        />
        <NetworkSummaryCard
          memberName={memberName || me.name || "Mi red"}
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
          refreshing={state.loading}
        />
      ) : null}
      {tab === "generation" ? <GenerationView nodes={tree} /> : null}
      {tab === "rank" ? <RankView nodes={tree} /> : null}
      {tab === "list" ? <OperativeListView nodes={tree} /> : null}
    </div>
  );
}
