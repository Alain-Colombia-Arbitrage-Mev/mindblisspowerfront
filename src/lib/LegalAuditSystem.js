// Legal Audit System - Track all legal actions with full traceability

class LegalAuditSystem {
  constructor() {
    this.auditLogs = [];
    this.subscribers = [];
  }

  // Get client IP (simulated)
  getClientIP() {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }

  // Get user agent
  getUserAgent() {
    return navigator?.userAgent || 'Unknown';
  }

  // Log action
  logAction(actionData) {
    if (!actionData.action_type || !actionData.user_email) {
      return { success: false, error: 'Missing required fields' };
    }

    const logEntry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      action_type: actionData.action_type,
      action_description: actionData.action_description || this.getActionDescription(actionData.action_type),
      user_id: actionData.user_id,
      user_email: actionData.user_email,
      user_role: actionData.user_role || 'user',
      document_id: actionData.document_id || null,
      document_title: actionData.document_title || null,
      document_type: actionData.document_type || null,
      contract_id: actionData.contract_id || null,
      signature_id: actionData.signature_id || null,
      previous_status: actionData.previous_status || null,
      new_status: actionData.new_status || null,
      timestamp: new Date(),
      ip_address: actionData.ip_address || this.getClientIP(),
      user_agent: actionData.user_agent || this.getUserAgent(),
      details: actionData.details ? JSON.stringify(actionData.details) : null,
      severity: actionData.severity || this.getSeverityLevel(actionData.action_type),
      requires_approval: actionData.requires_approval || this.requiresApproval(actionData.action_type),
      approval_status: actionData.approval_status || 'pending',
      approved_by: actionData.approved_by || null,
      approval_timestamp: actionData.approval_timestamp || null,
      notes: actionData.notes || null,
    };

    this.auditLogs.push(logEntry);
    this.notifySubscribers(logEntry);

