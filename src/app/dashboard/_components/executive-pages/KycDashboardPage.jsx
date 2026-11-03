"use client";

import { useMemo, useState } from "react";

import { Eye, Filter, IdCard, MapPin, Shield, UploadCloud, User } from "lucide-react";

import { PageHeader, StatusPill, Field } from './executive-ui';

import { member } from './member-defaults.mjs';

// Sin solicitudes simuladas: la lista real vendrá del backend KYC.
const kycRequests = [];

export function KycDashboardPage() {
  const [view, setView] = useState("personal");

  const progress = useMemo(() => (view === "personal" ? 45 : 20), [view]);

  return (
    <section className="executive-page">
      <div className="executive-container">
        <PageHeader
          eyebrow="Cumplimiento"
          title="KYC"
          subtitle="Verificacion de identidad con datos personales, documento y direccion. La experiencia queda preparada para conectarse al backend de aprobaciones."
          action={
            <button className="executive-button primary" type="button">
              <UploadCloud size={16} />
              Subir documento
            </button>
          }
        />

        <div className="mb-6 executive-tabs" role="tablist" aria-label="Vistas KYC">
          {[
            { id: "personal", label: "Mi verificacion", Icon: IdCard },
            { id: "manage", label: "Solicitudes", Icon: Filter },
          ].map(({ id, label, Icon }) => (
            <button key={id} className="executive-tab" aria-selected={view === id} type="button" onClick={() => setView(id)}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {view === "personal" ? (
          <div className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
            <div className="executive-panel">
              <h2 className="executive-section-title">
                <Shield size={18} style={{ color: "var(--vp-accent)" }} />
                Estado de verificacion
              </h2>
              <div className="mb-4 flex items-center justify-between">
                <StatusPill tone="warning">Pendiente</StatusPill>
                <span className="text-sm font-bold" style={{ color: "var(--vp-text)" }}>
                  {progress}%
                </span>
              </div>
              <div className="executive-progress">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-5 text-sm leading-7" style={{ color: "var(--vp-muted)" }}>
                Completa datos personales, documento y prueba de residencia. La revision se enfoca en identidad, seguridad y cumplimiento.
              </p>
            </div>

            <div className="executive-panel">
              <h2 className="executive-section-title">
                <User size={18} style={{ color: "var(--vp-accent)" }} />
                Datos personales
              </h2>
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Nombre legal">
                  <input className="executive-input" defaultValue={member.name} />
                </Field>
                <Field label="Documento">
                  <input className="executive-input" placeholder="Numero de documento" />
                </Field>
                <Field label="Fecha de nacimiento">
                  <input className="executive-input" type="date" />
                </Field>
                <Field label="Pais">
                  <input className="executive-input" defaultValue={member.country} />
                </Field>
                <Field label="Telefono">
                  <input className="executive-input" defaultValue={member.phone} />
                </Field>
                <Field label="Correo">
                  <input className="executive-input" defaultValue={member.email} readOnly />
                </Field>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="executive-upload">
                  <UploadCloud size={24} style={{ color: "var(--vp-accent)" }} />
                  <strong style={{ color: "var(--vp-text)" }}>Documento de identidad</strong>
                  <span className="text-sm">Frente y reverso en buena calidad.</span>
                </div>
                <div className="executive-upload">
                  <MapPin size={24} style={{ color: "var(--vp-accent)" }} />
                  <strong style={{ color: "var(--vp-text)" }}>Prueba de direccion</strong>
                  <span className="text-sm">Factura o extracto reciente.</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="executive-panel">
            <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <h2 className="executive-section-title mb-0">
                <IdCard size={18} style={{ color: "var(--vp-accent)" }} />
                Solicitudes KYC
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <input className="executive-input" placeholder="Nombre" />
                <select className="executive-select" defaultValue="">
                  <option value="">Estado</option>
                  <option value="pending">Pendiente</option>
                  <option value="approved">Aprobado</option>
                </select>
                <button className="executive-button primary" type="button">
                  Buscar
                </button>
              </div>
            </div>
            <div className="executive-table-wrap">
              <table className="executive-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Pais</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {kycRequests.map((request) => (
                    <tr key={`${request.name}-${request.type}`}>
                      <td>{request.name}</td>
                      <td>{request.type}</td>
                      <td>{request.country}</td>
                      <td>{request.date}</td>
                      <td>
                        <StatusPill tone={request.status === "Pendiente" ? "warning" : "info"}>{request.status}</StatusPill>
                      </td>
                      <td>
                        <button className="executive-button ghost" type="button">
                          <Eye size={15} />
                          Revisar
                        </button>
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
