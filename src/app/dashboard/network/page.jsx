"use client";

import { useEffect, useState } from "react";
import { Loader2, Network } from "lucide-react";

import BinaryTreeView from "@/components/panel/network/BinaryTreeView";
import GenerationView from "@/components/panel/network/GenerationView";
import NetworkSummaryCard from "@/components/panel/network/NetworkSummaryCard";
import NetworkTabs from "@/components/panel/network/NetworkTabs";
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

export default function NetworkPage() {
  const [tab, setTab] = useState("generation");
  const [memberName, setMemberName] = useState("");
  const [state, setState] = useState({ loading: true, error: "", data: null, summary: null, syncing: false });

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    let tries = 0;
    const maxTries = 20; // ~60s para cubrir webhook + lag de RDS

    const load = async () => {
      tries += 1;
      try {
        const [session, treeResponse, summaryResponse] = await Promise.all([
          fetch("/api/auth/session", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
          fetch("/api/member/tree", { cache: "no-store" }),
          fetch("/api/payments/me?fresh=1", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
        ]);
        const payload = await treeResponse.json().catch(() => ({}));
        if (cancelled) return;
        if (session?.name) setMemberName(session.name);
        if (!treeResponse.ok) {
          setState({ loading: false, error: payload.error || "No se pudo cargar tu posición.", data: null, summary: summaryResponse, syncing: false });
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
          syncing: shouldPoll,
        });

        if (shouldPoll) {
          timer = setTimeout(load, 3000);
        }
      } catch {
        if (!cancelled) setState({ loading: false, error: "Sin conexión con el árbol.", data: null, summary: null, syncing: false });
      }
    };

    load();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

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
    const latestStatus = state.summary?.payments?.[0]?.status;
    const active = Number(state.summary?.active_packages ?? 0) > 0;
    const paymentReceived = active || ["paid", "activated", "needs_placement"].includes(latestStatus);
    const needsPlacement = latestStatus === "needs_placement";

    return (
      <div className="p-6">
        <StatusCard>
          {state.syncing ? (
            <Loader2 className="animate-spin" size={18} style={{ color: "var(--vp-accent)" }} />
          ) : (
            <Network size={18} style={{ color: "var(--vp-accent)" }} />
          )}
          <div>
            <p className="m-0 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
              {needsPlacement
                ? "Tu pago requiere colocación manual"
                : paymentReceived
                  ? "Estamos sincronizando tu posición"
                  : "Aún no tienes posición en el árbol"}
            </p>
            <p className="m-0 mt-1 text-xs" style={{ color: "var(--vp-muted)" }}>
              {needsPlacement
                ? "Operaciones debe asignar tu patrocinador o nodo antes de mostrarte en el árbol binario."
                : paymentReceived
                  ? "Tu pago ya fue recibido. Esta pantalla se actualiza sola mientras el backend termina de reflejar tu ubicación."
                  : "Tu posición se asigna al activar tu primera membresía."}
            </p>
          </div>
        </StatusCard>
      </div>
    );
  }

  const { me, tree } = state.data;
  const directs = tree.filter((node) => node.level === 1);
  const leftDirect = directs.find((node) => node.side === "L");
  const rightDirect = directs.find((node) => node.side === "R");
  const leftCount = tree.filter((node) => node.side === "L").length;
  const rightCount = tree.filter((node) => node.side === "R").length;
  const maxGen = tree.reduce((max, node) => Math.max(max, node.level ?? 0), 0);
  const withRank = tree.filter((node) => node.rank).length;

  const summaryMetrics = [
    { label: "Total", value: tree.length, tone: "positive" },
    { label: "Izquierda", value: leftCount, tone: "positive" },
    { label: "Derecha", value: rightCount, tone: "accent" },
    { label: "Con Rango", value: withRank, tone: "default" },
    { label: "Directos", value: directs.length, tone: "default" },
    { label: "Gen Max", value: maxGen, tone: "default" },
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

      {tab === "tree" ? <BinaryTreeView nodes={tree} me={me} /> : null}
      {tab === "generation" ? <GenerationView nodes={tree} /> : null}
      {tab === "rank" ? <RankView nodes={tree} /> : null}
      {tab === "list" ? <OperativeListView nodes={tree} /> : null}
    </div>
  );
}
