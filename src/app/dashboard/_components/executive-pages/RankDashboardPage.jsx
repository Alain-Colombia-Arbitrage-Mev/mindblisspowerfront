"use client";

import { useEffect, useState } from "react";

import { readRankCatalog } from "@/lib/rank-catalog.mjs";
import { readMemberJson } from "@/lib/member-read.mjs";
import { rankPagePresentation, validRankPosition } from './rank-page-model.mjs';

import { Activity, BarChart3, CheckCircle2, DollarSign, Shield, TrendingUp, Trophy } from "lucide-react";

import { ExecutiveModulePage } from './executive-ui';

const moduleConfigs = {
ranks: {
    eyebrow: "Progreso",
    title: "Haz visible tu avance",
    subtitle: "Revisa tu rango actual, el siguiente paso y los requisitos pendientes sin mezclar progreso con liquidaciones.",
    action: { label: "Ver actividad", href: "/dashboard/activity", icon: Activity },
    // Placeholder: RankDashboardPage lo reemplaza con el rango REAL del miembro.
    metrics: [
      { label: "Rango actual", value: "—", detail: "cargando", icon: Trophy, tone: "accent" },
      { label: "Siguiente rango", value: "—", detail: "cargando", icon: TrendingUp, tone: "success" },
      { label: "Bono del siguiente", value: "—", detail: "al calificar", icon: DollarSign, tone: "warning" },
      { label: "Rangos en carrera", value: "—", detail: "catálogo", icon: Shield, tone: "muted" },
    ],
    cards: [
      { title: "Requisito inmediato", text: "Mantener datos personales completos y actividad verificable.", icon: CheckCircle2, status: "En curso" },
      { title: "Puntos", text: "Los puntos de rango deben venir del backend y no de calculos visuales temporales.", icon: BarChart3, status: "Auditado" },
      { title: "Siguiente nivel", text: "El avance se habilita cuando existan reglas de rango conectadas al perfil.", icon: Trophy, status: "Pendiente" },
    ],
    tableTitle: "Ruta de rangos",
    tableIcon: Trophy,
    columns: ["Rango", "Estado", "Puntos requeridos", "Bono"],
    // Se llena en runtime con mlm.rank + el rango real del miembro.
    rows: [],
  }
};

export function RankDashboardPage() {
  // Rango REAL del miembro (mlm.affiliate.current_rank_id) + carrera de rangos
  // real (mlm.rank). Antes mostraba "Corona" hardcodeado para todos.
  const [catalog, setCatalog] = useState({ loading: true, data: null, error: false });
  const [position, setPosition] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    // Public definitions and the private member proof are independent. A
    // catalog outage must not erase a confirmed rank or imply maximum rank.
    void readRankCatalog()
      .then(data => { if (!cancelled) setCatalog({ loading: false, data, error: false }); })
      .catch(() => { if (!cancelled) setCatalog({ loading: false, data: null, error: true }); });
    void readMemberJson('/api/member/tree?view=position', { signal: controller.signal, validate: validRankPosition })
      .then(data => { if (!cancelled) setPosition({ loading: false, data, error: null }); })
      .catch(error => {
        if (!cancelled) setPosition({ loading: false, data: null, error: { status: error?.status } });
      });
    return () => { cancelled = true; controller.abort(); };
  }, []);

  const presentation = rankPagePresentation(catalog, position);

  const config = {
    ...moduleConfigs.ranks,
    metrics: [
      { label: "Rango actual", ...presentation.current, icon: Trophy, tone: "accent" },
      { label: "Siguiente rango", ...presentation.next, icon: TrendingUp, tone: "success" },
      { label: "Bono del siguiente", ...presentation.bonus, icon: DollarSign, tone: "warning" },
      { label: "Rangos en carrera", ...presentation.catalog, icon: Shield, tone: "muted" },
    ],
    rows: presentation.rows,
  };
  return <ExecutiveModulePage config={config} />;
}
