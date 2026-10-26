"use client";

import { useNetworkHealth } from "@/lib/useNetworkHealth";

import { useSustainability } from "@/lib/useSustainability";

import { Activity, Bot, Brain, Shield, ShieldCheck, Sparkles, TrendingUp, Zap } from "lucide-react";

import { ExecutiveModulePage, MetricCard, IconCircle, StatusPill } from './executive-ui';

const moduleConfigs = {
ai: {
    eyebrow: "Inteligencia",
    title: "IA Asesor",
    subtitle: "Analisis asistido para detectar sanidad de red, acciones recomendadas y riesgos operativos antes de tomar decisiones.",
    action: { label: "Generar analisis", href: "#", icon: Brain },
    metrics: [
      { label: "Sanidad", value: "72%", detail: "estimacion local", icon: ShieldCheck, tone: "success" },
      { label: "Riesgos", value: "2", detail: "alertas suaves", icon: Activity, tone: "warning" },
      { label: "Acciones", value: "4", detail: "recomendadas", icon: Sparkles, tone: "accent" },
      { label: "Modelo", value: "LLM", detail: "pendiente backend", icon: Bot, tone: "info" },
    ],
    cards: [
      { title: "Insight principal", text: "El mayor impacto viene de completar perfiles pendientes antes de ampliar nuevas invitaciones.", icon: Brain, status: "Recomendado" },
      { title: "Sanidad de datos", text: "No hay volumen financiero publicado; el analisis evita inferir pagos o saldos no existentes.", icon: Shield, status: "Protegido" },
      { title: "Siguiente integracion", text: "Conectar OpenRouter desde backend para ejecutar diagnosticos auditables por usuario.", icon: Bot, status: "Backend" },
    ],
    tableTitle: "Recomendaciones",
    tableIcon: Sparkles,
    columns: ["Accion", "Impacto", "Estado", "Modulo"],
    rows: [
      ["Completar KYC pendiente", "Alto", "Pendiente", "Perfil"],
      ["Revisar lado con menor actividad", "Medio", "Listo", "Red"],
      ["Actualizar contacto de referidos", "Medio", "Pendiente", "Referidos"],
    ],
  }
};

