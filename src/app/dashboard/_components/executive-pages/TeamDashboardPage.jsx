"use client";

import { useEffect, useState } from "react";

import { Activity, CheckCircle2, Mail, Shield, Trophy, Users } from "lucide-react";

import { ExecutiveModulePage } from './executive-ui';

const moduleConfigs = {
team: {
    eyebrow: "Equipo",
    title: "Equipo Pro",
    subtitle: "Gestiona miembros, estados, rangos y prioridades de acompanamiento desde una vista de trabajo repetible.",
    action: { label: "Contactar equipo", href: "/dashboard/communications", icon: Mail },
    // Placeholder: TeamDashboardPage lo reemplaza con datos reales del árbol.
    metrics: [
      { label: "Miembros", value: "—", detail: "cargando", icon: Users, tone: "accent" },
      { label: "Activos", value: "—", detail: "cargando", icon: CheckCircle2, tone: "success" },
      { label: "Inactivos", value: "—", detail: "cargando", icon: Activity, tone: "warning" },
      { label: "Con rango", value: "—", detail: "cargando", icon: Trophy, tone: "accent" },
    ],
    cards: [
      { title: "Pipeline del equipo", text: "Agrupa miembros por estado para evitar acciones dispersas.", icon: Users, status: "Operativo" },
      { title: "Prioridad semanal", text: "Completar KYC, confirmar datos personales y actualizar contacto.", icon: Shield, status: "Alta" },
      { title: "Comunicacion", text: "Usa mensajes internos para registrar seguimiento y evitar perdida de contexto.", icon: Mail, status: "Disponible" },
    ],
    tableTitle: "Equipo",
    tableIcon: Users,
    columns: ["Miembro", "Rango", "Estado", "Posición"],
    // Se llena en runtime con /api/member/tree (TeamDashboardPage).
    rows: [],
  }
};

export function TeamDashboardPage() {
  // Datos reales de la red del miembro — nunca equipo simulado.
  const [network, setNetwork] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/member/tree?depth=6&limit=200", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d && !d.error) setNetwork(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const nodes = network?.positioned ? network.tree : [];
  const actives = nodes.filter((n) => n.status === "active").length;
  const ranked = nodes.filter((n) => n.rank).length;
  const config = {
    ...moduleConfigs.team,
    metrics: [
      { label: "Miembros", value: String(nodes.length), detail: "rama visible", icon: Users, tone: "accent" },
      { label: "Activos", value: String(actives), detail: "estado activo", icon: CheckCircle2, tone: "success" },
      { label: "Inactivos", value: String(nodes.length - actives), detail: "sin actividad", icon: Activity, tone: "warning" },
      { label: "Con rango", value: String(ranked), detail: "rango vigente", icon: Trophy, tone: "accent" },
    ],
    rows: nodes.slice(0, 100).map((n) => [
      n.name,
      n.rank?.name || "Sin rango",
      n.status === "active" ? "Activo" : "Inactivo",
      `Nivel ${n.level} · Rama ${n.rootSide === "L" ? "Izq" : n.rootSide === "R" ? "Der" : "—"}`,
    ]),
  };
  return <ExecutiveModulePage config={config} />;
}
