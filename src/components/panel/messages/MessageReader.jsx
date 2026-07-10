"use client";

import ReplyBox from "./ReplyBox";

function initialsOf(name) {
  return (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function MessageReader({ message, onSendReply }) {
  if (!message) {
    return (
      <div className="flex flex-1 items-center justify-center" style={{ background: "var(--vp-surface)" }}>
        <p className="text-sm" style={{ color: "var(--vp-muted)" }}>
          Selecciona un mensaje para leerlo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col" style={{ background: "var(--vp-surface)" }}>
      <div className="flex flex-col gap-4 border-b p-6" style={{ borderColor: "var(--vp-border)" }}>
        <h2 className="m-0 text-xl font-semibold" style={{ color: "var(--vp-text)" }}>
          {message.subject}
        </h2>
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
            style={{
              color: "#3b82f6",
              background: "rgba(37, 99, 235, 0.2)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            {initialsOf(message.from)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium" style={{ color: "var(--vp-text)" }}>
                {message.from}
              </span>
              {message.fromEmail ? (
                <span className="text-xs font-light" style={{ color: "var(--vp-muted)" }}>
                  &lt;{message.fromEmail}&gt;
                </span>
              ) : null}
            </div>
            <p className="m-0 mt-0.5 text-xs" style={{ color: "var(--vp-muted)" }}>
              Para: {message.to} • {message.date}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-8">
        {message.body.map((paragraph, index) => (
          <p
            key={index}
            className="m-0 whitespace-pre-line text-sm font-light leading-relaxed"
            style={{ color: "var(--vp-text-soft)" }}
          >
            {paragraph}
          </p>
        ))}
      </div>

      <ReplyBox onSend={onSendReply} />
    </div>
  );
}
