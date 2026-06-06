/**
 * Device Security Manager
 * Tracks device fingerprints, manages device access, and detects new/suspicious devices
 */

class DeviceSecurityManager {
  constructor() {
    this.registeredDevices = new Map(this.loadFromStorage('registeredDevices') || []);
    this.deviceFingerprints = new Map(this.loadFromStorage('deviceFingerprints') || []);
    this.deviceActivity = this.loadFromStorage('deviceActivity') || [];
    this.suspiciousActivity = this.loadFromStorage('suspiciousActivity') || [];
  }

  /**
   * Generate device fingerprint
   */
  async generateDeviceFingerprint() {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      maxTouchPoints: navigator.maxTouchPoints || 0,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: Date.now(),
    };

    // Simple hash for fingerprint ID
    const fingerprintStr = JSON.stringify(fingerprint);
    const hash = await this.simpleHash(fingerprintStr);
    fingerprint.id = hash;

    return fingerprint;
  }

  /**
   * Simple hash function for fingerprint
   */
  async simpleHash(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }

  /**
   * Detect device type
   */
  detectDeviceType() {
    const ua = navigator.userAgent;
    if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) {
      return 'Mobile';
    }
    if (/Tablet|iPad/.test(ua)) {
      return 'Tablet';
    }
    return 'Desktop';
  }

  /**
   * Detect browser
   */
  detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    return 'Unknown';
  }

  /**
   * Register new device
   */
  registerDevice(fingerprint, email, label = '') {
    const deviceId = fingerprint.id;
    const device = {
      deviceId,
      fingerprint,
      email,
      label: label || `${this.detectDeviceType()} - ${this.detectBrowser()}`,
      type: this.detectDeviceType(),
      browser: this.detectBrowser(),
      registeredAt: Date.now(),
      lastAccess: Date.now(),
      status: 'active',
      isNew: true,
      requiresConfirmation: true,
    };

    this.registeredDevices.set(deviceId, device);
    this.deviceFingerprints.set(deviceId, fingerprint);
    this.logDeviceActivity(deviceId, email, 'device_registered', 'New device registered');
    this.saveToStorage('registeredDevices', Array.from(this.registeredDevices.entries()));
    this.saveToStorage('deviceFingerprints', Array.from(this.deviceFingerprints.entries()));

    return device;
  }

  /**
   * Confirm new device
   */
  confirmDevice(deviceId) {
    const device = this.registeredDevices.get(deviceId);
    if (device) {
      device.isNew = false;
      device.requiresConfirmation = false;
      device.lastAccess = Date.now();
      this.registeredDevices.set(deviceId, device);
      this.logDeviceActivity(deviceId, device.email, 'device_confirmed', 'Device confirmed');
      this.saveToStorage('registeredDevices', Array.from(this.registeredDevices.entries()));
    }
  }

  /**
   * Check if device is known
   */
  isDeviceKnown(deviceId) {
    return this.registeredDevices.has(deviceId);
  }

  /**
   * Validate device access
   */
  validateDeviceAccess(deviceId) {
    const device = this.registeredDevices.get(deviceId);
    
    if (!device) {
      return { allowed: false, reason: 'unknown_device', requiresConfirmation: true };
    }

    if (device.status === 'blocked') {
      return { allowed: false, reason: 'device_blocked', severity: 'critical' };
    }

    if (device.requiresConfirmation) {
      return { allowed: false, reason: 'requires_confirmation', isNew: true };
    }

    return { allowed: true, device };
  }

  /**
   * Block device
   */
  blockDevice(deviceId, reason = '') {
    const device = this.registeredDevices.get(deviceId);
    if (device) {
      device.status = 'blocked';
      this.registeredDevices.set(deviceId, device);
      this.logDeviceActivity(deviceId, device.email, 'device_blocked', reason || 'Device blocked');
      this.flagSuspiciousActivity(deviceId, device.email, 'device_blocked', reason);
      this.saveToStorage('registeredDevices', Array.from(this.registeredDevices.entries()));
    }
  }

  /**
   * Remove device
   */
  removeDevice(deviceId) {
    const device = this.registeredDevices.get(deviceId);
    if (device) {
      this.logDeviceActivity(deviceId, device.email, 'device_removed', 'Device access removed');
      this.registeredDevices.delete(deviceId);
      this.deviceFingerprints.delete(deviceId);
      this.saveToStorage('registeredDevices', Array.from(this.registeredDevices.entries()));
      this.saveToStorage('deviceFingerprints', Array.from(this.deviceFingerprints.entries()));
    }
  }

  /**
   * Get all registered devices for admin
   */
  getRegisteredDevices() {
    return Array.from(this.registeredDevices.values());
  }

  /**
   * Get devices for specific email
   */
  getDevicesForEmail(email) {
    return Array.from(this.registeredDevices.values()).filter(d => d.email === email);
  }

  /**
   * Get new devices awaiting confirmation
   */
  getNewDevices() {
    return Array.from(this.registeredDevices.values()).filter(d => d.isNew);
  }

  /**
   * Log device activity
   */
  logDeviceActivity(deviceId, email, action, details = '') {
    const device = this.registeredDevices.get(deviceId);
    this.deviceActivity.push({
      deviceId,
      email,
      action,
      details,
      device: device ? { type: device.type, browser: device.browser, label: device.label } : null,
      timestamp: Date.now(),
    });
    this.saveToStorage('deviceActivity', this.deviceActivity);
  }

  /**
   * Flag suspicious activity
   */
  flagSuspiciousActivity(deviceId, email, reason, details = '') {
    const device = this.registeredDevices.get(deviceId);
    this.suspiciousActivity.push({
      deviceId,
      email,
      reason,
      details,
      device: device ? { type: device.type, browser: device.browser, label: device.label } : null,
      flaggedAt: Date.now(),
      resolved: false,
    });
    this.saveToStorage('suspiciousActivity', this.suspiciousActivity);
  }

  /**
   * Get device activity
   */
  getDeviceActivity(limit = 100) {
    return this.deviceActivity.slice(-limit).reverse();
  }

  /**
   * Get suspicious activity
   */
  getSuspiciousActivity() {
    return this.suspiciousActivity.filter(a => !a.resolved);
  }

  /**
   * Resolve suspicious activity
   */
  resolveSuspiciousActivity(index) {
    if (this.suspiciousActivity[index]) {
      this.suspiciousActivity[index].resolved = true;
      this.saveToStorage('suspiciousActivity', this.suspiciousActivity);
    }
  }

  /**
   * Detect suspicious patterns
   */
  detectSuspiciousPatterns(deviceId) {
    const deviceActivityLog = this.deviceActivity.filter(a => a.deviceId === deviceId);
    const recentActivity = deviceActivityLog.filter(
      a => Date.now() - a.timestamp < 1 * 60 * 60 * 1000
    );

    if (recentActivity.length > 20) {
      return { suspicious: true, reason: 'excessive_activity', count: recentActivity.length };
    }

    const failedAttempts = recentActivity.filter(a => a.action === 'access_denied');
    if (failedAttempts.length >= 3) {
      return { suspicious: true, reason: 'multiple_access_denials', count: failedAttempts.length };
    }

    return { suspicious: false };
  }

  /**
   * Local storage helpers
   */
  saveToStorage(key, value) {
    try {
      localStorage.setItem(`admin_device_${key}`, JSON.stringify(value));
    } catch (err) {
      console.error('Storage error:', err);
    }
  }

  loadFromStorage(key) {
    try {
      const data = localStorage.getItem(`admin_device_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Storage error:', err);
      return null;
    }
  }

  /**
   * Clear activity logs (admin only)
   */
  clearActivityLogs() {
    this.deviceActivity = [];
    this.suspiciousActivity = [];
    this.saveToStorage('deviceActivity', this.deviceActivity);
    this.saveToStorage('suspiciousActivity', this.suspiciousActivity);
  }

  /**
   * Reset all (testing only)
   */
  reset() {
    this.registeredDevices.clear();
    this.deviceFingerprints.clear();
    this.deviceActivity = [];
    this.suspiciousActivity = [];
    localStorage.removeItem('admin_device_registeredDevices');
    localStorage.removeItem('admin_device_deviceFingerprints');
    localStorage.removeItem('admin_device_deviceActivity');
    localStorage.removeItem('admin_device_suspiciousActivity');
  }
}

export default new DeviceSecurityManager();