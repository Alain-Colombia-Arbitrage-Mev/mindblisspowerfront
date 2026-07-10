"use client";

import { Landmark, X } from "lucide-react";

export default function NewsPreviewCard({ news, onClose }) {
  if (!news) return null;

  return (
    <aside
      className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl xl:w-96"
      style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--vp-border)", background: "rgba(10, 10, 10, 0.5)" }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--vp-accent)" }}>
          New Preview
        </span>
        <button
          aria-label="Cerrar vista previa"
          style={{ background: "transparent", border: 0, cursor: "pointer", padding: 0 }}
          type="button"
          onClick={onClose}
        >
          <X size={14} style={{ color: "var(--vp-muted)" }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ background: "var(--vp-shell)" }}>
        <article
          className="rounded-lg p-6"
          style={{ background: "var(--vp-surface-raised)", border: "1px solid var(--vp-border)" }}
        >
          <h3
            className="m-0 text-center text-base font-bold leading-tight"
            style={{ color: "var(--vp-text)" }}
          >
            {news.title}
          </h3>
          <p className="m-0 mt-2 text-[10px]" style={{ color: "var(--vp-muted)" }}>
            {news.dateline}
          </p>

          <div
            className="mt-4 flex h-24 items-center justify-center rounded"
            style={{ background: "linear-gradient(180deg, #1e3a8a, #000000)" }}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "rgba(255, 255, 255, 0.1)" }}
            >
              <Landmark size={22} style={{ color: "#ffffff" }} />
            </span>
          </div>

          <p
            className="m-0 mt-4 text-center text-[11px] font-bold uppercase"
            style={{ color: "var(--vp-text)" }}
          >
            {news.headline}
          </p>

          <p className="m-0 mt-4 text-[10px] leading-relaxed" style={{ color: "var(--vp-text-soft)" }}>
            {news.intro}
          </p>

          {news.details?.length ? (
            <dl
              className="mt-3 flex flex-col gap-1 rounded p-3"
              style={{ background: "var(--vp-bg)", border: "1px solid var(--vp-border)" }}
            >
              {news.details.map((detail) => (
                <div key={detail.label} className="flex gap-1 text-[10px]">
                  <dt className="m-0 font-bold" style={{ color: "var(--vp-accent)" }}>
                    {detail.label}:
                  </dt>
                  <dd className="m-0" style={{ color: "var(--vp-text-soft)" }}>
                    {detail.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {news.outro ? (
            <p className="m-0 mt-3 text-[10px] leading-relaxed" style={{ color: "var(--vp-text-soft)" }}>
              {news.outro}
            </p>
          ) : null}
        </article>
      </div>
    </aside>
  );
}
