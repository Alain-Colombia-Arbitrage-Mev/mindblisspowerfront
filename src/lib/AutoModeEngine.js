// Auto Mode Engine - Sistema de automatización inteligente
import UserManagementEngine from './UserManagementEngine';

const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

const ACTION_TYPES = {
  // Tier 1 - Low Risk
  CREATE_PAYMENT_REMINDER: 'create_payment_reminder',
  MARK_FOR_FOLLOWUP: 'mark_for_followup',
  ASSIGN_ADVISOR: 'assign_advisor',
  ADD_INTERNAL_NOTE: 'add_internal_note',
  MOVE_TO_REVIEW: 'move_to_review',
  PRIORITIZE_TICKET: 'prioritize_ticket',
  CLASSIFY_RISK: 'classify_risk',
  ADD_CRM_ALERT: 'add_crm_alert',
  UPDATE_ACTION_QUEUE: 'update_action_queue',

  // Tier 2 - Medium Risk
  REASSIGN_LEADER: 'reassign_leader',
  REASSIGN_ADVISOR: 'reassign_advisor',
  MARK_PAYMENT_REVIEW: 'mark_payment_review',
  MOVE_USER_STATUS: 'move_user_status',
  OPEN_INCIDENT: 'open_incident',
  CHANGE_PRIORITY: 'change_priority',
  APPLY_INTENSIVE_FOLLOWUP: 'apply_intensive_followup',
  CREATE_NETWORK_INTERVENTION: 'create_network_intervention',

  // Tier 3 - High Risk (Manual only)
  BLOCK_USER: 'block_user',
  APPROVE_PAYMENT: 'approve_payment',
  REJECT_PAYMENT: 'reject_payment',
  CHANGE_INVESTMENT: 'change_investment',
  ALTER_HIERARCHY: 'alter_hierarchy',
  CHANGE_PERMISSIONS: 'change_permissions',
  GRANT_ADMIN_ACCESS: 'grant_admin_access',
  REVOKE_ADMIN_ACCESS: 'revoke_admin_access',
  DELETE_RECORD: 'delete_record',
};

const OPERATING_MODES = {
  CONSERVATIVE: 'conservative',
  BALANCED: 'balanced',
  AGGRESSIVE: 'aggressive',
};

const SAFETY_MODES = {
  STRICT: 'strict',
  FLEXIBLE: 'flexible',
};

export const RISK_TIER = {
  T1: {
    label: 'T1',
    name: 'Auto',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.16)',
  },
  T2: {
    label: 'T2',
    name: 'Approval',
    color: '#fb923c',
    bgColor: 'rgba(251,146,60,0.16)',
  },
  T3: {
    label: 'T3',
    name: 'Manual',
    color: '#ef4444',
    bgColor: 'rgba(239,68,68,0.16)',
  },
};

export const MODULE_COLORS = {
  Payments: '#10b981',
  Network: '#8b5cf6',
  Compliance: '#ef4444',
  Support: '#fb923c',
  CRM: '#3b82f6',
  KYC: '#06b6d4',
  Ledger: '#14b8a6',
  Security: '#f43f5e',
  Admin: '#a855f7',
};

