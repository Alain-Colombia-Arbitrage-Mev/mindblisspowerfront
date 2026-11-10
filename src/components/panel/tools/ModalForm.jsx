"use client";

import { Calendar } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

const fieldStyle = {
  background: "var(--vp-surface)",
  border: "1px solid var(--vp-border)",
  color: "var(--vp-text)",
};

function Field({ field }) {
  if (field.type === "select") {
    return (
      <select
        aria-label={field.label}
        className="w-full appearance-none rounded-xl px-4 py-3 text-xs outline-none"
        defaultValue=""
        style={{ ...fieldStyle, color: "var(--vp-muted)" }}
      >
        <option value="" disabled>
          {field.label}
        </option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "date") {
    return (
      <label className="relative block">
        <span className="absolute left-4 top-1.5 text-[9px]" style={{ color: "var(--vp-subtle)" }}>
          {field.label}
        </span>
        <input
          className="w-full rounded-xl px-4 pb-2 pt-4 text-xs outline-none"
          placeholder="dd / mm / aaaa"
          style={{ ...fieldStyle, color: "var(--vp-accent)" }}
          type="text"
        />
        <Calendar
          size={12}
          style={{ color: "var(--vp-subtle)", position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)" }}
        />
      </label>
    );
  }
  if (field.type === "checkbox" || field.type === "toggle") {
    return (
      <label className="flex items-center gap-2 py-2 text-xs" style={{ color: "var(--vp-muted)" }}>
        <input
          className="h-4 w-4 rounded"
          defaultChecked={Boolean(field.default)}
          style={{ accentColor: "var(--vp-accent)" }}
          type="checkbox"
        />
        {field.label}
      </label>
    );
  }
  return (
    <input
      aria-label={field.label}
      className="w-full rounded-xl px-4 py-3 text-xs outline-none"
      placeholder={field.label}
      style={fieldStyle}
      type="text"
    />
  );
}

export default function ModalForm({ option, onClose }) {
  if (!option) return null;

  return (
    <Dialog.Root open={Boolean(option)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className={`fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%_-_2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[18px] border p-5 shadow-2xl sm:p-8 ${option.wide ? "max-w-2xl" : "max-w-md"}`}
          style={{ background: "var(--vp-shell)", borderColor: "var(--vp-border)", overscrollBehavior: "contain" }}
        >
        <Dialog.Title className="m-0 mb-1 text-lg font-bold uppercase tracking-wide" style={{ color: "var(--vp-accent)" }}>
          {option.label}
        </Dialog.Title>
        <Dialog.Description className="mb-5" style={{ color: "var(--vp-muted)" }}>Completa los campos y revisa la información antes de guardar.</Dialog.Description>
        <form
          className={option.wide ? "grid grid-cols-1 gap-4 md:grid-cols-2" : "space-y-4"}
          onSubmit={(event) => {
            event.preventDefault();
            onClose();
          }}
        >
          {option.fields.map((field) => (
            <div key={field.name} className={option.wide && !field.half ? "md:col-span-2" : undefined}>
              <Field field={field} />
            </div>
          ))}
          <div className={`flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end ${option.wide ? "md:col-span-2" : ""}`}>
            <button
              className="min-h-11 w-full rounded-xl border px-5 py-2.5 text-xs font-semibold sm:w-auto"
              style={{ background: "transparent", borderColor: "var(--vp-accent)", color: "var(--vp-accent)", cursor: "pointer" }}
              type="button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="min-h-11 w-full rounded-xl px-6 py-2.5 text-xs font-semibold sm:w-auto"
              style={{ background: "var(--vp-action)", color: "var(--vp-on-action)", border: 0, cursor: "pointer" }}
              type="submit"
            >
              Guardar
            </button>
          </div>
        </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
