// Stealth metadata — removes admin routes from public metadata
export const ADMIN_ROUTES = [
  '/admin-access',
  '/admin-dashboard',
  '/admin-tools',
  '/admin-automation',
  '/admin-viral',
  '/admin-social'
];

// Filter out admin routes from any route arrays
export const filterAdminRoutes = (routes) => {
  if (!Array.isArray(routes)) return routes;
  return routes.filter(route => !ADMIN_ROUTES.includes(route.path || route.to || route));
};

// Generate public sitemap (excludes admin routes)
export const generatePublicSitemap = (baseRoutes) => {
  return filterAdminRoutes(baseRoutes).map(route => ({
    url: route.path || route.to,
    lastmod: new Date().toISOString(),
    priority: 0.8
  }));
};

// Sanitize metadata to prevent admin detection
export const sanitizeMetadata = (metadata) => {
  return {
    ...metadata,
    // Remove any admin references
    robots: 'index, follow',
    // Explicitly exclude admin paths from indexing
    'X-Robots-Tag': 'noindex, follow'
  };
};

// Prevent admin route detection via navigation
export const isAdminRoute = (path) => {
  return ADMIN_ROUTES.some(adminRoute => path.startsWith(adminRoute));
};