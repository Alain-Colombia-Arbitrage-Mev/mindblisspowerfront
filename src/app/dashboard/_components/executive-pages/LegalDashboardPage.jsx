"use client";

import { BookOpen, CheckCircle2, Download, FileText, Shield } from "lucide-react";

import { ExecutiveModulePage } from './executive-ui';

const moduleConfigs = {
legal: {
    eyebrow: "Legal",
    title: "Centro legal",
    subtitle: "Documentos, politicas y confirmaciones necesarias para operar con claridad dentro de Mindbliss Power.",
    action: { label: "Descargar resumen", href: "#", icon: Download },
    metrics: [
      { label: "Documentos", value: "6", detail: "disponibles", icon: FileText, tone: "accent" },
      { label: "Aceptados", value: "0", detail: "pendiente backend", icon: CheckCircle2, tone: "muted" },
      { label: "KYC/AML", value: "Pendiente", detail: "cumplimiento", icon: Shield, tone: "warning" },
      { label: "Version", value: "2026", detail: "vigente", icon: BookOpen, tone: "info" },
    ],
    cards: [
      { title: "Terminos", text: "Condiciones generales de uso de la plataforma y servicios.", icon: FileText, status: "Disponible" },
      { title: "Privacidad", text: "Tratamiento de datos personales y manejo de informacion sensible.", icon: Shield, status: "Disponible" },
      { title: "Riesgos", text: "Declaraciones y aceptaciones necesarias antes de operaciones financieras.", icon: BookOpen, status: "Revisar" },
    ],
    tableTitle: "Documentos",
    tableIcon: FileText,
    columns: ["Documento", "Tipo", "Estado", "Accion"],
    rows: [
      ["Terminos y condiciones", "Legal", "Disponible", "Leer"],
      ["Politica de privacidad", "Datos", "Disponible", "Leer"],
      ["AML / KYC", "Cumplimiento", "Disponible", "Leer"],
    ],
  }
};

export function LegalDashboardPage() {
  return <ExecutiveModulePage config={moduleConfigs.legal} />;
}
