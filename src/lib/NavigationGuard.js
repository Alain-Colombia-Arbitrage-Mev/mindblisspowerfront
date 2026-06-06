/**
 * Navigation Guard
 * Prevents screen traps and ensures route integrity
 */

const SAFE_ROUTES = [
  '/admin-dashboard/overview',
  '/admin-dashboard/crm',
  '/admin-dashboard/participants',
  '/admin-dashboard/investments',
  '/admin-dashboard/payments',
  '/admin-dashboard/leaders',
  '/admin-dashboard/permissions',
  '/admin-dashboard/support',
  '/admin-dashboard/marketing',
  '/admin-dashboard/analytics',
  '/admin-dashboard/ai-brain',
  '/admin-dashboard/copilot',
  '/admin-dashboard/auto-mode',
  '/admin-dashboard/audit',
  '/admin-dashboard/settings',
  '/admin-dashboard/control-center',
  '/admin-dashboard/war-room/multi',
];

export function isValidAdminRoute(path) {
  // Check if route exists or is a sub-route of a valid module
  return SAFE_ROUTES.some(route => 
    path === route || path.startsWith(route + '/')
  );
}

export function getFallbackRoute() {
  return '/admin-dashboard/overview';
}

export function validateNavigation(currentPath, targetPath) {
  // Ensure target path is safe
  if (!targetPath || !isValidAdminRoute(targetPath)) {
    return getFallbackRoute();
  }
  return targetPath;
}

export function canNavigateBack() {
  return window.history.length > 1;
}