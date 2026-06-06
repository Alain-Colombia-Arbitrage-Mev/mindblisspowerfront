/**
 * AdminAccessForce
 * Force admin access bypass — all routes render without session validation
 */

export const AdminAccessForce = {
  /**
   * Initialize forced admin access
   */
  init() {
    // Ensure persistent access flag
    if (typeof localStorage !== 'undefined') {
      const hasAuth = localStorage.getItem('auth') === 'true';
      const hasToken = localStorage.getItem('admin_token');
      if (hasAuth || hasToken) {
        return true;
      }
    }
    return false;
  },

  /**
   * Set admin access flag
   */
  grantAccess() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth', 'true');
      localStorage.setItem('admin_token', 'force-override');
      localStorage.setItem('_admin_force_bypass', 'true');
    }
  },

  /**
   * Check if admin access is forced
   */
  isForced() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('auth') === 'true' || 
             localStorage.getItem('_admin_force_bypass') === 'true';
    }
    return false;
  },

  /**
   * Force redirect to admin dashboard
   */
  redirectToDashboard() {
    this.grantAccess();
    window.location.href = '/admin-dashboard';
  }
};

export default AdminAccessForce;