export const DEFAULT_RULES = [
  {
    id: 'AM-T1-001',
    module: 'Payments',
    trigger: 'Payment reminder due',
    condition: 'Due date within 72h and member active',
    action: 'Create reminder and schedule follow-up',
    riskTier: 'T1',
    owner: 'Finance Ops',
    enabled: true,
  },
  {
    id: 'AM-T1-002',
    module: 'CRM',
    trigger: 'High-value member inactivity',
    condition: 'No activity for 10+ days and package active',
    action: 'Mark for advisor follow-up',
    riskTier: 'T1',
    owner: 'Growth Ops',
    enabled: true,
  },
  {
    id: 'AM-T1-003',
    module: 'Support',
    trigger: 'Ticket priority drift',
    condition: 'Open ticket older than SLA threshold',
    action: 'Prioritize ticket and notify owner',
    riskTier: 'T1',
    owner: 'Support Lead',
    enabled: true,
  },
  {
    id: 'AM-T2-001',
    module: 'Network',
    trigger: 'Binary leg imbalance',
    condition: 'Leg spread exceeds configured threshold',
    action: 'Create network intervention for approval',
    riskTier: 'T2',
    owner: 'Network Ops',
    enabled: true,
  },
  {
    id: 'AM-T2-002',
    module: 'Compliance',
    trigger: 'KYC risk score increase',
    condition: 'Risk moved from medium to high',
    action: 'Open compliance review incident',
    riskTier: 'T2',
    owner: 'Compliance',
    enabled: true,
  },
  {
    id: 'AM-T2-003',
    module: 'Ledger',
    trigger: 'Manual adjustment detected',
    condition: 'Adjustment requires four-eyes review',
    action: 'Queue ledger review approval',
    riskTier: 'T2',
    owner: 'Finance Controller',
    enabled: false,
  },
];

const APPROVAL_RECORDS = [
  { id: 'VP-1024', name: 'Mariana Torres', country: 'CO', plan: 'Elite', amount: '$1,200' },
  { id: 'VP-1188', name: 'Carlos Vega', country: 'MX', plan: 'Pro', amount: '$650' },
  { id: 'VP-1310', name: 'Lucia Ramos', country: 'PE', compliance: 'Medium' },
];

export function generateExecutionQueue(tick = 0) {
  const suffix = String(Math.max(1, tick || 1)).padStart(2, '0');
  return [
    {
      id: `EX-${suffix}-001`,
      title: 'Payment reminder scheduled',
      module: 'Payments',
      trigger: 'Due date inside 72h',
      affected: 18,
      confidence: 91,
      executedAt: '08:20',
      status: 'executed',
      rollbackAvailable: true,
    },
    {
      id: `EX-${suffix}-002`,
      title: 'Advisor follow-up queue updated',
      module: 'CRM',
      trigger: 'High-value inactivity',
      affected: 7,
      confidence: 84,
      executedAt: '08:26',
      status: 'executed',
      rollbackAvailable: true,
    },
    {
      id: `EX-${suffix}-003`,
      title: 'Support tickets reprioritized',
      module: 'Support',
      trigger: 'SLA drift',
      affected: 5,
      confidence: 78,
      executedAt: '08:31',
      status: 'scheduled',
      rollbackAvailable: false,
    },
  ];
}

export function generateApprovalQueue() {
  return [
    {
      id: 'AP-204',
      title: 'Approve network intervention batch',
      module: 'Network',
      reason: 'Detected binary imbalance requires operator validation before any structural action.',
      suggestedOwner: 'Network Ops',
      affected: 3,
      confidence: 72,
      status: 'pending',
      affectedRecords: APPROVAL_RECORDS,
    },
    {
      id: 'AP-205',
      title: 'Review compliance escalation',
      module: 'Compliance',
      reason: 'KYC profile changed risk tier after document mismatch signal.',
      suggestedOwner: 'Compliance',
      affected: 1,
      confidence: 68,
      status: 'pending',
      affectedRecords: [APPROVAL_RECORDS[2]],
    },
  ];
}

export function generateEscalationQueue() {
  return [
    {
      id: 'ESC-031',
      title: 'Blocked role change attempt',
      module: 'Security',
      severity: 'critical',
      escalatedAt: '08:34',
      reason: 'Permission mutation is classified as Tier 3 and cannot be executed automatically.',
      manualAction: 'Requires manual review by Super Admin and audit note before execution.',
      affectedModule: 'Admin Access',
      affectedCount: 1,
    },
    {
      id: 'ESC-032',
      title: 'Financial verification requested',
      module: 'Ledger',
      severity: 'high',
      escalatedAt: '08:41',
      reason: 'Large payout approval matched a protected operation rule.',
      manualAction: 'Finance controller must approve or reject in the ledger workflow.',
      affectedModule: 'Payouts',
      affectedCount: 2,
    },
  ];
}

