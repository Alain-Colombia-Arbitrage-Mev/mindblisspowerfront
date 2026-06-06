/**
 * VICION AI Copilot — Operational Action Engine
 * Converts AI Brain insights into structured, executable admin operations.
 * Never auto-executes. Requires admin confirmation on every action.
 */

import { PARTICIPANTS_DATA, LEADERS_DATA, SUPPORT_CASES_DATA } from './SimulatedData';
import { CAMPAIGNS } from './acquisitionData';
import { CAMPAIGN_LIFECYCLE } from './campaignIntelligence';

// ─── ACTION TYPES ────────────────────────────────────────────────────────────

export const ACTION_TYPES = {
  REASSIGN_ADVISOR:     'reassign_advisor',
  REVIEW_PAYMENT:       'review_payment',
  FOLLOW_UP_CRM:        'follow_up_crm',
  INVESTIGATE_LEADER:   'investigate_leader',
  ESCALATE_SUPPORT:     'escalate_support',
  PAUSE_CAMPAIGN:       'pause_campaign',
  KYC_REVIEW:           'kyc_review',
  COMPLIANCE_REVIEW:    'compliance_review',
  REACTIVATE_DORMANT:   'reactivate_dormant',
  ASSIGN_SUPPORT:       'assign_support',
};

const MODULE_COLORS = {
  CRM:         '#8b5cf6',
  Participants:'#3b82f6',
  Payments:    '#06b6d4',
  Investments: '#fb923c',
  Leaders:     '#f59e0b',
  Support:     '#ef4444',
  Marketing:   '#10b981',
  Permissions: '#a855f7',
};

export function getModuleColor(module) {
  return MODULE_COLORS[module] || '#6b7280';
}

// ─── ADVISORS POOL ───────────────────────────────────────────────────────────

const ADVISORS = ['Carlos López', 'Ana Martínez', 'Roberto Díaz', 'Luisa Torres', 'Miguel Herrera'];

// ─── CORE ACTION GENERATORS ──────────────────────────────────────────────────

function genAdvisorReassignActions() {
  const noAdvisor = PARTICIPANTS_DATA.filter(p =>
    p.status === 'active' && (!p.advisor || p.advisor === 'Unassigned')
  );
  if (noAdvisor.length === 0) return [];

  return [{
    id: 'COP-001',
    type: ACTION_TYPES.REASSIGN_ADVISOR,
    title: `Reassign advisors to ${noAdvisor.length} active participants`,
    context: `${noAdvisor.length} active participants currently have no advisor assigned. This reduces engagement and increases churn risk.`,
    reason: 'Unadvised participants show 3x higher dropout rate within 30 days of activation.',
    suggestedAction: 'Distribute participants evenly across available advisors based on current load.',
    executionTarget: 'Participants',
    module: 'Participants',
    priority: 'high',
    affectedCount: noAdvisor.length,
    affectedEntities: noAdvisor.slice(0, 10).map(p => ({ id: p.id, name: p.name, country: p.country, plan: p.plan, amount: p.amount })),
    suggestedOperator: 'Senior Advisor',
    steps: [
      { step: 1, label: 'Filter unassigned active participants', detail: `${noAdvisor.length} participants identified` },
      { step: 2, label: 'Distribute by advisor capacity', detail: `~${Math.ceil(noAdvisor.length / ADVISORS.length)} per advisor` },
      { step: 3, label: 'Notify each assigned advisor', detail: 'Internal notification + task creation' },
      { step: 4, label: 'Log assignment in participant record', detail: 'Audit trail for compliance' },
    ],
    payload: {
      participants: noAdvisor,
      advisors: ADVISORS,
      distribution: ADVISORS.map((adv, i) => ({
        advisor: adv,
        assigned: noAdvisor.filter((_, idx) => idx % ADVISORS.length === i).map(p => p.name),
      })),
    },
  }];
}

