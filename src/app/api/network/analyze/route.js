import { NextResponse } from "next/server";

import { getNetworkDashboardModel } from "@/lib/dashboardNetworkModel";

export const runtime = "nodejs";

export async function GET() {
  const model = getNetworkDashboardModel();

  return NextResponse.json({
    provider: process.env.LLM_PROVIDER || "local-network-rules",
    insights: model.insights,
    context: model.llmContext,
  });
}

export async function POST(request) {
  const payload = await request.json();
  const engineURL = process.env.VP_ENGINE_HTTP_URL || process.env.BACKEND_ANALYSIS_URL;

  if (engineURL) {
    try {
      const response = await fetch(`${engineURL.replace(/\/$/, "")}/network/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      const fallback = buildLocalAnalysis(payload);
      fallback.warnings = [`No se pudo contactar vp-engine: ${error.message}`];
      return NextResponse.json(fallback);
    }
  }

  return NextResponse.json(buildLocalAnalysis(payload));
}

function buildLocalAnalysis(payload = {}) {
  const metrics = payload.metrics || {};
  const model = getNetworkDashboardModel();
  const total = Number(metrics.total_members ?? model.network.totalMembers ?? 0);
  const active = Number(metrics.active_members ?? model.network.activeMembers ?? 0);
  const left = Number(metrics.left_members ?? model.network.leftLeg.members ?? 0);
  const right = Number(metrics.right_members ?? model.network.rightLeg.members ?? 0);
  const leftVolume = Number(metrics.left_volume ?? model.network.leftLeg.volume ?? 0);
  const rightVolume = Number(metrics.right_volume ?? model.network.rightLeg.volume ?? 0);
  const weakLeg = left <= right ? "left" : "right";
  const activeRate = total > 0 ? active / total : 0;
  const balance = Math.min(left, right) / Math.max(left, right, 1);
  const healthScore = Math.max(0, Math.round(100 - (1 - activeRate) * 30 - (1 - balance) * 35));

  return {
    provider: "next-local-network-rules",
    mode: "deterministic",
    model: null,
    health_score: healthScore,
    risk_level: healthScore < 60 ? "alto" : healthScore < 78 ? "medio" : "bajo",
    weak_leg: weakLeg,
    summary: `Sanidad ${healthScore}/100. Pierna debil: ${weakLeg === "left" ? "izquierda" : "derecha"}.`,
    findings: [
      {
        severity: balance < 0.55 ? "alta" : balance < 0.8 ? "media" : "normal",
        area: "balance_binario",
        title: "Balance de piernas",
        detail: `Izquierda: ${left} miembros / ${leftVolume} PV. Derecha: ${right} miembros / ${rightVolume} PV.`,
      },
      {
        severity: activeRate < 0.5 ? "alta" : activeRate < 0.75 ? "media" : "normal",
        area: "actividad",
        title: "Actividad de red",
        detail: `${active} de ${total} miembros estan activos.`,
      },
      {
        severity: "media",
        area: "pierna_debil",
        title: "Pierna debil detectada",
        detail: `Prioriza seguimiento y derrame hacia la pierna ${weakLeg === "left" ? "izquierda" : "derecha"}.`,
      },
    ],
    predictions: [
      {
        label: "Presion de pago binario",
        horizon: "proximo cierre",
        direction: balance < 0.65 ? "deterioro" : "estable",
        score: Number((1 - balance).toFixed(2)),
        reason: "Calculado por balance relativo de piernas.",
      },
    ],
    actions: [
      {
        priority: "alta",
        title: "Priorizar pierna debil",
        detail: "Dirigir nuevos referidos y reactivaciones al lado con menor volumen operativo.",
        target: weakLeg,
      },
    ],
  };
}
