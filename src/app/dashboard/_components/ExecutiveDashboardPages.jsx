"use client";

import { useEffect, useMemo, useState } from "react";
import { useNetworkHealth } from "@/lib/useNetworkHealth";
import { useSustainability } from "@/lib/useSustainability";
import {
  Activity,
  Archive,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  IdCard,
  KeyRound,
  LifeBuoy,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Network,
  Package,
  Search,
  Send,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UploadCloud,
  User,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

const member = {
  name: "Javier Demo MVP",
  username: "javierdemo",
  email: "guardcolombia@gmail.com",
  phone: "+57 300 000 0000",
  country: "Colombia",
  rank: "Embajador Corona",
  plan: "Elite",
  joined: "29 May 2026",
  sponsor: "Mindbliss Power",
  referralCode: "823649",
  wallet: "Sin billetera configurada",
};

const overviewMetrics = [
  { label: "Red activa", value: "9", detail: "miembros visibles", icon: Users, tone: "accent" },
  { label: "Activos", value: "8", detail: "con estado activo", icon: CheckCircle2, tone: "success" },
  { label: "Rango", value: "Corona", detail: "nivel actual", icon: TrendingUp, tone: "accent" },
  { label: "Disponible", value: "$0.00", detail: "sin liquidaciones publicadas", icon: Wallet, tone: "muted" },
];

const activityRows = [
  { event: "Sesion iniciada", area: "Seguridad", date: "Hoy", status: "Completado" },
  { event: "Perfil sincronizado", area: "Cuenta", date: "Hoy", status: "Pendiente" },
  { event: "Codigo de referido disponible", area: "Referidos", date: "Ayer", status: "Completado" },
  { event: "KYC en revision", area: "Cumplimiento", date: "Ayer", status: "Pendiente" },
];

const messages = [
  {
    id: "msg-1",
    from: "Operaciones Mindbliss",
    subject: "Validacion de perfil",
    preview: "Tu informacion principal esta lista para revision interna.",
    time: "09:20",
    status: "Nuevo",
  },
  {
    id: "msg-2",
    from: "Soporte",
    subject: "Canal de atencion activo",
    preview: "Puedes abrir tickets desde el centro de comunicacion.",
    time: "Ayer",
    status: "Leido",
  },
];

const campaigns = [
  { name: "Actualizacion de plataforma", target: "Todos los miembros", sent: "0", read: "0%", status: "Borrador" },
  { name: "Recordatorio KYC", target: "Perfiles pendientes", sent: "0", read: "0%", status: "Programable" },
];

const financeRows = [
  { date: "13 Jun 2026", type: "Saldo inicial", amount: "$0.00", status: "Publicado" },
  { date: "13 Jun 2026", type: "Liquidaciones", amount: "$0.00", status: "Sin ejecutar" },
];

const kycRequests = [
  { name: "Javier Demo MVP", type: "Documento de identidad", country: "Colombia", date: "13 Jun 2026", status: "Pendiente" },
  { name: "Guard Colombia", type: "Prueba de residencia", country: "Colombia", date: "13 Jun 2026", status: "No iniciado" },
];

function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="executive-page-header">
      <div>
        <p className="executive-eyebrow">{eyebrow}</p>
        <h1 className="executive-title">{title}</h1>
        {subtitle && <p className="executive-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function IconCircle({ icon: Icon, tone = "accent" }) {
  const toneStyles = {
    accent: { background: "var(--vp-accent-muted)", border: "var(--vp-accent-border)", color: "var(--vp-accent)" },
    success: { background: "var(--vp-accent-muted)", border: "var(--vp-accent-border)", color: "var(--vp-accent)" },
    info: { background: "var(--vp-surface-raised)", border: "var(--vp-border)", color: "var(--vp-muted)" },
    warning: { background: "var(--vp-accent-muted)", border: "var(--vp-accent-border)", color: "var(--vp-accent)" },
    danger: { background: "var(--vp-danger-muted)", border: "var(--vp-danger-border)", color: "var(--vp-danger)" },
    muted: { background: "var(--vp-surface-raised)", border: "var(--vp-border)", color: "var(--vp-muted)" },
  };
  const styles = toneStyles[tone] ?? toneStyles.accent;

  return (
    <span
      className="flex h-10 w-10 items-center justify-center rounded-full"
      style={{ background: styles.background, border: `1px solid ${styles.border}`, color: styles.color }}
    >
      <Icon size={18} />
    </span>
  );
}

function MetricCard({ label, value, detail, icon, tone }) {
  return (
    <div className="executive-card">
      <div className="mb-5 flex items-start justify-between gap-4">
        <p className="executive-card-label">{label}</p>
        <IconCircle icon={icon} tone={tone} />
      </div>
      <p className="executive-card-value">{value}</p>
      <p className="mt-3 text-sm" style={{ color: "var(--vp-muted)" }}>
        {detail}
      </p>
    </div>
  );
}

function StatusPill({ children, tone = "warning" }) {
  return <span className={`executive-status ${tone}`}>{children}</span>;
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase" style={{ color: "var(--vp-muted)", letterSpacing: "0.1em" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

export function DashboardOverviewPage() {
  const [referral, setReferral] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d?.referralCode) setReferral(d.referralCode); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const displayReferral = referral || member.referralCode;
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

export function CommunicationsDashboardPage() {
  const [tab, setTab] = useState("messages");
  const [selectedMessage, setSelectedMessage] = useState(messages[0]);

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow="Comunicacion"
          title="Centro de mensajes"
          subtitle="Bandeja interna, noticias, tickets y comunicaciones de soporte en una sola superficie de trabajo."
          action={
            <button className="executive-button primary" type="button">
              <Send size={16} />
              Nuevo mensaje
            </button>
          }
        />

        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="executive-tabs" role="tablist" aria-label="Vistas de comunicacion">
            {[
              ["messages", "Mensajes", Mail],
              ["news", "Noticias", Bell],
              ["tickets", "Tickets", Archive],
              ["campaigns", "Campanas", Zap],
            ].map(([id, label, Icon]) => (
              <button key={id} className="executive-tab" aria-selected={tab === id} type="button" onClick={() => setTab(id)}>
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search size={15} style={{ color: "var(--vp-muted)", left: 13, position: "absolute", top: "50%", transform: "translateY(-50%)" }} />
            <input className="executive-input leading-icon" placeholder="Buscar mensajes..." type="search" />
          </div>
        </div>

        {tab !== "campaigns" ? (
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="executive-panel p-0">
              <div className="border-b p-4" style={{ borderColor: "var(--vp-border)" }}>
                <p className="executive-card-label mb-0">Bandeja interna</p>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--vp-border)" }}>
                {messages.map((message) => (
                  <button
                    key={message.id}
                    className="block w-full p-4 text-left"
                    style={{
                      background: selectedMessage?.id === message.id ? "var(--vp-surface-raised)" : "transparent",
                      border: 0,
                      borderLeft: `3px solid ${selectedMessage?.id === message.id ? "var(--vp-accent)" : "transparent"}`,
                      cursor: "pointer",
                    }}
                    type="button"
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <strong className="text-sm" style={{ color: "var(--vp-text)" }}>
                        {message.from}
                      </strong>
                      <span className="text-xs" style={{ color: "var(--vp-muted)" }}>
                        {message.time}
                      </span>
                    </div>
                    <p className="m-0 text-sm font-semibold" style={{ color: "var(--vp-text-soft)" }}>
                      {message.subject}
                    </p>
                    <p className="m-0 mt-1 line-clamp-2 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
                      {message.preview}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="executive-panel">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="executive-card-label">Mensaje seleccionado</p>
                  <h2 className="m-0 text-2xl font-semibold" style={{ color: "var(--vp-text)" }}>
                    {selectedMessage?.subject}
                  </h2>
                </div>
                <StatusPill tone={selectedMessage?.status === "Nuevo" ? "warning" : "success"}>{selectedMessage?.status}</StatusPill>
              </div>
              <p className="text-sm leading-7" style={{ color: "var(--vp-muted)" }}>
                {selectedMessage?.preview} Este modulo queda preparado para conectarse al backend de comunicaciones y tickets, manteniendo la misma interfaz.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <Field label="Asunto">
                  <input className="executive-input" placeholder="Escribe el asunto" type="text" />
                </Field>
                <Field label="Destinatario">
                  <input className="executive-input" placeholder="Equipo o miembro" type="text" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Respuesta">
                    <textarea className="executive-textarea" placeholder="Escribe una respuesta clara y accionable" />
                  </Field>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button className="executive-button primary" type="button">
                  <Send size={16} />
                  Enviar respuesta
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="executive-panel">
            <h2 className="executive-section-title">
              <Zap size={18} style={{ color: "var(--vp-accent)" }} />
              Comunicaciones masivas
            </h2>
            <div className="executive-table-wrap">
              <table className="executive-table">
                <thead>
                  <tr>
                    <th>Campana</th>
                    <th>Audiencia</th>
                    <th>Enviados</th>
                    <th>Lectura</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.name}>
                      <td>{campaign.name}</td>
                      <td>{campaign.target}</td>
                      <td>{campaign.sent}</td>
                      <td>{campaign.read}</td>
                      <td>
                        <StatusPill tone="warning">{campaign.status}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function FinanceDashboardPage() {
  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow="Finanzas"
          title="Billetera y retiros"
          subtitle="Gestiona saldo disponible, historial de liquidaciones y solicitudes de retiro. Los desembolsos permanecen en cero hasta que existan bonus runs publicados."
          action={
            <button className="executive-button" type="button">
              <Download size={16} />
              Exportar
            </button>
          }
        />

        <div className="executive-grid metrics mb-6">
          <MetricCard label="Balance disponible" value="$0.00" detail="saldo real en billetera" icon={Wallet} tone="success" />
          <MetricCard label="Ganancias historicas" value="$0.00" detail="sin movimientos publicados" icon={TrendingUp} tone="accent" />
          <MetricCard label="Retiros pendientes" value="$0.00" detail="sin solicitudes abiertas" icon={Activity} tone="muted" />
          <MetricCard label="Fondo empresa" value="$0.00" detail="pendiente de simulador real" icon={DollarSign} tone="info" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
          <div className="executive-panel">
            <h2 className="executive-section-title">
              <DollarSign size={18} style={{ color: "var(--vp-accent)" }} />
              Solicitar retiro
            </h2>
            <div className="space-y-5">
              <Field label="Monto a retirar">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--vp-muted)" }}>
                    $
                  </span>
                  <input className="executive-input leading-icon" disabled min="50" placeholder="0.00" type="number" />
                </div>
              </Field>
              <Field label="Billetera destino">
                <input className="executive-input" readOnly value={member.wallet} />
              </Field>
              <div className="rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
                <div className="mb-2 flex justify-between text-sm">
                  <span style={{ color: "var(--vp-muted)" }}>Comision estimada</span>
                  <span style={{ color: "var(--vp-text)" }}>$0.00</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span style={{ color: "var(--vp-muted)" }}>Total a recibir</span>
                  <span style={{ color: "var(--vp-accent)" }}>$0.00</span>
                </div>
              </div>
              <button className="executive-button primary w-full opacity-60" disabled type="button">
                Balance no disponible
              </button>
            </div>
          </div>

          <div className="executive-panel">
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <h2 className="executive-section-title mb-0">
                <CreditCard size={18} style={{ color: "var(--vp-accent)" }} />
                Historial financiero
              </h2>
              <button className="executive-button ghost" type="button">
                <Filter size={16} />
                Filtros
              </button>
            </div>
            <div className="executive-table-wrap">
              <table className="executive-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {financeRows.map((row) => (
                    <tr key={`${row.date}-${row.type}`}>
                      <td>{row.date}</td>
                      <td>{row.type}</td>
                      <td>{row.amount}</td>
                      <td>
                        <StatusPill tone={row.status === "Publicado" ? "success" : "warning"}>{row.status}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PLAN_LABEL = { passive_investor: "Inversionista pasivo", network: "Red" };

export function ProfileDashboardPage() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [digest, setDigest] = useState(true);
  const [me, setMe] = useState({ name: "", email: "", referralCode: "" });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d) setMe({ name: d.name || "", email: d.email || "", referralCode: d.referralCode || "" });
      })
      .catch(() => {});
    fetch("/api/payments/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d && !d.error) setSummary(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const displayName = me.name || member.name;
  const displayEmail = me.email || member.email;
  const displayReferral = me.referralCode || member.referralCode;
  const displayInitial = (displayName || "M").trim().charAt(0).toUpperCase();
  const displayRank = summary?.rank && summary.rank !== "—" ? summary.rank : member.rank;
  const displayJoined = summary?.joined_at || member.joined;
  const displayPlan = summary?.plan ? (PLAN_LABEL[summary.plan] || summary.plan) : member.plan;
  const displayBalance = summary
    ? `$${Number(summary.wallet_balance_usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : null;

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow="Perfil"
          title="Mi perfil"
          subtitle="Gestiona datos personales, seguridad, billetera de retiro y preferencias de notificacion."
          action={
            <button className="executive-button primary" type="button">
              Guardar cambios
            </button>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="executive-panel text-center">
              <div
                className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold"
                style={{ background: "var(--vp-bg)", border: "4px solid var(--vp-surface-raised)", color: "var(--vp-accent)" }}
              >
                {displayInitial}
              </div>
              <h2 className="m-0 text-2xl font-bold" style={{ color: "var(--vp-text)" }}>
                {displayName}
              </h2>
              <p className="mt-2 text-sm" style={{ color: "var(--vp-muted)" }}>
                {displayEmail}
              </p>
              <div className="mt-5 flex justify-center">
                <StatusPill tone="warning">{displayRank}</StatusPill>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-4 border-t pt-5 text-left" style={{ borderColor: "var(--vp-border)" }}>
                <div>
                  <p className="executive-card-label mb-1">Registro</p>
                  <p className="m-0 text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
                    {displayJoined}
                  </p>
                </div>
                <div>
                  <p className="executive-card-label mb-1">Plan</p>
                  <p className="m-0 text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
                    {displayPlan}
                  </p>
                </div>
                {displayBalance != null && (
                  <div className="col-span-2">
                    <p className="executive-card-label mb-1">Balance billetera</p>
                    <p className="m-0 text-lg font-semibold" style={{ color: "var(--vp-accent)" }}>
                      {displayBalance}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="executive-panel">
              <h2 className="executive-section-title">
                <Copy size={18} style={{ color: "var(--vp-accent)" }} />
                Referido
              </h2>
              <div className="rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
                <p className="executive-card-label">Codigo unico</p>
                <p className="m-0 text-4xl font-light" style={{ color: "var(--vp-text)" }}>
                  {displayReferral}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="executive-panel">
              <h2 className="executive-section-title">
                <User size={18} style={{ color: "var(--vp-accent)" }} />
                Informacion personal
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Nombre completo">
                  <input className="executive-input" key={displayName} defaultValue={displayName} />
                </Field>
                <Field label="Usuario">
                  <input className="executive-input" key={displayEmail} defaultValue={displayEmail ? displayEmail.split("@")[0] : member.username} readOnly />
                </Field>
                <Field label="Correo electronico">
                  <input className="executive-input" key={displayEmail} defaultValue={displayEmail} readOnly type="email" />
                </Field>
                <Field label="Telefono">
                  <input className="executive-input" defaultValue={member.phone} type="tel" />
                </Field>
                <Field label="Pais">
                  <input className="executive-input" defaultValue={member.country} />
                </Field>
                <Field label="Patrocinador">
                  <input className="executive-input" defaultValue={member.sponsor} readOnly />
                </Field>
              </div>
            </div>

            <div className="executive-grid two">
              <div className="executive-panel">
                <h2 className="executive-section-title">
                  <CreditCard size={18} style={{ color: "var(--vp-accent)" }} />
                  Billetera retiros
                </h2>
                <p className="mb-5 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
                  Configura una direccion USDT TRC20 antes de solicitar retiros.
                </p>
                <Field label="Direccion USDT">
                  <input className="executive-input" placeholder="T..." />
                </Field>
                <button className="executive-button mt-4 w-full" type="button">
                  Actualizar billetera
                </button>
              </div>

              <div className="executive-panel">
                <h2 className="executive-section-title">
                  <Shield size={18} style={{ color: "var(--vp-accent)" }} />
                  Seguridad
                </h2>
                <ToggleRow checked={twoFactor} icon={Lock} label="Autenticacion 2FA" onChange={() => setTwoFactor((value) => !value)} />
                <ToggleRow checked={digest} icon={Bell} label="Resumen por email" onChange={() => setDigest((value) => !value)} />
                <button className="executive-button mt-4 w-full" type="button">
                  <KeyRound size={16} />
                  Cambiar contrasena
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToggleRow({ checked, icon: Icon, label, onChange }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4 rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
      <div className="flex items-center gap-3">
        <Icon size={17} style={{ color: "var(--vp-accent)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
          {label}
        </span>
      </div>
      <button
        aria-pressed={checked}
        className="relative h-6 w-11 rounded-full"
        style={{ background: checked ? "var(--vp-accent)" : "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}
        type="button"
        onClick={onChange}
      >
        <span
          className="absolute top-1 h-4 w-4 rounded-full transition-all"
          style={{ background: checked ? "#0a0a0a" : "var(--vp-muted)", left: checked ? 23 : 4 }}
        />
      </button>
    </div>
  );
}

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
    rows: [
      ["Guard Colombia", "Derecho", "Activo", "Hoy"],
      ["Javier Demo MVP", "Raiz personal", "Activo", "Hoy"],
      ["Invitado pendiente", "Izquierdo", "Pendiente", "Sin actividad"],
    ],
  },
  referrals: {
    eyebrow: "Crecimiento",
    title: "Referidos",
    subtitle: "Comparte tu codigo, revisa conversiones y da seguimiento a cada invitacion desde una vista simple y profesional.",
    action: { label: "Copiar codigo", href: "#", icon: Copy },
    metrics: [
      { label: "Codigo", value: member.referralCode, detail: "codigo unico", icon: Copy, tone: "accent" },
      { label: "Invitados", value: "9", detail: "registros asociados", icon: UserPlus, tone: "success" },
      { label: "Pendientes", value: "3", detail: "requieren seguimiento", icon: Activity, tone: "warning" },
      { label: "Conversion", value: "0%", detail: "sin compras nuevas", icon: TrendingUp, tone: "info" },
    ],
    cards: [
      { title: "Enlace personal", text: "https://mindblisspower.com/register?ref=823649", icon: Copy, status: "Listo" },
      { title: "Seguimiento", text: "Mantén una lista corta de conversaciones abiertas y fecha de proximo contacto.", icon: MessageSquare, status: "Manual" },
      { title: "Calidad", text: "Prioriza personas con datos completos y disponibilidad para completar onboarding.", icon: ShieldCheck, status: "Revisar" },
    ],
    tableTitle: "Invitaciones",
    tableIcon: UserPlus,
    columns: ["Contacto", "Origen", "Estado", "Ultimo paso"],
    rows: [
      ["guardcolombia@gmail.com", "Codigo directo", "Activo", "Perfil creado"],
      ["prospecto@correo.com", "Enlace", "Pendiente", "Email enviado"],
      ["lead@correo.com", "Manual", "Pendiente", "Sin KYC"],
    ],
  },
  team: {
    eyebrow: "Equipo",
    title: "Equipo Pro",
    subtitle: "Gestiona miembros, estados, rangos y prioridades de acompanamiento desde una vista de trabajo repetible.",
    action: { label: "Contactar equipo", href: "/dashboard/communications", icon: Mail },
    metrics: [
      { label: "Miembros", value: "9", detail: "total visible", icon: Users, tone: "accent" },
      { label: "Activos", value: "8", detail: "estado activo", icon: CheckCircle2, tone: "success" },
      { label: "Pendientes", value: "1", detail: "perfil incompleto", icon: Activity, tone: "warning" },
      { label: "Rango lider", value: "Corona", detail: "referencia actual", icon: Trophy, tone: "accent" },
    ],
    cards: [
      { title: "Pipeline del equipo", text: "Agrupa miembros por estado para evitar acciones dispersas.", icon: Users, status: "Operativo" },
      { title: "Prioridad semanal", text: "Completar KYC, confirmar datos personales y actualizar contacto.", icon: Shield, status: "Alta" },
      { title: "Comunicacion", text: "Usa mensajes internos para registrar seguimiento y evitar perdida de contexto.", icon: Mail, status: "Disponible" },
    ],
    tableTitle: "Equipo",
    tableIcon: Users,
    columns: ["Miembro", "Rango", "Estado", "Prioridad"],
    rows: [
      ["Javier Demo MVP", "Embajador Corona", "Activo", "Mantener"],
      ["Guard Colombia", "Miembro", "Activo", "Completar perfil"],
      ["Nuevo prospecto", "Sin rango", "Pendiente", "Onboarding"],
    ],
  },
  ai: {
    eyebrow: "Inteligencia",
    title: "IA Asesor",
    subtitle: "Analisis asistido para detectar sanidad de red, acciones recomendadas y riesgos operativos antes de tomar decisiones.",
    action: { label: "Generar analisis", href: "#", icon: Brain },
    metrics: [
      { label: "Sanidad", value: "72%", detail: "estimacion local", icon: ShieldCheck, tone: "success" },
      { label: "Riesgos", value: "2", detail: "alertas suaves", icon: Activity, tone: "warning" },
      { label: "Acciones", value: "4", detail: "recomendadas", icon: Sparkles, tone: "accent" },
      { label: "Modelo", value: "LLM", detail: "pendiente backend", icon: Bot, tone: "info" },
    ],
    cards: [
      { title: "Insight principal", text: "El mayor impacto viene de completar perfiles pendientes antes de ampliar nuevas invitaciones.", icon: Brain, status: "Recomendado" },
      { title: "Sanidad de datos", text: "No hay volumen financiero publicado; el analisis evita inferir pagos o saldos no existentes.", icon: Shield, status: "Protegido" },
      { title: "Siguiente integracion", text: "Conectar OpenRouter desde backend para ejecutar diagnosticos auditables por usuario.", icon: Bot, status: "Backend" },
    ],
    tableTitle: "Recomendaciones",
    tableIcon: Sparkles,
    columns: ["Accion", "Impacto", "Estado", "Modulo"],
    rows: [
      ["Completar KYC pendiente", "Alto", "Pendiente", "Perfil"],
      ["Revisar lado con menor actividad", "Medio", "Listo", "Red"],
      ["Actualizar contacto de referidos", "Medio", "Pendiente", "Referidos"],
    ],
  },
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
  },
  ranks: {
    eyebrow: "Progreso",
    title: "Rangos",
    subtitle: "Carrera de rangos, avance operativo y requisitos pendientes presentados sin mezclar datos simulados con liquidaciones reales.",
    action: { label: "Ver actividad", href: "/dashboard/activity", icon: Activity },
    metrics: [
      { label: "Rango actual", value: "Corona", detail: "estado visible", icon: Trophy, tone: "accent" },
      { label: "Progreso", value: "64%", detail: "estimado", icon: TrendingUp, tone: "success" },
      { label: "Pendiente", value: "KYC", detail: "dato personal", icon: Shield, tone: "warning" },
      { label: "Bonos", value: "$0.00", detail: "sin cierre", icon: DollarSign, tone: "muted" },
    ],
    cards: [
      { title: "Requisito inmediato", text: "Mantener datos personales completos y actividad verificable.", icon: CheckCircle2, status: "En curso" },
      { title: "Puntos", text: "Los puntos de rango deben venir del backend y no de calculos visuales temporales.", icon: BarChart3, status: "Auditado" },
      { title: "Siguiente nivel", text: "El avance se habilita cuando existan reglas de rango conectadas al perfil.", icon: Trophy, status: "Pendiente" },
    ],
    tableTitle: "Ruta de rangos",
    tableIcon: Trophy,
    columns: ["Rango", "Estado", "Puntos", "Bono"],
    rows: [
      ["Bronce", "Completado", "Base", "$0.00"],
      ["Plata", "Disponible", "Pendiente", "$0.00"],
      ["Corona", "Actual", "Referencia", "$0.00"],
    ],
  },
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
  },
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
  },
  products: {
    eyebrow: "Productos",
    title: "Productos",
    subtitle: "Catalogo operativo de productos y servicios disponibles para miembros de Mindbliss Power.",
    action: { label: "Ver paquetes", href: "/dashboard/packages", icon: Package },
    metrics: [
      { label: "Productos", value: "3", detail: "categorias", icon: ShoppingBag, tone: "accent" },
      { label: "Activos", value: "1", detail: "disponible", icon: CheckCircle2, tone: "success" },
      { label: "Proximos", value: "2", detail: "en preparacion", icon: Sparkles, tone: "warning" },
      { label: "Soporte", value: "24h", detail: "canal interno", icon: LifeBuoy, tone: "info" },
    ],
    cards: [
      { title: "Membresia", text: "Acceso al portal, perfil, red, referidos y reportes de actividad.", icon: IdCard, status: "Activo" },
      { title: "Paquetes", text: "Catalogo conectado a backend para planes disponibles.", icon: Package, status: "Disponible" },
      { title: "Servicios", text: "Productos adicionales se publicaran cuando esten listos para operacion.", icon: ShoppingBag, status: "Proximo" },
    ],
    tableTitle: "Catalogo",
    tableIcon: ShoppingBag,
    columns: ["Producto", "Categoria", "Estado", "Accion"],
    rows: [
      ["Portal miembro", "Plataforma", "Activo", "Usar"],
      ["Paquetes", "Plan", "Disponible", "Revisar"],
      ["Servicios premium", "Soporte", "Proximo", "Pendiente"],
    ],
  },
  support: {
    eyebrow: "Soporte",
    title: "Centro de soporte",
    subtitle: "Canales de atencion, tickets y seguimiento para resolver dudas de cuenta, KYC, pagos y acceso.",
    action: { label: "Crear ticket", href: "#", icon: LifeBuoy },
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
    tableTitle: "Tickets recientes",
    tableIcon: LifeBuoy,
    columns: ["Ticket", "Categoria", "Estado", "Ultima actualizacion"],
    rows: [
      ["Sin tickets abiertos", "General", "Cerrado", "Ahora"],
      ["KYC pendiente", "Cumplimiento", "Pendiente", "Hoy"],
      ["Billetera", "Finanzas", "No configurada", "Hoy"],
    ],
  },
  legal: {
    eyebrow: "Legal",
    title: "Centro legal",
    subtitle: "Documentos, politicas y confirmaciones necesarias para operar con claridad dentro de Mindbliss Power.",
    action: { label: "Descargar resumen", href: "#", icon: Download },
    metrics: [
      { label: "Documentos", value: "6", detail: "disponibles", icon: FileText, tone: "accent" },
      { label: "Aceptados", value: "0", detail: "pendiente backend", icon: CheckCircle2, tone: "muted" },
      { label: "KYC/AML", value: "Pendiente", detail: "cumplimiento", icon: Shield, tone: "warning" },
      { label: "Version", value: "2026", detail: "vigente", icon: BookOpen, tone: "info" },
    ],
    cards: [
      { title: "Terminos", text: "Condiciones generales de uso de la plataforma y servicios.", icon: FileText, status: "Disponible" },
      { title: "Privacidad", text: "Tratamiento de datos personales y manejo de informacion sensible.", icon: Shield, status: "Disponible" },
      { title: "Riesgos", text: "Declaraciones y aceptaciones necesarias antes de operaciones financieras.", icon: BookOpen, status: "Revisar" },
    ],
    tableTitle: "Documentos",
    tableIcon: FileText,
    columns: ["Documento", "Tipo", "Estado", "Accion"],
    rows: [
      ["Terminos y condiciones", "Legal", "Disponible", "Leer"],
      ["Politica de privacidad", "Datos", "Disponible", "Leer"],
      ["AML / KYC", "Cumplimiento", "Disponible", "Leer"],
    ],
  },
};

function CalendarLikeIcon(props) {
  return <Activity {...props} />;
}

function ExecutiveModulePage({ config }) {
  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow={config.eyebrow}
          title={config.title}
          subtitle={config.subtitle}
          action={
            config.action && (
              <a className="executive-button primary" href={config.action.href}>
                <config.action.icon size={16} />
                {config.action.label}
              </a>
            )
          }
        />

        <div className="executive-grid metrics mb-6">
          {config.metrics.map((item) => (
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
              <config.tableIcon size={18} style={{ color: "var(--vp-accent)" }} />
              {config.tableTitle}
            </h2>
            <div className="relative w-full md:w-72">
              <Search size={15} style={{ color: "var(--vp-muted)", left: 13, position: "absolute", top: "50%", transform: "translateY(-50%)" }} />
              <input className="executive-input leading-icon" placeholder="Buscar..." type="search" />
            </div>
          </div>
          <ExecutiveTable columns={config.columns} rows={config.rows} />
        </div>
      </div>
    </section>
  );
}

function ExecutiveTable({ columns, rows }) {
  return (
    <div className="executive-table-wrap">
      <table className="executive-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${row[0]}-${cellIndex}`}>
                  {cellIndex === row.length - 1 ? <StatusPill tone={statusTone(String(cell))}>{cell}</StatusPill> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function statusTone(status) {
  const value = String(status).toLowerCase();
  if (value.includes("activo") || value.includes("complet") || value.includes("listo") || value.includes("disponible") || value.includes("usar")) return "success";
  if (value.includes("pendiente") || value.includes("pausada") || value.includes("revision") || value.includes("proximo") || value.includes("sin ejecutar")) return "warning";
  if (value.includes("alto") || value.includes("alta")) return "danger";
  return "info";
}

export function NetworkDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.network} />;
}

export function ReferralsDashboardPage() {
  const [referral, setReferral] = useState("");
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d?.referralCode) setReferral(d.referralCode); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const code = referral || member.referralCode;
  const config = {
    ...moduleConfigs.referrals,
    metrics: moduleConfigs.referrals.metrics.map((m) => (m.label === "Codigo" ? { ...m, value: code } : m)),
    cards: moduleConfigs.referrals.cards.map((c) =>
      c.title === "Enlace personal" ? { ...c, text: `https://app.mindblisspower.com/register?ref=${code}` } : c,
    ),
  };
  return <ExecutiveModulePage config={config} />;
}

export function TeamDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.team} />;
}

function ProjectedScenarioCard({ scenario }) {
  if (!scenario) return null;
  const { scenario: name, simulation, analysis } = scenario;
  const label = name === "modesto" ? "Proyectado modesto" : name === "estres" ? "Estrés" : name;
  const score = typeof analysis?.health_score === "number" ? `${Math.round(analysis.health_score)}%` : "—";
  const risk = analysis?.risk_level ?? "—";
  const solvent = simulation?.solvent;
  const theta = typeof simulation?.worst_theta === "number" ? simulation.worst_theta.toFixed(2) : "—";
  const margin = typeof simulation?.margin === "number" ? `${(simulation.margin * 100).toFixed(1)}%` : "—";
  const streams = simulation?.streams ?? {};

  const solventTone = solvent === true ? "success" : solvent === false ? "danger" : "info";
  const solventLabel = solvent === true ? "Solvente" : solvent === false ? "No solvente" : "—";
  const scoreTone = typeof analysis?.health_score === "number"
    ? (analysis.health_score >= 70 ? "success" : analysis.health_score >= 40 ? "warning" : "danger")
    : "info";

  const riskCount = Array.isArray(analysis?.findings)
    ? analysis.findings.filter((f) => f.severity === "alta").length
    : 0;

  return (
    <div className="executive-panel">
      <h2 className="executive-section-title">
        <TrendingUp size={18} style={{ color: "var(--vp-accent)" }} />
        {label}
      </h2>

      <div className="executive-grid metrics mb-6">
        <MetricCard label="Sanidad" value={score} detail={`riesgo: ${risk}`} icon={ShieldCheck} tone={scoreTone} />
        <MetricCard label="Nivel de riesgo" value={risk} detail={`${riskCount} hallazgos altos`} icon={Activity} tone={riskCount === 0 ? "success" : "warning"} />
        <MetricCard label="Solvencia" value={solventLabel} detail={`θ peor: ${theta}`} icon={Shield} tone={solventTone} />
        <MetricCard label="Margen" value={margin} detail="margen simulado" icon={Zap} tone={solvent ? "success" : "danger"} />
      </div>

      {Object.keys(streams).length > 0 && (
        <div>
          <p className="executive-card-label mb-3">Desglose de flujos simulados</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {Object.entries(streams).map(([key, val]) => (
              <div
                key={key}
                className="rounded-2xl p-4"
                style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
              >
                <p className="executive-card-label capitalize">{key}</p>
                <p className="text-xl font-bold" style={{ color: "var(--vp-text)" }}>
                  {typeof val === "number" ? val.toLocaleString("es", { maximumFractionDigits: 0 }) : String(val)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {Array.isArray(analysis?.findings) && analysis.findings.length > 0 && (
        <div className="mt-5">
          <p className="executive-card-label mb-3">Hallazgos clave</p>
          <div className="executive-grid three">
            {analysis.findings.slice(0, 3).map((f, i) => (
              <article key={`${name}-finding-${i}`} className="executive-card">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <IconCircle icon={f.area === "solvencia" ? Shield : f.area === "balance_binario" ? Activity : Brain} tone="accent" />
                  <StatusPill tone={f.severity === "alta" ? "danger" : f.severity === "media" ? "warning" : "info"}>
                    {f.severity === "alta" ? "Alto" : f.severity === "media" ? "Medio" : "Info"}
                  </StatusPill>
                </div>
                <h3 className="m-0 text-lg font-bold" style={{ color: "var(--vp-text)" }}>{f.title}</h3>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--vp-muted)" }}>{f.detail}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AiAdvisorDashboardPage() {
  const { loading: healthLoading, data: healthData, error: healthError } = useNetworkHealth();
  const { loading: sustLoading, data: sustData, error: sustError } = useSustainability();

  if (healthLoading) {
    const loadingConfig = {
      ...moduleConfigs.ai,
      metrics: moduleConfigs.ai.metrics.map((m) => ({ ...m, value: "…" })),
    };
    return <ExecutiveModulePage config={loadingConfig} />;
  }

  if (healthError || !healthData?.analysis) {
    const errorConfig = {
      ...moduleConfigs.ai,
      subtitle: healthError ? `Error al cargar datos: ${healthError}` : "No se pudo obtener el veredicto de red.",
      metrics: [
        { label: "Sanidad", value: "—", detail: "sin datos", icon: ShieldCheck, tone: "muted" },
        { label: "Riesgos", value: "—", detail: "sin datos", icon: Activity, tone: "muted" },
        { label: "Acciones", value: "—", detail: "sin datos", icon: Sparkles, tone: "muted" },
        { label: "Modelo", value: "—", detail: "sin datos", icon: Bot, tone: "muted" },
      ],
    };
    return <ExecutiveModulePage config={errorConfig} />;
  }

  const { analysis, rank_exposure } = healthData;
  const healthScore = typeof analysis.health_score === "number" ? `${Math.round(analysis.health_score)}%` : "—";
  const riskCount = Array.isArray(analysis.findings) ? analysis.findings.filter((f) => f.severity === "alta").length : "—";
  const actionCount = Array.isArray(analysis.actions) ? analysis.actions.length : "—";

  const exposureDetail = rank_exposure
    ? `Exposición: ${rank_exposure.liability_usd ?? "—"}`
    : "sin datos";

  const liveConfig = {
    ...moduleConfigs.ai,
    subtitle: analysis.summary || moduleConfigs.ai.subtitle,
    metrics: [
      { label: "Sanidad", value: healthScore, detail: analysis.risk_level || "estimacion local", icon: ShieldCheck, tone: analysis.health_score >= 70 ? "success" : analysis.health_score >= 40 ? "warning" : "danger" },
      { label: "Riesgos", value: String(riskCount), detail: `nivel: ${analysis.risk_level || "—"}`, icon: Activity, tone: riskCount === 0 ? "success" : "warning" },
      { label: "Acciones", value: String(actionCount), detail: "recomendadas", icon: Sparkles, tone: "accent" },
      { label: "Exposicion", value: rank_exposure ? String(rank_exposure.pending_installments ?? "—") : "—", detail: exposureDetail, icon: Bot, tone: "info" },
    ],
    cards: Array.isArray(analysis.findings) && analysis.findings.length > 0
      ? analysis.findings.slice(0, 3).map((f) => ({
          title: f.title,
          text: f.detail,
          icon: f.area === "solvencia" ? Shield : f.area === "balance_binario" ? Activity : Brain,
          status: f.severity === "alta" ? "Alto" : f.severity === "media" ? "Medio" : f.severity === "normal" ? "Info" : "Info",
        }))
      : moduleConfigs.ai.cards,
    rows: Array.isArray(analysis.actions) && analysis.actions.length > 0
      ? analysis.actions.map((a) => [a.title, a.detail?.slice(0, 40) ?? "—", a.priority ?? "—", a.target ?? "Red"])
      : moduleConfigs.ai.rows,
  };

  const projected = Array.isArray(sustData?.projected) ? sustData.projected : [];

  return (
    <>
      {/* Live verdict */}
      <ExecutiveModulePage config={liveConfig} />

      {/* Projected scenarios — appended below live verdict */}
      <section className="executive-page" style={{ paddingTop: 0 }}>
        <div className="executive-container">
          <div className="mb-6">
            <p className="executive-eyebrow">Análisis prospectivo</p>
            <h2 className="executive-title">Escenarios proyectados</h2>
            <p className="executive-subtitle">
              {sustLoading
                ? "Cargando escenarios proyectados…"
                : sustError
                ? `Error al cargar proyecciones: ${sustError}`
                : projected.length === 0
                ? "Sin datos de proyección disponibles."
                : "Simulación de sostenibilidad en condiciones de carga creciente."}
            </p>
          </div>

          <div className="flex flex-col gap-8">
            {!sustLoading && !sustError && projected.map((s) => (
              <ProjectedScenarioCard key={s.scenario} scenario={s} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function AutoModeDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.auto} />;
}

export function RankDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.ranks} />;
}

export function ActivityDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.activity} />;
}

export function BonusesDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.bonuses} />;
}

export function ProductsDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.products} />;
}

export function SupportDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.support} />;
}

export function LegalDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.legal} />;
}

export function KycDashboardPage() {
  const [view, setView] = useState("personal");

  const progress = useMemo(() => (view === "personal" ? 45 : 20), [view]);

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow="Cumplimiento"
          title="KYC"
          subtitle="Verificacion de identidad con datos personales, documento y direccion. La experiencia queda preparada para conectarse al backend de aprobaciones."
          action={
            <button className="executive-button primary" type="button">
              <UploadCloud size={16} />
              Subir documento
            </button>
          }
        />

        <div className="mb-6 executive-tabs" role="tablist" aria-label="Vistas KYC">
          {[
            ["personal", "Mi verificacion", IdCard],
            ["manage", "Solicitudes", Filter],
          ].map(([id, label, Icon]) => (
            <button key={id} className="executive-tab" aria-selected={view === id} type="button" onClick={() => setView(id)}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {view === "personal" ? (
          <div className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
            <div className="executive-panel">
              <h2 className="executive-section-title">
                <Shield size={18} style={{ color: "var(--vp-accent)" }} />
                Estado de verificacion
              </h2>
              <div className="mb-4 flex items-center justify-between">
                <StatusPill tone="warning">Pendiente</StatusPill>
                <span className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>
                  {progress}%
                </span>
              </div>
              <div className="executive-progress">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-5 text-sm leading-7" style={{ color: "var(--vp-muted)" }}>
                Completa datos personales, documento y prueba de residencia. La revision se enfoca en identidad, seguridad y cumplimiento.
              </p>
            </div>

            <div className="executive-panel">
              <h2 className="executive-section-title">
                <User size={18} style={{ color: "var(--vp-accent)" }} />
                Datos personales
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Nombre legal">
                  <input className="executive-input" defaultValue={member.name} />
                </Field>
                <Field label="Documento">
                  <input className="executive-input" placeholder="Numero de documento" />
                </Field>
                <Field label="Fecha de nacimiento">
                  <input className="executive-input" type="date" />
                </Field>
                <Field label="Pais">
                  <input className="executive-input" defaultValue={member.country} />
                </Field>
                <Field label="Telefono">
                  <input className="executive-input" defaultValue={member.phone} />
                </Field>
                <Field label="Correo">
                  <input className="executive-input" defaultValue={member.email} readOnly />
                </Field>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="executive-upload">
                  <UploadCloud size={24} style={{ color: "var(--vp-accent)" }} />
                  <strong style={{ color: "var(--vp-text)" }}>Documento de identidad</strong>
                  <span className="text-sm">Frente y reverso en buena calidad.</span>
                </div>
                <div className="executive-upload">
                  <MapPin size={24} style={{ color: "var(--vp-accent)" }} />
                  <strong style={{ color: "var(--vp-text)" }}>Prueba de direccion</strong>
                  <span className="text-sm">Factura o extracto reciente.</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="executive-panel">
            <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <h2 className="executive-section-title mb-0">
                <IdCard size={18} style={{ color: "var(--vp-accent)" }} />
                Solicitudes KYC
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <input className="executive-input" placeholder="Nombre" />
                <select className="executive-select" defaultValue="">
                  <option value="">Estado</option>
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                </select>
                <button className="executive-button primary" type="button">
                  Buscar
                </button>
              </div>
            </div>
            <div className="executive-table-wrap">
              <table className="executive-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Pais</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {kycRequests.map((request) => (
                    <tr key={`${request.name}-${request.type}`}>
                      <td>{request.name}</td>
                      <td>{request.type}</td>
                      <td>{request.country}</td>
                      <td>{request.date}</td>
                      <td>
                        <StatusPill tone={request.status === "Pendiente" ? "warning" : "info"}>{request.status}</StatusPill>
                      </td>
                      <td>
                        <button className="executive-button ghost" type="button">
                          <Eye size={15} />
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
