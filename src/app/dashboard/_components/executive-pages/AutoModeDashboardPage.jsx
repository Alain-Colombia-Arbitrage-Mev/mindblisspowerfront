"use client";

import { Activity, Bell, CheckCircle2, Lock, Shield, ShieldCheck, Zap } from "lucide-react";

import { ExecutiveModulePage } from './executive-ui';

const moduleConfigs = {
auto: {
    eyebrow: "Automatizacion",
    title: "Auto Mode",
    subtitle: "Centro de reglas operativas para automatizar seguimiento sin ejecutar acciones sensibles sin confirmacion.",
    action: { label: "Nueva regla", href: "#", icon: Zap },
    metrics: [
      { label: "Reglas", value: "3", detail: "configuradas", icon: Zap, tone: "accent" },
      { label: "Activas", value: "0", detail: "modo seguro", icon: Shield, tone: "muted" },
      { label: "Pendientes", value: "3", detail: "requieren aprobacion", icon: Activity, tone: "warning" },
      { label: "Ejecuciones", value: "0", detail: "hoy", icon: CheckCircle2, tone: "info" },
    ],
    cards: [
      { title: "Modo seguro", text: "Las reglas quedan preparadas, pero no ejecutan pagos, activaciones ni cambios de posicion.", icon: Lock, status: "Activo" },
      { title: "Seguimiento", text: "Automatiza recordatorios para perfiles incompletos y KYC pendiente.", icon: Bell, status: "Sugerido" },
      { title: "Aprobaciones", text: "Cada accion sensible debe pasar por confirmacion humana o backend autorizado.", icon: ShieldCheck, status: "Requerido" },
    ],
    tableTitle: "Reglas",
    tableIcon: Zap,
    columns: ["Regla", "Disparador", "Estado", "Accion"],
    rows: [
      ["Recordatorio KYC", "Perfil incompleto", "Pausada", "Email"],
      ["Seguimiento referido", "Registro nuevo", "Pausada", "Mensaje"],
      ["Alerta red", "Desbalance alto", "Pausada", "Notificacion"],
    ],
  }
};

export function AutoModeDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.auto} />;
}
