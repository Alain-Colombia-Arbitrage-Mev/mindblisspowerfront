/**
 * Admin Session Manager
 * Tracks active admin sessions, presence, and real-time collaboration
 */

class AdminSessionManager {
  constructor() {
    this.activeSessions = new Map();
    this.listeners = new Set();
    this.syncInterval = null;
    this.currentAdmin = null;
    this.sessionTokens = new Map(); // token -> session validation
  }

  /**
   * Register active admin session with token validation
   */
  registerSession(adminId, adminData, token = null) {
    const session = {
      adminId,
      name: adminData.name || 'Unknown Admin',
      email: adminData.email,
      role: adminData.role || 'admin',
      module: null,
      action: null,
      lastActivity: Date.now(),
      sessionStart: Date.now(),
      status: 'active',
      token: token || null,
      uniqueId: `${adminId}-${Date.now()}`,
    };

    if (token) {
      this.sessionTokens.set(token, session);
    }

    this.activeSessions.set(adminId, session);
    this.currentAdmin = session;
    this.notifyListeners();

    return session;
  }

  /**
   * Validate session token
   */
  validateSessionToken(token) {
    const session = this.sessionTokens.get(token);
    if (session) {
      session.lastActivity = Date.now();
      return { valid: true, session };
    }
    return { valid: false };
  }

  /**
   * Update admin presence (module + action) with activity refresh
   */
  updatePresence(adminId, module, action = null) {
    if (!this.activeSessions.has(adminId)) return;

    const session = this.activeSessions.get(adminId);
    session.module = module;
    session.action = action;
    session.lastActivity = Date.now();

    this.notifyListeners();
  }

  /**
   * Clear admin session on logout
   */
  clearSession(adminId) {
    this.activeSessions.delete(adminId);
    if (this.currentAdmin?.adminId === adminId) {
      this.currentAdmin = null;
    }
    this.notifyListeners();
  }

  /**
   * Get all active admin sessions
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get admins in specific module
   */
  getAdminsInModule(module) {
    return this.getActiveSessions().filter(s => s.module === module);
  }

  /**
   * Check for conflicts (multiple admins in same action)
   */
  detectConflict(module, action) {
    const inModule = this.getAdminsInModule(module);
    return inModule.filter(s => s.action === action);
  }

  /**
   * Get current admin session
   */
  getCurrentSession() {
    return this.currentAdmin;
  }

  /**
   * Subscribe to session changes
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          activeSessions: this.getActiveSessions(),
          currentAdmin: this.currentAdmin,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Error in session listener:', err);
      }
    });
  }

  /**
   * Simulate real-time sync
   */
  startSync() {
    this.syncInterval = setInterval(() => {
      // Clean up stale sessions (inactive > 5 minutes)
      const now = Date.now();
      const staleThreshold = 5 * 60 * 1000;

      for (const [adminId, session] of this.activeSessions) {
        if (now - session.lastActivity > staleThreshold) {
          this.clearSession(adminId);
        }
      }

      this.notifyListeners();
    }, 3000);
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  /**
   * Reset for testing
   */
  reset() {
    this.activeSessions.clear();
    this.currentAdmin = null;
    this.notifyListeners();
  }
}

export default new AdminSessionManager();