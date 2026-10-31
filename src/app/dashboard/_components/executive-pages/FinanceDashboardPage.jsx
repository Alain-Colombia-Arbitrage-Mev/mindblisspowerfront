"use client";

import { useEffect, useState } from "react";

import { useMemberSummary } from "@/hooks/useMemberSummary";

import { isRecoverySummary } from "@/lib/member-read.mjs";

import { formatPaymentMoney as money, formatPaymentDate as fmtMoneyDate, withdrawalTerms } from "@/lib/payment-display.mjs";

import StripeSalesHistory from "../../packages/StripeSalesHistory";
import NOWPaymentsBalances from "@/components/panel/NOWPaymentsBalances";

import { Activity, AlertTriangle, ArrowDownToLine, CreditCard, DollarSign, Download, Loader2, TrendingUp, UserPlus, Wallet } from "lucide-react";

import { PageHeader, MetricCard, Field, StatusPill } from './executive-ui';

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

export function FinanceDashboardPage() {
  // Distinguir "cargando" de "cargó y es 0" de "falló" es el punto central:
  // nunca pintar $0.00 mientras carga ni cuando la API falla.
  const { state, reload: load } = useMemberSummary();

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow="Finanzas"
          title="Billetera y retiros"
          subtitle="Consulta por separado el histórico Stripe y tus membresías y comisiones NOWPayments. El vencimiento de un plazo no implica un pago automático."
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
          Ocurrió un problema al consultar tu billetera. No podemos confirmar su saldo; vuelve a consultar más tarde.
        </p>
      </div>
      <button className="executive-button primary" type="button" onClick={onRetry}>
        Reintentar
      </button>
    </div>
  );
}

