const PERSONAL_PORTAL_ORIGINS = new Set([
  'https://mindblisspower.com',
  'https://app.mindblisspower.com',
  'https://mindbliss-portal-rewon.devfidubit.workers.dev',
]);

export function isPersonalPortalOrigin(value) {
  return typeof value === 'string' && PERSONAL_PORTAL_ORIGINS.has(value);
}

/** Metadata names only an exact deployed portal or an explicit local dev origin. */
export function personalWalletMetadata(value) {
  let allowed = isPersonalPortalOrigin(value);
  if (!allowed && typeof value === 'string') {
    try {
      const url = new URL(value);
      allowed = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)
        && url.origin === value && !url.username && !url.password;
    } catch { /* Unknown hosts never initialize the wallet SDK. */ }
  }
  if (!allowed) return null;
  return {
    name: 'Mindbliss Power',
    description: 'Conecta tu wallet personal y recarga fondos de forma segura.',
    url: value,
    icons: [`${value}/mindbliss/mindbliss-favicon.png`],
  };
}
