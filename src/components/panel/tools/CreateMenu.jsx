"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CreateMenu({ options, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
        style={{ background: "var(--vp-accent)", color: "#000000", border: 0, cursor: "pointer" }}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        Create
        <ChevronDown size={10} />
      </button>
      {open ? (
        <div
          className="absolute right-0 z-30 mt-2 w-56 rounded-xl border py-1 shadow-2xl"
          style={{ background: "var(--vp-surface)", borderColor: "var(--vp-border)" }}
        >
          {options.map((option) => (
            <button
              key={option.id}
              className="block w-full px-4 py-2.5 text-left text-xs"
              style={{ background: "transparent", border: 0, color: "var(--vp-text-soft)", cursor: "pointer" }}
              type="button"
              onClick={() => {
                setOpen(false);
                onSelect(option);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
