import { useState } from "react";
import { Check, Copy, MapPin, Network, ShieldCheck, Trophy } from "lucide-react";

function money(value) {
  return `$${Number(value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function number(value) {
  return Number(value ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function StatBox({ label, value, tone = "accent" }) {
  const colors = {
    accent: "var(--vp-accent)",
    text: "var(--vp-text)",
    muted: "var(--vp-muted)",
    success: "var(--vp-success)",
  };

  return (
    <div
      className="min-w-0 rounded-xl border p-3"
      style={{ background: "var(--vp-bg)", borderColor: "var(--vp-border)" }}
    >
      <span className="mb-1 block text-[10px] font-medium" style={{ color: "var(--vp-muted)" }}>
        {label}
      </span>
      <span className="block truncate text-sm font-bold" style={{ color: colors[tone] ?? colors.accent }} title={String(value)}>
        {value}
      </span>
    </div>
  );
}

function LegRow({ label, occupant }) {
  return (
    <div
      className="flex min-w-0 items-center justify-between gap-3 rounded-xl border p-3"
      style={{ background: "var(--vp-bg)", borderColor: "var(--vp-border)" }}
    >
      <span className="shrink-0 text-[10px] font-medium" style={{ color: "var(--vp-muted)" }}>
        {label}
      </span>
      <span
        className="truncate rounded border px-2 py-0.5 text-xs font-bold"
        style={{
          color: occupant ? "var(--vp-accent)" : "var(--vp-muted)",
          background: occupant ? "var(--vp-accent-muted)" : "var(--vp-surface-raised)",
          borderColor: occupant ? "var(--vp-accent-border)" : "var(--vp-border)",
        }}
        title={occupant || "Disponible"}
      >
        {occupant || "Disponible"}
      </span>
    </div>
  );
}

function ProgressBar({ progress }) {
  const pct = Math.max(0, Math.min(100, Number(progress ?? 0)));
  return (
    <div className="h-2.5 overflow-hidden rounded-full" style={{ background: "var(--vp-bg)" }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--vp-accent)" }} />
    </div>
  );
}

export default function PositionCard({
  rank,
  depth,
  side,
  sponsor,
  parent,
  affiliateId,
  activePackage,
  rankProgress,
  commissions,
  referral,
  leftLeg,
  rightLeg,
}) {
  const [copied, setCopied] = useState(false);
  const hasRankProgress = Boolean(rankProgress);
  const nextRank = rankProgress?.nextRank;
  const referralLink = referral?.link || "";
  const referralCode = referral?.code || "";

  const copyReferral = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section
      className="rounded-2xl border p-5 xl:col-span-2"
      style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Network size={18} style={{ color: "var(--vp-accent)" }} />
          <div className="min-w-0">
            <h3 className="m-0 text-sm font-bold" style={{ color: "var(--vp-text)" }}>
              Tu posición en la red
            </h3>
            <p className="m-0 text-[10px] font-light" style={{ color: "var(--vp-muted)" }}>
              Nodo, pierna, sponsor y comisiones propias
            </p>
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase"
          style={{
            color: activePackage ? "var(--vp-success)" : "var(--vp-muted)",
            background: activePackage ? "var(--vp-success-muted)" : "var(--vp-surface-raised)",
            borderColor: activePackage ? "var(--vp-success-border)" : "var(--vp-border)",
          }}
        >
          <ShieldCheck size={12} />
          {activePackage ? "Paquete activo" : "Sin paquete activo"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatBox label="Nodo" value={affiliateId ? `#${affiliateId}` : "—"} tone="text" />
        <StatBox label="Rango actual" value={rank || "Sin rango"} />
        <StatBox label="Profundidad" value={depth} />
        <StatBox label="Tu pierna" value={side} />
        <StatBox label="Padre binario" value={parent || "Raíz"} tone="text" />
        <StatBox label="Patrocinador" value={sponsor || "—"} tone="text" />
        <StatBox label="Puntos izquierda" value={number(rankProgress?.leftPoints)} tone="success" />
        <StatBox label="Puntos derecha" value={number(rankProgress?.rightPoints)} tone="success" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatBox label="Disponible" value={money(commissions?.available)} tone="success" />
        <StatBox label="En maduración" value={money(commissions?.maturing)} tone="accent" />
        <StatBox label="Retirable" value={money(commissions?.withdrawable)} tone="text" />
      </div>

      <div
        className="mt-3 rounded-xl border p-4"
        style={{ background: "var(--vp-bg)", borderColor: "var(--vp-border)" }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-bold" style={{ color: "var(--vp-text)" }}>
            <Trophy size={14} style={{ color: "var(--vp-accent)" }} />
            {!hasRankProgress ? "Puntos de rango no disponibles" : nextRank ? `Siguiente rango: ${nextRank.code}` : "Carrera de rangos completada"}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: "var(--vp-muted)" }}>
            Punto calificable: {hasRankProgress ? number(rankProgress?.qualifyingPoints) : "—"}
          </span>
        </div>
        <ProgressBar progress={hasRankProgress ? nextRank?.progressPct ?? 100 : 0} />
        <p className="m-0 mt-2 text-[11px]" style={{ color: "var(--vp-muted)" }}>
          {!hasRankProgress
            ? "La vista mlm.v_rank_progress no respondió. El árbol y la posición siguen disponibles."
            : nextRank
            ? `${number(nextRank.requiredPoints)} puntos requeridos por pierna. Bono de rango: ${money(nextRank.bonusUsd)}.`
            : "No hay un rango superior pendiente en el catálogo actual."}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LegRow label="Pierna izquierda" occupant={leftLeg} />
        <LegRow label="Pierna derecha" occupant={rightLeg} />
      </div>

      <div
        className="mt-3 flex flex-col gap-3 rounded-xl border p-3 md:flex-row md:items-center"
        style={{ background: "var(--vp-bg)", borderColor: "var(--vp-border)" }}
      >
        <MapPin size={15} className="shrink-0" style={{ color: "var(--vp-accent)" }} />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[10px] font-medium" style={{ color: "var(--vp-muted)" }}>
            Link de referido {referralCode ? `(${referralCode})` : ""}
          </p>
          <p className="m-0 truncate text-xs font-bold" style={{ color: referralLink ? "var(--vp-text)" : "var(--vp-muted)" }} title={referralLink || "Pendiente"}>
            {referralLink || "Pendiente de activación y ubicación en el árbol"}
          </p>
        </div>
        <button
          type="button"
          onClick={copyReferral}
          disabled={!referralLink}
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-bold disabled:opacity-60"
          style={{
            background: copied ? "var(--vp-accent)" : "var(--vp-surface-raised)",
            borderColor: copied ? "var(--vp-accent-strong)" : "var(--vp-border)",
            color: copied ? "#000000" : "var(--vp-text)",
            cursor: referralLink ? "pointer" : "default",
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </section>
  );
}
