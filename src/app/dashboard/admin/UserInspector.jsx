"use client";

import { useCallback, useEffect, useState } from "react";
import {
  UserSearch, Search, Loader2, X, Pencil, Ban, CheckCircle2, Trash2,
  Wallet, Network, IdCard, ShieldAlert,
} from "lucide-react";

// Inspector de usuario (solo admin): buscador + ficha completa (identidad,
// Cognito, BMP, afiliados, finanzas, rama) + acciones (editar / banear /
// desbanear / borrar). Consume los BFF /api/admin/user* y /api/admin/blacklist*.

const money = (v) => `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fdate = (v) => (v ? new Date(v).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" }) : "—");

const KYC_LABEL = { none: "Sin iniciar", pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado" };
const CONCEPT_LABEL = {
  package_purchase: "Compra de membresía",
  binary_bonus: "Bono binario",
  direct_bonus: "Bono directo",
  leadership_bonus: "Bono liderazgo",
  rank_bonus: "Bono de rango",
  withdrawal: "Retiro",
  withdrawal_fee: "Comisión de retiro",
  deposit: "Depósito",
  retirement_contribution: "Aporte jubilación",
};
const BMP_REASON = {
  not_registered: "Sin cuenta BMP",
  kyc_pending: "KYC pendiente en BMP",
  va_incomplete: "Cuenta virtual incompleta",
  bmp_blocked: "Bloqueado por BMP",
  unavailable: "BMP no disponible",
};

// Badge de estado de la persona: activo verde / suspendido ámbar / baneado rojo /
// deleted gris. blacklisted pinta rojo aunque el status diga otra cosa.
function statusBadge(person) {
  const s = person?.status || "";
  if (person?.blacklisted || s === "banned") return { label: "Baneado", color: "var(--vp-danger)", bg: "var(--vp-danger-muted)", border: "var(--vp-danger-border)" };
  if (s === "suspended") return { label: "Suspendido", color: "var(--vp-amber)", bg: "transparent", border: "var(--vp-border)" };
  if (s === "deleted") return { label: "Eliminado", color: "var(--vp-subtle)", bg: "transparent", border: "var(--vp-border)" };
  if (s === "active") return { label: "Activo", color: "var(--vp-accent)", bg: "var(--vp-accent-muted)", border: "var(--vp-accent-border)" };
  return { label: s || "—", color: "var(--vp-muted)", bg: "transparent", border: "var(--vp-border)" };
}

export default function UserInspector() {
  // Buscador
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Ficha
  const [ficha, setFicha] = useState(null);
  const [loadingFicha, setLoadingFicha] = useState(false);
  const [bmp, setBmp] = useState(null);
  const [branchTree, setBranchTree] = useState(null);

  // Acciones
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [modal, setModal] = useState(null); // "edit" | "ban" | "unban" | "delete" | null

  const person = ficha?.person || null;
  const banned = Boolean(person?.blacklisted || person?.status === "suspended" || person?.status === "banned");

  async function runSearch(e) {
    e?.preventDefault?.();
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const r = await fetch(`/api/admin/tree/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      setResults(r.ok ? d.results || [] : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  const loadFicha = useCallback(async (targetEmail) => {
    if (!targetEmail) return;
    setLoadingFicha(true);
    setMsg({ type: "", text: "" });
    setBmp(null);
    setBranchTree(null);
    try {
      const r = await fetch(`/api/admin/user?target_email=${encodeURIComponent(targetEmail)}`, { cache: "no-store" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFicha(null);
        setMsg({ type: "err", text: d.error === "not_found" ? "Usuario no encontrado." : "No se pudo cargar la ficha." });
        return;
      }
      setFicha(d);
      // Cargas secundarias en paralelo (best-effort): BMP + mini subárbol.
      fetch(`/api/admin/user/bmp?target_email=${encodeURIComponent(d.person?.email || targetEmail)}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((b) => { if (b && !b.error) setBmp(b); })
        .catch(() => {});
      if (d.branch?.affiliate_id) {
        fetch(`/api/admin/user/branch-tree?affiliate_id=${d.branch.affiliate_id}`, { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : null))
          .then((t) => { if (t?.root) setBranchTree(t); })
          .catch(() => {});
      }
    } catch {
      setFicha(null);
      setMsg({ type: "err", text: "No se pudo cargar la ficha." });
    } finally {
      setLoadingFicha(false);
    }
  }, []);

  function pick(res) {
    setResults(null);
    setQuery("");
    if (res.email) loadFicha(res.email);
  }

  const refetch = useCallback(() => {
    if (person?.email) loadFicha(person.email);
  }, [person?.email, loadFicha]);

  // ── Acciones ──────────────────────────────────────────────────────────────

  async function doBanToggle() {
    if (!person) return;
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      const r = banned
        ? await fetch("/api/admin/blacklist/remove", {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: person.email }),
          })
        : await fetch("/api/admin/blacklist", {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ fullname: person.name, email: person.email, phone: person.phone, motive: "Baneado desde el Inspector de usuario" }),
          });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg({ type: "err", text: d.error === "forbidden" ? "No autorizado." : "La operación falló. Intenta de nuevo." });
      } else {
        // refetch limpia msg al arrancar: fijar el mensaje DESPUÉS de dispararlo.
        refetch();
        setMsg({ type: "ok", text: banned ? "Usuario desbaneado y cuenta rehabilitada." : "Usuario baneado (lista negra + cuenta suspendida)." });
      }
    } catch {
      setMsg({ type: "err", text: "La operación falló. Intenta de nuevo." });
    } finally {
      setBusy(false);
      setModal(null);
    }
  }

  async function doDelete(confirmText) {
    if (!person) return;
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      const r = await fetch("/api/admin/user", {
        method: "DELETE", headers: { "content-type": "application/json" },
        body: JSON.stringify({ person_id: person.id, confirm: confirmText }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const text = {
          has_balance: "Tiene saldo o membresía activa; resuélvelo antes de borrar.",
          target_is_admin: "No se puede borrar a un administrador.",
          not_super_admin: "Solo un super admin puede borrar.",
          forbidden: "Solo un super admin puede borrar.",
          confirm_required: "Debes teclear DELETE para confirmar.",
          not_found: "Usuario no encontrado.",
        }[d.error] || "No se pudo borrar. Intenta de nuevo.";
        setMsg({ type: "err", text });
      } else {
        setFicha(null);
        setBmp(null);
        setBranchTree(null);
        setMsg({ type: "ok", text: "Usuario eliminado (soft-delete) y login deshabilitado." });
      }
    } catch {
      setMsg({ type: "err", text: "No se pudo borrar. Intenta de nuevo." });
    } finally {
      setBusy(false);
      setModal(null);
    }
  }

  async function doEdit(fields) {
    if (!person) return { ok: false, error: "sin usuario" };
    setBusy(true);
    try {
      const r = await fetch("/api/admin/user", {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ person_id: person.id, ...fields }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const text = {
          email_taken: "Ese email ya pertenece a otra cuenta.",
          invalid_email: "El email no tiene un formato válido.",
          no_fields: "No hay cambios que guardar.",
          not_found: "Usuario no encontrado.",
        }[d.error] || "No se pudo guardar. Intenta de nuevo.";
        return { ok: false, error: text };
      }
      // Si cambió el email, la ficha se recarga por el email nuevo. loadFicha
      // limpia msg al arrancar: fijar el mensaje DESPUÉS de dispararla.
      const nextEmail = fields.new_email || person.email;
      loadFicha(nextEmail);
      setMsg({ type: "ok", text: d.cognito_note ? `Datos actualizados. Aviso: ${d.cognito_note}.` : "Datos actualizados." });
      return { ok: true, cognitoNote: d.cognito_note || "" };
    } catch {
      return { ok: false, error: "No se pudo guardar. Intenta de nuevo." };
    } finally {
      setBusy(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const badge = statusBadge(person);

  return (
    <div className="executive-panel mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="executive-section-title m-0">
          <UserSearch size={18} style={{ color: "var(--vp-accent)" }} /> Inspector de usuario
        </h2>
        <form onSubmit={runSearch} className="relative" style={{ width: 320, maxWidth: "100%" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por email, handle o nombre…"
            className="h-10 w-full rounded-lg pl-9 pr-9 text-sm"
            style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" }}
          />
          <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--vp-muted)" }} />
          {query ? (
            <button type="button" onClick={() => { setQuery(""); setResults(null); }}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "var(--vp-muted)" }}>
              <X size={15} />
            </button>
          ) : null}
        </form>
      </div>

      {/* Resultados de búsqueda */}
      {results != null ? (
        <div className="mb-4 rounded-xl" style={{ border: "1px solid var(--vp-border)" }}>
          {searching ? (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--vp-muted)" }}>
              <Loader2 size={14} className="mr-2 inline animate-spin" /> Buscando…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--vp-muted)" }}>Sin coincidencias.</div>
          ) : (
            results.map((res) => (
              <button
                key={res.id}
                type="button"
                onClick={() => pick(res)}
                className="flex w-full items-center gap-2 border-b px-4 py-2.5 text-left last:border-b-0"
                style={{ borderColor: "var(--vp-border)" }}
              >
                <span className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>
                  {res.handle ? `@${res.handle}` : res.name}
                </span>
                <span className="truncate text-xs" style={{ color: "var(--vp-subtle)" }}>{res.name} · {res.email}</span>
                {res.banned ? <span className="ml-auto text-[11px] font-bold" style={{ color: "var(--vp-danger)" }}>Baneado</span> : null}
                <span className="text-[11px]" style={{ color: "var(--vp-accent)", marginLeft: res.banned ? 8 : "auto" }}>Abrir ficha →</span>
              </button>
            ))
          )}
        </div>
      ) : null}

      {/* Mensajes globales (patrón msg de WithdrawPanel) */}
      {msg.text ? (
        <div className="mb-4 rounded-lg px-3 py-2 text-sm font-semibold" style={msg.type === "ok"
          ? { background: "var(--vp-accent-muted)", border: "1px solid var(--vp-accent-border)", color: "var(--vp-accent)" }
          : { background: "var(--vp-danger-muted)", border: "1px solid var(--vp-danger-border)", color: "var(--vp-danger)" }}>
          {msg.text}
        </div>
      ) : null}

      {loadingFicha ? (
        <div className="px-2 py-6 text-sm" style={{ color: "var(--vp-muted)" }}>
          <Loader2 size={14} className="mr-2 inline animate-spin" /> Cargando ficha…
        </div>
      ) : !person ? (
        <p className="text-sm" style={{ color: "var(--vp-subtle)" }}>
          Busca un usuario por email, handle o nombre y elige un resultado para abrir su ficha.
        </p>
      ) : (
        <>
          {/* Cabecera de ficha + acciones */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <div className="text-base font-bold" style={{ color: "var(--vp-text)" }}>{person.name || "—"}</div>
                <div className="text-xs" style={{ color: "var(--vp-subtle)" }}>{person.email} · ID {person.id}</div>
              </div>
              <span className="rounded-md px-2 py-1 text-[11px] font-bold" style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                {badge.label}
              </span>
              {person.is_admin ? (
                <span className="rounded-md px-2 py-1 text-[11px] font-bold" style={{ color: "var(--vp-accent)", border: "1px solid var(--vp-accent-border)" }}>Admin</span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionBtn onClick={() => setModal("edit")} disabled={busy} tone="neutral"><Pencil size={13} /> Editar</ActionBtn>
              {banned ? (
                <ActionBtn onClick={() => setModal("unban")} disabled={busy} tone="ok"><CheckCircle2 size={13} /> Desbanear</ActionBtn>
              ) : (
                <ActionBtn onClick={() => setModal("ban")} disabled={busy} tone="bad"><Ban size={13} /> Banear</ActionBtn>
              )}
              <ActionBtn onClick={() => setModal("delete")} disabled={busy} tone="bad"><Trash2 size={13} /> Borrar</ActionBtn>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Identidad */}
            <Card title="Identidad" Icon={IdCard}>
              <Row k="Nombre" v={person.name || "—"} />
              <Row k="Alias" v={person.alias || "—"} />
              <Row k="Email" v={person.email} />
              <Row k="Teléfono" v={person.phone || "—"} />
              <Row k="Estado" v={<span style={{ color: badge.color, fontWeight: 700 }}>{badge.label}</span>} />
              <Row k="KYC" v={KYC_LABEL[person.kyc_status] || person.kyc_status || "—"} />
              <Row k="Admin" v={person.is_admin ? "Sí" : "No"} />
              <Row k="Creado" v={fdate(person.created_at)} />
              <Row k="Cognito" v={cognitoLabel(ficha.cognito)} />
              <Row k="BMP" v={bmpLabel(bmp)} />
            </Card>

            {/* Finanzas */}
            <Card title="Finanzas" Icon={Wallet}>
              <div className="mb-3 grid grid-cols-3 gap-2">
                {["USD", "USD-RET"].map((sym) => {
                  const w = (ficha.wallets || []).find((x) => x.symbol === sym);
                  return (
                    <div key={sym} className="rounded-lg p-2" style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}>
                      <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>{sym}</div>
                      <div className="text-sm font-semibold" style={{ color: "var(--vp-accent)" }}>{money(w?.balance)}</div>
                    </div>
                  );
                })}
                <div className="rounded-lg p-2" style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}>
                  <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>Membresías</div>
                  <div className="text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
                    {ficha.packages?.active ?? 0} activas / {ficha.packages?.total ?? 0}
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>Últimos movimientos</div>
              {(ficha.recent_movements || []).length === 0 ? (
                <p className="mt-1 text-xs" style={{ color: "var(--vp-subtle)" }}>Sin movimientos.</p>
              ) : (
                <div className="executive-table-wrap mt-1" style={{ maxHeight: 220, overflow: "auto" }}>
                  <table className="executive-table">
                    <thead><tr><th>Concepto</th><th>Monto</th><th>Fecha</th></tr></thead>
                    <tbody>
                      {ficha.recent_movements.map((m, i) => (
                        <tr key={i}>
                          <td>{CONCEPT_LABEL[m.concept] || m.concept}</td>
                          <td style={{ color: Number(m.amount) >= 0 ? "var(--vp-accent)" : "var(--vp-danger)" }}>{money(m.amount)}</td>
                          <td className="text-[11px]" style={{ color: "var(--vp-subtle)" }}>{fdate(m.posted_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Afiliados */}
            <Card title="Afiliados" Icon={Network}>
              {(ficha.affiliates || []).length === 0 ? (
                <p className="text-xs" style={{ color: "var(--vp-subtle)" }}>Sin posición en el árbol.</p>
              ) : (
                <div className="executive-table-wrap">
                  <table className="executive-table">
                    <thead><tr><th>Handle</th><th>Posición</th><th>Rango</th><th>Sponsor</th><th>Estado</th></tr></thead>
                    <tbody>
                      {ficha.affiliates.map((a) => (
                        <tr key={a.id}>
                          <td className="font-bold" style={{ color: "var(--vp-text)" }}>@{a.handle}</td>
                          <td>{a.side ? `Pierna ${a.side === "L" ? "izquierda" : "derecha"}` : "Raíz"} · nivel {a.depth}</td>
                          <td>{a.rank ? a.rank.name : "—"}</td>
                          <td>{a.sponsor ? `@${a.sponsor.handle}` : "—"}</td>
                          <td style={{ color: a.status === "active" ? "var(--vp-accent)" : "var(--vp-subtle)" }}>
                            {a.status === "active" ? "Activo" : a.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Rama */}
            <Card title="Rama" Icon={Network}>
              {!ficha.branch ? (
                <p className="text-xs" style={{ color: "var(--vp-subtle)" }}>Sin rama (usuario sin posición en el árbol).</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Stat label="Downline total" value={Number(ficha.branch.downline_total).toLocaleString("en-US")} />
                    <Stat label="Pierna izq." value={`${Number(ficha.branch.downline_left).toLocaleString("en-US")} · ${Number(ficha.branch.pv_left).toLocaleString("en-US")} PV`} />
                    <Stat label="Pierna der." value={`${Number(ficha.branch.downline_right).toLocaleString("en-US")} · ${Number(ficha.branch.pv_right).toLocaleString("en-US")} PV`} />
                    <Stat label="Ventas de la rama" value={ficha.branch.agg_skipped ? "—" : money(ficha.branch.branch_sales_usd)} accent />
                    <Stat label="Comisiones de la rama" value={ficha.branch.agg_skipped ? "—" : money(ficha.branch.branch_commissions_usd)} accent />
                  </div>
                  {ficha.branch.agg_skipped ? (
                    <p className="mt-2 text-[11px]" style={{ color: "var(--vp-amber)" }}>
                      Rama demasiado grande: ventas y comisiones no se calculan en línea.
                    </p>
                  ) : null}
                  <div className="mt-3 text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>Hijos directos</div>
                  {branchTree == null ? (
                    <p className="mt-1 text-xs" style={{ color: "var(--vp-subtle)" }}><Loader2 size={12} className="mr-1 inline animate-spin" /> Cargando…</p>
                  ) : (branchTree.children || []).length === 0 ? (
                    <p className="mt-1 text-xs" style={{ color: "var(--vp-subtle)" }}>Sin hijos directos.</p>
                  ) : (
                    <div className="mt-1 grid gap-2 sm:grid-cols-2">
                      {branchTree.children.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}>
                          <span className="rounded px-1 text-[10px] font-black" style={{
                            background: c.side === "L" ? "var(--vp-accent-muted)" : "var(--vp-surface-raised)",
                            color: c.side === "L" ? "var(--vp-accent)" : "var(--vp-muted)",
                          }}>{c.side}</span>
                          <span className="truncate text-sm font-bold" style={{ color: "var(--vp-text)" }}>@{c.handle}</span>
                          <span className="ml-auto text-[11px]" style={{ color: "var(--vp-subtle)" }}>
                            {Number(c.downline_total).toLocaleString("en-US")} abajo
                          </span>
                          <span className="text-[11px] font-bold" style={{ color: c.status === "active" ? "var(--vp-accent)" : "var(--vp-subtle)" }}>
                            {c.status === "active" ? "Activo" : c.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </>
      )}

      {/* Modales */}
      {modal === "edit" && person ? (
        <EditModal person={person} busy={busy} onClose={() => setModal(null)} onSave={doEdit} />
      ) : null}
      {(modal === "ban" || modal === "unban") && person ? (
        <ConfirmModal
          title={modal === "ban" ? "Banear usuario" : "Desbanear usuario"}
          text={modal === "ban"
            ? `Se agregará a ${person.name || person.email} a la lista negra, se suspenderá su cuenta y se deshabilitará su login. ¿Continuar?`
            : `Se quitará a ${person.name || person.email} de la lista negra y se rehabilitará su cuenta y login. ¿Continuar?`}
          confirmLabel={modal === "ban" ? "Banear" : "Desbanear"}
          tone={modal === "ban" ? "bad" : "ok"}
          busy={busy}
          onClose={() => setModal(null)}
          onConfirm={doBanToggle}
        />
      ) : null}
      {modal === "delete" && person ? (
        <DeleteModal person={person} busy={busy} onClose={() => setModal(null)} onConfirm={doDelete} />
      ) : null}
    </div>
  );
}

// ── Etiquetas Cognito / BMP ──────────────────────────────────────────────────

function cognitoLabel(cog) {
  if (!cog || cog.exists == null) return <span style={{ color: "var(--vp-subtle)" }}>No verificable</span>;
  if (!cog.exists) return <span style={{ color: "var(--vp-danger)", fontWeight: 700 }}>Sin cuenta</span>;
  return (
    <span style={{ color: cog.enabled ? "var(--vp-accent)" : "var(--vp-danger)", fontWeight: 700 }}>
      {cog.status || "—"} · {cog.enabled ? "habilitado" : "deshabilitado"}
    </span>
  );
}

function bmpLabel(bmp) {
  if (bmp == null) return <span style={{ color: "var(--vp-subtle)" }}>Consultando…</span>;
  if (bmp.available === false) return <span style={{ color: "var(--vp-amber)" }}>{BMP_REASON.unavailable}</span>;
  if (bmp.can_withdraw) return <span style={{ color: "var(--vp-accent)", fontWeight: 700 }}>Puede retirar</span>;
  return (
    <span style={{ color: "var(--vp-danger)", fontWeight: 700 }}>
      Bloqueado · {BMP_REASON[bmp.block_reason] || bmp.block_reason || "motivo desconocido"}
    </span>
  );
}

// ── Piezas de UI ─────────────────────────────────────────────────────────────

function Card({ title, Icon, children }) {
  return (
    <div className="executive-card p-4 vp-glass">
      <div className="mb-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>
        <Icon size={13} /> {title}
      </div>
      {children}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b py-1.5 text-sm last:border-b-0" style={{ borderColor: "var(--vp-border)" }}>
      <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--vp-subtle)" }}>{k}</span>
      <span className="truncate text-right" style={{ color: "var(--vp-text)" }}>{v}</span>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg p-2" style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}>
      <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--vp-subtle)" }}>{label}</div>
      <div className="text-sm font-semibold" style={{ color: accent ? "var(--vp-accent)" : "var(--vp-text)" }}>{value}</div>
    </div>
  );
}

function ActionBtn({ onClick, disabled, tone, children }) {
  const style = tone === "ok"
    ? { background: "var(--vp-accent-muted)", color: "var(--vp-accent)", border: "1px solid var(--vp-accent-border)" }
    : tone === "bad"
      ? { background: "var(--vp-danger-muted)", color: "var(--vp-danger)", border: "1px solid var(--vp-danger-border)" }
      : { background: "var(--vp-surface)", color: "var(--vp-text)", border: "1px solid var(--vp-border)" };
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold disabled:opacity-50" style={style}>
      {children}
    </button>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div className="executive-panel w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>{title}</h3>
          <button type="button" onClick={onClose} style={{ color: "var(--vp-muted)" }}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle = { background: "var(--vp-surface)", border: "1px solid var(--vp-border)", color: "var(--vp-text)" };

function EditModal({ person, busy, onClose, onSave }) {
  const [firstName, setFirstName] = useState(person.first_name || "");
  const [lastName, setLastName] = useState(person.last_name || "");
  const [newEmail, setNewEmail] = useState(person.email || "");
  const [phone, setPhone] = useState(person.phone || "");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const fields = {};
    if (firstName.trim() && firstName.trim() !== person.first_name) fields.first_name = firstName.trim();
    if (lastName.trim() && lastName.trim() !== person.last_name) fields.last_name = lastName.trim();
    if (newEmail.trim() && newEmail.trim().toLowerCase() !== (person.email || "").toLowerCase()) fields.new_email = newEmail.trim();
    if (phone.trim() && phone.trim() !== person.phone) fields.phone = phone.trim();
    if (Object.keys(fields).length === 0) { setErr("No hay cambios que guardar."); return; }
    const res = await onSave(fields);
    if (!res.ok) { setErr(res.error); return; }
    if (res.cognitoNote) { setNote(res.cognitoNote); return; } // dejar el aviso visible
    onClose();
  }

  return (
    <ModalShell title={`Editar a ${person.name || person.email}`} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3">
        <label className="grid gap-1 text-xs font-semibold" style={{ color: "var(--vp-subtle)" }}>
          Nombre
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-10 rounded-lg px-3 text-sm" style={inputStyle} />
        </label>
        <label className="grid gap-1 text-xs font-semibold" style={{ color: "var(--vp-subtle)" }}>
          Apellido
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10 rounded-lg px-3 text-sm" style={inputStyle} />
        </label>
        <label className="grid gap-1 text-xs font-semibold" style={{ color: "var(--vp-subtle)" }}>
          Email
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-10 rounded-lg px-3 text-sm" style={inputStyle} />
        </label>
        <label className="grid gap-1 text-xs font-semibold" style={{ color: "var(--vp-subtle)" }}>
          Teléfono
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 rounded-lg px-3 text-sm" style={inputStyle} />
        </label>
        {err ? <p className="text-xs font-semibold" style={{ color: "var(--vp-danger)" }}>{err}</p> : null}
        {note ? (
          <p className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ color: "var(--vp-amber)", border: "1px solid var(--vp-border)" }}>
            <ShieldAlert size={12} className="mr-1 inline" /> {note}
          </p>
        ) : null}
        <div className="mt-1 flex justify-end gap-2">
          <ActionBtn onClick={onClose} disabled={busy} tone="neutral">{note ? "Cerrar" : "Cancelar"}</ActionBtn>
          <button type="submit" disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold disabled:opacity-50"
            style={{ background: "var(--vp-accent-muted)", color: "var(--vp-accent)", border: "1px solid var(--vp-accent-border)" }}>
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Pencil size={12} />} Guardar
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ConfirmModal({ title, text, confirmLabel, tone, busy, onClose, onConfirm }) {
  return (
    <ModalShell title={title} onClose={onClose}>
      <p className="text-sm" style={{ color: "var(--vp-muted)" }}>{text}</p>
      <div className="mt-4 flex justify-end gap-2">
        <ActionBtn onClick={onClose} disabled={busy} tone="neutral">Cancelar</ActionBtn>
        <ActionBtn onClick={onConfirm} disabled={busy} tone={tone}>
          {busy ? <Loader2 size={12} className="animate-spin" /> : null} {confirmLabel}
        </ActionBtn>
      </div>
    </ModalShell>
  );
}

function DeleteModal({ person, busy, onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState("");
  return (
    <ModalShell title={`Borrar a ${person.name || person.email}`} onClose={onClose}>
      <p className="text-sm" style={{ color: "var(--vp-muted)" }}>
        Esto marca la cuenta como eliminada (soft-delete) y deshabilita su login. Solo un super admin puede hacerlo.
        Escribe <strong style={{ color: "var(--vp-danger)" }}>DELETE</strong> para confirmar.
      </p>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="DELETE"
        className="mt-3 h-10 w-full rounded-lg px-3 text-sm"
        style={inputStyle}
      />
      <div className="mt-4 flex justify-end gap-2">
        <ActionBtn onClick={onClose} disabled={busy} tone="neutral">Cancelar</ActionBtn>
        <ActionBtn onClick={() => onConfirm(confirmText)} disabled={busy || confirmText !== "DELETE"} tone="bad">
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Borrar definitivamente
        </ActionBtn>
      </div>
    </ModalShell>
  );
}
