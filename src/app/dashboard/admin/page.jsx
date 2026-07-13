"use client";

import { useCallback, useEffect, useState } from "react";
import PaymentsSection from "./PaymentsSection";
import FinanceSection from "./FinanceSection";
import PlanConfigSection from "./PlanConfigSection";
import ActivityFeed from "./ActivityFeed";
import SalesSection from "./SalesSection";
import { ShieldCheck, Users, DollarSign, Ban, CheckCircle2, Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const money = (v) => `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PAGE = 25;

export default function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [denied, setDenied] = useState(false);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetch("/api/admin/summary", { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 403) { setDenied(true); return; }
        const d = await r.json().catch(() => ({}));
        if (r.ok) setSummary(d);
      })
      .catch(() => {});
  }, []);

  const loadUsers = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/users?q=${encodeURIComponent(search)}&limit=${PAGE}&offset=${offset}`, { cache: "no-store" })
      .then(async (r) => {
        if (r.status === 403) { setDenied(true); return; }
        const d = await r.json().catch(() => ({}));
        if (r.ok) { setUsers(d.users || []); setTotal(d.total || 0); }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, offset]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function toggleBlock(u) {
    setBusyId(u.person_id);
    try {
      const r = await fetch("/api/admin/block", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ person_id: u.person_id, blocked: !u.blocked }),
      });
      if (r.ok) setUsers((cur) => cur.map((x) => x.person_id === u.person_id ? { ...x, blocked: !u.blocked, status: !u.blocked ? "suspended" : "active" } : x));
    } finally { setBusyId(null); }
  }

  if (denied) {
    return (
      <section className="executive-page"><div className="executive-container">
        <div className="executive-panel text-sm font-semibold" style={{ color: "var(--vp-danger)" }}>
          No autorizado. Esta sección es solo para administradores.
        </div>
      </div></section>
    );
  }

  const page = Math.floor(offset / PAGE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <section className="executive-page"><div className="executive-container">
      <div className="executive-page-header">
        <div>
          <p className="executive-eyebrow">Administración</p>
          <h1 className="executive-title">Panel Admin</h1>
          <p className="executive-subtitle">Usuarios, pagos, rangos, ventas por producto y control de bloqueo.</p>
        </div>
        <span className="executive-icon-badge"><ShieldCheck size={20} /></span>
      </div>

      {/* Resumen */}
      <div className="grid gap-3 sm:grid-cols-4">
        <Metric Icon={Users} label="Usuarios" value={summary ? Number(summary.total_users).toLocaleString("en-US") : "…"} />
        <Metric Icon={CheckCircle2} label="Paquetes vendidos" value={summary ? Number(summary.total_sold).toLocaleString("en-US") : "…"} accent />
        <Metric Icon={DollarSign} label="Ingresos (Stripe)" value={summary ? money(summary.total_revenue_usd) : "…"} accent />
        <Metric Icon={Ban} label="Bloqueados" value={summary ? Number(summary.blocked_users).toLocaleString("en-US") : "…"} />
      </div>

      {/* Ventas por producto */}
      {summary?.products?.length > 0 && (
        <div className="executive-panel mt-6">
          <h2 className="executive-section-title"><DollarSign size={18} style={{ color: "var(--vp-accent)" }} /> Total vendido por producto</h2>
          <div className="executive-table-wrap">
            <table className="executive-table">
              <thead><tr><th>Producto</th><th>Precio</th><th>Vendidos</th><th>Ingresos</th></tr></thead>
              <tbody>
                {summary.products.map((p) => (
                  <tr key={p.package_id}>
                    <td>{p.name}</td><td>{money(p.amount_usd)}</td>
                    <td>{Number(p.sold).toLocaleString("en-US")}</td>
                    <td style={{ color: "var(--vp-accent)" }}>{money(p.revenue_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Finanzas + monitor de solvencia (live) */}
      <FinanceSection />

      {/* Ventas de paquetes (PACK MINDBLISS por tier) */}
      <SalesSection />

      {/* Actividad reciente (eventos de dominio, incluye member.registered) */}
      <ActivityFeed />

      {/* Editor de comisiones (four-eyes) */}
      <PlanConfigSection />

      {/* Retiros */}
      <PaymentsSection />

      <WithdrawalsSection />

      {/* Usuarios */}
      <div className="executive-panel mt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="executive-section-title m-0"><Users size={18} style={{ color: "var(--vp-accent)" }} /> Usuarios</h2>
          <form onSubmit={(e) => { e.preventDefault(); setOffset(0); setSearch(q.trim()); }} className="relative" style={{ width: 260 }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre o email…"
              className="h-10 w-full rounded-lg pl-9 pr-3 text-sm"
              style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }} />
            <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--vp-muted)" }} />
          </form>
        </div>

        <div className="executive-table-wrap">
          <table className="executive-table">
            <thead><tr><th>Usuario</th><th>Rango</th><th>Pagado</th><th>Árbol (I/D)</th><th>Packs</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ color: "var(--vp-muted)" }}><Loader2 size={15} className="inline animate-spin" /> Cargando…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} style={{ color: "var(--vp-muted)" }}>Sin resultados.</td></tr>
              ) : users.map((u) => (
                <tr key={u.person_id} style={{ opacity: u.blocked ? 0.6 : 1 }}>
                  <td>
                    <div className="font-bold" style={{ color: "var(--vp-text)" }}>{u.name || "—"}</div>
                    <div className="text-[11px]" style={{ color: "var(--vp-subtle)" }}>{u.email}</div>
                  </td>
                  <td>{u.rank}</td>
                  <td style={{ color: "var(--vp-accent)" }}>{money(u.total_paid_usd)}</td>
                  <td>{u.positioned ? <span style={{ color: treeColor(u) }}>{u.left_count} / {u.right_count}</span> : <span style={{ color: "var(--vp-subtle)" }}>sin posición</span>}</td>
                  <td>{u.active_packages}</td>
                  <td>{u.blocked
                    ? <span className="font-bold" style={{ color: "var(--vp-danger)" }}>Bloqueado</span>
                    : <span style={{ color: "var(--vp-accent)" }}>{u.status === "active" ? "Activo" : u.status}</span>}</td>
                  <td>
                    <button type="button" onClick={() => toggleBlock(u)} disabled={busyId === u.person_id}
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                      style={u.blocked
                        ? { background: "var(--vp-accent-muted)", color: "var(--vp-accent)", border: "1px solid var(--vp-accent-border)" }
                        : { background: "var(--vp-danger-muted)", color: "var(--vp-danger)", border: "1px solid var(--vp-danger-border)" }}>
                      {busyId === u.person_id ? <Loader2 size={12} className="animate-spin" /> : u.blocked ? <CheckCircle2 size={12} /> : <Ban size={12} />}
                      {u.blocked ? "Desbloquear" : "Bloquear"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm" style={{ color: "var(--vp-muted)" }}>
          <span>{total.toLocaleString("en-US")} usuarios · pág {page}/{pages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold disabled:opacity-40"
              style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }}><ChevronLeft size={13} /> Anterior</button>
            <button type="button" disabled={offset + PAGE >= total} onClick={() => setOffset(offset + PAGE)}
              className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold disabled:opacity-40"
              style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }}>Siguiente <ChevronRight size={13} /></button>
          </div>
        </div>
      </div>
    </div></section>
  );
}

