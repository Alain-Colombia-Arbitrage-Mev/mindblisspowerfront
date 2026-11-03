"use client";

import { Activity, Bell, CheckCircle2, Download, FileText, Filter, Shield } from "lucide-react";

import { ExecutiveModulePage } from './executive-ui';

import { activityRows } from './member-defaults.mjs';

const moduleConfigs = {
activity: {
    eyebrow: "Actividad",
    title: "Reporte de actividad",
    subtitle: "Bitacora operativa para revisar sesiones, perfil, KYC, referidos y cambios importantes en la cuenta.",
    action: { label: "Exportar", href: "#", icon: Download },
    metrics: [
      { label: "Eventos", value: "4", detail: "recientes", icon: Activity, tone: "accent" },
      { label: "Completados", value: "2", detail: "sin accion", icon: CheckCircle2, tone: "success" },
      { label: "Pendientes", value: "2", detail: "requieren revision", icon: Bell, tone: "warning" },
      { label: "Alertas", value: "0", detail: "criticas", icon: Shield, tone: "muted" },
    ],
    cards: [
      { title: "Registro claro", text: "Cada accion debe dejar evidencia, fecha y modulo de origen.", icon: FileText, status: "Activo" },
      { title: "Actividad sensible", text: "Retiros, KYC y seguridad requieren trazabilidad adicional.", icon: Shield, status: "Controlado" },
      { title: "Filtros", text: "La vista queda preparada para filtrar por modulo, estado y fecha.", icon: Filter, status: "Listo" },
    ],
    tableTitle: "Eventos",
    tableIcon: Activity,
    columns: ["Evento", "Modulo", "Fecha", "Estado"],
    rows: activityRows.map((row) => [row.event, row.area, row.date, row.status]),
  }
};

export function ActivityDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.activity} />;
}
