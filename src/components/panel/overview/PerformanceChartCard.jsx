"use client";

import { useState } from "react";

const X = [44, 136, 228, 320, 412, 504, 596];
const BASELINE = 288;

function smoothPath(points) {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function areaPath(points) {
  const first = points[0];
  const last = points[points.length - 1];
  return `${smoothPath(points)} L ${last[0]} ${BASELINE} L ${first[0]} ${BASELINE} Z`;
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-xs font-medium" style={{ color: "var(--vp-muted)" }}>
        {label}
      </span>
    </span>
  );
}

export default function PerformanceChartCard({
  teamSeries = [162, 123, 176, 61, 131, 22, 120],
  personalSeries = [210, 154, 204, 235, 103, 212, 92],
  months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"],
  yLabels = ["$100M", "$75M", "$50M", "$25M", "$0"],
}) {
  const [range, setRange] = useState("monthly");
  const teamPoints = teamSeries.map((y, i) => [X[i], y]);
  const personalPoints = personalSeries.map((y, i) => [X[i], y]);
  const gridYs = [8, 78, 148, 218, 288];

  return (
    <section
      className="flex min-w-0 flex-1 flex-col gap-6 overflow-hidden rounded-3xl p-6"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-lg font-semibold" style={{ color: "var(--vp-text)" }}>
            Rendimiento de Negocio
          </h2>
          <p className="m-0 mt-1 text-xs font-light" style={{ color: "var(--vp-muted)" }}>
            Comparativa de volumen personal vs equipo (Últimos 7 meses)
          </p>
        </div>
        <div
          className="flex rounded-lg p-1"
          style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
        >
          {[
            ["monthly", "Mensual"],
            ["yearly", "Anual"],
          ].map(([id, label]) => (
            <button
              key={id}
              className="rounded-md px-3 py-1.5 text-xs font-medium"
              style={{
                background: range === id ? "var(--vp-surface)" : "transparent",
                border: 0,
                color: range === id ? "var(--vp-text)" : "var(--vp-muted)",
                cursor: "pointer",
              }}
              type="button"
              onClick={() => setRange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-5">
        <LegendDot color="var(--vp-accent)" label="Volumen de Equipo" />
        <LegendDot color="#4b5563" label="Volumen Personal" />
      </div>

      <svg
        aria-label="Gráfico de rendimiento de negocio"
        className="h-auto w-full"
        role="img"
        viewBox="0 0 620 320"
      >
        {gridYs.map((y, i) => (
          <g key={y}>
            <line stroke="var(--vp-border)" strokeWidth="1" x1="44" x2="596" y1={y} y2={y} />
            <text fill="var(--vp-muted)" fontSize="11" textAnchor="end" x="38" y={y + 4}>
              {yLabels[i]}
            </text>
          </g>
        ))}

        <path d={areaPath(personalPoints)} fill="url(#personalGradient)" />
        <path d={areaPath(teamPoints)} fill="url(#teamGradient)" />
        <path
          d={smoothPath(personalPoints)}
          fill="none"
          stroke="#4b5563"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d={smoothPath(teamPoints)}
          fill="none"
          stroke="var(--vp-accent)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />

        {personalPoints.map(([x, y]) => (
          <circle key={`p-${x}`} cx={x} cy={y} fill="var(--vp-surface)" r="3.5" stroke="#4b5563" strokeWidth="2" />
        ))}
        {teamPoints.map(([x, y]) => (
          <circle key={`t-${x}`} cx={x} cy={y} fill="var(--vp-surface)" r="4" stroke="var(--vp-accent)" strokeWidth="2" />
        ))}

        {months.map((month, i) => (
          <text key={month} fill="var(--vp-muted)" fontSize="12" textAnchor="middle" x={X[i]} y="310">
            {month}
          </text>
        ))}

        <defs>
          <linearGradient id="teamGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#facc15" stopOpacity="0.35" />
            <stop offset="1" stopColor="#facc15" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="personalGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#9ca3af" stopOpacity="0.15" />
            <stop offset="1" stopColor="#9ca3af" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </section>
  );
}
