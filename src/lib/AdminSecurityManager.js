/**
 * AdminSecurityManager
 * Enterprise-grade security orchestration for admin platform
 * Handles authentication, session validation, access control, and audit logging
 */

import AdminSessionManager from './AdminSessionManager';
import AdminSessionValidator from './AdminSessionValidator';
import AdminAuditLogger from './AdminAuditLogger';

class AdminSecurityManager {
  constructor() {
    this.sessionManager = AdminSessionManager;
    this.sessionValidator = AdminSessionValidator;
    this.auditLogger = AdminAuditLogger;
  }

  /**
   * Authenticate admin - hardened entry point
   */
  async authenticateAdmin(credentials) {
    try {
      // Validate credentials format
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Invalid credentials format');
      }

      // Check for brute force
      const attempts = this.getFailedAttempts(credentials.email);
      if (attempts > 5) {
        await this.auditLogger.logSecurityEvent('auth_brute_force_detected', {
          email: credentials.email,
          ip: this.getClientIP(),
          device: this.getDeviceFingerprint(),
        });
        throw new Error('Too many failed attempts. Account temporarily locked.');
      }

      // Validate credentials (mock - replace with actual auth)
      const isValid = this.validateCredentials(credentials);
      if (!isValid) {
        this.recordFailedAttempt(credentials.email);
        throw new Error('Invalid credentials');
      }

      // Create secure session
      const session = AdminSessionManager.createSession(credentials.adminId, {
        email: credentials.email,
        ip: this.getClientIP(),
        device: this.getDeviceFingerprint(),
        userAgent: navigator.userAgent,
        timestamp: new Date(),
      });

      // Log authentication
      await this.auditLogger.logSecurityEvent('admin_authenticated', {
        adminId: credentials.adminId,
        ip: this.getClientIP(),
        device: this.getDeviceFingerprint(),
      });

      return session;
    } catch (error) {
      await this.auditLogger.logSecurityEvent('authentication_failed', {
        email: credentials?.email,
        error: error.message,
        ip: this.getClientIP(),
      });
      throw error;
    }
  }

  /**
   * Validate admin session - continuous validation
   */
  async validateSession(sessionId) {
    try {
      const session = AdminSessionManager.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Check session expiration
      const isExpired = this.sessionValidator.isSessionExpired(session);
      if (isExpired) {
        AdminSessionManager.clearSession(sessionId);
        throw new Error('Session expired');
      }

      // Validate IP consistency
      const currentIP = this.getClientIP();
      if (session.metadata?.ip && session.metadata.ip !== currentIP) {
        await this.auditLogger.logSecurityEvent('ip_change_detected', {
          sessionId,
          previousIP: session.metadata.ip,
          currentIP,
          device: this.getDeviceFingerprint(),
        });
        // Warning but allow (configurable)
      }

      // Validate device fingerprint
      const currentDevice = this.getDeviceFingerprint();
      if (session.metadata?.device && session.metadata.device !== currentDevice) {
        await this.auditLogger.logSecurityEvent('device_change_detected', {
          sessionId,
          previousDevice: session.metadata.device,
          currentDevice,
        });
      }

      return true;
    } catch (error) {
      await this.auditLogger.logSecurityEvent('session_validation_failed', {
        sessionId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Enforce access control for route
   */
  async enforceAccessControl(sessionId, route, requiredRole = 'admin') {
    try {
      const session = AdminSessionManager.getSession(sessionId);
      if (!session) {
        throw new Error('Unauthorized: No active session');
      }

      const isValid = await this.validateSession(sessionId);
      if (!isValid) {
        throw new Error('Unauthorized: Invalid session');
      }

      // Check role-based access
      if (session.admin?.role !== requiredRole && requiredRole !== '*') {
        await this.auditLogger.logSecurityEvent('unauthorized_access_attempt', {
          sessionId,
          route,
          requiredRole,
          actualRole: session.admin?.role,
          ip: this.getClientIP(),
        });
        throw new Error(`Unauthorized: Insufficient privileges for ${route}`);
      }

      // Log successful access
      await this.auditLogger.logAccessEvent(sessionId, route);

      return true;
    } catch (error) {
      await this.auditLogger.logSecurityEvent('access_control_violation', {
        sessionId,
        route,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Log admin action
   */
  async logAction(sessionId, action, details = {}) {
    const session = AdminSessionManager.getSession(sessionId);
    if (!session) return;

    await this.auditLogger.logAdminAction(sessionId, action, {
      ...details,
      ip: this.getClientIP(),
      device: this.getDeviceFingerprint(),
      timestamp: new Date(),
    });
  }

  /**
   * Detect anomalies
   */
  async detectAnomalies(sessionId) {
    const session = AdminSessionManager.getSession(sessionId);
    if (!session) return null;

    const anomalies = [];

    // Check rapid actions
    const recentActions = await this.auditLogger.getRecentActions(sessionId, 60); // Last 60 seconds
    if (recentActions.length > 50) {
      anomalies.push('excessive_rapid_actions');
    }

    // Check geographic anomaly
    const locations = await this.auditLogger.getLocationHistory(sessionId);
    if (locations.length > 1) {
      // Check if IPs are geographically far apart
      const speedAnomaly = this.sessionValidator.detectGeographicAnomaly(locations);
      if (speedAnomaly) {
        anomalies.push('impossible_travel_detected');
      }
    }

    if (anomalies.length > 0) {
      await this.auditLogger.logSecurityEvent('anomalies_detected', {
        sessionId,
        anomalies,
      });
    }

    return anomalies;
  }

  // ── Helper Methods ─────────────────────────

  validateCredentials(credentials) {
    // Mock validation - replace with actual auth service
    return credentials.email && credentials.password && credentials.adminId;
  }

  getFailedAttempts(email) {
    const key = `auth_failed_${email}`;
    const stored = sessionStorage.getItem(key);
    return stored ? parseInt(stored) : 0;
  }

  recordFailedAttempt(email) {
    const key = `auth_failed_${email}`;
    const current = this.getFailedAttempts(email);
    sessionStorage.setItem(key, (current + 1).toString());
  }

  getClientIP() {
    // In production, this should come from backend via secure API
    return localStorage.getItem('_admin_ip') || 'unknown';
  }

  getDeviceFingerprint() {
    // Generate consistent device fingerprint
    const fpKey = '_admin_device_fp';
    let fp = localStorage.getItem(fpKey);

    if (!fp) {
      fp = `${navigator.userAgent}_${navigator.language}_${new Date().getTimezoneOffset()}`;
      fp = this.hashString(fp);
      localStorage.setItem(fpKey, fp);
    }

    return fp;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

export default new AdminSecurityManager();