function genPaymentReviewActions() {
  const flagged = PARTICIPANTS_DATA.filter(p =>
    p.paymentStatus === 'under_review' || p.paymentStatus === 'flagged'
  );
  const highValuePending = PARTICIPANTS_DATA.filter(p =>
    p.paymentStatus === 'pending' && p.amount >= 1000
  );

  const actions = [];

  if (flagged.length > 0) {
    actions.push({
      id: 'COP-002',
      type: ACTION_TYPES.REVIEW_PAYMENT,
      title: `Review ${flagged.length} flagged payment${flagged.length > 1 ? 's' : ''} under AML scrutiny`,
      context: `${flagged.length} payments are currently flagged or under AML review. Regulatory exposure increases with each day of inaction.`,
      reason: 'AML flags require resolution within 48h per internal compliance policy.',
      suggestedAction: 'Assign senior finance reviewer to each flagged payment. Request supporting documentation.',
      executionTarget: 'Payments',
      module: 'Payments',
      priority: 'critical',
      affectedCount: flagged.length,
      affectedEntities: flagged.map(p => ({ id: p.id, name: p.name, amount: p.amount, method: p.paymentMethod, riskScore: p.riskScore })),
      suggestedOperator: 'Finance Reviewer',
      steps: [
        { step: 1, label: 'Pull flagged payment list', detail: `${flagged.length} records isolated` },
        { step: 2, label: 'Request bank statements from participants', detail: 'Email template prepared' },
        { step: 3, label: 'Assign to senior AML reviewer', detail: 'Tracker updated' },
        { step: 4, label: 'Resolve or escalate within 48h', detail: 'SLA clock active' },
      ],
      payload: { payments: flagged },
    });
  }

  if (highValuePending.length > 0) {
    actions.push({
      id: 'COP-003',
      type: ACTION_TYPES.REVIEW_PAYMENT,
      title: `Expedite ${highValuePending.length} high-value pending payment${highValuePending.length > 1 ? 's' : ''}`,
      context: `${highValuePending.length} participant${highValuePending.length > 1 ? 's have' : ' has'} plans worth $1,000+ with payments in pending state.`,
      reason: 'High-value activations delayed by payment processing reduce cycle-eligible volume and trust.',
      suggestedAction: 'Manually verify and fast-track confirmation for plans ≥ $1,000.',
      executionTarget: 'Payments',
      module: 'Payments',
      priority: 'high',
      affectedCount: highValuePending.length,
      affectedEntities: highValuePending.map(p => ({ id: p.id, name: p.name, amount: p.amount, method: p.paymentMethod })),
      suggestedOperator: 'Finance Reviewer',
      steps: [
        { step: 1, label: 'Filter pending payments ≥ $1,000', detail: `${highValuePending.length} records` },
        { step: 2, label: 'Contact participant to confirm transfer', detail: 'Phone/email outreach' },
        { step: 3, label: 'Mark as verified once confirmed', detail: 'Triggers activation flow' },
      ],
      payload: { payments: highValuePending },
    });
  }

  return actions;
}

