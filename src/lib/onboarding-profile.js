/**
 * @typedef {Object} OnboardingDraft
 * @property {string} [email]
 * @property {string} [fullName]
 * @property {string} [phone]
 * @property {string} [country]
 * @property {string} [city]
 * @property {string} [documentType]
 * @property {string} [documentNumber]
 * @property {string} [birthDate]
 * @property {string} [address]
 * @property {string} [preferredLanguage]
 * @property {string} [communicationChannel]
 * @property {string} [memberInterest]
 * @property {string} [supportNeeds]
 * @property {boolean} [acceptsPrivacy]
 * @property {boolean} [acceptsCommunications]
 */

function clean(value) {
  return String(value || "").trim();
}

export function normalizeOnboardingEmail(value) {
  return clean(value).toLowerCase();
}

/**
 * Mezcla el borrador del navegador con la identidad verificada del servidor.
 * Si hay sesión, el email de Cognito es autoritativo y nunca reutilizamos datos
 * locales pertenecientes a otra cuenta que haya usado el mismo dispositivo.
 * @param {{stored?: OnboardingDraft, session?: {email?: string, authenticated?: boolean, name?: string}, profile?: {first_name?: string, last_name?: string, phone?: string, country?: string}, onboarding?: {city?: string, document_type?: string, document_number?: string, birth_date?: string, address?: string, preferred_language?: string, communication_channel?: string, member_interest?: string, support_needs?: string, accepts_privacy?: boolean, accepts_communications?: boolean}}} [identity]
 */
export function mergeOnboardingIdentity({ stored = {}, session = {}, profile = {}, onboarding = {} } = {}) {
  const sessionEmail = normalizeOnboardingEmail(session.email);
  const storedEmail = normalizeOnboardingEmail(stored.email);
  const authenticated = Boolean(session.authenticated && sessionEmail);
  const sameAccountDraft = !authenticated || storedEmail === sessionEmail;
  /** @type {OnboardingDraft} */
  const merged = sameAccountDraft ? { ...stored } : {};

  if (!authenticated) {
    return { authenticated: false, data: merged };
  }

  merged.email = sessionEmail;

  const profileName = [clean(profile.first_name), clean(profile.last_name)].filter(Boolean).join(" ");
  const sessionName = clean(session.name);
  if (profileName) merged.fullName = profileName;
  else if (!clean(merged.fullName) && sessionName) merged.fullName = sessionName;

  const phone = clean(profile.phone);
  const country = clean(profile.country);
  if (phone) merged.phone = phone;
  if (country) merged.country = country;

  const serverFields = {
    city: onboarding.city,
    documentType: onboarding.document_type,
    documentNumber: onboarding.document_number,
    birthDate: onboarding.birth_date,
    address: onboarding.address,
    preferredLanguage: onboarding.preferred_language,
    communicationChannel: onboarding.communication_channel,
    memberInterest: onboarding.member_interest,
    supportNeeds: onboarding.support_needs,
  };
  for (const [field, value] of Object.entries(serverFields)) {
    if (typeof value === "string" && value.trim()) merged[field] = value.trim();
  }
  if (typeof onboarding.accepts_privacy === "boolean") merged.acceptsPrivacy = onboarding.accepts_privacy;
  if (typeof onboarding.accepts_communications === "boolean") {
    merged.acceptsCommunications = onboarding.accepts_communications;
  }

  return { authenticated: true, data: merged };
}

/**
 * Lista blanca para el borrador del navegador. Si el formulario incorpora
 * campos nuevos en el futuro, no terminarán en localStorage por accidente.
 * @param {OnboardingDraft} [data]
 */
export function toBrowserOnboardingDraft(data = {}) {
  return {
    email: data.email,
    fullName: data.fullName,
    phone: data.phone,
    country: data.country,
    city: data.city,
    documentType: data.documentType,
    preferredLanguage: data.preferredLanguage,
    communicationChannel: data.communicationChannel,
    memberInterest: data.memberInterest,
    acceptsPrivacy: data.acceptsPrivacy,
    acceptsCommunications: data.acceptsCommunications,
  };
}
