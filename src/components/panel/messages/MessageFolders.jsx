"use client";

import { Inbox, Pen, Send, Star } from "lucide-react";

const FOLDER_ICONS = { inbox: Inbox, starred: Star, sent: Send };

export default function MessageFolders({ folders, activeFolder, onSelectFolder, onCompose }) {
  return (
    <div
      className="hidden w-64 shrink-0 flex-col gap-6 border-r p-4 lg:flex"
      style={{ borderColor: "var(--vp-border)", background: "var(--vp-shell)" }}
    >
      <button
        className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold"
        style={{ background: "var(--vp-accent)", color: "#000000", border: 0, cursor: "pointer" }}
        type="button"
        onClick={onCompose}
      >
        <Pen size={14} />
        Nuevo Mensaje
      </button>

      <nav className="flex flex-col gap-1">
        {folders.map((folder) => {
          const Icon = FOLDER_ICONS[folder.id] ?? Inbox;
          const active = folder.id === activeFolder;
          return (
            <button
              key={folder.id}
              className="flex h-[42px] w-full items-center justify-between rounded-lg px-3"
              style={{
                background: active ? "rgba(250, 204, 21, 0.1)" : "transparent",
                border: 0,
                cursor: "pointer",
              }}
              type="button"
              onClick={() => onSelectFolder?.(folder.id)}
            >
              <span className="flex items-center gap-3">
                <Icon size={16} style={{ color: active ? "var(--vp-accent)" : "var(--vp-muted)" }} />
                <span
                  className="text-sm"
                  style={{ color: active ? "var(--vp-accent)" : "var(--vp-muted)", fontWeight: active ? 500 : 400 }}
                >
                  {folder.label}
                </span>
              </span>
              {folder.count ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-bold"
                  style={{ background: "var(--vp-accent)", color: "#000000" }}
                >
                  {folder.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