function genCRMFollowUpActions() {
  const dormant = PARTICIPANTS_DATA.filter(p =>
    ['inactive', 'paused'].includes(p.status) && p.kyc === 'verified' && p.amount >= 500
  );
  const highIntent = PARTICIPANTS_DATA.filter(p =>
    p.status === 'pending_verification' && p.amount >= 1000
  );
  const actions = [];

  if (dormant.length >= 3) {
    actions.push({
      id: 'COP-004',
      type: ACTION_TYPES.REACTIVATE_DORMANT,
      title: `Reactivate ${dormant.length} dormant verified participants`,
      context: `${dormant.length} participants with verified KYC and confirmed plan history are currently dormant or paused.`,
      reason: 'Verified participants with prior investment have 4x higher reactivation rate vs cold leads. Minimum reactivation cost.',
      suggestedAction: 'Personal advisor contact sequence: call → email → note. Focus on plan benefits update.',
      executionTarget: 'CRM',
      module: 'CRM',
      priority: 'medium',
      affectedCount: dormant.length,
      affectedEntities: dormant.map(p => ({ id: p.id, name: p.name, country: p.country, amount: p.amount, advisor: p.advisor })),
      suggestedOperator: 'Advisor Team',
      steps: [
        { step: 1, label: 'Export dormant verified list', detail: `${dormant.length} participants` },
        { step: 2, label: 'Assign reactivation advisor per participant', detail: 'Based on country/language match' },
        { step: 3, label: 'Personal outreach — call first', detail: 'Script: cycle update + referral offer' },
        { step: 4, label: 'Log outcome as note in CRM record', detail: 'Track response rate' },
      ],
      payload: { participants: dormant },
    });
  }

  if (highIntent.length > 0) {
    actions.push({
      id: 'COP-005',
      type: ACTION_TYPES.FOLLOW_UP_CRM,
      title: `Priority follow-up on ${highIntent.length} high-value pending registrations`,
      context: `${highIntent.length} high-value registrations (≥$1,000) are stalled in verification. These are high-intent entrants.`,
      reason: 'Each day of delay in KYC completion reduces activation probability by ~8%.',
      suggestedAction: 'Assign dedicated KYC reviewer and advisor to accelerate approval.',
      executionTarget: 'CRM',
      module: 'CRM',
      priority: 'high',
      affectedCount: highIntent.length,
      affectedEntities: highIntent.map(p => ({ id: p.id, name: p.name, country: p.country, amount: p.amount })),
      suggestedOperator: 'Senior Advisor',
      steps: [
        { step: 1, label: 'Filter high-value pending registrations', detail: `${highIntent.length} participants ≥$1,000` },
        { step: 2, label: 'Send urgent KYC completion reminder', detail: 'Personalized email template' },
        { step: 3, label: 'Pre-assign advisor for post-KYC onboarding', detail: 'Warm handoff reduces churn' },
      ],
      payload: { participants: highIntent },
    });
  }

  return actions;
}