export function generateExecutionLog(tick = 0) {
  const suffix = String(Math.max(1, tick || 1)).padStart(2, '0');
  return [
    {
      id: `LOG-${suffix}-001`,
      action: 'Payment reminder scheduled',
      module: 'Payments',
      trigger: 'Due date inside 72h',
      riskTier: 'T1',
      confidence: 91,
      approvedBy: 'AUTO',
      ts: '08:20:14',
      result: 'success',
    },
    {
      id: `LOG-${suffix}-002`,
      action: 'Advisor follow-up queue updated',
      module: 'CRM',
      trigger: 'High-value inactivity',
      riskTier: 'T1',
      confidence: 84,
      approvedBy: 'AUTO',
      ts: '08:26:02',
      result: 'success',
    },
    {
      id: `LOG-${suffix}-003`,
      action: 'Network intervention queued',
      module: 'Network',
      trigger: 'Binary leg imbalance',
      riskTier: 'T2',
      confidence: 72,
      approvedBy: 'Admin',
      ts: '08:32:45',
      result: 'success',
    },
  ];
}

export function safetyGuardCheck(action) {
  const protectedModules = new Set(['Security', 'Ledger', 'Admin']);
  const tier = action?.riskTier || action?.risk_level;
  const module = action?.module;

  if (tier === 'T3' || protectedModules.has(module)) {
    return {
      allowed: false,
      reason: 'Protected operation requires manual approval.',
    };
  }

  return { allowed: true, reason: 'Action is inside Auto Mode guardrails.' };
}

