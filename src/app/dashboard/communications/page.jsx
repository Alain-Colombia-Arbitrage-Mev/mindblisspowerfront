"use client";

import { useState } from "react";

import MessageFolders from "@/components/panel/messages/MessageFolders";
import MessageList from "@/components/panel/messages/MessageList";
import MessageReader from "@/components/panel/messages/MessageReader";

const MESSAGES = [
  {
    id: 1,
    folder: "inbox",
    from: "Soporte Técnico",
    fromEmail: "admin@mindbliss.com",
    to: "joseoperator",
    time: "10:45 AM",
    date: "Hoy, 10:45 AM",
    subject: "Actualización de sistema",
    preview: "Hola José, te informamos que el sistema estará en mantenimiento esta noche...",
    body: [
      "Estimado José,",
      "Te informamos que el día de hoy realizaremos un mantenimiento programado en los servidores para mejorar la velocidad.",
      "Saludos cordiales,\nEl equipo de Mindbliss Power",
    ],
  },
];

const FOLDERS = [
  { id: "inbox", label: "Recibidos", count: 3 },
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
