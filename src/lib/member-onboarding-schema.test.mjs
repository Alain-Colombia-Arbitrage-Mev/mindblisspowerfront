import assert from "node:assert/strict";
import test from "node:test";

import { memberOnboardingSchema, toPaymentsOnboarding } from "./member-onboarding-schema.js";

const valid = {
  fullName: "Miembro Ejemplo",
  phone: "+573001112233",
  country: "Colombia",
  city: "Bogotá",
  documentType: "cc",
  documentNumber: "123456789",
  birthDate: "1990-06-15",
  address: "Carrera 1 # 2-3",
  preferredLanguage: "es",
  communicationChannel: "whatsapp",
  memberInterest: "community",
  supportNeeds: "Contacto en la tarde",
  acceptsPrivacy: true,
  acceptsCommunications: true,
};

test("memberOnboardingSchema accepts and trims a valid profile", () => {
  const parsed = memberOnboardingSchema.parse({ ...valid, fullName: "  Miembro Ejemplo  " });
  assert.equal(parsed.fullName, "Miembro Ejemplo");
});

test("memberOnboardingSchema rejects unknown fields and missing privacy consent", () => {
  assert.equal(memberOnboardingSchema.safeParse({ ...valid, email: "spoof@example.com" }).success, false);
  assert.equal(memberOnboardingSchema.safeParse({ ...valid, acceptsPrivacy: false }).success, false);
});

test("memberOnboardingSchema rejects future dates and document metacharacters", () => {
  assert.equal(memberOnboardingSchema.safeParse({ ...valid, birthDate: "2999-01-01" }).success, false);
  assert.equal(memberOnboardingSchema.safeParse({ ...valid, documentNumber: "123<script>" }).success, false);
});

test("toPaymentsOnboarding takes identity from the verified session", () => {
  const payload = toPaymentsOnboarding(valid, "verified@example.com");
  assert.equal(payload.email, "verified@example.com");
  assert.equal(payload.document_number, valid.documentNumber);
  assert.equal("fullName" in payload, false);
});
