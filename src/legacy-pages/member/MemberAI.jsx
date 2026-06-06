import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  GitBranch,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingDown,
  Users,
} from "lucide-react";
import platformDataCore from "@/lib/platformDataCore";
import { getAllDescendants } from "@/lib/warRoomDataAdapter";

export default function MemberAI() {
  const userId = localStorage.getItem("user_id");
  const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const networkData = useMemo(() => {
    const descendants = getAllDescendants(userId, platformDataCore.network_nodes, platformDataCore.users);
    const nodes = platformDataCore.network_nodes.filter((node) => descendants.some((member) => member.id === node.member_id));
    let leftMembers = descendants.filter((member) => normalizeSide(member.binary_side || member.side) === "left");
    let rightMembers = descendants.filter((member) => normalizeSide(member.binary_side || member.side) === "right");

    if (leftMembers.length + rightMembers.length === 0) {
      const leftNodes = nodes.filter((node) => normalizeSide(node.binary_side || node.side) === "left");
      const rightNodes = nodes.filter((node) => normalizeSide(node.binary_side || node.side) === "right");
      leftMembers = leftNodes.map((node) => platformDataCore.users.find((user) => user.id === node.member_id)).filter(Boolean);
      rightMembers = rightNodes.map((node) => platformDataCore.users.find((user) => user.id === node.member_id)).filter(Boolean);
    }

    if (leftMembers.length + rightMembers.length === 0 && descendants.length > 0) {
      const midpoint = Math.ceil(descendants.length / 2);
      leftMembers = descendants.slice(0, midpoint);
      rightMembers = descendants.slice(midpoint);
    }
    const totalMembers = descendants.length;
    const totalActive = descendants.filter((member) => member.status === "activo").length;
    const investmentLeft = leftMembers.reduce((sum, member) => sum + (member.investment || 0), 0);
    const investmentRight = rightMembers.reduce((sum, member) => sum + (member.investment || 0), 0);
    const totalInvestment = descendants.reduce((sum, member) => sum + (member.investment || 0), 0);

    return {
      descendants,
      leftSize: leftMembers.length,
      rightSize: rightMembers.length,
      activeLeft: leftMembers.filter((member) => member.status === "activo").length,
      activeRight: rightMembers.filter((member) => member.status === "activo").length,
      investmentLeft,
      investmentRight,
      totalMembers,
      totalActive,
      totalInvestment,
      activeRate: totalMembers > 0 ? Math.round((totalActive / totalMembers) * 100) : 0,
    };
  }, [userId]);

  const requestPayload = useMemo(() => ({
    affiliate_id: userId || "demo",
    generated_at: new Date().toISOString(),
    metrics: {
      total_members: networkData.totalMembers,
      active_members: networkData.totalActive,
      left_members: networkData.leftSize,
      right_members: networkData.rightSize,
      left_volume: networkData.investmentLeft,
      right_volume: networkData.investmentRight,
      company_fund: Math.round(networkData.totalInvestment * 0.5),
      projected_outflows: Math.round(networkData.totalInvestment * 0.22),
      worst_theta: 0.91,
      rank: userData.rank || "Miembro",
    },
    recent_events: networkData.descendants.slice(0, 8).map((member) => ({
      type: member.status === "activo" ? "active_member" : "inactive_member",
      side: member.binary_side || member.side || "",
      amount: member.investment || 0,
      member_id: member.id,
      notes: member.name,
    })),
  }), [networkData, userData.rank, userId]);

  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestPayload]);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/network/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "No se pudo analizar la red.");
      }
      setAnalysis(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const health = Number(analysis?.health_score || 0);
  const weakLeg = analysis?.weak_leg === "right" ? "Derecha" : analysis?.weak_leg === "left" ? "Izquierda" : "Balanceada";

  return (
    <div className="min-h-screen px-5 py-8 sm:px-8 lg:px-10" style={{ background: "var(--vp-bg)", color: "var(--vp-text)" }}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-black" style={{ color: "var(--vp-accent)" }}>
              Inteligencia de red
            </p>
            <h1 className="text-3xl font-black" style={{ color: "var(--vp-text)" }}>
              Sanidad del arbol binario
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
              Analisis operativo con reglas deterministicas y LLM configurable por OpenRouter.
            </p>
          </div>
          <button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              color: "var(--vp-shell)",
              background: "var(--vp-accent)",
              border: "1px solid var(--vp-accent-strong)",
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            Analizar ahora
          </button>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <MetricCard icon={Users} label="Red total" value={networkData.totalMembers} />
          <MetricCard icon={Activity} label="Activos" value={`${networkData.totalActive} / ${networkData.activeRate}%`} />
          <MetricCard icon={GitBranch} label="Pierna debil" value={weakLeg} accent />
          <MetricCard icon={ShieldCheck} label="Sanidad" value={loading ? "..." : `${health}/100`} />
        </section>

        {error && (
          <div
            className="mb-6 flex gap-3 rounded-lg p-4 text-sm"
            style={{ color: "var(--vp-danger)", background: "var(--vp-danger-muted)", border: "1px solid var(--vp-danger-border)" }}
          >
            <AlertTriangle size={17} />
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div
            className="rounded-xl p-6"
            style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", boxShadow: "var(--vp-shadow)" }}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                  style={{ color: "var(--vp-accent)", background: "var(--vp-accent-muted)", border: "1px solid var(--vp-accent-border)" }}
                >
                  <Bot size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black" style={{ color: "var(--vp-text)" }}>
                    Modelo de analisis
                  </h2>
                  <p className="mt-1 text-sm" style={{ color: "var(--vp-muted)" }}>
                    {analysis?.provider || "preparando"} {analysis?.model ? `· ${analysis.model}` : ""}
                  </p>
                </div>
              </div>
              <RiskBadge risk={analysis?.risk_level} />
            </div>

            <div className="mb-6 h-3 rounded-full" style={{ background: "var(--vp-surface-raised)" }}>
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.max(0, health))}%`,
                  background: health >= 78 ? "var(--vp-accent)" : health >= 60 ? "var(--vp-amber)" : "var(--vp-danger)",
                }}
              />
            </div>

            <p className="mb-6 text-base leading-7" style={{ color: "var(--vp-text-soft)" }}>
              {loading ? "Analizando la red..." : analysis?.summary || "Ejecuta el analisis para ver el diagnostico."}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {(analysis?.predictions || []).map((prediction) => (
                <div key={`${prediction.label}-${prediction.horizon}`} className="rounded-lg p-4" style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black" style={{ color: "var(--vp-text)" }}>
                      {prediction.label}
                    </h3>
                    <span className="text-xs font-bold" style={{ color: "var(--vp-accent)" }}>
                      {Math.round(Number(prediction.score || 0) * 100)}%
                    </span>
                  </div>
                  <p className="text-xs font-bold" style={{ color: "var(--vp-muted)" }}>
                    {prediction.horizon} · {prediction.direction}
                  </p>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--vp-text-soft)" }}>
                    {prediction.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <Panel title="Acciones prioritarias" icon={Target}>
              <div className="space-y-3">
                {(analysis?.actions || []).map((action) => (
                  <ActionRow key={`${action.title}-${action.target}`} action={action} />
                ))}
                {!analysis?.actions?.length && (
                  <p className="text-sm" style={{ color: "var(--vp-muted)" }}>
                    Sin acciones cargadas todavia.
                  </p>
                )}
              </div>
            </Panel>

            <Panel title="Hallazgos" icon={TrendingDown}>
              <div className="space-y-3">
                {(analysis?.findings || []).map((finding) => (
                  <FindingRow key={`${finding.area}-${finding.title}`} finding={finding} />
                ))}
              </div>
            </Panel>
          </aside>
        </section>
      </div>
    </div>
  );
}

function normalizeSide(side) {
  const value = String(side || "").toLowerCase();
  if (["left", "l", "izquierda"].includes(value)) return "left";
  if (["right", "r", "derecha"].includes(value)) return "right";
  return "";
}

function MetricCard({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}>
      <Icon size={18} style={{ color: accent ? "var(--vp-accent)" : "var(--vp-muted)" }} />
      <p className="mt-4 text-xs font-bold" style={{ color: "var(--vp-muted)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-black" style={{ color: accent ? "var(--vp-accent)" : "var(--vp-text)" }}>
        {value}
      </p>
    </div>
  );
}

function RiskBadge({ risk = "bajo" }) {
  const high = risk === "alto";
  const mid = risk === "medio";
  return (
    <span
      className="rounded-lg px-3 py-2 text-xs font-black"
      style={{
        color: high ? "var(--vp-danger)" : mid ? "var(--vp-amber)" : "var(--vp-accent)",
        background: high ? "var(--vp-danger-muted)" : mid ? "var(--vp-amber-muted)" : "var(--vp-accent-muted)",
        border: high ? "1px solid var(--vp-danger-border)" : mid ? "1px solid var(--vp-amber-border)" : "1px solid var(--vp-accent-border)",
      }}
    >
      Riesgo {risk || "bajo"}
    </span>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}>
      <div className="mb-4 flex items-center gap-2">
        <Icon size={17} style={{ color: "var(--vp-accent)" }} />
        <h2 className="text-sm font-black" style={{ color: "var(--vp-text)" }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function ActionRow({ action }) {
  return (
    <div className="rounded-lg p-4" style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black" style={{ color: "var(--vp-text)" }}>
          {action.title}
        </h3>
        <ArrowRight size={14} style={{ color: "var(--vp-muted)" }} />
      </div>
      <p className="text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
        {action.detail}
      </p>
    </div>
  );
}

function FindingRow({ finding }) {
  const isHigh = finding.severity === "alta";
  return (
    <div className="flex gap-3 rounded-lg p-3" style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}>
      {isHigh ? (
        <AlertTriangle className="mt-0.5 shrink-0" size={16} style={{ color: "var(--vp-danger)" }} />
      ) : (
        <CheckCircle2 className="mt-0.5 shrink-0" size={16} style={{ color: "var(--vp-accent)" }} />
      )}
      <div>
        <h3 className="text-sm font-black" style={{ color: "var(--vp-text)" }}>
          {finding.title}
        </h3>
        <p className="mt-1 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
          {finding.detail}
        </p>
      </div>
    </div>
  );
}
