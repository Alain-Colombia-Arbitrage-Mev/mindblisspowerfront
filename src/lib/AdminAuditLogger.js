/**
 * Admin Audit Logger
 * Comprehensive forensic logging of all critical admin actions
 */

class AdminAuditLogger {
  constructor() {
    this.auditLog = this.loadFromStorage('auditLog') || [];
    this.maxLogs = 10000; // Keep last 10k entries
  }

  /**
   * Log login attempt
   */
  logLogin(email, success, ip, device, region, errorReason = null) {
    this.log('LOGIN_ATTEMPT', email, {
      success,
      ip,
      device: device?.label || 'Unknown',
      region,
      errorReason,
    }, success ? 'success' : 'failed');
  }

  /**
   * Log role change
   */
  logRoleChange(actorEmail, targetEmail, oldRole, newRole, ip, device) {
    this.log('ROLE_CHANGE', actorEmail, {
      targetEmail,
      oldRole,
      newRole,
      ip,
      device: device?.label || 'Unknown',
    }, 'success');
  }

  /**
   * Log payment change
   */
  logPaymentChange(actorEmail, participantEmail, paymentId, action, amount, status, ip, device) {
    this.log('PAYMENT_CHANGE', actorEmail, {
      participantEmail,
      paymentId,
      action, // verify, reject, approve, refund
      amount,
      status,
      ip,
      device: device?.label || 'Unknown',
    }, status ? 'success' : 'failed');
  }

  /**
   * Log plan change
   */
  logPlanChange(actorEmail, participantEmail, oldPlan, newPlan, ip, device) {
    this.log('PLAN_CHANGE', actorEmail, {
      participantEmail,
      oldPlan,
      newPlan,
      ip,
      device: device?.label || 'Unknown',
    }, 'success');
  }

  /**
   * Log user edit
   */
  logUserEdit(actorEmail, targetEmail, fieldsChanged, ip, device) {
    this.log('USER_EDIT', actorEmail, {
      targetEmail,
      fieldsChanged,
      ip,
      device: device?.label || 'Unknown',
    }, 'success');
  }

  /**
   * Log permission update
   */
  logPermissionUpdate(actorEmail, targetEmail, permission, action, ip, device) {
    this.log('PERMISSION_UPDATE', actorEmail, {
      targetEmail,
      permission,
      action, // grant, revoke
      ip,
      device: device?.label || 'Unknown',
    }, 'success');
  }

  /**
   * Log Auto Mode action
   */
  logAutoModeAction(actorEmail, action, details, success, ip, device) {
    this.log('AUTO_MODE_ACTION', actorEmail, {
      action,
      details,
      ip,
      device: device?.label || 'Unknown',
    }, success ? 'success' : 'failed');
  }

  /**
   * Log AI Copilot action
   */
  logAICopilotAction(actorEmail, action, prompt, recommendation, accepted, ip, device) {
    this.log('AI_COPILOT_ACTION', actorEmail, {
      action,
      prompt: prompt ? prompt.substring(0, 100) : 'N/A',
      recommendation,
      accepted,
      ip,
      device: device?.label || 'Unknown',
    }, accepted ? 'success' : 'ignored');
  }

  /**
   * Core logging function
   */
  log(actionType, actor, details, result) {
    const entry = {
      id: this.generateId(),
      timestamp: Date.now(),
      actionType,
      actor,
      details,
      result,
      date: new Date().toISOString(),
    };

    this.auditLog.push(entry);

    // Keep only recent logs
    if (this.auditLog.length > this.maxLogs) {
      this.auditLog = this.auditLog.slice(-this.maxLogs);
    }

    this.saveToStorage('auditLog', this.auditLog);
    return entry;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all audit logs
   */
  getAllLogs() {
    return [...this.auditLog].reverse();
  }

  /**
   * Filter logs
   */
  filterLogs(criteria) {
    let filtered = this.auditLog;

    if (criteria.actionType) {
      filtered = filtered.filter(l => l.actionType === criteria.actionType);
    }

    if (criteria.actor) {
      filtered = filtered.filter(l => l.actor.toLowerCase().includes(criteria.actor.toLowerCase()));
    }

    if (criteria.result) {
      filtered = filtered.filter(l => l.result === criteria.result);
    }

    if (criteria.dateFrom) {
      filtered = filtered.filter(l => l.timestamp >= new Date(criteria.dateFrom).getTime());
    }

    if (criteria.dateTo) {
      filtered = filtered.filter(l => l.timestamp <= new Date(criteria.dateTo).getTime());
    }

    if (criteria.search) {
      const searchLower = criteria.search.toLowerCase();
      filtered = filtered.filter(l =>
        JSON.stringify(l).toLowerCase().includes(searchLower)
      );
    }

    return filtered.reverse();
  }

  /**
   * Get action type statistics
   */
  getActionStats() {
    const stats = {};
    this.auditLog.forEach(entry => {
      stats[entry.actionType] = (stats[entry.actionType] || 0) + 1;
    });
    return stats;
  }

  /**
   * Get actor statistics
   */
  getActorStats() {
    const stats = {};
    this.auditLog.forEach(entry => {
      stats[entry.actor] = (stats[entry.actor] || 0) + 1;
    });
    return stats;
  }

  /**
   * Get result statistics
   */
  getResultStats() {
    const stats = { success: 0, failed: 0, ignored: 0 };
    this.auditLog.forEach(entry => {
      if (entry.result === 'success') stats.success++;
      else if (entry.result === 'failed') stats.failed++;
      else if (entry.result === 'ignored') stats.ignored++;
    });
    return stats;
  }

  /**
   * Search logs
   */
  search(query) {
    const queryLower = query.toLowerCase();
    return this.auditLog.filter(entry =>
      entry.actor.toLowerCase().includes(queryLower) ||
      entry.actionType.toLowerCase().includes(queryLower) ||
      JSON.stringify(entry.details).toLowerCase().includes(queryLower)
    ).reverse();
  }

  /**
   * Export logs as JSON
   */
  exportLogs(filters = {}) {
    const data = this.filterLogs(filters);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear logs (admin only)
   */
  clearLogs() {
    this.auditLog = [];
    this.saveToStorage('auditLog', this.auditLog);
  }

  /**
   * Get logs for date range
   */
  getLogsForDateRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return this.auditLog.filter(l => l.timestamp >= start && l.timestamp <= end).reverse();
  }

  /**
   * Storage helpers
   */
  saveToStorage(key, value) {
    try {
      localStorage.setItem(`admin_audit_${key}`, JSON.stringify(value));
    } catch (err) {
      console.error('Storage error:', err);
    }
  }

  loadFromStorage(key) {
    try {
      const data = localStorage.getItem(`admin_audit_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Storage error:', err);
      return null;
    }
  }

  /**
   * Reset (testing only)
   */
  reset() {
    this.auditLog = [];
    localStorage.removeItem('admin_audit_auditLog');
  }
}

export default new AdminAuditLogger();