"use client";

import { useCallback, useEffect, useState } from "react";

import SupportTicketForm from ".././SupportTicketForm";

import { Activity, IdCard, KeyRound, LifeBuoy, Loader2, Shield, ShieldCheck, Wallet } from "lucide-react";

import { PageHeader, MetricCard, IconCircle, StatusPill, statusTone } from './executive-ui';
import { useI18n } from "@/i18n/LanguageProvider";

function formatTicketDate(iso, locale) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

export function SupportDashboardPage() {
  const { t, locale } = useI18n();
  const config = {
    eyebrow: t("supportPage.eyebrow"), title: t("supportPage.title"), subtitle: t("supportPage.subtitle"),
    metrics: [
      { label: t("supportPage.tickets"), value: "0", detail: t("supportPage.open"), icon: LifeBuoy, tone: "muted" },
      { label: t("supportPage.time"), value: "24h", detail: t("supportPage.responseTarget"), icon: Activity, tone: "info" },
      { label: "KYC", value: t("supportPage.pending"), detail: t("supportPage.activeChannel"), icon: IdCard, tone: "warning" },
      { label: t("supportPage.account"), value: t("supportPage.active"), detail: t("supportPage.unblocked"), icon: ShieldCheck, tone: "success" },
    ],
    cards: [
      { title: t("supportPage.access"), text: t("supportPage.accessCopy"), icon: KeyRound, status: t("supportPage.channel") },
      { title: t("supportPage.compliance"), text: t("supportPage.complianceCopy"), icon: Shield, status: t("supportPage.channel") },
      { title: t("supportPage.finance"), text: t("supportPage.financeCopy"), icon: Wallet, status: t("supportPage.channel") },
    ],
  };
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
    m.label === t("supportPage.tickets") && state === "ready" ? { ...m, value: String(tickets.length) } : m,
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
              {t("supportPage.myTickets")}
            </h2>
          </div>

          {state === "loading" && (
            <div className="flex items-center gap-2 py-8" style={{ color: "var(--vp-muted)" }}>
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">{t("supportPage.loadingTickets")}</span>
            </div>
          )}

          {state === "error" && (
            <div role="status" className="flex flex-col items-start gap-3 rounded-xl px-4 py-5" style={{ background: "var(--vp-info-muted)", border: "1px solid var(--vp-info-border)" }}>
              <span className="text-sm font-semibold" style={{ color: "var(--vp-info)" }}>{t("supportPage.ticketsSyncing")}</span>
              <p className="m-0 text-xs leading-6" style={{ color: "var(--vp-muted)" }}>
                {t("supportPage.syncingCopy")}
              </p>
              <button className="executive-button" type="button" onClick={load}>
                {t("supportPage.refreshTickets")}
              </button>
            </div>
          )}

          {state === "ready" && tickets.length === 0 && (
            <div className="py-8 text-sm" style={{ color: "var(--vp-muted)" }}>
              {t("supportPage.noTickets")}
            </div>
          )}

          {state === "ready" && tickets.length > 0 && (
            <div className="executive-table-wrap">
              <table className="executive-table">
                <thead>
                  <tr>
                    <th>{t("supportPage.subject")}</th>
                    <th>{t("supportPage.status")}</th>
                    <th>{t("supportPage.priority")}</th>
                    <th>{t("supportPage.answer")}</th>
                    <th>{t("supportPage.date")}</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => {
                    const label = t(`supportPage.status_${ticket.status}`);
                    return (
                      <tr key={ticket.id}>
                        <td>{ticket.subject}</td>
                        <td>
                          <StatusPill tone={statusTone(label)}>{label}</StatusPill>
                        </td>
                        <td>{t(`supportPage.priority_${ticket.priority || "normal"}`)}</td>
                        <td>{ticket.answer || (ticket.status === "open" ? t("supportPage.inReview") : "-")}</td>
                        <td>{formatTicketDate(ticket.created_at, locale)}</td>
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
