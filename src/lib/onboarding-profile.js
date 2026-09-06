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
 */
export function mergeOnboardingIdentity({ stored = {}, session = {}, profile = {} } = {}) {
  const sessionEmail = normalizeOnboardingEmail(session.email);
  const storedEmail = normalizeOnboardingEmail(stored.email);
  const authenticated = Boolean(session.authenticated && sessionEmail);
  const sameAccountDraft = !authenticated || storedEmail === sessionEmail;
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

  return { authenticated: true, data: merged };
}
