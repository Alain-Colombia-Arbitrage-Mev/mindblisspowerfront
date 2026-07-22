"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNetworkHealth } from "@/lib/useNetworkHealth";
import { useSustainability } from "@/lib/useSustainability";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowDownToLine,
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
  Loader2,
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

// Placeholders NEUTROS para cuando la sesión/summary aún no cargan o fallan.
// NUNCA poner datos ficticios aquí: los miembros migrados verían un rango,
// código de referido o balance que no es suyo.
const member = {
  name: "",
  username: "",
  email: "",
  phone: "",
  country: "",
  rank: "Sin rango",
  plan: "—",
  joined: "—",
  sponsor: "—",
  referralCode: "",
  wallet: "Sin billetera configurada",
};

const overviewMetrics = [
  { label: "Red activa", value: "—", detail: "miembros visibles", icon: Users, tone: "accent" },
  { label: "Activos", value: "—", detail: "con estado activo", icon: CheckCircle2, tone: "success" },
  { label: "Rango", value: "—", detail: "nivel actual", icon: TrendingUp, tone: "accent" },
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

// Formato de dinero unificado (mismos decimales que MyPaymentsPanel).
const money = (v) => `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtMoneyDate = (s) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }); } catch { return s; }
};
// Estados de retiro → etiqueta + tono del StatusPill.
const WITHDRAWAL_STATUS = {
  requested: { label: "Solicitado", tone: "warning" },
  approved: { label: "Aprobado", tone: "success" },
  paid: { label: "Pagado", tone: "success" },
  rejected: { label: "Rechazado", tone: "danger" },
  cancelled: { label: "Cancelado", tone: "muted" },
};
const PAYMENT_STATUS = {
  activated: { label: "Activado", tone: "success" },
  paid: { label: "Pagado", tone: "success" },
  needs_placement: { label: "Pendiente", tone: "warning" },
  created: { label: "Iniciado", tone: "warning" },
  failed: { label: "Fallido", tone: "danger" },
  expired: { label: "Expirado", tone: "muted" },
  refunded: { label: "Reembolsado", tone: "muted" },
};

// Sin solicitudes simuladas: la lista real vendrá del backend KYC.
const kycRequests = [];

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
  // Distinguir "cargando" de "cargó y es 0" de "falló" es el punto central:
  // nunca pintar $0.00 mientras carga ni cuando la API falla.
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const mountedRef = useRef(true);

  const load = () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    fetch("/api/payments/me", { cache: "no-store" })
      .then(async (r) => {
        const p = await r.json().catch(() => ({}));
        if (!mountedRef.current) return;
        // buyer_not_found = miembro sin registro de pagos aún: NO es un error,
        // es un saldo legítimamente en 0 con historial vacío.
        if (!r.ok && p.error !== "buyer_not_found") {
          return setState({ loading: false, error: p.error || "summary-failed", data: null });
        }
        setState({ loading: false, error: "", data: p.error === "buyer_not_found" ? {} : p });
      })
      .catch(() => { if (mountedRef.current) setState({ loading: false, error: "network", data: null }); });
  };

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, []);

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow="Finanzas"
          title="Billetera y retiros"
          subtitle="Gestiona tu saldo disponible, historial de retiros y solicitudes. Los montos reflejan tus comisiones publicadas por el motor."
        />

        {state.loading ? (
          <FinanceLoading />
        ) : state.error ? (
          <FinanceError onRetry={load} />
        ) : (
          <FinanceContent data={state.data || {}} onDone={load} />
        )}
      </div>
    </section>
  );
}

function FinanceLoading() {
  return (
    <>
      <div className="executive-grid metrics mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="executive-card">
            <div className="mb-5 flex items-start justify-between gap-4">
              <span className="skeleton-line" style={{ width: "60%", height: 12, borderRadius: 6, background: "var(--vp-surface-raised)" }} />
              <span className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--vp-surface-raised)" }} />
            </div>
            <div className="skeleton-line" style={{ width: "45%", height: 26, borderRadius: 8, background: "var(--vp-surface-raised)" }} />
          </div>
        ))}
      </div>
      <div className="executive-panel flex items-center justify-center gap-2 py-16 text-sm" style={{ color: "var(--vp-muted)" }}>
        <Loader2 size={16} className="animate-spin" />
        Cargando tu saldo…
      </div>
    </>
  );
}

function FinanceError({ onRetry }) {
  return (
    <div className="executive-panel flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--vp-danger-muted)", border: "1px solid var(--vp-danger-border)", color: "var(--vp-danger)" }}>
        <AlertTriangle size={22} />
      </span>
      <div>
        <p className="text-base font-bold" style={{ color: "var(--vp-text)" }}>No pudimos cargar tu saldo</p>
        <p className="mt-1 text-sm" style={{ color: "var(--vp-muted)" }}>
          Ocurrió un problema al consultar tu billetera. Tu dinero está seguro; vuelve a intentarlo.
        </p>
      </div>
      <button className="executive-button primary" type="button" onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}

function FinanceContent({ data, onDone }) {
  const withdrawals = Array.isArray(data.withdrawals) ? data.withdrawals : [];
  const payments = Array.isArray(data.payments) ? data.payments : [];
  const pendingTotal = withdrawals
    .filter((w) => w.status === "requested" || w.status === "approved")
    .reduce((sum, w) => sum + Number(w.amount_usd ?? 0), 0);

  const history = [
    ...withdrawals.map((w) => ({
      key: `wd-${w.id}`,
      date: w.created_at,
      type: "Retiro",
      amount: w.amount_usd,
      status: WITHDRAWAL_STATUS[w.status] || WITHDRAWAL_STATUS.requested,
    })),
    ...payments.map((p) => ({
      key: `pay-${p.purchase_id}`,
      date: p.created_at,
      type: "Membresía",
      amount: p.total_usd,
      status: PAYMENT_STATUS[p.status] || PAYMENT_STATUS.created,
    })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return (
    <>
      <div className="executive-grid metrics mb-6">
        <MetricCard label="Balance disponible" value={money(data.available_for_withdrawal_usd)} detail="saldo real para retirar" icon={Wallet} tone="success" />
        <MetricCard label="Comisiones en maduración" value={money(data.commission_maturing_usd)} detail="aún no disponibles" icon={TrendingUp} tone="accent" />
        <MetricCard label="Retiros pendientes" value={money(pendingTotal)} detail="solicitudes en curso" icon={Activity} tone="muted" />
        <MetricCard label="Membresías activas" value={String(data.active_packages ?? 0)} detail="cuentas con estado activo" icon={CreditCard} tone="info" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
        <WithdrawPanel data={data} onDone={onDone} />

        <div className="executive-panel">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <h2 className="executive-section-title mb-0">
              <CreditCard size={18} style={{ color: "var(--vp-accent)" }} />
              Historial financiero
            </h2>
          </div>
          <div className="executive-table-wrap">
            {history.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: "var(--vp-muted)" }}>
                Aún no tienes movimientos registrados.
              </p>
            ) : (
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
                  {history.map((row) => (
                    <tr key={row.key}>
                      <td>{fmtMoneyDate(row.date)}</td>
                      <td>{row.type}</td>
                      <td>{money(row.amount)}</td>
                      <td>
                        <StatusPill tone={row.status.tone}>{row.status.label}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function WithdrawPanel({ data, onDone }) {
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const min = Number(data.min_withdrawal_usd ?? 100);
  const avail = Number(data.available_for_withdrawal_usd ?? 0);
  const canWithdraw = avail >= min;

  async function submit() {
    setMsg({ type: "", text: "" });
    const amt = Number(amount);
    if (!amt || amt < min) return setMsg({ type: "err", text: `El mínimo de retiro es ${money(min)}.` });
    if (amt > avail) return setMsg({ type: "err", text: "El monto supera tu saldo disponible." });
    if (bank.trim().length < 6) return setMsg({ type: "err", text: "Ingresa tus datos bancarios." });
    // Guard anti-doble-clic: el backend llama a BMP y puede tardar ~10s.
    setBusy(true);
    try {
      const r = await fetch("/api/payments/withdraw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: amt.toFixed(2), bank_info: bank.trim() }),
      });
      const p = await r.json().catch(() => ({}));
      if (!r.ok) {
        const m = {
          min_withdrawal: `El mínimo es ${money(min)}.`,
          insufficient_balance: "Saldo insuficiente.",
          no_balance: "No tienes saldo de comisiones.",
        }[p.error] || "No se pudo solicitar el retiro. Intenta de nuevo.";
        setMsg({ type: "err", text: m });
      } else {
        setMsg({ type: "ok", text: "Solicitud enviada. Queda pendiente de aprobación." });
        setAmount(""); setBank(""); onDone();
      }
    } catch {
      setMsg({ type: "err", text: "Sin conexión. Intenta de nuevo." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="executive-panel">
      <h2 className="executive-section-title">
        <DollarSign size={18} style={{ color: "var(--vp-accent)" }} />
        Solicitar retiro
      </h2>
      <div className="space-y-5">
        <Field label="Monto a retirar (USD)">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--vp-muted)" }}>$</span>
            <input
              className="executive-input leading-icon"
              type="number"
              min={min}
              step="0.01"
              placeholder={`${min}.00`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!canWithdraw || busy}
            />
          </div>
        </Field>
        <Field label="Datos bancarios de destino">
          <textarea
            className="executive-input"
            rows={3}
            placeholder="Banco, número de cuenta/CLABE, titular, documento"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            disabled={!canWithdraw || busy}
          />
        </Field>
        <div className="rounded-2xl p-4" style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}>
          <div className="mb-2 flex justify-between text-sm">
            <span style={{ color: "var(--vp-muted)" }}>Disponible</span>
            <span style={{ color: "var(--vp-text)" }}>{money(avail)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--vp-muted)" }}>Mínimo de retiro</span>
            <span style={{ color: "var(--vp-text)" }}>{money(min)}</span>
          </div>
        </div>
        <button
          className="executive-button primary w-full disabled:opacity-60"
          type="button"
          onClick={submit}
          disabled={!canWithdraw || busy}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
          {canWithdraw ? "Enviar solicitud" : "Saldo insuficiente para retirar"}
        </button>
        {msg.text && (
          <p className="text-xs font-semibold" style={{ color: msg.type === "ok" ? "var(--vp-accent)" : "var(--vp-danger)" }}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}

const PLAN_LABEL = { passive_investor: "Inversionista pasivo", network: "Red" };

export function ProfileDashboardPage() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [digest, setDigest] = useState(true);
  const [me, setMe] = useState({ name: "", email: "", referralCode: "" });
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", country: "", payout_wallet_usdc: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState({ type: "", text: "" });
  const editedRef = useRef(false);

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
    fetch("/api/member/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        // No pisar lo que el usuario ya empezó a editar si el fetch llega tarde.
        if (cancelled || !d || editedRef.current) return;
        const full = [d.first_name, d.last_name].filter(Boolean).join(" ").trim();
        setForm({
          name: full,
          phone: d.phone || "",
          country: d.country || "",
          payout_wallet_usdc: d.payout_wallet_usdc || "",
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const setField = (k) => (e) => { editedRef.current = true; setForm((f) => ({ ...f, [k]: e.target.value })); };

  async function saveProfile() {
    setSaving(true);
    setSaveMsg({ type: "", text: "" });
    const wallet = (form.payout_wallet_usdc || "").trim();
    if (wallet && !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      setSaving(false);
      setSaveMsg({ type: "err", text: "La dirección USDC debe ser una address ERC-20 válida (0x + 40 hex)." });
      return;
    }
    try {
      const r = await fetch("/api/member/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: (form.name || "").trim(),
          phone: (form.phone || "").trim(),
          country: (form.country || "").trim(),
          payout_wallet_usdc: wallet,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const m = { invalid_wallet: "Dirección USDC inválida.", person_not_found: "No se pudo guardar (perfil no encontrado)." }[d.error] || "No se pudieron guardar los cambios.";
        setSaveMsg({ type: "err", text: m });
      } else {
        setSaveMsg({ type: "ok", text: "Cambios guardados." });
        // Refresca el sidebar con el nombre nuevo de inmediato (optimista).
        try { window.dispatchEvent(new CustomEvent("vp:profile-updated", { detail: { name: (form.name || "").trim() } })); } catch { /* ignore */ }
      }
    } catch {
      setSaveMsg({ type: "err", text: "Sin conexión. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  }

  const displayName = me.name || "Mi cuenta";
  const displayEmail = me.email || member.email;
  const displayReferral = me.referralCode || member.referralCode;
  const displayInitial = (displayName || "M").trim().charAt(0).toUpperCase();
  const displayRank = summary?.rank && summary.rank !== "—" ? summary.rank : member.rank;
  const displayJoined = summary?.joined_at || member.joined;
  const displayPlan = summary?.plan ? (PLAN_LABEL[summary.plan] || summary.plan) : member.plan;
  // Siempre visible: el saldo real del ledger (migración 2.0 ⇒ $0.00 para
  // todos). Si el summary aún no carga se muestra $0.00, nunca se oculta.
  const displayBalance = `$${Number(summary?.wallet_balance_usd ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow="Perfil"
          title="Mi perfil"
          subtitle="Gestiona datos personales, seguridad, billetera de retiro y preferencias de notificacion."
          action={
            <div className="flex flex-col items-end gap-1">
              <button className="executive-button primary" type="button" onClick={saveProfile} disabled={saving}>
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
              {saveMsg.text && (
                <span className="text-xs font-semibold" style={{ color: saveMsg.type === "ok" ? "var(--vp-accent)" : "#f87171" }}>
                  {saveMsg.text}
                </span>
              )}
            </div>
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
                {displayReferral ? (
                  <p className="m-0 text-4xl font-light" style={{ color: "var(--vp-text)" }}>
                    {displayReferral}
                  </p>
                ) : (
                  <p className="m-0 mt-1 text-sm leading-6" style={{ color: "var(--vp-muted)" }}>
                    Tu código estará disponible cuando actives tu membresía y quedes colocado en la red.
                  </p>
                )}
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
                  <input className="executive-input" value={form.name} onChange={setField("name")} placeholder="Tu nombre y apellido" />
                </Field>
                <Field label="Usuario">
                  <input className="executive-input" key={displayEmail} defaultValue={displayEmail ? displayEmail.split("@")[0] : member.username} readOnly />
                </Field>
                <Field label="Correo electronico">
                  <input className="executive-input" key={displayEmail} defaultValue={displayEmail} readOnly type="email" />
                </Field>
                <Field label="Telefono">
                  <input className="executive-input" value={form.phone} onChange={setField("phone")} type="tel" placeholder="+57 300 000 0000" />
                </Field>
                <Field label="Pais">
                  <input className="executive-input" value={form.country} onChange={setField("country")} placeholder="País" />
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
                  Configura una direccion USDC (red Ethereum · ERC-20) antes de solicitar retiros.
                </p>
                <Field label="Direccion USDC (ERC-20)">
                  <input className="executive-input" value={form.payout_wallet_usdc} onChange={setField("payout_wallet_usdc")} placeholder="0x..." />
                </Field>
                <button className="executive-button mt-4 w-full" type="button" onClick={saveProfile} disabled={saving}>
                  {saving ? "Guardando…" : "Actualizar billetera"}
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
    rows: [],
  },
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
  },
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
    // Placeholder: RankDashboardPage lo reemplaza con el rango REAL del miembro.
    metrics: [
      { label: "Rango actual", value: "—", detail: "cargando", icon: Trophy, tone: "accent" },
      { label: "Siguiente rango", value: "—", detail: "cargando", icon: TrendingUp, tone: "success" },
      { label: "Bono del siguiente", value: "—", detail: "al calificar", icon: DollarSign, tone: "warning" },
      { label: "Rangos en carrera", value: "—", detail: "catálogo", icon: Shield, tone: "muted" },
    ],
    cards: [
      { title: "Requisito inmediato", text: "Mantener datos personales completos y actividad verificable.", icon: CheckCircle2, status: "En curso" },
      { title: "Puntos", text: "Los puntos de rango deben venir del backend y no de calculos visuales temporales.", icon: BarChart3, status: "Auditado" },
      { title: "Siguiente nivel", text: "El avance se habilita cuando existan reglas de rango conectadas al perfil.", icon: Trophy, status: "Pendiente" },
    ],
    tableTitle: "Ruta de rangos",
    tableIcon: Trophy,
    columns: ["Rango", "Estado", "Puntos requeridos", "Bono"],
    // Se llena en runtime con mlm.rank + el rango real del miembro.
    rows: [],
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
    action: { label: "Ver membresías", href: "/dashboard/packages", icon: Package },
    metrics: [
      { label: "Productos", value: "3", detail: "categorias", icon: ShoppingBag, tone: "accent" },
      { label: "Activos", value: "1", detail: "disponible", icon: CheckCircle2, tone: "success" },
      { label: "Proximos", value: "2", detail: "en preparacion", icon: Sparkles, tone: "warning" },
      { label: "Soporte", value: "24h", detail: "canal interno", icon: LifeBuoy, tone: "info" },
    ],
    cards: [
      { title: "Membresia", text: "Acceso al portal, perfil, red, referidos y reportes de actividad.", icon: IdCard, status: "Activo" },
      { title: "Membresías", text: "Catalogo conectado a backend para planes disponibles.", icon: Package, status: "Disponible" },
      { title: "Servicios", text: "Productos adicionales se publicaran cuando esten listos para operacion.", icon: ShoppingBag, status: "Proximo" },
    ],
    tableTitle: "Catalogo",
    tableIcon: ShoppingBag,
    columns: ["Producto", "Categoria", "Estado", "Accion"],
    rows: [
      ["Portal miembro", "Plataforma", "Activo", "Usar"],
      ["Membresías", "Plan", "Disponible", "Revisar"],
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
  const link = code ? `https://app.mindblisspower.com/register?ref=${encodeURIComponent(code)}` : "";
  const config = {
    ...moduleConfigs.referrals,
    metrics: moduleConfigs.referrals.metrics.map((m) => (m.label === "Codigo" ? { ...m, value: code || "—" } : m)),
    cards: moduleConfigs.referrals.cards.map((c) =>
      c.title === "Enlace personal"
        ? {
            ...c,
            text: link || "Tu enlace estará disponible cuando actives tu membresía y quedes colocado en la red.",
            status: code ? "Listo" : "Pendiente",
          }
        : c,
    ),
  };
  return <ExecutiveModulePage config={config} />;
}

export function TeamDashboardPage() {
  // Datos reales de la red del miembro (3 niveles) — nunca equipo simulado.
  const [network, setNetwork] = useState(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/member/tree", { cache: "no-store" })
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
      { label: "Miembros", value: String(nodes.length), detail: "primeros 3 niveles", icon: Users, tone: "accent" },
      { label: "Activos", value: String(actives), detail: "estado activo", icon: CheckCircle2, tone: "success" },
      { label: "Inactivos", value: String(nodes.length - actives), detail: "sin actividad", icon: Activity, tone: "warning" },
      { label: "Con rango", value: String(ranked), detail: "rango vigente", icon: Trophy, tone: "accent" },
    ],
    rows: nodes.slice(0, 100).map((n) => [
      n.name,
      n.rank?.name || "Sin rango",
      n.status === "active" ? "Activo" : "Inactivo",
      `Nivel ${n.level} · ${n.side === "L" ? "Izq" : "Der"}`,
    ]),
  };
  return <ExecutiveModulePage config={config} />;
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
  // Rango REAL del miembro (mlm.affiliate.current_rank_id) + carrera de rangos
  // real (mlm.rank). Antes mostraba "Corona" hardcodeado para todos.
  const [ranks, setRanks] = useState([]);
  const [myRank, setMyRank] = useState(null); // {code,name,order} | null
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/member/ranks", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/member/tree", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([rk, tree]) => {
        if (cancelled) return;
        if (rk?.ranks) setRanks(rk.ranks);
        if (tree?.positioned && tree.me?.rank) setMyRank(tree.me.rank);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const money0 = (v) => `$${Number(v ?? 0).toLocaleString("en-US")}`;
  const currentIdx = myRank ? ranks.findIndex((r) => r.code === myRank.code) : -1;
  const next = currentIdx + 1 < ranks.length ? ranks[currentIdx + 1] : null;

  const config = {
    ...moduleConfigs.ranks,
    metrics: [
      { label: "Rango actual", value: loaded ? (myRank?.name || "Sin rango") : "—", detail: "según la red migrada", icon: Trophy, tone: "accent" },
      { label: "Siguiente rango", value: next ? next.name_es : loaded ? "Máximo" : "—", detail: "en la carrera", icon: TrendingUp, tone: "success" },
      { label: "Bono del siguiente", value: next ? money0(next.bonus_amount_usd) : "—", detail: "al calificar", icon: DollarSign, tone: "warning" },
      { label: "Rangos en carrera", value: ranks.length ? String(ranks.length) : "—", detail: "catálogo oficial", icon: Shield, tone: "muted" },
    ],
    rows: ranks.map((r, i) => [
      r.name_es,
      i <= currentIdx ? (i === currentIdx ? "Actual" : "Alcanzado") : "Pendiente",
      Number(r.required_points).toLocaleString("en-US"),
      money0(r.bonus_amount_usd),
    ]),
  };
  return <ExecutiveModulePage config={config} />;
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
