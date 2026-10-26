"use client";

import { BarChart3, MessageSquare, Network, Target, TrendingUp, UserPlus, Users } from "lucide-react";

import { ExecutiveModulePage } from './executive-ui';

const moduleConfigs = {
network: {
    eyebrow: "Red",
    title: "Analisis de red",
    subtitle: "Vista operativa para revisar lados, actividad, referidos directos y puntos de seguimiento sin mezclar saldos simulados.",
    action: { label: "Ver referidos", href: "/dashboard/referrals", icon: UserPlus },
    metrics: [
      { label: "Red activa", value: "9", detail: "miembros visibles", icon: Users, tone: "accent" },
      { label: "Lado izquierdo", value: "4", detail: "conteo actual", icon: Network, tone: "muted" },
      { label: "Lado derecho", value: "5", detail: "conteo actual", icon: Network, tone: "accent" },
      { label: "Volumen", value: "$0.00", detail: "pendiente de liquidacion", icon: BarChart3, tone: "info" },
    ],
    cards: [
      { title: "Posicion actual", text: "Tu posicion esta activa y lista para recibir nuevas invitaciones desde el codigo unico.", icon: Target, status: "Activo" },
      { title: "Balance operativo", text: "El lado con menor actividad se calcula por conteo mientras no exista volumen publicado.", icon: TrendingUp, status: "44% / 56%" },
      { title: "Siguiente accion", text: "Prioriza seguimiento de invitados pendientes antes de abrir nuevas conversaciones.", icon: MessageSquare, status: "Seguimiento" },
    ],
    tableTitle: "Miembros recientes",
    tableIcon: Users,
    columns: ["Nombre", "Lado", "Estado", "Actividad"],
    rows: [],
  }
};

export function NetworkDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.network} />;
}
