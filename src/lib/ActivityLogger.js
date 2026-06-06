/**
 * Activity Logger
 * Centralized utility for logging admin actions
 */

class ActivityLogger {
  constructor() {
    this.activities = [];
    this.maxActivities = 100;
    this.subscribers = [];
  }

  /**
   * Log an admin action
   */
  logAction(action) {
    const activity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      adminName: action.adminName || 'Unknown Admin',
      action: action.action, // e.g., "approved payment", "reassigned participant"
      entityType: action.entityType, // e.g., "payment", "participant", "support_case"
      entityId: action.entityId,
      entityName: action.entityName || action.entityId,
      details: action.details,
      status: action.status || 'success', // success, error, warning
      timestamp: new Date(),
      metadata: action.metadata || {},
    };

    // Add to activities (keep only latest 100)
    this.activities.unshift(activity);
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }

    // Notify subscribers
    this.notify();

    return activity;
  }

  /**
   * Log payment approval
   */
  logPaymentApproval(adminName, paymentId, amount, entityName) {
    return this.logAction({
      adminName,
      action: 'approved payment',
      entityType: 'payment',
      entityId: paymentId,
      entityName: entityName || `Payment #${paymentId}`,
      details: `$${amount} approved`,
      status: 'success',
    });
  }

  /**
   * Log participant reassignment
   */
  logParticipantReassignment(adminName, participantId, participantName, newLeaderId) {
    return this.logAction({
      adminName,
      action: 'reassigned participant',
      entityType: 'participant',
      entityId: participantId,
      entityName: participantName || `Participant #${participantId}`,
      details: `Assigned to leader #${newLeaderId}`,
      status: 'success',
    });
  }

  /**
   * Log user edit
   */
  logUserEdit(adminName, userId, userName, fieldChanged) {
    return this.logAction({
      adminName,
      action: 'edited user',
      entityType: 'user',
      entityId: userId,
      entityName: userName || `User #${userId}`,
      details: `Modified: ${fieldChanged}`,
      status: 'success',
    });
  }

  /**
   * Log support case update
   */
  logSupportUpdate(adminName, caseId, caseTitle, updateType) {
    return this.logAction({
      adminName,
      action: 'updated support case',
      entityType: 'support_case',
      entityId: caseId,
      entityName: caseTitle || `Case #${caseId}`,
      details: updateType, // e.g., "marked as resolved"
      status: 'success',
    });
  }

  /**
   * Log AI Copilot action
   */
  logAICopilotAction(adminName, actionType, targetEntity, result) {
    return this.logAction({
      adminName,
      action: `AI Copilot ${actionType}`,
      entityType: 'ai_action',
      entityId: targetEntity.id,
      entityName: targetEntity.name || `${targetEntity.type} #${targetEntity.id}`,
      details: result,
      status: 'success',
    });
  }

  /**
   * Log Auto Mode execution
   */
  logAutoModeExecution(actionType, targetEntity, result, status = 'success') {
    return this.logAction({
      adminName: 'Auto Mode',
      action: `executed ${actionType}`,
      entityType: 'auto_mode',
      entityId: targetEntity.id,
      entityName: targetEntity.name || `${targetEntity.type} #${targetEntity.id}`,
      details: result,
      status,
    });
  }

  /**
   * Get recent activities
   */
  getActivities(limit = 50) {
    return this.activities.slice(0, limit);
  }

  /**
   * Clear activities
   */
  clear() {
    this.activities = [];
    this.notify();
  }

  /**
   * Subscribe to activity updates
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all subscribers
   */
  notify() {
    this.subscribers.forEach(cb => cb(this.activities));
  }
}

// Export singleton instance
export default new ActivityLogger();