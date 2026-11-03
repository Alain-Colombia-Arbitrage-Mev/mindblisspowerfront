"use client";

import { useMemberSession } from "@/lib/member-session-context";

import { Activity, CheckCircle2, Copy, TrendingUp, Users, Wallet } from "lucide-react";

import { PageHeader, MetricCard, StatusPill } from './executive-ui';

import { member, activityRows } from './member-defaults.mjs';

const overviewMetrics = [
  { label: "Red activa", value: "—", detail: "miembros visibles", icon: Users, tone: "accent" },
  { label: "Activos", value: "—", detail: "con estado activo", icon: CheckCircle2, tone: "success" },
  { label: "Rango", value: "—", detail: "nivel actual", icon: TrendingUp, tone: "accent" },
  { label: "Disponible", value: "$0.00", detail: "sin liquidaciones publicadas", icon: Wallet, tone: "muted" },
];

export function DashboardOverviewPage() {
  const session = useMemberSession();
  const displayReferral = session?.referralCode || member.referralCode;
  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow="Centro operativo"
          title="Overview"
          subtitle="Estado general de cuenta, red, cumplimiento y actividad reciente desde una interfaz sobria para operacion diaria."
          action={
            <a className="executive-button primary" href="/dashboard/referrals">
              <Copy size={16} />
              Copiar referido
            </a>
          }
        />

        <div className="executive-grid metrics mb-6">
          {overviewMetrics.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </div>

        <div className="executive-grid two mb-6">
          <div className="executive-panel">
            <h2 className="executive-section-title">
              <TrendingUp size={18} style={{ color: "var(--vp-accent)" }} />
              Salud de la red
            </h2>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
                <p className="executive-card-label">Lado izquierdo</p>
                <p className="text-3xl font-light" style={{ color: "var(--vp-text)" }}>
                  4
                </p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
                <p className="executive-card-label">Lado derecho</p>
                <p className="text-3xl font-light" style={{ color: "var(--vp-accent)" }}>
                  5
                </p>
              </div>
            </div>
            <div className="mb-3 flex justify-between text-sm">
              <span style={{ color: "var(--vp-muted)" }}>Balance operativo</span>
              <strong style={{ color: "var(--vp-text)" }}>44% / 56%</strong>
            </div>
            <div className="executive-progress">
              <span style={{ width: "44%" }} />
            </div>
            <p className="mt-4 text-sm leading-7" style={{ color: "var(--vp-muted)" }}>
              El lado con menor actividad se identifica por conteo mientras no exista volumen de liquidacion publicado. Esto evita mostrar pagos simulados como si fueran saldos reales.
            </p>
          </div>

          <div className="executive-panel">
            <h2 className="executive-section-title">
              <Activity size={18} style={{ color: "var(--vp-accent)" }} />
              Actividad reciente
            </h2>
            <div className="space-y-3">
              {activityRows.map((row) => (
                <div key={`${row.event}-${row.date}`} className="flex items-center justify-between gap-4 rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
                  <div>
                    <p className="m-0 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
                      {row.event}
                    </p>
                    <p className="m-0 mt-1 text-xs" style={{ color: "var(--vp-muted)" }}>
                      {row.area} · {row.date}
                    </p>
                  </div>
                  <StatusPill tone={row.status === "Completado" ? "success" : "warning"}>{row.status}</StatusPill>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="executive-grid three">
          {[
            { title: "Codigo de referido", value: displayReferral, text: "Codigo unico para invitaciones." },
            { title: "KYC", value: "Pendiente", text: "Completa datos personales y documentos." },
            { title: "Rango", value: member.rank, text: "Seguimiento de progreso y requisitos." },
          ].map((item) => (
            <div key={item.title} className="executive-card">
              <p className="executive-card-label">{item.title}</p>
              <p className="text-2xl font-semibold" style={{ color: "var(--vp-text)" }}>
                {item.value}
              </p>
              <p className="mt-3 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