function FinanceContent({ data, onDone }) {
  const recovered = isRecoverySummary(data);
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
  ].sort((a, b) => (new Date(b.date || 0)).getTime() - (new Date(a.date || 0)).getTime());

  return (
    <>
      <div className="executive-grid metrics mb-6">
        <MetricCard label={recovered ? "Saldo histórico Stripe" : "Balance disponible"} value={money(data.available_for_withdrawal_usd)} detail={recovered ? "pendiente de cálculo y revisión" : "saldo contable sujeto a validación"} icon={Wallet} tone="success" />
        <MetricCard label="Comisiones en maduración" value={money(data.commission_maturing_usd)} detail="aún no disponibles" icon={TrendingUp} tone="accent" />
        <MetricCard label="Retiros pendientes" value={money(pendingTotal)} detail="solicitudes en curso" icon={Activity} tone="muted" />
        <MetricCard label="Membresías activas" value={String(data.active_packages ?? 0)} detail="cuentas con estado activo" icon={CreditCard} tone="info" />
      </div>

      {recovered && <div role="status" className="executive-panel mb-6 text-sm" style={{ color: "var(--vp-muted)" }}>
        Las comisiones siguen pendientes de cálculo y revisión. Los retiros están bloqueados; un saldo no determinado no equivale a cero.
        <StripeSalesHistory sales={data.stripe_sales} />
      </div>}

      <NOWPaymentsBalances data={data.nowpayments} />

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

// Texto legible por código de bloqueo BMP (el backend manda el código crudo).
// not_registered NO va aquí: tiene su propia tarjeta de invitación.
const BMP_BLOCK_TEXT = {
  kyc_pending:
    "Tu verificación de identidad (KYC) en BMP está pendiente. Complétala en la app de BMP para poder retirar.",
  va_incomplete:
    "Aún no tienes una cuenta virtual activa en BMP donde depositar. Actívala en la app de BMP para poder retirar.",
  bmp_blocked:
    "BMP tiene tu cuenta bloqueada por el momento. Contacta al soporte de BMP para reactivarla.",
};

// Invitación cuando el usuario NO está registrado en BMP: BMP es la plataforma
// de pagos donde se reciben los retiros, así que sin cuenta BMP no hay a dónde
// pagar. En vez de un error, lo invitamos a crear su cuenta y vincular su email.
function BMPRegisterInvite() {
  return (
    <div
      className="mb-4 rounded-2xl p-5"
      style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-accent)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex shrink-0 items-center justify-center rounded-xl"
          style={{ width: 40, height: 40, background: "var(--vp-accent)", color: "var(--vp-bg)" }}
        >
          <UserPlus size={20} />
        </div>
        <div className="flex-1">
          <h3 className="mb-1 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
            Aún no estás registrado en BMP
          </h3>
          <p className="mb-3 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
            BMP es la plataforma de pagos donde recibes tus retiros. Crea tu cuenta con
            el <strong>mismo correo</strong> de tu cuenta aquí y actívala para poder retirar.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://play.google.com/store/apps/details?id=chat.bemindepower.bmpchat"
              target="_blank"
              rel="noopener noreferrer"
              className="executive-button primary inline-flex min-h-10 items-center gap-2 px-4 text-xs"
            >
              <Download size={14} /> Descargar app BMP
            </a>
            <a
              href="https://bemindepower.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-xs font-semibold"
              style={{ border: "1px solid var(--vp-border)", color: "var(--vp-text)" }}
            >
              Registrarme en BMP
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function WithdrawPanel({ data, onDone }) {
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const { min, available: avail, allowed: canWithdraw } = withdrawalTerms(data);

  // Candado BMP: el retiro exige una cuenta BMP válida. Consultamos el estado
  // para mostrar el motivo del bloqueo y deshabilitar el form, en vez de dejar
  // que el usuario intente y reciba un error genérico del backend.
  const [bmp, setBmp] = useState(null);
  useEffect(() => {
    if (data.payout_locked === true) return undefined;
    const controller = new AbortController();
    let cancelled = false;
    fetch("/api/payments/bmp-status", { cache: "no-store", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d && !d.error) setBmp(d); })
      .catch(() => {});
    return () => { cancelled = true; controller.abort(); };
  }, [data.payout_locked]);
  // El backend devuelve block_reason como CÓDIGO (not_registered, kyc_pending…).
  // available:false ⇒ BMP no respondió: el backend es fail-open al solicitar (la
  // solicitud se registra y se re-verifica al pagar), así que NO bloqueamos el
  // form; sólo avisamos. Un bloqueo DURO es sólo cuando BMP respondió y niega.
  const bmpReason = bmp?.block_reason || "";
  const bmpAnswered = bmp?.available === true;
  const bmpUnavailable = bmp != null && bmp.available === false;
  const bmpNotRegistered = bmpAnswered && bmpReason === "not_registered";
  // Bloqueo duro: BMP respondió y no habilita retiro. not_registered se muestra
  // aparte (invitación a registrarse), el resto con banner de motivo.
  const bmpHardBlocked = bmpAnswered && bmp?.can_withdraw === false;
  const formEnabled = canWithdraw && !bmpHardBlocked;

  async function submit() {
    setMsg({ type: "", text: "" });
    if (!formEnabled || busy) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < min) return setMsg({ type: "err", text: `El mínimo de retiro es ${money(min)}.` });
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
      {bmpNotRegistered && <BMPRegisterInvite />}
      {bmpHardBlocked && !bmpNotRegistered && (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-sm font-semibold"
          style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-danger)", color: "var(--vp-danger)" }}
        >
          {BMP_BLOCK_TEXT[bmpReason] ||
            "Tu cuenta BMP no permite retiros por ahora. Verifica o activa tu cuenta BMP para poder retirar."}
        </div>
      )}
      {bmpUnavailable && (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-xs font-semibold"
          style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)", color: "var(--vp-muted)" }}
        >
          No pudimos verificar tu cuenta BMP en este momento. Puedes enviar la solicitud; se verificará antes del pago.
        </div>
      )}
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
              disabled={!formEnabled || busy}
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
            disabled={!formEnabled || busy}
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
          disabled={!formEnabled || busy}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
          {data.payout_locked === true || avail === null
            ? "Comisiones pendientes de revisión"
            : !canWithdraw
            ? "Saldo insuficiente para retirar"
            : bmpNotRegistered
              ? "Regístrate en BMP para retirar"
              : bmpHardBlocked
                ? "Cuenta BMP no habilitada"
                : "Enviar solicitud"}
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
