export const CUSTOMER_APP_HOST = "app.mindblisspower.com";
export const CUSTOMER_PUBLIC_HOST = "mindblisspower.com";
export const ADMIN_APP_HOST = "admin.mindblisspower.com";

const ADMIN_PAGE_REDIRECTS = [
  { prefix: "/dashboard/command-center", target: "/dashboard/centro-de-mando" },
  { prefix: "/dashboard/admin", target: "/dashboard" },
  { prefix: "/dashboard/ai-analysis", target: "/dashboard/asesor" },
  { prefix: "/dashboard/ai", target: "/dashboard/asesor" },
];

export function normalizeHost(host) {
  return String(host || "").toLowerCase().split(":")[0];
}

export function isCustomerAppHost(host) {
  const normalized = normalizeHost(host);
  return normalized === CUSTOMER_APP_HOST || normalized === CUSTOMER_PUBLIC_HOST || normalized.endsWith(".sslip.io");
}

// Admission only: do not rewrite requests. Normalize before classifying so an
// encoded segment or separator cannot bypass the public/admin boundary.
export function normalizedApplicationPath(pathname) {
  if (typeof pathname !== 'string' || pathname.length > 8192 || !pathname.startsWith('/')) return null;
  let path = pathname;
  try {
    for (let count = 0; count < 6; count++) {
      const decoded = decodeURIComponent(path);
      if (decoded === path) {
        if (/[\\\u0000-\u0020\u007f?#]/.test(path)) return null;
        return new URL(path.replace(/\/{2,}/g, '/'), 'https://routing.invalid').pathname;
      }
      path = decoded;
    }
  } catch { /* Invalid/over-encoded paths are never passed to an admin route. */ }
  return null;
}

export function adminUrl(pathname = "/dashboard") {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `https://${ADMIN_APP_HOST}${path}`;
}

export function customerDomainDecision({ host, pathname }) {
  if (!isCustomerAppHost(host)) return { type: "pass" };
  const path = normalizedApplicationPath(pathname);
  if (path === null || /^\/api\/admin(?:\/|$)/i.test(path)) {
    return { type: "notFound" };
  }

  const redirect = ADMIN_PAGE_REDIRECTS.find(({ prefix }) => (
    path === prefix || path.startsWith(`${prefix}/`)
  ));
  if (redirect) {
    return { type: "redirect", location: adminUrl(redirect.target) };
  }

  return { type: "pass" };
}
