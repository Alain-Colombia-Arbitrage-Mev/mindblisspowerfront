"use client";

import { useEffect, useState } from "react";

import { readRankCatalog } from "@/lib/rank-catalog.mjs";

import { Activity, BarChart3, CheckCircle2, DollarSign, Shield, TrendingUp, Trophy } from "lucide-react";

import { ExecutiveModulePage } from './executive-ui';

const moduleConfigs = {
ranks: {
    eyebrow: "Progreso",
    title: "Rangos",
    subtitle: "Carrera de rangos, avance operativo y requisitos pendientes presentados sin mezclar datos simulados con liquidaciones reales.",
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
  const [ranks, setRanks] = useState([]);
  const [myRank, setMyRank] = useState(null); // {code,name,order} | null
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      readRankCatalog(),
      fetch("/api/member/tree?view=position", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([rk, tree]) => {
        if (cancelled) return;
        if (rk?.ranks) setRanks(rk.ranks);
        if (tree?.positioned && tree.me?.rank) setMyRank(tree.me.rank);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const money0 = (v) => `$${Number(v ?? 0).toLocaleString("en-US")}`;
  const currentIdx = myRank ? ranks.findIndex((r) => r.code === myRank.code) : -1;
  const next = currentIdx + 1 < ranks.length ? ranks[currentIdx + 1] : null;

  const config = {
    ...moduleConfigs.ranks,
    metrics: [
      { label: "Rango actual", value: loaded ? (myRank?.name || "Sin rango") : "—", detail: "según la red migrada", icon: Trophy, tone: "accent" },
      { label: "Siguiente rango", value: next ? next.name_es : loaded ? "Máximo" : "—", detail: "en la carrera", icon: TrendingUp, tone: "success" },
      { label: "Bono del siguiente", value: next ? money0(next.bonus_amount_usd) : "—", detail: "al calificar", icon: DollarSign, tone: "warning" },
      { label: "Rangos en carrera", value: ranks.length ? String(ranks.length) : "—", detail: "catálogo oficial", icon: Shield, tone: "muted" },
    ],
    rows: ranks.map((r, i) => [
      r.name_es,
      i <= currentIdx ? (i === currentIdx ? "Actual" : "Alcanzado") : "Pendiente",
      Number(r.required_points).toLocaleString("en-US"),
      money0(r.bonus_amount_usd),
    ]),
  };
  return <ExecutiveModulePage config={config} />;
}