const WD_LABEL = { requested: "Solicitado", approved: "Aprobado", paid: "Pagado", rejected: "Rechazado", cancelled: "Cancelado" };

function WithdrawalsSection() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("requested");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/withdrawals?status=${encodeURIComponent(filter)}&limit=50`, { cache: "no-store" })
      .then(async (r) => { const d = await r.json().catch(() => ({})); if (r.ok) setItems(d.withdrawals || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  async function act(id, action) {
    setBusyId(id);
    try {
      const r = await fetch("/api/admin/withdrawals/action", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (r.ok) load();
    } finally { setBusyId(null); }
  }

  return (
    <div className="executive-panel mt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="executive-section-title m-0"><Ban size={18} style={{ color: "var(--vp-accent)" }} /> Solicitudes de retiro</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="h-9 rounded-lg px-3 text-sm" style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }}>
          <option value="requested">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="paid">Pagadas</option>
          <option value="rejected">Rechazadas</option>
          <option value="">Todas</option>
        </select>
      </div>
      <div className="executive-table-wrap">
        <table className="executive-table">
          <thead><tr><th>Miembro</th><th>Monto</th><th>Datos bancarios</th><th>Estado</th><th>Fecha</th><th></th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ color: "var(--vp-muted)" }}><Loader2 size={15} className="inline animate-spin" /> Cargando…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} style={{ color: "var(--vp-muted)" }}>Sin solicitudes.</td></tr>
            ) : items.map((wd) => (
              <tr key={wd.id}>
                <td><div className="font-bold" style={{ color: "var(--vp-text)" }}>{wd.member || "—"}</div><div className="text-[11px]" style={{ color: "var(--vp-subtle)" }}>{wd.email}</div></td>
                <td style={{ color: "var(--vp-accent)" }}>{money(wd.amount_usd)}</td>
                <td className="text-[11px]" style={{ color: "var(--vp-muted)", maxWidth: 240, whiteSpace: "pre-wrap" }}>{wd.bank_info || "—"}</td>
                <td>{WD_LABEL[wd.status] || wd.status}</td>
                <td className="text-[11px]" style={{ color: "var(--vp-subtle)" }}>{wd.created_at ? new Date(wd.created_at).toLocaleDateString("es-CO") : "—"}</td>
                <td>
                  <div className="flex gap-1.5">
                    {wd.status === "requested" && (<>
                      <ActBtn onClick={() => act(wd.id, "approve")} busy={busyId === wd.id} tone="ok">Aprobar</ActBtn>
                      <ActBtn onClick={() => act(wd.id, "reject")} busy={busyId === wd.id} tone="bad">Rechazar</ActBtn>
                    </>)}
                    {wd.status === "approved" && (
                      <ActBtn onClick={() => act(wd.id, "pay")} busy={busyId === wd.id} tone="ok">Marcar pagada</ActBtn>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px]" style={{ color: "var(--vp-subtle)" }}>
        El pago bancario se ejecuta manualmente por operaciones; "Marcar pagada" actualiza el estado (el asiento contable se concilia aparte).
      </p>
    </div>
  );
}

function ActBtn({ onClick, busy, tone, children }) {
  const style = tone === "ok"
    ? { background: "var(--vp-accent-muted)", color: "var(--vp-accent)", border: "1px solid var(--vp-accent-border)" }
    : { background: "var(--vp-danger-muted)", color: "var(--vp-danger)", border: "1px solid var(--vp-danger-border)" };
  return (
    <button type="button" onClick={onClick} disabled={busy}
      className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-bold disabled:opacity-50" style={style}>
      {busy ? <Loader2 size={12} className="animate-spin" /> : null}{children}
    </button>
  );
}

// Salud del árbol: verde si balanceado, ámbar si desbalance moderado, rojo si fuerte.
function treeColor(u) {
  const l = Number(u.left_count), r = Number(u.right_count);
  const max = Math.max(l, r), min = Math.min(l, r);
  if (max === 0) return "var(--vp-subtle)";
  const ratio = min / max;
  if (ratio >= 0.6) return "var(--vp-accent)";
  if (ratio >= 0.3) return "var(--vp-amber)";
  return "var(--vp-danger)";
}

function Metric({ Icon, label, value, accent }) {
  return (
    <div className="executive-card p-3 vp-glass">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}><Icon size={12} /> {label}</div>
      <div className="text-xl font-semibold" style={{ color: accent ? "var(--vp-accent)" : "var(--vp-text)" }}>{value}</div>
    </div>
  );
}
