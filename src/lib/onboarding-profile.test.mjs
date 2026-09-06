import assert from "node:assert/strict";
import test from "node:test";

import { mergeOnboardingIdentity, toBrowserOnboardingDraft } from "./onboarding-profile.js";

test("recovers an existing member from the verified session without a browser draft", () => {
  const result = mergeOnboardingIdentity({
    session: { authenticated: true, email: "Member@Example.com", name: "Member Name" },
    profile: { first_name: "Real", last_name: "Member", phone: "+573001112233", country: "Colombia" },
  });

  assert.equal(result.authenticated, true);
  assert.deepEqual(result.data, {
    email: "member@example.com",
    fullName: "Real Member",
    phone: "+573001112233",
    country: "Colombia",
  });
});

test("keeps a same-account registration draft and enriches it with backend data", () => {
  const result = mergeOnboardingIdentity({
    stored: { email: "member@example.com", city: "Bogotá", memberInterest: "community" },
    session: { authenticated: true, email: "member@example.com", name: "Member Name" },
    profile: { first_name: "Real", last_name: "Member" },
  });

  assert.equal(result.data.city, "Bogotá");
  assert.equal(result.data.memberInterest, "community");
  assert.equal(result.data.fullName, "Real Member");
});

test("discards a browser draft that belongs to another authenticated member", () => {
  const result = mergeOnboardingIdentity({
    stored: { email: "previous@example.com", phone: "+111", documentNumber: "sensitive" },
    session: { authenticated: true, email: "current@example.com", name: "Current Member" },
  });

  assert.deepEqual(result.data, {
    email: "current@example.com",
    fullName: "Current Member",
  });
});

test("preserves a new registration draft when there is no authenticated session", () => {
  const stored = { email: "new@example.com", fullName: "New Member", city: "Medellín" };
  const result = mergeOnboardingIdentity({ stored, session: { authenticated: false } });

  assert.equal(result.authenticated, false);
  assert.deepEqual(result.data, stored);
});

test("hydrates private onboarding fields from the authenticated backend", () => {
  const result = mergeOnboardingIdentity({
    stored: { email: "member@example.com", documentNumber: "stale-browser-value" },
    session: { authenticated: true, email: "member@example.com" },
    onboarding: {
      city: "Bogotá",
      document_type: "cc",
      document_number: "123456789",
      birth_date: "1990-06-15",
      address: "Carrera 1 # 2-3",
      support_needs: "Contacto en la tarde",
      accepts_privacy: true,
      accepts_communications: false,
    },
  });

  assert.equal(result.data.documentNumber, "123456789");
  assert.equal(result.data.birthDate, "1990-06-15");
  assert.equal(result.data.acceptsCommunications, false);
});

test("browser draft uses an allowlist and excludes private onboarding fields", () => {
  const safe = toBrowserOnboardingDraft({
    email: "member@example.com",
    fullName: "Member Example",
    city: "Bogotá",
    documentNumber: "123456789",
    birthDate: "1990-06-15",
    address: "Carrera 1 # 2-3",
    supportNeeds: "Salud",
    preferredLanguage: "es",
    futureSensitiveField: "must-not-leak",
  });

  assert.deepEqual(safe, {
    email: "member@example.com",
    fullName: "Member Example",
    phone: undefined,
    country: undefined,
    city: "Bogotá",
    documentType: undefined,
    preferredLanguage: "es",
    communicationChannel: undefined,
    memberInterest: undefined,
    acceptsPrivacy: undefined,
    acceptsCommunications: undefined,
  });
});
