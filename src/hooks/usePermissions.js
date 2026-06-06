import { useAuth } from '@/lib/AuthContext';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/RolePermissions';

/**
 * Hook: usePermissions
 * Check current user's permissions
 */

export default function usePermissions() {
  const { user } = useAuth();
  const userRole = user?.role || 'user';

  return {
    // Single permission check
    can: (permission) => hasPermission(userRole, permission),

    // Multiple permission checks
    canAny: (permissions) => hasAnyPermission(userRole, permissions),
    canAll: (permissions) => hasAllPermissions(userRole, permissions),

    // Get user role
    role: userRole,
  };
}