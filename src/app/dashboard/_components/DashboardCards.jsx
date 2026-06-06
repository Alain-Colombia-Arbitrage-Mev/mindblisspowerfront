import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BadgeDollarSign,
  BrainCircuit,
  Crown,
  Network,
  RadioTower,
  Users,
} from "lucide-react";

import ReferralCopyButton from "./ReferralCopyButton";

export function PageTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#667085]">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-normal text-[#101828]">{title}</h2>
      {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">{description}</p>}
    </div>
  );
}

export function MetricCard({ label, value, detail, icon: Icon = Activity, tone = "blue" }) {
  const tones = {
    blue: "bg-[#e9f1ff] text-[#1d4ed8]",
    green: "bg-[#e7f8f3] text-[#0f8f78]",
    amber: "bg-[#fff3cf] text-[#9a6700]",
    rose: "bg-[#ffe8e8] text-[#c2413b]",
    dark: "bg-[#eef2f7] text-[#344054]",
  };

  return (
    <section className="rounded-lg border border-[#d8dee9] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#667085]">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-[#101828]">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {detail && <p className="mt-3 text-xs leading-5 text-[#667085]">{detail}</p>}
    </section>
  );
}

export function ReferralPanel({ code }) {
  return (
    <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#667085]">Codigo de referidos</p>
          <p className="mt-2 break-all font-mono text-xl font-semibold text-[#101828]">{code}</p>
        </div>
        <ReferralCopyButton value={code} />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {["Link personal", "Derrame preferente", "Tracking activo"].map((item) => (
          <div key={item} className="rounded-md bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-[#475467]">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

export function LegBalance({ network }) {
  const leftWidth = Math.max(network.leftLeg.members, 1);
  const rightWidth = Math.max(network.rightLeg.members, 1);
  const total = leftWidth + rightWidth;
  const leftPercent = Math.round((leftWidth / total) * 100);
  const rightPercent = 100 - leftPercent;

  return (
    <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#101828]">Balance binario</p>
          <p className="mt-1 text-sm text-[#667085]">
            Pierna debil: {network.weakLeg.side === "left" ? "izquierda" : "derecha"}
          </p>
        </div>
        <Network className="h-5 w-5 text-[#1d4ed8]" />
      </div>

      <div className="mt-5 overflow-hidden rounded-md bg-[#eef2f7]">
        <div className="flex h-3">
          <div className="bg-[#21c7a8]" style={{ width: `${leftPercent}%` }} />
          <div className="bg-[#4f7df3]" style={{ width: `${rightPercent}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <LegStat label="Izquierda" members={network.leftLeg.members} volume={network.leftLeg.volume} icon={ArrowDownLeft} />
        <LegStat label="Derecha" members={network.rightLeg.members} volume={network.rightLeg.volume} icon={ArrowUpRight} />
      </div>
    </section>
  );
}

export function NetworkTreePreview({ members }) {
  const left = members.filter((member) => member.side === "left").slice(0, 4);
  const right = members.filter((member) => member.side === "right").slice(0, 4);

  return (
    <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#101828]">Mapa operativo</p>
          <p className="mt-1 text-sm text-[#667085]">Primeras lineas visibles por pierna</p>
        </div>
        <RadioTower className="h-5 w-5 text-[#0f8f78]" />
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr]">
        <NodeColumn title="Izquierda" members={left} align="right" />
        <div className="flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-[#d8dee9] bg-[#101828] text-center text-xs font-semibold text-white">
            Corona
          </div>
        </div>
        <NodeColumn title="Derecha" members={right} />
      </div>
    </section>
  );
}

export function InsightList({ insights }) {
  return (
    <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#101828]">Analisis de red</p>
          <p className="mt-1 text-sm text-[#667085]">Salida preparada para LLM</p>
        </div>
        <BrainCircuit className="h-5 w-5 text-[#7c3aed]" />
      </div>
      <div className="space-y-3">
        {insights.map((insight) => (
          <div key={insight.title} className="rounded-md border border-[#e5e7eb] p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${insight.severity === "alta" ? "text-[#c2413b]" : "text-[#d97706]"}`} />
              <p className="text-sm font-semibold text-[#101828]">{insight.title}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#667085]">{insight.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RankBars({ rankMix }) {
  const entries = Object.entries(rankMix);
  const max = Math.max(...entries.map(([, count]) => count), 1);

  return (
    <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#101828]">Rangos en la red</p>
        <Crown className="h-5 w-5 text-[#d97706]" />
      </div>
      <div className="space-y-3">
        {entries.map(([rank, count]) => (
          <div key={rank}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-[#344054]">{rank}</span>
              <span className="text-[#667085]">{count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-md bg-[#eef2f7]">
              <div className="h-full rounded-md bg-[#f59e0b]" style={{ width: `${Math.round((count / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TeamTable({ members, title = "Equipo Pro" }) {
  return (
    <section className="rounded-lg border border-[#d8dee9] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] p-5">
        <p className="text-sm font-semibold text-[#101828]">{title}</p>
        <Users className="h-5 w-5 text-[#1d4ed8]" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#667085]">
            <tr>
              <th className="px-5 py-3">Miembro</th>
              <th className="px-5 py-3">Rango</th>
              <th className="px-5 py-3">Pierna</th>
              <th className="px-5 py-3">Actividad</th>
              <th className="px-5 py-3">Prioridad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-5 py-4 font-medium text-[#101828]">{member.name}</td>
                <td className="px-5 py-4 text-[#475467]">{member.rank}</td>
                <td className="px-5 py-4 text-[#475467]">{member.side === "left" ? "Izquierda" : "Derecha"}</td>
                <td className="px-5 py-4">
                  <StatusPill value={member.activityLevel || member.status} />
                </td>
                <td className="px-5 py-4">
                  <StatusPill value={member.priority || "normal"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ActivityTable({ rows }) {
  return (
    <section className="rounded-lg border border-[#d8dee9] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] p-5">
        <p className="text-sm font-semibold text-[#101828]">Reporte de actividad</p>
        <Activity className="h-5 w-5 text-[#0f8f78]" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#667085]">
            <tr>
              <th className="px-5 py-3">Miembro</th>
              <th className="px-5 py-3">Rango</th>
              <th className="px-5 py-3">Pierna</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3">Ultimo movimiento</th>
              <th className="px-5 py-3">Prioridad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-5 py-4 font-medium text-[#101828]">{row.name}</td>
                <td className="px-5 py-4 text-[#475467]">{row.rank}</td>
                <td className="px-5 py-4 text-[#475467]">{row.side === "left" ? "Izquierda" : "Derecha"}</td>
                <td className="px-5 py-4">
                  <StatusPill value={row.status} />
                </td>
                <td className="px-5 py-4 text-[#475467]">{row.lastMovement}</td>
                <td className="px-5 py-4">
                  <StatusPill value={row.priority} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function LLMContextPanel({ context }) {
  return (
    <section className="rounded-lg border border-[#d8dee9] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#101828]">Contexto LLM</p>
        <BrainCircuit className="h-5 w-5 text-[#7c3aed]" />
      </div>
      <pre className="max-h-[420px] overflow-auto rounded-md bg-[#101828] p-4 text-xs leading-6 text-[#d1d5db]">
        {JSON.stringify(context, null, 2)}
      </pre>
    </section>
  );
}

export function MetricsGrid({ network }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Miembros de red" value={network.totalMembers} detail={`${network.activeMembers} activos`} icon={Users} tone="blue" />
      <MetricCard label="Pierna debil" value={network.weakLeg.side === "left" ? "Izquierda" : "Derecha"} detail={`${network.weakLeg.members} miembros`} icon={ArrowDownLeft} tone="amber" />
      <MetricCard label="Actividad" value={`${network.activeRate}%`} detail={`${network.highPriorityMembers} en seguimiento alto`} icon={Activity} tone="green" />
      <MetricCard label="Fondo empresa" value={`$${network.companyFundEstimate.toLocaleString("en-US")}`} detail="Estimado sobre bonos de red" icon={BadgeDollarSign} tone="rose" />
    </div>
  );
}

function LegStat({ label, members, volume, icon: Icon }) {
  return (
    <div className="rounded-md border border-[#e5e7eb] p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#475467]" />
        <p className="text-sm font-semibold text-[#101828]">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-[#101828]">{members}</p>
      <p className="text-xs text-[#667085]">Volumen: ${volume.toLocaleString("en-US")}</p>
    </div>
  );
}

function NodeColumn({ title, members, align = "left" }) {
  return (
    <div>
      <p className={`mb-3 text-xs font-semibold uppercase tracking-wide text-[#667085] ${align === "right" ? "text-right" : ""}`}>{title}</p>
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className={`rounded-md border border-[#e5e7eb] bg-[#f8fafc] p-3 ${align === "right" ? "text-right" : ""}`}
          >
            <p className="truncate text-sm font-semibold text-[#101828]">{member.name}</p>
            <p className="mt-1 text-xs text-[#667085]">{member.rank} · {member.activityLevel}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ value }) {
  const normalized = String(value || "normal").toLowerCase();
  const tone = normalized === "alta" || normalized === "inactivo"
    ? "bg-[#ffe8e8] text-[#c2413b]"
    : normalized === "media" || normalized === "baja"
      ? "bg-[#fff3cf] text-[#9a6700]"
      : "bg-[#e7f8f3] text-[#0f8f78]";

  return <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${tone}`}>{value}</span>;
}
