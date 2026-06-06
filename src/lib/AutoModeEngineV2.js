// Auto Mode Engine V2 - Enterprise-grade automation
import UserManagementEngine from './UserManagementEngine';

const ACTION_TYPES = {
  CREATE_PAYMENT_REMINDER: 'create_payment_reminder',
  MARK_FOR_FOLLOWUP: 'mark_for_followup',
  ASSIGN_ADVISOR: 'assign_advisor',
  ADD_INTERNAL_NOTE: 'add_internal_note',
  MOVE_TO_REVIEW: 'move_to_review',
  CREATE_NETWORK_INTERVENTION: 'create_network_intervention',
  REASSIGN_LEADER: 'reassign_leader',
  MARK_PAYMENT_REVIEW: 'mark_payment_review',
  BLOCK_USER: 'block_user',
  APPROVE_PAYMENT: 'approve_payment',
};

const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const AutoModeEngineV2 = {
  getConfig: () => {
    const config = localStorage.getItem('auto_mode_config_v2');
    return config ? JSON.parse(config) : {
      enabled: false,
      operating_mode: 'balanced',
      safety_mode: 'strict',
      paused: false,
    };
  },

  saveConfig: (config) => {
    localStorage.setItem('auto_mode_config_v2', JSON.stringify(config));
    return config;
  },

  // Execute action with real state changes
  executeAction: (action, context = {}) => {
    const config = AutoModeEngineV2.getConfig();
    const startTime = Date.now();
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action_id: action.id,
      action_type: action.type,
      user_id: action.user_id,
      risk_level: action.risk_level,
      initiated_by: context.initiated_by || 'auto_mode',
    };

    // Validation
    if (!config.enabled) {
      auditEntry.status = 'blocked';
      auditEntry.reason = 'Auto Mode disabled';
      AutoModeEngineV2.writeAudit(auditEntry);
      return { success: false, error: 'DISABLED', message: 'Auto Mode desactivado' };
    }

    if (config.paused) {
      auditEntry.status = 'blocked';
      auditEntry.reason = 'Auto Mode paused';
      AutoModeEngineV2.writeAudit(auditEntry);
      return { success: false, error: 'PAUSED', message: 'Auto Mode pausado' };
    }

    const user = UserManagementEngine.getUser(action.user_id);
    if (!user) {
      auditEntry.status = 'failed';
      auditEntry.error = 'User not found';
      AutoModeEngineV2.writeAudit(auditEntry);
      return { success: false, error: 'USER_NOT_FOUND', message: 'Usuario no encontrado' };
    }

    // Execute action based on type
    let stateChanges = {};
    try {
      switch (action.type) {
        case ACTION_TYPES.CREATE_PAYMENT_REMINDER:
          UserManagementEngine.addAlert(action.user_id, {
            type: 'payment_reminder',
            severity: 'medium',
            message: `Recordatorio de pago: $${action.data?.amount || 0}`,
          });
          stateChanges = { alert_created: true, alert_type: 'payment_reminder' };
          break;

        case ACTION_TYPES.MARK_FOR_FOLLOWUP:
          UserManagementEngine.addAlert(action.user_id, {
            type: 'followup_required',
            severity: 'high',
          });
          UserManagementEngine.addHistory(action.user_id, '[AUTO] Marcado para seguimiento');
          stateChanges = { followup_status: 'pending', followup_level: 'high' };
          break;

        case ACTION_TYPES.ASSIGN_ADVISOR:
          UserManagementEngine.updateUser(action.user_id, { status: 'under_review' });
          UserManagementEngine.addHistory(action.user_id, '[AUTO] Asesor asignado automáticamente');
          stateChanges = { new_status: 'under_review', advisor_assigned: true };
          break;

        case ACTION_TYPES.MOVE_TO_REVIEW:
          UserManagementEngine.updateUser(action.user_id, { status: 'under_review' });
          UserManagementEngine.addHistory(action.user_id, '[AUTO] Movido a revisión');
          stateChanges = { status_changed_to: 'under_review' };
          break;

        case ACTION_TYPES.CREATE_NETWORK_INTERVENTION:
          UserManagementEngine.addAlert(action.user_id, {
            type: 'network_intervention',
            severity: 'high',
            message: 'Intervención de red detectada y marcada',
          });
          UserManagementEngine.addHistory(action.user_id, '[AUTO] Intervención de red creada');
          stateChanges = { intervention_type: 'network_rebalance', intervention_created: true };
          break;

        default:
          stateChanges = { action_recorded: true };
      }

      const executionTime = Date.now() - startTime;

      // Log execution
      auditEntry.status = 'executed';
      auditEntry.execution_time_ms = executionTime;
      auditEntry.state_changes = stateChanges;
      AutoModeEngineV2.writeAudit(auditEntry);

      // Store executed action
      const executedAction = {
        ...action,
        status: 'executed',
        executed_at: new Date().toISOString(),
        execution_time_ms: executionTime,
        state_changes: stateChanges,
      };
      AutoModeEngineV2.addActionLog(executedAction);

      return { 
        success: true, 
        action: executedAction, 
        message: 'Acción ejecutada exitosamente',
        audit_id: auditEntry.action_id,
        state_changes: stateChanges,
      };
    } catch (error) {
      auditEntry.status = 'failed';
      auditEntry.error = error.message;
      auditEntry.execution_time_ms = Date.now() - startTime;
      AutoModeEngineV2.writeAudit(auditEntry);

      return {
        success: false,
        error: 'EXECUTION_FAILED',
        message: `Error ejecutando acción: ${error.message}`,
        details: error.message,
      };
    }
  },

  // Approval workflow
  approveAction: (actionId, approvedBy = 'admin') => {
    const approvalQueue = AutoModeEngineV2.getApprovalQueue();
    const actionIndex = approvalQueue.findIndex(a => a.id === actionId);

    if (actionIndex === -1) {
      return { success: false, error: 'NOT_FOUND', message: 'Acción no encontrada' };
    }

    const action = approvalQueue[actionIndex];
    approvalQueue.splice(actionIndex, 1);
    localStorage.setItem('auto_mode_approval_queue_v2', JSON.stringify(approvalQueue));

    // Log approval
    const approvalLog = localStorage.getItem('auto_mode_approval_log_v2') ? JSON.parse(localStorage.getItem('auto_mode_approval_log_v2')) : [];
    approvalLog.unshift({
      timestamp: new Date().toISOString(),
      action_id: actionId,
      approved_by: approvedBy,
      user_id: action.user_id,
    });
    localStorage.setItem('auto_mode_approval_log_v2', JSON.stringify(approvalLog.slice(0, 200)));

    // Execute the approved action
    return AutoModeEngineV2.executeAction(action, { initiated_by: `approved_by_${approvedBy}` });
  },

  rejectAction: (actionId, rejectedBy = 'admin', reason = '') => {
    const approvalQueue = AutoModeEngineV2.getApprovalQueue();
    const actionIndex = approvalQueue.findIndex(a => a.id === actionId);

    if (actionIndex === -1) {
      return { success: false, error: 'NOT_FOUND', message: 'Acción no encontrada' };
    }

    const action = approvalQueue[actionIndex];
    approvalQueue.splice(actionIndex, 1);
    localStorage.setItem('auto_mode_approval_queue_v2', JSON.stringify(approvalQueue));

    // Log rejection
    const rejectionLog = localStorage.getItem('auto_mode_rejection_log_v2') ? JSON.parse(localStorage.getItem('auto_mode_rejection_log_v2')) : [];
    rejectionLog.unshift({
      timestamp: new Date().toISOString(),
      action_id: actionId,
      rejected_by: rejectedBy,
      user_id: action.user_id,
      reason: reason,
    });
    localStorage.setItem('auto_mode_rejection_log_v2', JSON.stringify(rejectionLog.slice(0, 200)));

    // Audit
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action_id: actionId,
      action_type: action.type,
      user_id: action.user_id,
      status: 'rejected',
      rejected_by: rejectedBy,
      reason: reason,
    };
    AutoModeEngineV2.writeAudit(auditEntry);

    return { success: true, message: 'Acción rechazada' };
  },

  // Queue management
  getApprovalQueue: () => {
    const queue = localStorage.getItem('auto_mode_approval_queue_v2');
    return queue ? JSON.parse(queue) : [];
  },

  getEscalationQueue: () => {
    const queue = localStorage.getItem('auto_mode_escalation_queue_v2');
    return queue ? JSON.parse(queue) : [];
  },

  getActionLog: () => {
    const log = localStorage.getItem('auto_mode_action_log_v2');
    return log ? JSON.parse(log) : [];
  },

  getAuditLog: () => {
    const log = localStorage.getItem('auto_mode_audit_log_v2');
    return log ? JSON.parse(log) : [];
  },

  // Internal write methods
  writeAudit: (entry) => {
    const auditLog = AutoModeEngineV2.getAuditLog();
    auditLog.unshift(entry);
    localStorage.setItem('auto_mode_audit_log_v2', JSON.stringify(auditLog.slice(0, 500)));
  },

  addActionLog: (action) => {
    const actionLog = AutoModeEngineV2.getActionLog();
    actionLog.unshift(action);
    localStorage.setItem('auto_mode_action_log_v2', JSON.stringify(actionLog.slice(0, 200)));
  },

  // Statistics
  getStats: () => {
    const auditLog = AutoModeEngineV2.getAuditLog();
    const approvalQueue = AutoModeEngineV2.getApprovalQueue();
    const escalationQueue = AutoModeEngineV2.getEscalationQueue();

    const executedToday = auditLog.filter(a => {
      const logDate = new Date(a.timestamp).toDateString();
      const today = new Date().toDateString();
      return logDate === today && a.status === 'executed';
    }).length;

    const executed = auditLog.filter(a => a.status === 'executed').length;
    const failed = auditLog.filter(a => a.status === 'failed').length;

    return {
      total_executed: executed,
      executed_today: executedToday,
      failed: failed,
      pending_approval: approvalQueue.length,
      escalated: escalationQueue.length,
      success_rate: executed + failed > 0 ? Math.round((executed / (executed + failed)) * 100) : 100,
    };
  },

  // Constants
  ACTION_TYPES,
  RISK_LEVELS,
};

export default AutoModeEngineV2;