/**
 * Security Alert System
 * Real-time detection of unusual activity and security risks
 */

class SecurityAlertSystem {
  constructor() {
    this.alerts = this.loadFromStorage('securityAlerts') || [];
    this.loginAttempts = {};
    this.observers = [];
    this.maxAlerts = 500;
  }

  /**
   * Subscribe to alert updates
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify subscribers
   */
  notifyObservers() {
    this.observers.forEach(cb => cb([...this.alerts].reverse()));
  }

  /**
   * Create alert
   */
  createAlert(type, severity, title, message, actor, recommendedAction, details = {}) {
    const alert = {
      id: this.generateId(),
      timestamp: Date.now(),
      date: new Date().toISOString(),
      type, // FAILED_LOGIN, NEW_DEVICE, UNUSUAL_LOCATION, HIGH_RISK_ACTION, PERMISSION_ESCALATION, RAPID_CHANGES
      severity, // info, warning, critical
      title,
      message,
      actor,
      recommendedAction,
      details,
      acknowledged: false,
      ackedBy: null,
      ackedAt: null,
    };

    this.alerts.push(alert);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    this.saveToStorage('securityAlerts', this.alerts);
    this.notifyObservers();
    return alert;
  }

  /**
   * Detect multiple failed logins
   */
  detectFailedLogins(email, ip, failureCount) {
    if (failureCount >= 3) {
      return this.createAlert(
        'FAILED_LOGIN',
        'critical',
        'Multiple Failed Login Attempts',
        `${failureCount} failed login attempts for ${email} from ${ip}`,
        email,
        'Lock account immediately or verify with user',
        { email, ip, failureCount }
      );
    } else if (failureCount >= 1) {
      return this.createAlert(
        'FAILED_LOGIN',
        'warning',
        'Failed Login Attempt',
        `Failed login for ${email} from ${ip}`,
        email,
        'Monitor for additional attempts',
        { email, ip, failureCount }
      );
    }
  }

  /**
   * Detect new device access
   */
  detectNewDevice(email, deviceInfo, ip, region) {
    return this.createAlert(
      'NEW_DEVICE',
      'warning',
      'New Device Detected',
      `${email} accessed from new device (${deviceInfo.label}) in ${region}`,
      email,
      'Request device confirmation or IP whitelist',
      { email, device: deviceInfo, ip, region }
    );
  }

  /**
   * Detect unusual location
   */
  detectUnusualLocation(email, previousRegion, newRegion, timeDiffMinutes) {
    if (timeDiffMinutes < 60) {
      return this.createAlert(
        'UNUSUAL_LOCATION',
        'critical',
        'Impossible Travel Detected',
        `${email} accessed from ${previousRegion} and ${newRegion} within ${timeDiffMinutes} minutes`,
        email,
        'Verify user identity immediately',
        { email, previousRegion, newRegion, timeDiffMinutes }
      );
    } else {
      return this.createAlert(
        'UNUSUAL_LOCATION',
        'warning',
        'Location Change Detected',
        `${email} accessed from ${newRegion} (previously ${previousRegion})`,
        email,
        'Monitor for suspicious activity',
        { email, previousRegion, newRegion }
      );
    }
  }

  /**
   * Detect high-risk admin action
   */
  detectHighRiskAction(actor, action, targetCount, details) {
    const riskLevel = targetCount > 10 ? 'critical' : 'warning';
    return this.createAlert(
      'HIGH_RISK_ACTION',
      riskLevel,
      'High-Risk Admin Action',
      `${actor} performed ${action} on ${targetCount} records`,
      actor,
      'Review action and rollback if unauthorized',
      { actor, action, targetCount, ...details }
    );
  }

  /**
   * Detect permission escalation
   */
  detectPermissionEscalation(actor, targetEmail, oldRole, newRole) {
    return this.createAlert(
      'PERMISSION_ESCALATION',
      'critical',
      'Permission Escalation Detected',
      `${actor} granted ${newRole} role to ${targetEmail} (was ${oldRole})`,
      actor,
      'Review and verify authorization immediately',
      { actor, targetEmail, oldRole, newRole }
    );
  }

  /**
   * Detect rapid changes
   */
  detectRapidChanges(actor, entityType, changeCount, timeWindowSeconds) {
    const severity = changeCount > 20 ? 'critical' : changeCount > 10 ? 'warning' : 'info';
    return this.createAlert(
      'RAPID_CHANGES',
      severity,
      'Rapid Data Changes Detected',
      `${actor} made ${changeCount} ${entityType} changes in ${timeWindowSeconds} seconds`,
      actor,
      'Investigate for unauthorized automation or attacks',
      { actor, entityType, changeCount, timeWindowSeconds }
    );
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId, acknowledgedBy) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.ackedBy = acknowledgedBy;
      alert.ackedAt = Date.now();
      this.saveToStorage('securityAlerts', this.alerts);
      this.notifyObservers();
    }
  }

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts() {
    return this.alerts.filter(a => !a.acknowledged).reverse();
  }

  /**
   * Get all alerts
   */
  getAllAlerts() {
    return [...this.alerts].reverse();
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity) {
    return this.alerts.filter(a => a.severity === severity).reverse();
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type) {
    return this.alerts.filter(a => a.type === type).reverse();
  }

  /**
   * Get alerts for date range
   */
  getAlertsForDateRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return this.alerts.filter(a => a.timestamp >= start && a.timestamp <= end).reverse();
  }

  /**
   * Get critical alerts count
   */
  getCriticalAlertCount() {
    return this.alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  }

  /**
   * Get alert summary
   */
  getAlertSummary() {
    return {
      total: this.alerts.length,
      critical: this.alerts.filter(a => a.severity === 'critical').length,
      warning: this.alerts.filter(a => a.severity === 'warning').length,
      info: this.alerts.filter(a => a.severity === 'info').length,
      unacknowledged: this.alerts.filter(a => !a.acknowledged).length,
      byType: this.getAlertsByType(''),
    };
  }

  /**
   * Clear alerts
   */
  clearAlerts() {
    this.alerts = [];
    this.saveToStorage('securityAlerts', this.alerts);
    this.notifyObservers();
  }

  /**
   * Clear acknowledged alerts
   */
  clearAcknowledgedAlerts() {
    this.alerts = this.alerts.filter(a => !a.acknowledged);
    this.saveToStorage('securityAlerts', this.alerts);
    this.notifyObservers();
  }

  /**
   * Generate ID
   */
  generateId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Storage helpers
   */
  saveToStorage(key, value) {
    try {
      localStorage.setItem(`security_${key}`, JSON.stringify(value));
    } catch (err) {
      console.error('Storage error:', err);
    }
  }

  loadFromStorage(key) {
    try {
      const data = localStorage.getItem(`security_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Storage error:', err);
      return null;
    }
  }
}

export default new SecurityAlertSystem();