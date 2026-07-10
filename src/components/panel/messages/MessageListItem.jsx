"use client";

export default function MessageListItem({ message, active, onSelect }) {
  return (
    <button
      className="block w-full border-b p-4 text-left"
      style={{
        background: active ? "var(--vp-surface-raised)" : "transparent",
        border: 0,
        borderBottom: "1px solid var(--vp-border)",
        borderLeft: `3px solid ${active ? "var(--vp-accent)" : "transparent"}`,
        cursor: "pointer",
      }}
      type="button"
      onClick={() => onSelect?.(message)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
          {message.from}
        </span>
        <span className="shrink-0 text-[10px]" style={{ color: "var(--vp-muted)" }}>
          {message.time}
        </span>
      </div>
      <p className="m-0 mt-1 truncate text-xs font-medium" style={{ color: "var(--vp-muted)" }}>
        {message.subject}
      </p>
      <p
        className="m-0 mt-1 text-[11px] font-light leading-relaxed"
        style={{
          color: "rgba(156, 163, 175, 0.6)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {message.preview}
      </p>
    </button>
  );
}
