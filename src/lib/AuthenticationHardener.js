/**
 * Authentication Hardener
 * Implements secure login with 2-step verification, attempt tracking, lockout, and session validation
 */

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_TOKEN_LENGTH = 32;

class AuthenticationHardener {
  constructor() {
    this.loginAttempts = new Map(); // email -> { count, timestamp, locked }
    this.sessionTokens = new Map(); // token -> { adminId, createdAt, lastActivity }
    this.twoStepSessions = new Map(); // sessionId -> { email, verified, expiresAt }
  }

  /**
   * Generate secure session token
   */
  generateSessionToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(SESSION_TOKEN_LENGTH)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Track login attempt
   */
  trackLoginAttempt(email, success = false) {
    if (success) {
      this.loginAttempts.delete(email);
      return { allowed: true, attemptsRemaining: LOCKOUT_THRESHOLD };
    }

    const attempt = this.loginAttempts.get(email) || { count: 0, timestamp: Date.now(), locked: false };

    if (attempt.locked && Date.now() - attempt.timestamp < LOCKOUT_DURATION) {
      const remainingTime = Math.ceil((LOCKOUT_DURATION - (Date.now() - attempt.timestamp)) / 1000 / 60);
      return { allowed: false, reason: 'locked', remainingMinutes: remainingTime };
    }

    if (attempt.locked) {
      attempt.locked = false;
      attempt.count = 0;
    }

    attempt.count += 1;
    attempt.timestamp = Date.now();

    if (attempt.count >= LOCKOUT_THRESHOLD) {
      attempt.locked = true;
      this.loginAttempts.set(email, attempt);
      return { allowed: false, reason: 'locked', remainingMinutes: 15 };
    }

    this.loginAttempts.set(email, attempt);
    return { allowed: true, attemptsRemaining: LOCKOUT_THRESHOLD - attempt.count };
  }

  /**
   * Create 2-step verification session
   */
  createTwoStepSession(email) {
    const sessionId = this.generateSessionToken();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minute expiry

    this.twoStepSessions.set(sessionId, {
      email,
      verified: false,
      expiresAt,
      code: Math.random().toString().slice(2, 8),
    });

    return { sessionId, codeLength: 6 };
  }

  /**
   * Verify 2-step code
   */
  verifyTwoStepCode(sessionId, code) {
    const session = this.twoStepSessions.get(sessionId);

    if (!session) {
      return { valid: false, reason: 'invalid_session' };
    }

    if (Date.now() > session.expiresAt) {
      this.twoStepSessions.delete(sessionId);
      return { valid: false, reason: 'expired' };
    }

    if (session.code !== code) {
      return { valid: false, reason: 'invalid_code' };
    }

    session.verified = true;
    return { valid: true };
  }

  /**
   * Create secure session token
   */
  createSessionToken(adminId, adminData) {
    const token = this.generateSessionToken();
    const now = Date.now();

    this.sessionTokens.set(token, {
      adminId,
      email: adminData.email,
      name: adminData.name,
      role: adminData.role,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + INACTIVITY_TIMEOUT,
    });

    return token;
  }

  /**
   * Validate session token
   */
  validateSessionToken(token) {
    const session = this.sessionTokens.get(token);

    if (!session) {
      return { valid: false, reason: 'invalid_token' };
    }

    const now = Date.now();

    if (now > session.expiresAt) {
      this.sessionTokens.delete(token);
      return { valid: false, reason: 'expired' };
    }

    // Refresh activity
    session.lastActivity = now;
    session.expiresAt = now + INACTIVITY_TIMEOUT;

    return { valid: true, session };
  }

  /**
   * Refresh session on activity
   */
  refreshSessionToken(token) {
    const validation = this.validateSessionToken(token);
    if (validation.valid) {
      return { refreshed: true };
    }
    return { refreshed: false, reason: validation.reason };
  }

  /**
   * Revoke session token
   */
  revokeSessionToken(token) {
    this.sessionTokens.delete(token);
  }

  /**
   * Check if email is locked
   */
  isEmailLocked(email) {
    const attempt = this.loginAttempts.get(email);
    if (!attempt || !attempt.locked) return false;
    if (Date.now() - attempt.timestamp >= LOCKOUT_DURATION) return false;
    return true;
  }

  /**
   * Get remaining lockout time in minutes
   */
  getLockoutTimeRemaining(email) {
    const attempt = this.loginAttempts.get(email);
    if (!attempt || !attempt.locked) return 0;
    const remaining = LOCKOUT_DURATION - (Date.now() - attempt.timestamp);
    return remaining > 0 ? Math.ceil(remaining / 1000 / 60) : 0;
  }

  /**
   * Clear old expired sessions (cleanup)
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [token, session] of this.sessionTokens) {
      if (now > session.expiresAt) {
        this.sessionTokens.delete(token);
      }
    }
  }
}

export default new AuthenticationHardener();