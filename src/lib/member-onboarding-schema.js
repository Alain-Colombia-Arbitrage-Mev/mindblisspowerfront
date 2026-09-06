import { z } from "zod";

const optionalText = (max) => z.string().trim().max(max).default("");
const birthDate = z.string().trim().default("").refine((value) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;
  const now = new Date();
  const oldest = new Date(Date.UTC(now.getUTCFullYear() - 120, now.getUTCMonth(), now.getUTCDate()));
  return parsed <= now && parsed >= oldest;
}, "invalid_birth_date");

export const memberOnboardingSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(32),
  country: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(120),
  documentType: z.enum(["cc", "ce", "passport", "dni"]).default("cc"),
  documentNumber: optionalText(40).refine(
    (value) => !value || /^[\p{L}\p{N}][\p{L}\p{N} ./-]{2,39}$/u.test(value),
    "invalid_document"
  ),
  birthDate,
  address: optionalText(240),
  preferredLanguage: z.enum(["es", "en", "pt"]),
  communicationChannel: z.enum(["whatsapp", "email", "phone"]),
  memberInterest: z.enum(["wellbeing", "products", "community", "education"]),
  supportNeeds: optionalText(1000),
  acceptsPrivacy: z.literal(true),
  acceptsCommunications: z.boolean(),
}).strict();

export function toPaymentsOnboarding(body, email) {
  return {
    email,
    name: body.fullName,
    phone: body.phone,
    country: body.country,
    city: body.city,
    document_type: body.documentNumber ? body.documentType : "",
    document_number: body.documentNumber,
    birth_date: body.birthDate,
    address: body.address,
    preferred_language: body.preferredLanguage,
    communication_channel: body.communicationChannel,
    member_interest: body.memberInterest,
    support_needs: body.supportNeeds,
    accepts_privacy: body.acceptsPrivacy,
    accepts_communications: body.acceptsCommunications,
  };
}