function genLeaderActions() {
  const violations = LEADERS_DATA.filter(l => l.violations >= 3);
  const declining = LEADERS_DATA.filter(l => l.growth && l.growth.startsWith('-'));
  const lowCompliance = LEADERS_DATA.filter(l => l.compliance < 70 && !['suspended'].includes(l.status));
  const actions = [];

  if (violations.length > 0) {
    actions.push({
      id: 'COP-006',
      type: ACTION_TYPES.COMPLIANCE_REVIEW,
      title: `Compliance intervention: ${violations.map(l => l.name).join(', ')}`,
      context: `${violations.length} leader${violations.length > 1 ? 's have' : ' has'} accumulated 3+ communication violations.`,
      reason: 'Off-script messaging creates regulatory liability and damages participant trust.',
      suggestedAction: 'Initiate mandatory retraining and freeze activation privileges pending review.',
      executionTarget: 'Leaders',
      module: 'Leaders',
      priority: 'critical',
      affectedCount: violations.length,
      affectedEntities: violations.map(l => ({ id: l.id, name: l.name, country: l.country, violations: l.violations, network: l.network })),
      suggestedOperator: 'Compliance Officer',
      steps: [
        { step: 1, label: 'Freeze activation privileges', detail: 'Temporary pending review completion' },
        { step: 2, label: 'Schedule compliance interview', detail: 'Within 72h' },
        { step: 3, label: 'Assign mandatory retraining module', detail: 'Communication guidelines certification' },
        { step: 4, label: 'Document outcome in leader record', detail: 'Audit trail' },
      ],
      payload: { leaders: violations },
    });
  }

  if (declining.length > 0) {
    actions.push({
      id: 'COP-007',
      type: ACTION_TYPES.INVESTIGATE_LEADER,
      title: `Performance investigation: ${declining.map(l => l.name).join(', ')}`,
      context: `${declining.length} leader${declining.length > 1 ? 's are' : ' is'} showing negative network growth. Early intervention reduces network contraction.`,
      reason: 'Leader network decline compounds downstream participant churn within 30–60 days.',
      suggestedAction: 'Schedule 1:1 coaching session. Review network composition and identify root cause.',
      executionTarget: 'Leaders',
      module: 'Leaders',
      priority: 'high',
      affectedCount: declining.length,
      affectedEntities: declining.map(l => ({ id: l.id, name: l.name, country: l.country, growth: l.growth, network: l.network })),
      suggestedOperator: 'Leadership Coach',
      steps: [
        { step: 1, label: 'Pull last 3 months network data', detail: 'Identify trend inflection point' },
        { step: 2, label: 'Schedule leader coaching call', detail: 'Agenda: team morale + structure review' },
        { step: 3, label: 'Assign global mentor for support', detail: '30-day monitoring plan' },
      ],
      payload: { leaders: declining },
    });
  }

  if (lowCompliance.length > 0) {
    actions.push({
      id: 'COP-008',
      type: ACTION_TYPES.COMPLIANCE_REVIEW,
      title: `Compliance gap: ${lowCompliance.length} leader${lowCompliance.length > 1 ? 's' : ''} below 70% threshold`,
      context: `${lowCompliance.length} active leaders have compliance scores below the 70% minimum operational threshold.`,
      reason: 'Leaders below 70% compliance are 6x more likely to generate participant disputes.',
      suggestedAction: 'Issue compliance notice and require re-certification within 14 days.',
      executionTarget: 'Leaders',
      module: 'Leaders',
      priority: 'medium',
      affectedCount: lowCompliance.length,
      affectedEntities: lowCompliance.map(l => ({ id: l.id, name: l.name, country: l.country, compliance: l.compliance })),
      suggestedOperator: 'Compliance Officer',
      steps: [
        { step: 1, label: 'Send compliance gap notice', detail: 'Include specific violation categories' },
        { step: 2, label: 'Assign remediation training', detail: 'Targeted module by gap type' },
        { step: 3, label: 'Schedule compliance re-check in 14 days', detail: 'Automated reminder set' },
      ],
      payload: { leaders: lowCompliance },
    });
  }

  return actions;
}

function genSupportActions() {
  const critical = SUPPORT_CASES_DATA.filter(c => c.priority === 'critical' && c.status !== 'resolved');
  const unassigned = SUPPORT_CASES_DATA.filter(c => c.assigned === 'Unassigned');
  const slaBreached = SUPPORT_CASES_DATA.filter(c => c.sla === 'BREACHED');
  const actions = [];

  if (slaBreached.length > 0) {
    actions.push({
      id: 'COP-009',
      type: ACTION_TYPES.ESCALATE_SUPPORT,
      title: `Escalate ${slaBreached.length} SLA-breached support case${slaBreached.length > 1 ? 's' : ''}`,
      context: `${slaBreached.length} support case${slaBreached.length > 1 ? 's have' : ' has'} exceeded internal SLA thresholds.`,
      reason: 'SLA breaches directly impact participant satisfaction scores and retention.',
      suggestedAction: 'Escalate to senior support lead. Send participant acknowledgment within 2h.',
      executionTarget: 'Support',
      module: 'Support',
      priority: 'critical',
      affectedCount: slaBreached.length,
      affectedEntities: slaBreached.map(c => ({ id: c.id, title: c.title, participant: c.participant, age: c.age, assigned: c.assigned })),
      suggestedOperator: 'Support Lead',
      steps: [
        { step: 1, label: 'Escalate to support lead', detail: 'Immediate assignment' },
        { step: 2, label: 'Send apology + ETA to participant', detail: 'Email template prepared' },
        { step: 3, label: 'Resolve or partial resolution within 4h', detail: 'SLA recovery protocol' },
        { step: 4, label: 'Post-resolution follow-up in 24h', detail: 'Satisfaction check' },
      ],
      payload: { cases: slaBreached },
    });
  }

  if (unassigned.length > 0) {
    actions.push({
      id: 'COP-010',
      type: ACTION_TYPES.ASSIGN_SUPPORT,
      title: `Assign ${unassigned.length} unowned support case${unassigned.length > 1 ? 's' : ''}`,
      context: `${unassigned.length} open case${unassigned.length > 1 ? 's are' : ' is'} currently unassigned. Idle cases degrade to SLA breach within 24h.`,
      reason: 'Unassigned cases have 8x higher probability of SLA breach than assigned cases.',
      suggestedAction: 'Distribute to available support agents based on case type and current workload.',
      executionTarget: 'Support',
      module: 'Support',
      priority: 'high',
      affectedCount: unassigned.length,
      affectedEntities: unassigned.map(c => ({ id: c.id, title: c.title, type: c.type, priority: c.priority })),
      suggestedOperator: 'Support Manager',
      steps: [
        { step: 1, label: 'List all unassigned cases', detail: `${unassigned.length} cases` },
        { step: 2, label: 'Match case type to agent specialty', detail: 'Payment cases → Finance-trained agents' },
        { step: 3, label: 'Assign and notify agents', detail: 'Internal notification triggered' },
      ],
      payload: { cases: unassigned },
    });
  }

  return actions;
}

