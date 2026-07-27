"use client";

import { useState } from "react";

import MessageFolders from "@/components/panel/messages/MessageFolders";
import MessageList from "@/components/panel/messages/MessageList";
import MessageReader from "@/components/panel/messages/MessageReader";

// Sin mensajería real todavía: bandeja vacía (no mensajes mock) y sin caja de
// "responder" (MessageReader oculta el ReplyBox cuando no hay mensaje seleccionado).
const MESSAGES = [];

const FOLDERS = [
  { id: "inbox", label: "Recibidos", count: 0 },
  { id: "starred", label: "Destacados" },
  { id: "sent", label: "Enviados" },
];

const FOLDER_TITLES = { inbox: "Recibidos", starred: "Destacados", sent: "Enviados" };

export default function CommunicationsPage() {
  const [folder, setFolder] = useState("inbox");
  const [selectedId, setSelectedId] = useState(MESSAGES[0]?.id ?? null);

  const visibleMessages = MESSAGES.filter((message) => message.folder === folder);
  const selectedMessage = visibleMessages.find((message) => message.id === selectedId) ?? visibleMessages[0] ?? null;

  return (
    <div className="h-full p-6">
      <div
        className="flex h-full overflow-hidden rounded-2xl"
        style={{ background: "var(--vp-surface)", border: "1px solid var(--vp-border)" }}
      >
        <MessageFolders
          folders={FOLDERS}
          activeFolder={folder}
          onSelectFolder={(next) => {
            setFolder(next);
            setSelectedId(null);
          }}
        />
        <MessageList
          title={FOLDER_TITLES[folder]}
          messages={visibleMessages}
          selectedId={selectedMessage?.id ?? null}
          onSelect={(message) => setSelectedId(message.id)}
        />
        <MessageReader message={selectedMessage} />
      </div>
    </div>
  );
}
