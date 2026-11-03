"use client";

import { useCallback, useEffect, useState } from "react";

import SupportTicketForm from ".././SupportTicketForm";

import { Activity, IdCard, KeyRound, LifeBuoy, Loader2, Shield, ShieldCheck, Wallet } from "lucide-react";

import { PageHeader, MetricCard, IconCircle, StatusPill, statusTone } from './executive-ui';

const moduleConfigs = {
support: {
    eyebrow: "Soporte",
    title: "Centro de soporte",
    subtitle: "Canales de atencion, tickets y seguimiento para resolver dudas de cuenta, KYC, pagos y acceso.",
    metrics: [
      { label: "Tickets", value: "0", detail: "abiertos", icon: LifeBuoy, tone: "muted" },
      { label: "Tiempo", value: "24h", detail: "respuesta objetivo", icon: Activity, tone: "info" },
      { label: "KYC", value: "Pendiente", detail: "canal activo", icon: IdCard, tone: "warning" },
      { label: "Cuenta", value: "Activa", detail: "sin bloqueo", icon: ShieldCheck, tone: "success" },
    ],
    cards: [
      { title: "Acceso", text: "Problemas de login, codigo por correo o recuperacion de cuenta.", icon: KeyRound, status: "Canal" },
      { title: "Cumplimiento", text: "Soporte para documentos, datos personales y revision KYC.", icon: Shield, status: "Canal" },
      { title: "Finanzas", text: "Consultas de billetera, retiros y estados de liquidacion.", icon: Wallet, status: "Canal" },
    ],
  }
};

const TICKET_STATUS_LABELS = { open: "Abierto", answered: "Respondido", closed: "Cerrado" };

const TICKET_PRIORITY_LABELS = { critical: "Critico", high: "Alta", normal: "Normal", low: "Baja" };

function formatTicketDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es", { year: "numeric", month: "short", day: "numeric" });
}

export function SupportDashboardPage() {
  const config = moduleConfigs.support;
  const [tickets, setTickets] = useState([]);
  const [state, setState] = useState("loading"); // loading | ready | error

  const load = useCallback(async () => {
    setState("loading");
    try {
      const r = await fetch("/api/member/support/tickets", { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setState("error");
        return;
      }
      setTickets(Array.isArray(d.tickets) ? d.tickets : []);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const metrics = config.metrics.map((m) =>
    m.label === "Tickets" && state === "ready" ? { ...m, value: String(tickets.length) } : m,
  );

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader eyebrow={config.eyebrow} title={config.title} subtitle={config.subtitle} />

        <SupportTicketForm onCreated={load} />

        <div className="executive-grid metrics mb-6">
          {metrics.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </div>

        <div className="executive-grid three mb-6">
          {config.cards.map((card) => (
            <article key={card.title} className="executive-card">
              <div className="mb-5 flex items-start justify-between gap-4">
                <IconCircle icon={card.icon} tone="accent" />
                <StatusPill tone={statusTone(card.status)}>{card.status}</StatusPill>
              </div>
              <h2 className="m-0 text-xl font-bold" style={{ color: "var(--vp-text)" }}>
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-7" style={{ color: "var(--vp-muted)" }}>
                {card.text}
              </p>
            </article>
          ))}
        </div>

        <div className="executive-panel">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h2 className="executive-section-title mb-0">
              <LifeBuoy size={18} style={{ color: "var(--vp-accent)" }} />
              Mis tickets
            </h2>
          </div>

          {state === "loading" && (
            <div className="flex items-center gap-2 py-8" style={{ color: "var(--vp-muted)" }}>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Cargando tus tickets…</span>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-start gap-3 py-8">
              <span className="text-sm font-semibold" style={{ color: "#f87171" }}>
                No pudimos cargar tus tickets.
              </span>
              <button className="executive-button" type="button" onClick={load}>
                Reintentar
              </button>
            </div>
          )}

          {state === "ready" && tickets.length === 0 && (
            <div className="py-8 text-sm" style={{ color: "var(--vp-muted)" }}>
              Aún no tienes tickets.
            </div>
          )}

          {state === "ready" && tickets.length > 0 && (
            <div className="executive-table-wrap">
              <table className="executive-table">
                <thead>
                  <tr>
                    <th>Asunto</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Respuesta</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => {
                    const label = TICKET_STATUS_LABELS[t.status] || t.status;
                    return (
                      <tr key={t.id}>
                        <td>{t.subject}</td>
                        <td>
                          <StatusPill tone={statusTone(label)}>{label}</StatusPill>
                        </td>
                        <td>{TICKET_PRIORITY_LABELS[t.priority] || t.priority || "Normal"}</td>
                        <td>{t.answer || (t.status === "open" ? "En revision" : "-")}</td>
                        <td>{formatTicketDate(t.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
