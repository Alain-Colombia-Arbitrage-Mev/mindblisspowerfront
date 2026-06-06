// Auto Mode Configuration Helper
export const AUTO_MODE_CONFIG = {
  RISK_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  },
  OPERATING_MODES: {
    CONSERVATIVE: 'conservative',
    BALANCED: 'balanced',
    AGGRESSIVE: 'aggressive',
  },
  SAFETY_MODES: {
    STRICT: 'strict',
    FLEXIBLE: 'flexible',
  },
  DEFAULT_CONFIG: {
    enabled: false,
    operating_mode: 'balanced',
    safety_mode: 'strict',
    paused: false,
  },
  TIER_1_ACTIONS: [
    'create_payment_reminder',
    'mark_for_followup',
    'assign_advisor',
    'add_internal_note',
    'move_to_review',
    'prioritize_ticket',
    'classify_risk',
    'add_crm_alert',
    'update_action_queue',
  ],
  TIER_2_ACTIONS: [
    'reassign_leader',
    'reassign_advisor',
    'mark_payment_review',
    'move_user_status',
    'open_incident',
    'change_priority',
    'apply_intensive_followup',
    'create_network_intervention',
  ],
  TIER_3_ACTIONS: [
    'block_user',
    'approve_payment',
    'reject_payment',
    'change_investment',
    'alter_hierarchy',
    'change_permissions',
    'grant_admin_access',
    'revoke_admin_access',
    'delete_record',
  ],
};

export default AUTO_MODE_CONFIG;