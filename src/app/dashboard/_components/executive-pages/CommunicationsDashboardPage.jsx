"use client";

import { useState } from "react";

import { Archive, Bell, Mail, Search, Send, Zap } from "lucide-react";

import { PageHeader, StatusPill, Field } from './executive-ui';

const messages = [
  {
    id: "msg-1",
    from: "Operaciones Mindbliss",
    subject: "Validacion de perfil",
    preview: "Tu informacion principal esta lista para revision interna.",
    time: "09:20",
    status: "Nuevo",
  },
  {
    id: "msg-2",
    from: "Soporte",
    subject: "Canal de atencion activo",
    preview: "Puedes abrir tickets desde el centro de comunicacion.",
    time: "Ayer",
    status: "Leido",
  },
];

const campaigns = [
  { name: "Actualizacion de plataforma", target: "Todos los miembros", sent: "0", read: "0%", status: "Borrador" },
  { name: "Recordatorio KYC", target: "Perfiles pendientes", sent: "0", read: "0%", status: "Programable" },
];

export function CommunicationsDashboardPage() {
  const [tab, setTab] = useState("messages");
  const [selectedMessage, setSelectedMessage] = useState(messages[0]);

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow="Comunicacion"
          title="Centro de mensajes"
          subtitle="Bandeja interna, noticias, tickets y comunicaciones de soporte en una sola superficie de trabajo."
          action={
            <button className="executive-button primary" type="button">
              <Send size={16} />
              Nuevo mensaje
            </button>
          }
        />

        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="executive-tabs" role="tablist" aria-label="Vistas de comunicacion">
            {[
              { id: "messages", label: "Mensajes", Icon: Mail },
              { id: "news", label: "Noticias", Icon: Bell },
              { id: "tickets", label: "Tickets", Icon: Archive },
              { id: "campaigns", label: "Campanas", Icon: Zap },
            ].map(({ id, label, Icon }) => (
              <button key={id} className="executive-tab" aria-selected={tab === id} type="button" onClick={() => setTab(id)}>
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search size={15} style={{ color: "var(--vp-muted)", left: 13, position: "absolute", top: "50%", transform: "translateY(-50%)" }} />
            <input className="executive-input leading-icon" placeholder="Buscar mensajes..." type="search" />
          </div>
        </div>

        {tab !== "campaigns" ? (
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="executive-panel p-0">
              <div className="border-b p-4" style={{ borderColor: "var(--vp-border)" }}>
                <p className="executive-card-label mb-0">Bandeja interna</p>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--vp-border)" }}>
                {messages.map((message) => (
                  <button
                    key={message.id}
                    className="block w-full p-4 text-left"
                    style={{
                      background: selectedMessage?.id === message.id ? "var(--vp-surface-raised)" : "transparent",
                      border: 0,
                      borderLeft: `3px solid ${selectedMessage?.id === message.id ? "var(--vp-accent)" : "transparent"}`,
                      cursor: "pointer",
                    }}
                    type="button"
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <strong className="text-sm" style={{ color: "var(--vp-text)" }}>
                        {message.from}
                      </strong>
                      <span className="text-xs" style={{ color: "var(--vp-muted)" }}>
                        {message.time}
                      </span>
                    </div>
                    <p className="m-0 text-sm font-semibold" style={{ color: "var(--vp-text-soft)" }}>
                      {message.subject}
                    </p>
                    <p className="m-0 mt-1 line-clamp-2 text-xs leading-5" style={{ color: "var(--vp-muted)" }}>
                      {message.preview}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="executive-panel">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="executive-card-label">Mensaje seleccionado</p>
                  <h2 className="m-0 text-2xl font-semibold" style={{ color: "var(--vp-text)" }}>
                    {selectedMessage?.subject}
                  </h2>
                </div>
                <StatusPill tone={selectedMessage?.status === "Nuevo" ? "warning" : "success"}>{selectedMessage?.status}</StatusPill>
              </div>
              <p className="text-sm leading-7" style={{ color: "var(--vp-muted)" }}>
                {selectedMessage?.preview} Este modulo queda preparado para conectarse al backend de comunicaciones y tickets, manteniendo la misma interfaz.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <Field label="Asunto">
                  <input className="executive-input" placeholder="Escribe el asunto" type="text" />
                </Field>
                <Field label="Destinatario">
                  <input className="executive-input" placeholder="Equipo o miembro" type="text" />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Respuesta">
                    <textarea className="executive-textarea" placeholder="Escribe una respuesta clara y accionable" />
                  </Field>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button className="executive-button primary" type="button">
                  <Send size={16} />
                  Enviar respuesta
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="executive-panel">
            <h2 className="executive-section-title">
              <Zap size={18} style={{ color: "var(--vp-accent)" }} />
              Comunicaciones masivas
            </h2>
            <div className="executive-table-wrap">
              <table className="executive-table">
                <thead>
                  <tr>
                    <th>Campana</th>
                    <th>Audiencia</th>
                    <th>Enviados</th>
                    <th>Lectura</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.name}>
                      <td>{campaign.name}</td>
                      <td>{campaign.target}</td>
                      <td>{campaign.sent}</td>
                      <td>{campaign.read}</td>
                      <td>
                        <StatusPill tone="warning">{campaign.status}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
