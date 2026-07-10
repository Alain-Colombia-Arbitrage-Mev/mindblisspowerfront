import { CreditCard, FileText, Home, User } from "lucide-react";

export const KYC_DOC_TYPES = [
  {
    id: "identity_card",
    icon: CreditCard,
    title: "Documento de Identidad",
    description: "INE, cédula o documento nacional vigente (frente y reverso en un solo archivo).",
  },
  {
    id: "passport",
    icon: FileText,
    title: "Pasaporte",
    description: "Página principal con fotografía y datos, vigente.",
  },
  {
    id: "proof_address",
    icon: Home,
    title: "Comprobante de Domicilio",
    description: "Recibo de servicios o estado de cuenta con menos de 3 meses.",
  },
  {
    id: "selfie",
    icon: User,
    title: "Selfie con Documento",
    description: "Fotografía tuya sosteniendo el documento de identidad.",
  },
];

export const KYC_ACCEPTED_MIMES = ["application/pdf", "image/jpeg", "image/png"];
export const KYC_MAX_SIZE_BYTES = 15 * 1024 * 1024; // debe coincidir con el backend

export const KYC_STATUS_LABELS = {
  not_started: { label: "Sin iniciar", tone: "gray" },
  in_review: { label: "En revisión", tone: "amber" },
  approved: { label: "Aprobado", tone: "green" },
  rejected: { label: "Rechazado", tone: "red" },
  expired: { label: "Expirado", tone: "red" },
  pending_upload: { label: "Subida incompleta", tone: "gray" },
};
