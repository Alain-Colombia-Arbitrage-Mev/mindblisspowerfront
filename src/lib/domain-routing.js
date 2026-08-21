export const CUSTOMER_APP_HOST = "app.mindblisspower.com";
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
  return normalized === CUSTOMER_APP_HOST || normalized.endsWith(".sslip.io");
}

export function adminUrl(pathname = "/dashboard") {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `https://${ADMIN_APP_HOST}${path}`;
}

export function customerDomainDecision({ host, pathname }) {
  if (!isCustomerAppHost(host)) return { type: "pass" };

  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
    return { type: "notFound" };
  }

  const redirect = ADMIN_PAGE_REDIRECTS.find(({ prefix }) => (
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  ));
  if (redirect) {
    return { type: "redirect", location: adminUrl(redirect.target) };
  }

  return { type: "pass" };
}
