"use client";

import { Activity, BarChart3, CreditCard, DollarSign, ShieldCheck, Wallet } from "lucide-react";

import { ExecutiveModulePage, CalendarLikeIcon } from './executive-ui';

const moduleConfigs = {
bonuses: {
    eyebrow: "Bonuses",
    title: "Bonificaciones",
    subtitle: "Resumen de pagos, cierres y estados de liquidacion. Actualmente se muestran valores en cero porque no hay bonus runs publicados.",
    action: { label: "Ver finanzas", href: "/dashboard/withdrawals", icon: Wallet },
    metrics: [
      { label: "Disponible", value: "$0.00", detail: "wallet actual", icon: Wallet, tone: "muted" },
      { label: "Historico", value: "$0.00", detail: "movimientos", icon: DollarSign, tone: "muted" },
      { label: "Runs cerrados", value: "0", detail: "periodos", icon: Activity, tone: "info" },
      { label: "Pendiente", value: "$0.00", detail: "retiros", icon: CreditCard, tone: "muted" },
    ],
    cards: [
      { title: "Cero real", text: "No se muestran ganancias simuladas como si fueran pagos disponibles.", icon: ShieldCheck, status: "Protegido" },
      { title: "Cierres", text: "Los pagos se habilitan cuando el backend publique periodos y movimientos.", icon: CalendarLikeIcon, status: "Pendiente" },
      { title: "Fondo empresa", text: "El simulador debe separar reparto a miembros y fondo corporativo.", icon: BarChart3, status: "Diseno" },
    ],
    tableTitle: "Liquidaciones",
    tableIcon: DollarSign,
    columns: ["Periodo", "Tipo", "Monto", "Estado"],
    rows: [
      ["Jun 2026", "Debil / balance", "$0.00", "Sin ejecutar"],
      ["Jun 2026", "Referidos", "$0.00", "Sin ejecutar"],
      ["Jun 2026", "Rango", "$0.00", "Sin ejecutar"],
    ],
  }
};

export function BonusesDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.bonuses} />;
}