function ProjectedScenarioCard({ scenario }) {
  if (!scenario) return null;
  const { scenario: name, simulation, analysis } = scenario;
  const label = name === "modesto" ? "Proyectado modesto" : name === "estres" ? "Estrés" : name;
  const score = typeof analysis?.health_score === "number" ? `${Math.round(analysis.health_score)}%` : "—";
  const risk = analysis?.risk_level ?? "—";
  const solvent = simulation?.solvent;
  const theta = typeof simulation?.worst_theta === "number" ? simulation.worst_theta.toFixed(2) : "—";
  const margin = typeof simulation?.margin === "number" ? `${(simulation.margin * 100).toFixed(1)}%` : "—";
  const streams = simulation?.streams ?? {};

  const solventTone = solvent === true ? "success" : solvent === false ? "danger" : "info";
  const solventLabel = solvent === true ? "Solvente" : solvent === false ? "No solvente" : "—";
  const scoreTone = typeof analysis?.health_score === "number"
    ? (analysis.health_score >= 70 ? "success" : analysis.health_score >= 40 ? "warning" : "danger")
    : "info";

  const riskCount = Array.isArray(analysis?.findings)
    ? analysis.findings.filter((f) => f.severity === "alta").length
    : 0;

  return (
    <div className="executive-panel">
      <h2 className="executive-section-title">
        <TrendingUp size={18} style={{ color: "var(--vp-accent)" }} />
        {label}
      </h2>

      <div className="executive-grid metrics mb-6">
        <MetricCard label="Sanidad" value={score} detail={`riesgo: ${risk}`} icon={ShieldCheck} tone={scoreTone} />
        <MetricCard label="Nivel de riesgo" value={risk} detail={`${riskCount} hallazgos altos`} icon={Activity} tone={riskCount === 0 ? "success" : "warning"} />
        <MetricCard label="Solvencia" value={solventLabel} detail={`θ peor: ${theta}`} icon={Shield} tone={solventTone} />
        <MetricCard label="Margen" value={margin} detail="margen simulado" icon={Zap} tone={solvent ? "success" : "danger"} />
      </div>

      {Object.keys(streams).length > 0 && (
        <div>
          <p className="executive-card-label mb-3">Desglose de flujos simulados</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {Object.entries(streams).map(([key, val]) => (
              <div
                key={key}
                className="rounded-2xl p-4"
                style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
              >
                <p className="executive-card-label capitalize">{key}</p>
                <p className="text-xl font-bold" style={{ color: "var(--vp-text)" }}>
                  {typeof val === "number" ? val.toLocaleString("es", { maximumFractionDigits: 0 }) : String(val)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(analysis?.findings) && analysis.findings.length > 0 && (
        <div className="mt-5">
          <p className="executive-card-label mb-3">Hallazgos clave</p>
          <div className="executive-grid three">
            {analysis.findings.slice(0, 3).map((f, i) => (
              <article key={`${name}-finding-${i}`} className="executive-card">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <IconCircle icon={f.area === "solvencia" ? Shield : f.area === "balance_binario" ? Activity : Brain} tone="accent" />
                  <StatusPill tone={f.severity === "alta" ? "danger" : f.severity === "media" ? "warning" : "info"}>
                    {f.severity === "alta" ? "Alto" : f.severity === "media" ? "Medio" : "Info"}
                  </StatusPill>
                </div>
                <h3 className="m-0 text-lg font-bold" style={{ color: "var(--vp-text)" }}>{f.title}</h3>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--vp-muted)" }}>{f.detail}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AiAdvisorDashboardPage() {
  const { loading: healthLoading, data: healthData, error: healthError } = useNetworkHealth();
  const { loading: sustLoading, data: sustData, error: sustError } = useSustainability();

  if (healthLoading) {
    const loadingConfig = {
      ...moduleConfigs.ai,
      metrics: moduleConfigs.ai.metrics.map((m) => ({ ...m, value: "…" })),
    };
    return <ExecutiveModulePage config={loadingConfig} />;
  }

  if (healthError || !healthData?.analysis) {
    const errorConfig = {
      ...moduleConfigs.ai,
      subtitle: healthError ? `Error al cargar datos: ${healthError}` : "No se pudo obtener el veredicto de red.",
      metrics: [
        { label: "Sanidad", value: "—", detail: "sin datos", icon: ShieldCheck, tone: "muted" },
        { label: "Riesgos", value: "—", detail: "sin datos", icon: Activity, tone: "muted" },
        { label: "Acciones", value: "—", detail: "sin datos", icon: Sparkles, tone: "muted" },
        { label: "Modelo", value: "—", detail: "sin datos", icon: Bot, tone: "muted" },
      ],
    };
    return <ExecutiveModulePage config={errorConfig} />;
  }

  const { analysis, rank_exposure } = healthData;
  const healthScore = typeof analysis.health_score === "number" ? `${Math.round(analysis.health_score)}%` : "—";
  const riskCount = Array.isArray(analysis.findings) ? analysis.findings.filter((f) => f.severity === "alta").length : "—";
  const actionCount = Array.isArray(analysis.actions) ? analysis.actions.length : "—";

  const exposureDetail = rank_exposure
    ? `Exposición: ${rank_exposure.liability_usd ?? "—"}`
    : "sin datos";

  const liveConfig = {
    ...moduleConfigs.ai,
    subtitle: analysis.summary || moduleConfigs.ai.subtitle,
    metrics: [
      { label: "Sanidad", value: healthScore, detail: analysis.risk_level || "estimacion local", icon: ShieldCheck, tone: analysis.health_score >= 70 ? "success" : analysis.health_score >= 40 ? "warning" : "danger" },
      { label: "Riesgos", value: String(riskCount), detail: `nivel: ${analysis.risk_level || "—"}`, icon: Activity, tone: riskCount === 0 ? "success" : "warning" },
      { label: "Acciones", value: String(actionCount), detail: "recomendadas", icon: Sparkles, tone: "accent" },
      { label: "Exposicion", value: rank_exposure ? String(rank_exposure.pending_installments ?? "—") : "—", detail: exposureDetail, icon: Bot, tone: "info" },
    ],
    cards: Array.isArray(analysis.findings) && analysis.findings.length > 0
      ? analysis.findings.slice(0, 3).map((f) => ({
          title: f.title,
          text: f.detail,
          icon: f.area === "solvencia" ? Shield : f.area === "balance_binario" ? Activity : Brain,
          status: f.severity === "alta" ? "Alto" : f.severity === "media" ? "Medio" : f.severity === "normal" ? "Info" : "Info",
        }))
      : moduleConfigs.ai.cards,
    rows: Array.isArray(analysis.actions) && analysis.actions.length > 0
      ? analysis.actions.map((a) => [a.title, a.detail?.slice(0, 40) ?? "—", a.priority ?? "—", a.target ?? "Red"])
      : moduleConfigs.ai.rows,
  };

  const projected = Array.isArray(sustData?.projected) ? sustData.projected : [];

  return (
    <>
      {/* Live verdict */}
      <ExecutiveModulePage config={liveConfig} />

      {/* Projected scenarios — appended below live verdict */}
      <section className="executive-page" style={{ paddingTop: 0 }}>
        <div className="executive-container">
          <div className="mb-6">
            <p className="executive-eyebrow">Análisis prospectivo</p>
            <h2 className="executive-title">Escenarios proyectados</h2>
            <p className="executive-subtitle">
              {sustLoading
                ? "Cargando escenarios proyectados…"
                : sustError
                ? `Error al cargar proyecciones: ${sustError}`
                : projected.length === 0
                ? "Sin datos de proyección disponibles."
                : "Simulación de sostenibilidad en condiciones de carga creciente."}
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {!sustLoading && !sustError && projected.map((s) => (
              <ProjectedScenarioCard key={s.scenario} scenario={s} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
