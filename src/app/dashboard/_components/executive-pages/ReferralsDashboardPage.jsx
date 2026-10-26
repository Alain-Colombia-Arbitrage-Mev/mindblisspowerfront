"use client";

import ReferralModule from "@/components/member/ReferralModule";

import { Activity, Copy, MessageSquare, ShieldCheck, TrendingUp, UserPlus } from "lucide-react";

import { PageHeader } from './executive-ui';

import { member } from './member-defaults.mjs';

const moduleConfigs = {
referrals: {
    eyebrow: "Crecimiento",
    title: "Referidos",
    subtitle: "Comparte tu codigo, revisa conversiones y da seguimiento a cada invitacion desde una vista simple y profesional.",
    action: { label: "Copiar codigo", href: "#", icon: Copy },
    metrics: [
      { label: "Codigo", value: member.referralCode, detail: "codigo unico", icon: Copy, tone: "accent" },
      { label: "Invitados", value: "—", detail: "registros asociados", icon: UserPlus, tone: "success" },
      { label: "Pendientes", value: "—", detail: "requieren seguimiento", icon: Activity, tone: "warning" },
      { label: "Conversion", value: "—", detail: "sin compras nuevas", icon: TrendingUp, tone: "info" },
    ],
    cards: [
      { title: "Enlace personal", text: "Tu enlace aparece al cargar tu código de referido.", icon: Copy, status: "Listo" },
      { title: "Seguimiento", text: "Mantén una lista corta de conversaciones abiertas y fecha de proximo contacto.", icon: MessageSquare, status: "Manual" },
      { title: "Calidad", text: "Prioriza personas con datos completos y disponibilidad para completar onboarding.", icon: ShieldCheck, status: "Revisar" },
    ],
    tableTitle: "Invitaciones",
    tableIcon: UserPlus,
    columns: ["Contacto", "Origen", "Estado", "Ultimo paso"],
    rows: [],
  }
};

export function ReferralsDashboardPage() {
  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow={moduleConfigs.referrals.eyebrow}
          title={moduleConfigs.referrals.title}
          subtitle={moduleConfigs.referrals.subtitle}
        />
        <ReferralModule />
      </div>
    </section>
  );
}
