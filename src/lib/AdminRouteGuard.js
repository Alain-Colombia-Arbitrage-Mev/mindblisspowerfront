/**
 * Admin Route Guard - Protects Growth Lab routes
 * Validates admin session before allowing access to any growth lab module
 */

import AdminSessionManager from './AdminSessionManager';

export const validateAdminAccess = () => {
  const session = AdminSessionManager.getCurrentSession();
  return !!session;
};

export const requireAdminAccess = (navigate) => {
  if (!validateAdminAccess()) {
    navigate('/admin-access');
    return false;
  }
  return true;
};

/**
 * Usage in components:
 * 
 * useEffect(() => {
 *   if (!validateAdminAccess()) {
 *     navigate('/admin-access');
 *   }
 * }, [navigate]);
 */