import { coreFetch } from '@/lib/cloudflare-runtime.mjs';
import { rawIdToken } from "@/lib/admin-bff";
import { NextResponse } from "next/server";

import { getNetworkDashboardModel } from "@/lib/dashboardNetworkModel";
import { verifiedEmailFromIdTokenForSession as verifiedEmailFromIdToken } from "@/lib/verify-id-token";
import { AuthServiceUnavailable } from "@/lib/better-auth-bridge.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Era la única ruta API sin verificación de sesión: el POST reenviaba JSON
// arbitrario de un cliente anónimo al motor interno si VP_ENGINE_HTTP_URL
// estaba configurado. Fail-closed: sesión Cognito verificada o 401.
async function requireSession() {
  try {
    const idToken = await rawIdToken();
    if (!idToken) return reply({ error: "unauthenticated" }, 401);
    const email = await verifiedEmailFromIdToken(idToken);
    return email ? null : reply({ error: "unauthenticated" }, 401);
  } catch (error) {
    if (!(error instanceof AuthServiceUnavailable)) throw error;
    return reply({ error: 'authentication_unavailable' }, 503);
  }
}

const reply = (body, status = 200) => NextResponse.json(body, {
  status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
});

export async function GET() {
  const denied = await requireSession();
  if (denied) return denied;
  const model = getNetworkDashboardModel();

  return reply({
    provider: process.env.LLM_PROVIDER || "local-network-rules",
    insights: model.insights,
    context: model.llmContext,
  });
}

export async function POST(request) {
  const denied = await requireSession();
  if (denied) return denied;
  let payload;
  try { payload = await request.json(); }
  catch { return reply({ error: 'invalid_json' }, 400); }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return reply({ error: 'invalid_json' }, 400);
  const engineURL = process.env.VP_ENGINE_HTTP_URL || process.env.BACKEND_ANALYSIS_URL;

  if (engineURL) {
    try {
      const response = await coreFetch(`${engineURL.replace(/\/$/, "")}/network/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      const data = await response.json();
      return reply(data, response.status);
    } catch {
      const fallback = buildLocalAnalysis(payload);
      fallback.warnings = ["El servicio de análisis no está disponible; se muestra un cálculo local."];
      return reply(fallback);
    }
  }

  return reply(buildLocalAnalysis(payload));
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