export const AutoModeEngine = {
  // Obtener configuración
  getConfig: () => {
    const config = localStorage.getItem('auto_mode_config');
    return config ? JSON.parse(config) : {
      enabled: false,
      operating_mode: OPERATING_MODES.BALANCED,
      safety_mode: SAFETY_MODES.STRICT,
      created_at: new Date().toISOString(),
    };
  },

  // Guardar configuración
  saveConfig: (config) => {
    localStorage.setItem('auto_mode_config', JSON.stringify(config));
    return config;
  },

  // Obtener riesgo de acción
  getActionRiskLevel: (actionType) => {
    const tier1 = [
      ACTION_TYPES.CREATE_PAYMENT_REMINDER,
      ACTION_TYPES.MARK_FOR_FOLLOWUP,
      ACTION_TYPES.ADD_INTERNAL_NOTE,
      ACTION_TYPES.MOVE_TO_REVIEW,
      ACTION_TYPES.PRIORITIZE_TICKET,
      ACTION_TYPES.CLASSIFY_RISK,
      ACTION_TYPES.ADD_CRM_ALERT,
      ACTION_TYPES.UPDATE_ACTION_QUEUE,
    ];

    const tier2 = [
      ACTION_TYPES.REASSIGN_LEADER,
      ACTION_TYPES.REASSIGN_ADVISOR,
      ACTION_TYPES.MARK_PAYMENT_REVIEW,
      ACTION_TYPES.MOVE_USER_STATUS,
      ACTION_TYPES.OPEN_INCIDENT,
      ACTION_TYPES.CHANGE_PRIORITY,
      ACTION_TYPES.APPLY_INTENSIVE_FOLLOWUP,
      ACTION_TYPES.CREATE_NETWORK_INTERVENTION,
    ];

    if (tier1.includes(actionType)) return RISK_LEVELS.LOW;
    if (tier2.includes(actionType)) return RISK_LEVELS.MEDIUM;
    return RISK_LEVELS.HIGH;
  },

  // Analizar y generar acciones automáticas
  analyzeAndGenerateActions: () => {
    const config = AutoModeEngine.getConfig();
    if (!config.enabled) return [];

    const users = UserManagementEngine.getAllUsers();
    const actions = [];

    users.forEach(user => {
      // Pago pendiente cercano a vencimiento
      if (user.status === 'active' && user.investment_total > 0 && Math.random() > 0.8) {
        actions.push({
          id: `auto-${user.id}-payment-reminder`,
          type: ACTION_TYPES.CREATE_PAYMENT_REMINDER,
          risk_level: RISK_LEVELS.LOW,
          user_id: user.id,
          user_name: user.full_name,
          title: `Recordatorio de pago para ${user.full_name}`,
          reason: 'Pago pendiente detectado',
          status: 'pending',
          timestamp: new Date().toISOString(),
          data: { amount: user.investment_total, days_until_due: Math.floor(Math.random() * 30) + 5 },
        });
      }

      // Usuario sin líder asignado
      if (!user.upline_id && user.role !== 'admin' && user.status === 'pending') {
        actions.push({
          id: `auto-${user.id}-assign-leader`,
          type: ACTION_TYPES.ASSIGN_ADVISOR,
          risk_level: RISK_LEVELS.LOW,
          user_id: user.id,
          user_name: user.full_name,
          title: `Asignar asesor a ${user.full_name}`,
          reason: 'Usuario sin asignación de asesor',
          status: 'pending',
          timestamp: new Date().toISOString(),
        });
      }

      // Usuario de alto valor sin actividad
      if (user.investment_total > 2000 && user.status === 'active' && Math.random() > 0.7) {
        actions.push({
          id: `auto-${user.id}-high-value-check`,
          type: ACTION_TYPES.MARK_FOR_FOLLOWUP,
          risk_level: RISK_LEVELS.LOW,
          user_id: user.id,
          user_name: user.full_name,
          title: `Seguimiento para usuario de alto valor: ${user.full_name}`,
          reason: 'Usuario de alto valor detectado sin actividad reciente',
          status: 'pending',
          timestamp: new Date().toISOString(),
          data: { investment: user.investment_total },
        });
      }

      // Líder con red desbalanceada
      if (user.role === 'leader' && Math.random() > 0.85) {
        const network = users.filter(u => u.upline_id === user.id);
        const leftSide = network.filter(u => u.network_side === 'left').length;
        const rightSide = network.filter(u => u.network_side === 'right').length;

        if (Math.abs(leftSide - rightSide) > 5 && network.length > 10) {
          actions.push({
            id: `auto-${user.id}-network-rebalance`,
            type: ACTION_TYPES.CREATE_NETWORK_INTERVENTION,
            risk_level: RISK_LEVELS.MEDIUM,
            user_id: user.id,
            user_name: user.full_name,
            title: `Intervención de red para ${user.full_name}`,
            reason: `Red desbalanceada detectada (${leftSide}L - ${rightSide}R)`,
            status: 'pending_approval',
            timestamp: new Date().toISOString(),
            data: { left: leftSide, right: rightSide, network_size: network.length },
          });
        }
      }
    });

    return actions.sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      return riskOrder[a.risk_level] - riskOrder[b.risk_level];
    });
  },

  // Procesar acción según riesgo
  processAction: (action) => {
    const config = AutoModeEngine.getConfig();
    const riskLevel = action.risk_level;

    // Low risk - Auto execute
    if (riskLevel === RISK_LEVELS.LOW) {
      return AutoModeEngine.executeAction(action);
    }

    // Medium risk - Queue for approval
    if (riskLevel === RISK_LEVELS.MEDIUM) {
      return AutoModeEngine.queueForApproval(action);
    }

    // High risk - Escalate
    if (riskLevel === RISK_LEVELS.HIGH) {
      return AutoModeEngine.escalate(action);
    }
  },

  // Ejecutar acción
  executeAction: (action) => {
    const user = UserManagementEngine.getUser(action.user_id);
    if (!user) return { success: false, message: 'Usuario no encontrado' };

    const executedAction = {
      ...action,
      status: 'executed',
      executed_at: new Date().toISOString(),
    };

    // Log
    const actionLog = AutoModeEngine.getActionLog();
    actionLog.unshift(executedAction);
    localStorage.setItem('auto_mode_action_log', JSON.stringify(actionLog.slice(0, 200)));

    // Update user if needed
    if (action.type === 'move_to_review') {
      UserManagementEngine.updateUser(action.user_id, { status: 'under_review' });
    }

    UserManagementEngine.addHistory(action.user_id, `Auto Mode: ${action.title}`);

    return { success: true, action: executedAction, message: 'Acción ejecutada automáticamente' };
  },

  // Cola de aprobación
  queueForApproval: (action) => {
    const approvalQueue = AutoModeEngine.getApprovalQueue();
    approvalQueue.unshift({ ...action, status: 'pending_approval' });
    localStorage.setItem('auto_mode_approval_queue', JSON.stringify(approvalQueue.slice(0, 50)));
    return { success: true, message: 'Acción en cola de aprobación' };
  },

  // Escalación
  escalate: (action) => {
    const escalationQueue = AutoModeEngine.getEscalationQueue();
    escalationQueue.unshift({ ...action, status: 'escalated', escalated_at: new Date().toISOString() });
    localStorage.setItem('auto_mode_escalation_queue', JSON.stringify(escalationQueue.slice(0, 50)));
    return { success: true, message: 'Caso escalado para revisión manual' };
  },

  // Obtener colas
  getApprovalQueue: () => {
    const queue = localStorage.getItem('auto_mode_approval_queue');
    return queue ? JSON.parse(queue) : [];
  },

  getEscalationQueue: () => {
    const queue = localStorage.getItem('auto_mode_escalation_queue');
    return queue ? JSON.parse(queue) : [];
  },

  getActionLog: () => {
    const log = localStorage.getItem('auto_mode_action_log');
    return log ? JSON.parse(log) : [];
  },

  // Aprobar acción
  approveAction: (actionId) => {
    const approvalQueue = AutoModeEngine.getApprovalQueue();
    const action = approvalQueue.find(a => a.id === actionId);

    if (action) {
      approvalQueue.splice(approvalQueue.indexOf(action), 1);
      localStorage.setItem('auto_mode_approval_queue', JSON.stringify(approvalQueue));

      const result = AutoModeEngine.executeAction(action);
      return result;
    }

    return { success: false, message: 'Acción no encontrada' };
  },

  // Rechazar acción
  rejectAction: (actionId) => {
    const approvalQueue = AutoModeEngine.getApprovalQueue();
    const action = approvalQueue.find(a => a.id === actionId);

    if (action) {
      approvalQueue.splice(approvalQueue.indexOf(action), 1);
      localStorage.setItem('auto_mode_approval_queue', JSON.stringify(approvalQueue));

      return { success: true, message: 'Acción rechazada' };
    }

    return { success: false, message: 'Acción no encontrada' };
  },

  // Estadísticas
  getStats: () => {
    const actionLog = AutoModeEngine.getActionLog();
    const approvalQueue = AutoModeEngine.getApprovalQueue();
    const escalationQueue = AutoModeEngine.getEscalationQueue();

    const todayLog = actionLog.filter(a => {
      const logDate = new Date(a.executed_at).toDateString();
      const today = new Date().toDateString();
      return logDate === today;
    });

    return {
      total_executed: actionLog.length,
      executed_today: todayLog.length,
      pending_approval: approvalQueue.length,
      escalated: escalationQueue.length,
      success_rate: actionLog.length > 0 ? 100 : 0,
    };
  },

  // Constantes
  RISK_LEVELS,
  ACTION_TYPES,
  OPERATING_MODES,
  SAFETY_MODES,
};

export default AutoModeEngine;