function genMarketingActions() {
  const fatigued = Object.entries(CAMPAIGN_LIFECYCLE).filter(([, v]) => v.currentHealth < 35);
  const actions = [];

  if (fatigued.length > 0) {
    actions.push({
      id: 'COP-011',
      type: ACTION_TYPES.PAUSE_CAMPAIGN,
      title: `Pause ${fatigued.length} fatigued campaign${fatigued.length > 1 ? 's' : ''} to stop budget waste`,
      context: `${fatigued.length} active campaign${fatigued.length > 1 ? 's are' : ' is'} in deep fatigue. Health score below 35/100.`,
      reason: 'Continued spend on fatigued campaigns yields diminishing returns and inflates blended CPA.',
      suggestedAction: 'Pause campaigns, initiate creative refresh cycle, relaunch within 7–10 days.',
      executionTarget: 'Marketing',
      module: 'Marketing',
      priority: 'medium',
      affectedCount: fatigued.length,
      affectedEntities: fatigued.map(([id, v]) => ({ id, health: v.currentHealth, phase: v.phase })),
      suggestedOperator: 'Growth Manager',
      steps: [
        { step: 1, label: 'Pause all fatigued campaigns', detail: `${fatigued.length} campaigns paused` },
        { step: 2, label: 'Brief creative team on refresh', detail: 'New angles and hooks required' },
        { step: 3, label: 'Schedule 7-day rest + relaunch', detail: 'A/B test new vs old creative' },
      ],
      payload: { campaigns: fatigued },
    });
  }

  return actions;
}

// ─── MASTER GENERATOR ────────────────────────────────────────────────────────

export function generateCopilotActions() {
  const all = [
    ...genPaymentReviewActions(),
    ...genLeaderActions(),
    ...genSupportActions(),
    ...genCRMFollowUpActions(),
    ...genAdvisorReassignActions(),
    ...genMarketingActions(),
  ];

  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return all.sort((a, b) => sevOrder[a.priority] - sevOrder[b.priority]);
}

// ─── ACTION HISTORY ──────────────────────────────────────────────────────────

const HISTORY_KEY = 'vicion_copilot_history';

export function getActionHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

export function recordActionExecution(action, operator = 'Super Admin') {
  const history = getActionHistory();
  history.unshift({
    id: action.id,
    title: action.title,
    module: action.module,
    priority: action.priority,
    affectedCount: action.affectedCount,
    operator,
    executedAt: new Date().toISOString(),
    result: 'executed',
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}