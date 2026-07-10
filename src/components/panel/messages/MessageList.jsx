"use client";

import { Filter } from "lucide-react";
import MessageListItem from "./MessageListItem";

export default function MessageList({ title, messages, selectedId, onSelect }) {
  return (
    <div
      className="flex w-full shrink-0 flex-col border-r md:w-80"
      style={{ borderColor: "var(--vp-border)", background: "rgba(10, 10, 10, 0.5)" }}
    >
      <div
        className="flex h-[52px] shrink-0 items-center justify-between border-b px-4"
        style={{ borderColor: "var(--vp-border)", background: "var(--vp-surface)" }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--vp-text)" }}>
          {title}
        </span>
        <Filter size={13} style={{ color: "var(--vp-muted)" }} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => (
          <MessageListItem
            key={message.id}
            message={message}
            active={message.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