    return { success: true, logEntry };
  }

  // Get action description
  getActionDescription(actionType) {
    const descriptions = {
      contract_created: 'New contract created',
      contract_updated: 'Contract updated',
      document_generated: 'Legal document generated',
      document_updated: 'Document content updated',
      signature_initiated: 'Signature process initiated',
      signature_completed: 'Document signed and recorded',
      signature_invalidated: 'Signature invalidated',
      status_changed: 'Document status changed',
      document_archived: 'Document archived',
      document_deleted: 'Document deleted',
      access_granted: 'Access granted to document',
      access_revoked: 'Access revoked from document',
    };
    return descriptions[actionType] || 'Legal action recorded';
  }

  // Get severity level
  getSeverityLevel(actionType) {
    const critical = ['document_deleted', 'signature_invalidated', 'access_revoked'];
    const high = ['contract_created', 'document_generated', 'signature_completed'];
    const medium = ['document_updated', 'status_changed', 'document_archived'];
    const low = ['access_granted'];

    if (critical.includes(actionType)) return 'critical';
    if (high.includes(actionType)) return 'high';
    if (medium.includes(actionType)) return 'medium';
    if (low.includes(actionType)) return 'low';
    return 'medium';
  }

  // Check if action requires approval
  requiresApproval(actionType) {
    return ['document_deleted', 'signature_invalidated', 'access_revoked'].includes(actionType);
  }

  // Get all logs
  getAllLogs(limit = 1000) {
    return this.auditLogs.slice(-limit).reverse();
  }

  // Filter logs
  filterLogs(filters) {
    let results = this.auditLogs;

    if (filters.action_type) {
      results = results.filter(log => log.action_type === filters.action_type);
    }

    if (filters.user_email) {
      results = results.filter(log => log.user_email === filters.user_email);
    }

    if (filters.document_id) {
      results = results.filter(log => log.document_id === filters.document_id);
    }

    if (filters.contract_id) {
      results = results.filter(log => log.contract_id === filters.contract_id);
    }

    if (filters.severity) {
      results = results.filter(log => log.severity === filters.severity);
    }

    if (filters.requires_approval) {
      results = results.filter(log => log.requires_approval === filters.requires_approval);
    }

    if (filters.approval_status) {
      results = results.filter(log => log.approval_status === filters.approval_status);
    }

    if (filters.date_from) {
      results = results.filter(log => new Date(log.timestamp) >= new Date(filters.date_from));
    }

    if (filters.date_to) {
      results = results.filter(log => new Date(log.timestamp) <= new Date(filters.date_to));
    }

    return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Get logs by action type
  getLogsByActionType(actionType) {
    return this.auditLogs.filter(log => log.action_type === actionType).reverse();
  }

  // Get logs by user
  getLogsByUser(userEmail) {
    return this.auditLogs.filter(log => log.user_email === userEmail).reverse();
  }

  // Get logs by document
  getLogsByDocument(documentId) {
    return this.auditLogs.filter(log => log.document_id === documentId).reverse();
  }

  // Get logs by contract
  getLogsByContract(contractId) {
    return this.auditLogs.filter(log => log.contract_id === contractId).reverse();
  }

  // Get pending approvals
  getPendingApprovals() {
    return this.auditLogs.filter(log => log.requires_approval && log.approval_status === 'pending');
  }

  // Approve action
  approveAction(logId, approvedBy) {
    const log = this.auditLogs.find(l => l.id === logId);
    if (!log) return { success: false, error: 'Log entry not found' };

    log.approval_status = 'approved';
    log.approved_by = approvedBy;
    log.approval_timestamp = new Date();

    this.notifySubscribers(log);
    return { success: true, log };
  }

  // Reject action
  rejectAction(logId, approvedBy, reason) {
    const log = this.auditLogs.find(l => l.id === logId);
    if (!log) return { success: false, error: 'Log entry not found' };

    log.approval_status = 'rejected';
    log.approved_by = approvedBy;
    log.approval_timestamp = new Date();
    log.notes = reason || log.notes;

    this.notifySubscribers(log);
    return { success: true, log };
  }

  // Get audit statistics
  getStatistics() {
    const total = this.auditLogs.length;
    const byActionType = {};
    const byUser = {};
    const bySeverity = {};
    const byApprovalStatus = {};

    this.auditLogs.forEach(log => {
      byActionType[log.action_type] = (byActionType[log.action_type] || 0) + 1;
      byUser[log.user_email] = (byUser[log.user_email] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
      if (log.requires_approval) {
        byApprovalStatus[log.approval_status] = (byApprovalStatus[log.approval_status] || 0) + 1;
      }
    });

    return {
      total,
      byActionType,
      byUser,
      bySeverity,
      byApprovalStatus,
      pendingApprovals: this.getPendingApprovals().length,
      criticalActions: this.auditLogs.filter(l => l.severity === 'critical').length,
      recentActions: this.auditLogs.slice(-20).reverse(),
    };
  }

  // Generate audit report
  generateAuditReport(filters = {}) {
    const logs = Object.keys(filters).length > 0 ? this.filterLogs(filters) : this.getAllLogs();

    return {
      reportDate: new Date(),
      periodStart: filters.date_from || null,
      periodEnd: filters.date_to || null,
      totalActions: logs.length,
      logs,
      statistics: {
        byActionType: this.groupBy(logs, 'action_type'),
        byUser: this.groupBy(logs, 'user_email'),
        bySeverity: this.groupBy(logs, 'severity'),
      },
    };
  }

  // Helper: group by field
  groupBy(array, field) {
    return array.reduce((acc, item) => {
      acc[item[field]] = (acc[item[field]] || 0) + 1;
      return acc;
    }, {});
  }

  // Export logs
  exportLogs(format = 'json', filters = {}) {
    const logs = Object.keys(filters).length > 0 ? this.filterLogs(filters) : this.getAllLogs();

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    if (format === 'csv') {
      const headers = ['ID', 'Action', 'User', 'Document', 'Severity', 'Timestamp'];
      const rows = logs.map(log => [
        log.id,
        log.action_type,
        log.user_email,
        log.document_id || '—',
        log.severity,
        new Date(log.timestamp).toISOString(),
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return null;
  }

  // Subscribe to audit events
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Notify subscribers
  notifySubscribers(logEntry) {
    this.subscribers.forEach(callback => {
      try {
        callback(logEntry);
      } catch (error) {
        console.error('Error in audit subscriber:', error);
      }
    });
  }

  // Get logs with timeline format
  getTimelineView(limit = 50) {
    const logs = this.auditLogs.slice(-limit).reverse();
    
    return logs.map(log => ({
      id: log.id,
      time: new Date(log.timestamp),
      action: log.action_description,
      user: log.user_email,
      document: log.document_title || log.document_id,
      severity: log.severity,
      details: {
        actionType: log.action_type,
        documentId: log.document_id,
        contractId: log.contract_id,
        previousStatus: log.previous_status,
        newStatus: log.new_status,
      },
    }));
  }

  // Clear old logs (older than days)
  clearOldLogs(olderThanDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const beforeCount = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(log => new Date(log.timestamp) > cutoffDate);
    return beforeCount - this.auditLogs.length;
  }
}

// Singleton instance
let auditSystemInstance = null;

const legalAuditSystem = {
  getInstance: () => {
    if (!auditSystemInstance) {
      auditSystemInstance = new LegalAuditSystem();
    }
    return auditSystemInstance;
  },

  logAction: (data) => legalAuditSystem.getInstance().logAction(data),
  getAllLogs: (limit) => legalAuditSystem.getInstance().getAllLogs(limit),
  filterLogs: (filters) => legalAuditSystem.getInstance().filterLogs(filters),
  getLogsByDocument: (id) => legalAuditSystem.getInstance().getLogsByDocument(id),
  getLogsByUser: (email) => legalAuditSystem.getInstance().getLogsByUser(email),
  getPendingApprovals: () => legalAuditSystem.getInstance().getPendingApprovals(),
  approveAction: (id, approvedBy) => legalAuditSystem.getInstance().approveAction(id, approvedBy),
  rejectAction: (id, approvedBy, reason) => legalAuditSystem.getInstance().rejectAction(id, approvedBy, reason),
  getStatistics: () => legalAuditSystem.getInstance().getStatistics(),
  generateAuditReport: (filters) => legalAuditSystem.getInstance().generateAuditReport(filters),
  exportLogs: (format, filters) => legalAuditSystem.getInstance().exportLogs(format, filters),
  getTimelineView: (limit) => legalAuditSystem.getInstance().getTimelineView(limit),
};

export default legalAuditSystem;