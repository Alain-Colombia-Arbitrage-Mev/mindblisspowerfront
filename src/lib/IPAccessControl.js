/**
 * IP Access Control
 * Manages trusted/blocked IPs, region awareness, and suspicious login detection
 */

class IPAccessControl {
  constructor() {
    this.trustedIPs = new Set(this.loadFromStorage('trustedIPs') || []);
    this.blockedIPs = new Set(this.loadFromStorage('blockedIPs') || []);
    this.loginHistory = this.loadFromStorage('loginHistory') || [];
    this.ipRegions = new Map(this.loadFromStorage('ipRegions') || []);
  }

  /**
   * Get client IP (mock - in production would use backend API)
   */
  getClientIP() {
    // Mock IP detection - in production use RTCPeerConnection or server endpoint
    return `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }

  /**
   * Detect region from IP (mock - in production use GeoIP API)
   */
  async detectRegion(ip) {
    // Mock region detection
    const regions = {
      '192.168': 'United Arab Emirates',
      '10.0': 'Internal Network',
      '172.16': 'Local Area Network',
    };

    const prefix = ip.split('.').slice(0, 2).join('.');
    const region = regions[prefix] || 'Unknown Location';

    // Store in cache
    if (!this.ipRegions.has(ip)) {
      this.ipRegions.set(ip, { region, detectedAt: Date.now() });
      this.saveToStorage('ipRegions', Array.from(this.ipRegions.entries()));
    }

    return { ip, region, timestamp: Date.now() };
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  /**
   * Check if IP is trusted
   */
  isIPTrusted(ip) {
    return this.trustedIPs.has(ip);
  }

  /**
   * Validate IP access
   */
  validateIPAccess(ip) {
    if (this.isIPBlocked(ip)) {
      return { allowed: false, reason: 'blocked', severity: 'critical' };
    }

    if (this.isIPTrusted(ip)) {
      return { allowed: true, trusted: true };
    }

    // Unrecognized IP
    return { allowed: false, reason: 'suspicious', severity: 'warning', requiresVerification: true };
  }

  /**
   * Add IP to trusted list
   */
  addTrustedIP(ip, label = '') {
    this.trustedIPs.add(ip);
    this.loginHistory.push({
      ip,
      action: 'trusted_added',
      label,
      timestamp: Date.now(),
    });
    this.saveToStorage('trustedIPs', Array.from(this.trustedIPs));
    this.saveToStorage('loginHistory', this.loginHistory);
  }

  /**
   * Remove IP from trusted list
   */
  removeTrustedIP(ip) {
    this.trustedIPs.delete(ip);
    this.loginHistory.push({
      ip,
      action: 'trusted_removed',
      timestamp: Date.now(),
    });
    this.saveToStorage('trustedIPs', Array.from(this.trustedIPs));
    this.saveToStorage('loginHistory', this.loginHistory);
  }

  /**
   * Block IP
   */
  blockIP(ip, reason = '') {
    this.blockedIPs.add(ip);
    this.loginHistory.push({
      ip,
      action: 'ip_blocked',
      reason,
      timestamp: Date.now(),
    });
    this.saveToStorage('blockedIPs', Array.from(this.blockedIPs));
    this.saveToStorage('loginHistory', this.loginHistory);
  }

  /**
   * Unblock IP
   */
  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    this.loginHistory.push({
      ip,
      action: 'ip_unblocked',
      timestamp: Date.now(),
    });
    this.saveToStorage('blockedIPs', Array.from(this.blockedIPs));
    this.saveToStorage('loginHistory', this.loginHistory);
  }

  /**
   * Log login attempt
   */
  logLoginAttempt(ip, email, success = false) {
    const region = this.ipRegions.get(ip) || { region: 'Unknown' };
    this.loginHistory.push({
      ip,
      email,
      action: success ? 'login_success' : 'login_failed',
      region: region.region,
      timestamp: Date.now(),
    });
    this.saveToStorage('loginHistory', this.loginHistory);
  }

  /**
   * Get login history
   */
  getLoginHistory(limit = 50) {
    return this.loginHistory.slice(-limit).reverse();
  }

  /**
   * Get trusted IPs
   */
  getTrustedIPs() {
    return Array.from(this.trustedIPs);
  }

  /**
   * Get blocked IPs
   */
  getBlockedIPs() {
    return Array.from(this.blockedIPs);
  }

  /**
   * Get login locations
   */
  getLoginLocations() {
    const locations = {};
    this.loginHistory.forEach(entry => {
      const key = entry.region || 'Unknown';
      locations[key] = (locations[key] || 0) + 1;
    });
    return locations;
  }

  /**
   * Detect suspicious patterns
   */
  detectSuspiciousPatterns(ip) {
    const recentLogins = this.loginHistory.filter(
      h => h.ip === ip && Date.now() - h.timestamp < 24 * 60 * 60 * 1000
    );

    if (recentLogins.length > 10) {
      return { suspicious: true, reason: 'excessive_attempts', count: recentLogins.length };
    }

    const failedAttempts = recentLogins.filter(h => h.action === 'login_failed');
    if (failedAttempts.length >= 3) {
      return { suspicious: true, reason: 'multiple_failures', count: failedAttempts.length };
    }

    return { suspicious: false };
  }

  /**
   * Local storage helpers
   */
  saveToStorage(key, value) {
    try {
      localStorage.setItem(`admin_ip_${key}`, JSON.stringify(value));
    } catch (err) {
      console.error('Storage error:', err);
    }
  }

  loadFromStorage(key) {
    try {
      const data = localStorage.getItem(`admin_ip_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Storage error:', err);
      return null;
    }
  }

  /**
   * Clear history (admin only)
   */
  clearLoginHistory() {
    this.loginHistory = [];
    this.saveToStorage('loginHistory', this.loginHistory);
  }

  /**
   * Reset all (testing only)
   */
  reset() {
    this.trustedIPs.clear();
    this.blockedIPs.clear();
    this.loginHistory = [];
    this.ipRegions.clear();
    localStorage.removeItem('admin_ip_trustedIPs');
    localStorage.removeItem('admin_ip_blockedIPs');
    localStorage.removeItem('admin_ip_loginHistory');
    localStorage.removeItem('admin_ip_ipRegions');
  }
}

export default new IPAccessControl();