/**
 * AdminSessionValidator
 * Validates admin sessions with IP, device, and temporal awareness
 */

class AdminSessionValidator {
  constructor() {
    this.SESSION_TIMEOUT = 60 * 60 * 1000; // 60 minutes
    this.INACTIVE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
    this.MAX_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(session) {
    if (!session?.created_at) return true;

    const now = new Date();
    const createdAt = new Date(session.created_at);
    const lastActivity = new Date(session.last_activity || session.created_at);

    // Check total session duration
    if (now - createdAt > this.MAX_SESSION_DURATION) {
      return true;
    }

    // Check inactivity timeout
    if (now - lastActivity > this.INACTIVE_TIMEOUT) {
      return true;
    }

    return false;
  }

  /**
   * Validate IP consistency
   */
  validateIPConsistency(session, currentIP) {
    if (!session?.metadata?.ip) return true; // First request

    return session.metadata.ip === currentIP;
  }

  /**
   * Validate device consistency
   */
  validateDeviceConsistency(session, currentDevice) {
    if (!session?.metadata?.device) return true;

    return session.metadata.device === currentDevice;
  }

  /**
   * Detect impossible travel (geographic anomaly)
   */
  detectGeographicAnomaly(locations) {
    if (locations.length < 2) return false;

    const [loc1, loc2] = locations.slice(-2);
    const timeDiff = new Date(loc2.timestamp) - new Date(loc1.timestamp);
    const timeDiffMinutes = timeDiff / 1000 / 60;

    // Rough distance estimate (simplified)
    // In production, use actual geolocation API
    const distanceKm = this.estimateDistance(loc1.ip, loc2.ip);

    // Max speed: 900 km/h (commercial flight)
    const maxKmPerMin = 900 / 60;
    const requiredMinutes = distanceKm / maxKmPerMin;

    return timeDiffMinutes < requiredMinutes;
  }

  /**
   * Estimate distance between IPs (mock)
   * In production, use IP geolocation service
   */
  estimateDistance(ip1, ip2) {
    // Simplified: if IPs are different, assume 1000km
    return ip1 !== ip2 ? 1000 : 0;
  }

  /**
   * Check for concurrent sessions from different IPs
   */
  detectConcurrentAnomalies(sessions) {
    const ips = new Set();
    const devices = new Set();

    sessions.forEach((session) => {
      if (session.metadata?.ip) ips.add(session.metadata.ip);
      if (session.metadata?.device) devices.add(session.metadata.device);
    });

    // More than 3 unique IPs or devices is suspicious
    return {
      multipleIPs: ips.size > 3,
      multipleDevices: devices.size > 3,
      ipCount: ips.size,
      deviceCount: devices.size,
    };
  }

  /**
   * Validate request signature (for sensitive operations)
   */
  validateRequestSignature(sessionId, data, signature) {
    // Implementation would use HMAC or similar
    // This is a placeholder
    const hash = this.hashData(sessionId + JSON.stringify(data));
    return hash === signature;
  }

  /**
   * Hash data for verification
   */
  hashData(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate session token
   */
  generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(sessionId, token) {
    const stored = sessionStorage.getItem(`csrf_${sessionId}`);
    return stored === token;
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(sessionId) {
    const token = this.generateSessionToken();
    sessionStorage.setItem(`csrf_${sessionId}`, token);
    return token;
  }
}

export default new AdminSessionValidator();