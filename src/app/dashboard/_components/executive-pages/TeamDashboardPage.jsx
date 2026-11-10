"use client";

import { useEffect, useState } from "react";

import { Activity, CheckCircle2, Mail, Shield, Trophy, Users } from "lucide-react";
import { readMemberJson, validMemberTree } from "@/lib/member-read.mjs";

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
  const [network, setNetwork] = useState({ status: "loading", data: null });
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    readMemberJson("/api/member/tree?depth=6&limit=200", { signal: controller.signal, validate: validMemberTree })
      .then((data) => { if (!cancelled) setNetwork({ status: "ready", data }); })
      .catch(() => { if (!cancelled) setNetwork({ status: "error", data: null }); });
    return () => { cancelled = true; controller.abort(); };
  }, []);

  const nodes = network.status === "ready" && network.data?.positioned ? network.data.tree : [];
  const actives = nodes.filter((n) => n.status === "active").length;
  const ranked = nodes.filter((n) => n.rank).length;
  const pending = network.status === "loading";
  const unavailable = network.status === "error";
  const value = (readyValue) => pending || unavailable ? "—" : String(readyValue);
  const detail = (readyText) => pending ? "cargando" : unavailable ? "sin confirmar" : readyText;
  const config = {
    ...moduleConfigs.team,
    metrics: [
      { label: "Miembros", value: value(nodes.length), detail: detail("rama visible"), icon: Users, tone: "accent" },
      { label: "Activos", value: value(actives), detail: detail("estado activo"), icon: CheckCircle2, tone: "success" },
      { label: "Inactivos", value: value(nodes.length - actives), detail: detail("sin actividad"), icon: Activity, tone: "warning" },
      { label: "Con rango", value: value(ranked), detail: detail("rango vigente"), icon: Trophy, tone: "accent" },
    ],
    tableMessage: pending ? "Cargando miembros de tu red…" : unavailable
      ? "La red está en sincronización. Actualiza nuevamente en unos instantes."
      : "Aún no hay miembros visibles en esta rama.",
    rows: nodes.slice(0, 100).map((n) => [
      n.name,
      n.rank?.name || "Sin rango",
      n.status === "active" ? "Activo" : "Inactivo",
      `Nivel ${n.level} · Rama ${n.rootSide === "L" ? "Izq" : n.rootSide === "R" ? "Der" : "—"}`,
    ]),
  };
  return <ExecutiveModulePage config={config} />;
}
