/**
 * Role-Based Permission System
 * Defines roles and their allowed actions/modules
 */

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  FINANCE: 'finance',
  SUPPORT: 'support',
  LEADER_SUPERVISOR: 'leader_supervisor',
  MARKETING_OPERATOR: 'marketing_operator',
};

const PERMISSIONS = {
  // Payment/Finance
  VIEW_PAYMENTS: 'view_payments',
  APPROVE_PAYMENTS: 'approve_payments',
  REJECT_PAYMENTS: 'reject_payments',
  MODIFY_PAYMENTS: 'modify_payments',

  // Participants/Users
  VIEW_PARTICIPANTS: 'view_participants',
  EDIT_PARTICIPANTS: 'edit_participants',
  REASSIGN_PARTICIPANTS: 'reassign_participants',
  DELETE_PARTICIPANTS: 'delete_participants',

  // Leaders
  VIEW_LEADERS: 'view_leaders',
  EDIT_LEADERS: 'edit_leaders',
  MODIFY_LEADER_STATUS: 'modify_leader_status',
  DELETE_LEADERS: 'delete_leaders',

  // Support
  VIEW_SUPPORT_CASES: 'view_support_cases',
  MANAGE_SUPPORT_CASES: 'manage_support_cases',
  CLOSE_SUPPORT_CASES: 'close_support_cases',

  // Investments
  VIEW_INVESTMENTS: 'view_investments',
  APPROVE_INVESTMENTS: 'approve_investments',
  MODIFY_INVESTMENTS: 'modify_investments',

  // CRM
  VIEW_CRM: 'view_crm',
  EDIT_CRM: 'edit_crm',

  // Permissions/Roles
  MANAGE_PERMISSIONS: 'manage_permissions',
  MANAGE_ROLES: 'manage_roles',

  // Marketing
  VIEW_MARKETING: 'view_marketing',
  MANAGE_CAMPAIGNS: 'manage_campaigns',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_GROWTH_LAB: 'manage_growth_lab',

  // Control Center
  ACCESS_CONTROL_CENTER: 'access_control_center',
  MANAGE_AI_BRAIN: 'manage_ai_brain',
  MANAGE_AUTO_MODE: 'manage_auto_mode',

  // Global Control
  ACCESS_GLOBAL_CONTROL: 'access_global_control',
  MANAGE_COUNTRY_SETTINGS: 'manage_country_settings',

  // Audit & Settings
  VIEW_AUDIT: 'view_audit',
  MANAGE_SETTINGS: 'manage_settings',
};

const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // Has ALL permissions
    ...Object.values(PERMISSIONS),
  ],

  [ROLES.ADMIN]: [
    // Can do most things except delete
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.APPROVE_PAYMENTS,
    PERMISSIONS.VIEW_PARTICIPANTS,
    PERMISSIONS.EDIT_PARTICIPANTS,
    PERMISSIONS.REASSIGN_PARTICIPANTS,
    PERMISSIONS.VIEW_LEADERS,
    PERMISSIONS.EDIT_LEADERS,
    PERMISSIONS.VIEW_SUPPORT_CASES,
    PERMISSIONS.MANAGE_SUPPORT_CASES,
    PERMISSIONS.CLOSE_SUPPORT_CASES,
    PERMISSIONS.VIEW_INVESTMENTS,
    PERMISSIONS.APPROVE_INVESTMENTS,
    PERMISSIONS.VIEW_CRM,
    PERMISSIONS.EDIT_CRM,
    PERMISSIONS.VIEW_MARKETING,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_GROWTH_LAB,
    PERMISSIONS.ACCESS_CONTROL_CENTER,
    PERMISSIONS.MANAGE_AI_BRAIN,
    PERMISSIONS.MANAGE_AUTO_MODE,
    PERMISSIONS.ACCESS_GLOBAL_CONTROL,
    PERMISSIONS.VIEW_AUDIT,
  ],

  [ROLES.FINANCE]: [
    PERMISSIONS.VIEW_PAYMENTS,
    PERMISSIONS.APPROVE_PAYMENTS,
    PERMISSIONS.REJECT_PAYMENTS,
    PERMISSIONS.VIEW_PARTICIPANTS,
    PERMISSIONS.VIEW_INVESTMENTS,
    PERMISSIONS.APPROVE_INVESTMENTS,
    PERMISSIONS.VIEW_AUDIT,
  ],

  [ROLES.SUPPORT]: [
    PERMISSIONS.VIEW_PARTICIPANTS,
    PERMISSIONS.VIEW_SUPPORT_CASES,
    PERMISSIONS.MANAGE_SUPPORT_CASES,
    PERMISSIONS.CLOSE_SUPPORT_CASES,
    PERMISSIONS.VIEW_CRM,
    PERMISSIONS.EDIT_CRM,
  ],

  [ROLES.LEADER_SUPERVISOR]: [
    PERMISSIONS.VIEW_LEADERS,
    PERMISSIONS.EDIT_LEADERS,
    PERMISSIONS.MODIFY_LEADER_STATUS,
    PERMISSIONS.VIEW_PARTICIPANTS,
    PERMISSIONS.REASSIGN_PARTICIPANTS,
    PERMISSIONS.VIEW_MARKETING,
    PERMISSIONS.VIEW_ANALYTICS,
  ],

  [ROLES.MARKETING_OPERATOR]: [
    PERMISSIONS.VIEW_MARKETING,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_GROWTH_LAB,
    PERMISSIONS.VIEW_PARTICIPANTS,
  ],
};

/**
 * Get permissions for a role
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if role has specific permission
 */
export const hasPermission = (role, permission) => {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
};

/**
 * Check if role has any of multiple permissions
 */
export const hasAnyPermission = (role, permissions) => {
  const rolePerms = getRolePermissions(role);
  return permissions.some(perm => rolePerms.includes(perm));
};

/**
 * Check if role has all of multiple permissions
 */
export const hasAllPermissions = (role, permissions) => {
  const rolePerms = getRolePermissions(role);
  return permissions.every(perm => rolePerms.includes(perm));
};

/**
 * Get human-readable role name
 */
export const getRoleName = (role) => {
  const names = {
    [ROLES.SUPER_ADMIN]: 'Super Admin',
    [ROLES.ADMIN]: 'Admin',
    [ROLES.FINANCE]: 'Finance Officer',
    [ROLES.SUPPORT]: 'Support Specialist',
    [ROLES.LEADER_SUPERVISOR]: 'Leader Supervisor',
    [ROLES.MARKETING_OPERATOR]: 'Marketing Operator',
  };
  return names[role] || role;
};

export { ROLES, PERMISSIONS, ROLE_PERMISSIONS };