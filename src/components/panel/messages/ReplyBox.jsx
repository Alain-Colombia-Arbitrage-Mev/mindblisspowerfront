"use client";

import { useState } from "react";

export default function ReplyBox({ onSend }) {
  const [value, setValue] = useState("");

  const send = () => {
    const text = value.trim();
    if (!text) return;
    onSend?.(text);
    setValue("");
  };

  return (
    <div
      className="border-t p-4"
      style={{ borderColor: "var(--vp-border)", background: "rgba(10, 10, 10, 0.5)" }}
    >
      <div
        className="flex items-center gap-2 rounded-lg p-2"
        style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
      >
        <input
          aria-label="Respuesta rápida"
          className="w-full bg-transparent px-3 text-sm outline-none"
          placeholder="Escribe una respuesta rápida..."
          style={{ color: "var(--vp-text)" }}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send();
          }}
        />
        <button
          className="shrink-0 rounded-md px-4 py-1.5 text-xs font-semibold"
          style={{ background: "var(--vp-accent)", color: "#000000", border: 0, cursor: "pointer" }}
          type="button"
          onClick={send}
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
