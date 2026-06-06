import usePermissions from '@/hooks/usePermissions';

/**
 * PermissionGate Component
 * Conditionally render content based on user permissions
 */

export default function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}) {
  const { can, canAny, canAll } = usePermissions();

  // Single permission check
  if (permission) {
    if (!can(permission)) {
      return fallback;
    }
    return children;
  }

  // Multiple permissions check
  if (permissions) {
    const hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
    if (!hasAccess) {
      return fallback;
    }
    return children;
  }

  return children;
}