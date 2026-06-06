"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const navItems = [
  { href: "/login", label: "Acceso" },
  { href: "/register", label: "Registro" },
  { href: "/onboarding", label: "Bienvenida" },
];

/**
 * Editorial two-column auth layout.
 * Left: full-height B&W brand photograph with copy overlay.
 * Right: scrollable form column.
 * Always dark ("auth-mono") — auth pages are the brand moment.
 */
export default function AuthShell({
  activePath,
  eyebrow,
  title,
  description,
  children,
  sideKpis = [],
  visualSrc = "/mindbliss/mindbliss-02.avif",
  visualAlt = "",
  visualPosition = "center",
}) {
  return (
    <main className="auth-mono min-h-dvh lg:grid lg:grid-cols-[minmax(420px,46%)_minmax(0,1fr)]">
      {/* ── Photo panel ─────────────────────────────────────────── */}
      <aside className="auth-grain relative flex min-h-[300px] flex-col justify-between overflow-hidden p-6 sm:min-h-[360px] sm:p-8 lg:sticky lg:top-0 lg:h-dvh lg:p-10">
        <img
          src={visualSrc}
          alt={visualAlt}
          loading="eager"
          className="auth-photo absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: visualPosition }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(6,6,7,0.94) 0%, rgba(6,6,7,0.46) 46%, rgba(6,6,7,0.22) 100%)",
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="auth-rise inline-flex items-baseline gap-2" style={{ animationDelay: "0ms" }}>
            <span className="auth-display text-lg leading-none" style={{ color: "var(--vp-text)" }}>
              Mindbliss
            </span>
            <span className="auth-display text-lg leading-none" style={{ color: "var(--vp-accent)" }}>
              Power
            </span>
          </Link>
          <Link
            href="/"
            className="auth-rise inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] transition hover:opacity-80"
            style={{ color: "var(--vp-muted)", animationDelay: "60ms" }}
          >
            Inicio
            <ArrowUpRight size={13} />
          </Link>
        </div>

        <div className="relative z-10">
          <div
            className="auth-rise mb-4 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em]"
            style={{ color: "var(--vp-accent)", animationDelay: "120ms" }}
          >
            <span className="inline-block h-2 w-2" style={{ background: "var(--vp-accent)" }} />
            {eyebrow}
          </div>

          <h1
            className="auth-display auth-rise max-w-xl text-4xl leading-[0.98] sm:text-5xl lg:text-6xl"
            style={{ color: "var(--vp-text)", animationDelay: "180ms" }}
          >
            {title}
          </h1>

          {description && (
            <p
              className="auth-rise mt-5 hidden max-w-md text-sm leading-7 sm:block"
              style={{ color: "var(--vp-text-soft)", animationDelay: "240ms" }}
            >
              {description}
            </p>
          )}

          {sideKpis.length > 0 && (
            <div
              className="auth-rise mt-7 hidden border-t pt-5 sm:flex"
              style={{ borderColor: "rgba(247,247,244,0.18)", animationDelay: "300ms" }}
            >
              {sideKpis.map((item, index) => (
                <div
                  key={item.label}
                  className={index === 0 ? "pr-6" : "border-l px-6"}
                  style={index === 0 ? undefined : { borderColor: "rgba(247,247,244,0.18)" }}
                >
                  <div className="auth-display text-2xl" style={{ color: "var(--vp-accent)" }}>
                    {item.value}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--vp-muted)" }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Form column ─────────────────────────────────────────── */}
      <section className="relative flex min-h-[60dvh] flex-col lg:min-h-dvh">
        <nav className="flex items-center gap-6 px-6 pt-6 sm:px-10 lg:px-14">
          {navItems.map((item) => {
            const active = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="border-b-2 pb-2 text-[11px] font-black uppercase tracking-[0.2em] transition"
                style={{
                  color: active ? "var(--vp-text)" : "var(--vp-subtle)",
                  borderColor: active ? "var(--vp-accent)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-start justify-center px-5 py-8 sm:px-10 sm:py-10 lg:items-center lg:px-14">
          <div className="auth-rise w-full max-w-[560px]" style={{ animationDelay: "200ms" }}>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
