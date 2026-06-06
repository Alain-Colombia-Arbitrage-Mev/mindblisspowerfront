/**
 * VICION — AI Copilot Engine
 * Converts platform data into structured, executable operational actions.
 * Never executes automatically. All actions require admin confirmation.
 */

import { PARTICIPANTS_DATA, LEADERS_DATA, SUPPORT_CASES_DATA } from './SimulatedData';
import { generateActionQueue, generateRisks } from './aiBrain';

const ADVISORS = ['Carlos López', 'María García', 'Roberto Díaz', 'Ana Torres', 'Luis Fernández'];

// ─── ACTION BUILDERS ────────────────────────────────────────────────────────

function buildParticipantActions() {
  const actions = [];

  const noAdvisor = PARTICIPANTS_DATA.filter(p => !p.advisor || p.advisor === 'Unassigned');
  if (noAdvisor.length > 0) {
    actions.push({
      id: 'CP-001',
      title: `Reassign ${noAdvisor.length} participants without advisor`,
      context: `${noAdvisor.length} active participants have no assigned advisor, reducing support quality and conversion follow-up.`,
      reason: 'Unassigned participants show 40% lower activation rate and higher churn probability.',
      suggestedAction: 'Bulk-assign participants to available advisors based on workload',
      executionTarget: '/admin-dashboard/participants',
      module: 'Participants',
      priority: 'high',
      status: 'pending',
      affectedCount: noAdvisor.length,
      operator: 'Senior Advisor',
      entities: noAdvisor.slice(0, 10).map(p => ({ id: p.id, name: p.name, country: p.country, plan: p.plan, amount: p.amount })),
      steps: [
        { label: 'Review unassigned participant list', detail: `${noAdvisor.length} participants identified` },
        { label: 'Select advisor assignments', detail: `Suggested: ${ADVISORS.slice(0, 3).join(', ')}` },
        { label: 'Confirm bulk assignment', detail: 'Changes are reversible' },
        { label: 'Generate follow-up note', detail: 'Auto-log assignment action' },
      ],
      suggestedAdvisors: ADVISORS,
    });
  }

  const stalled = PARTICIPANTS_DATA.filter(p =>
    (p.status === 'pending_verification' || p.status === 'under_review') && p.amount >= 500
  );
  if (stalled.length > 0) {
    actions.push({
      id: 'CP-002',
      title: `Clear ${stalled.length} stalled high-value activations`,
      context: `${stalled.length} participants with plans ≥$500 are stuck in verification. Combined value: $${stalled.reduce((s, p) => s + p.amount, 0).toLocaleString()}.`,
      reason: 'High-value stalls represent significant revenue delay. Each day increases churn risk by ~8%.',
      suggestedAction: 'Expedite KYC and payment review — assign to senior reviewer queue',
      executionTarget: '/admin-dashboard/participants',
      module: 'Participants',
      priority: 'critical',
      status: 'ready',
      affectedCount: stalled.length,
      operator: 'KYC Reviewer',
      entities: stalled.slice(0, 8).map(p => ({ id: p.id, name: p.name, country: p.country, plan: p.plan, amount: p.amount, stage: p.kyc !== 'verified' ? 'KYC' : 'Payment' })),
      steps: [
        { label: 'Open stalled participant queue', detail: `${stalled.length} records filtered` },
        { label: 'Identify document gaps', detail: 'Cross-reference submitted docs' },
        { label: 'Assign to senior KYC reviewer', detail: 'Priority queue' },
        { label: 'Set 24h resolution target', detail: 'SLA flag applied' },
      ],
    });
  }

  const dormant = PARTICIPANTS_DATA.filter(p =>
    ['inactive', 'paused'].includes(p.status) && p.kyc === 'verified' && p.amount >= 500
  );
  if (dormant.length > 0) {
    actions.push({
      id: 'CP-003',
      title: `Reactivate ${dormant.length} dormant verified participants`,
      context: `${dormant.length} participants with verified KYC and confirmed plans are currently dormant. Total at-risk value: $${dormant.reduce((s, p) => s + p.amount, 0).toLocaleString()}.`,
      reason: 'Verified participants who have gone dormant are the highest-ROI reactivation segment.',
      suggestedAction: 'Launch personal advisor outreach with structured reactivation script',
      executionTarget: '/admin-dashboard/crm',
      module: 'CRM',
      priority: 'medium',
      status: 'pending',
      affectedCount: dormant.length,
      operator: 'Advisor Team',
      entities: dormant.slice(0, 8).map(p => ({ id: p.id, name: p.name, country: p.country, plan: p.plan, amount: p.amount, lastActivity: p.lastActivity })),
      steps: [
        { label: 'Filter dormant verified segment', detail: `${dormant.length} participants` },
        { label: 'Prepare personalized outreach context', detail: 'Plan + history attached' },
        { label: 'Assign to advisor with lowest active load', detail: 'Workload balancing' },
        { label: 'Schedule follow-up in 72h', detail: 'CRM note auto-created' },
      ],
    });
  }

  return actions;
}

function buildPaymentActions() {
  const actions = [];

  const flagged = PARTICIPANTS_DATA.filter(p => p.paymentStatus === 'under_review' || p.paymentStatus === 'flagged');
  if (flagged.length > 0) {
    actions.push({
      id: 'CP-004',
      title: `Review ${flagged.length} flagged payment${flagged.length > 1 ? 's' : ''}`,
      context: `${flagged.length} payments are under AML/fraud review. Total value: $${flagged.reduce((s, p) => s + p.amount, 0).toLocaleString()}.`,
      reason: 'Unresolved payment reviews create compliance exposure and block participant activation.',
      suggestedAction: 'Assign senior finance reviewer — request supporting documentation within 48h',
      executionTarget: '/admin-dashboard/payments',
      module: 'Payments',
      priority: 'critical',
      status: 'ready',
      affectedCount: flagged.length,
      operator: 'Finance Reviewer',
      entities: flagged.slice(0, 6).map(p => ({ id: p.id, name: p.name, amount: p.amount, method: p.paymentMethod, riskScore: p.riskScore, country: p.country })),
      steps: [
        { label: 'Open flagged payment queue', detail: `${flagged.length} transactions` },
        { label: 'Request bank statement / documentation', detail: 'Compliance checklist applied' },
        { label: 'Cross-reference identity with origin', detail: 'AML check' },
        { label: 'Approve, hold, or escalate each case', detail: 'Admin confirmation required' },
      ],
    });
  }

  const cash = PARTICIPANTS_DATA.filter(p => p.paymentMethod === 'Cash' && p.paymentStatus === 'pending');
  if (cash.length > 0) {
    actions.push({
      id: 'CP-005',
      title: `Confirm ${cash.length} pending cash deposit${cash.length > 1 ? 's' : ''}`,
      context: `${cash.length} cash deposits require physical confirmation from local agents before activation.`,
      reason: 'Cash deposits cannot be verified automatically — local agent confirmation is mandatory per compliance policy.',
      suggestedAction: 'Contact local agent in each country — confirm receipt and apply cash verification checklist',
      executionTarget: '/admin-dashboard/payments',
      module: 'Payments',
      priority: 'high',
      status: 'pending',
      affectedCount: cash.length,
      operator: 'Finance Reviewer',
      entities: cash.map(p => ({ id: p.id, name: p.name, amount: p.amount, country: p.country })),
      steps: [
        { label: 'List pending cash deposits by country', detail: `${cash.length} records` },
        { label: 'Contact local agent per region', detail: 'Use agent contact directory' },
        { label: 'Verify physical receipt confirmation', detail: 'Signed document required' },
        { label: 'Update payment status to verified', detail: 'Admin confirmation required' },
      ],
    });
  }

  return actions;
}

function buildLeaderActions() {
  const actions = [];

  const highViolations = LEADERS_DATA.filter(l => l.violations >= 3);
  if (highViolations.length > 0) {
    actions.push({
      id: 'CP-006',
      title: `Intervene on ${highViolations.length} leader${highViolations.length > 1 ? 's' : ''} with critical violations`,
      context: `${highViolations.map(l => l.name).join(', ')} ${highViolations.length === 1 ? 'has' : 'have'} accumulated 3+ communication violations.`,
      reason: 'Multiple violations indicate systematic off-script behavior. Continued operation creates regulatory exposure.',
      suggestedAction: 'Initiate mandatory retraining — suspend activation privileges pending compliance review',
      executionTarget: '/admin-dashboard/leaders',
      module: 'Leaders',
      priority: 'critical',
      status: 'ready',
      affectedCount: highViolations.length,
      operator: 'Compliance Officer',
      entities: highViolations.map(l => ({ id: l.id, name: l.name, country: l.country, violations: l.violations, network: l.network, compliance: l.compliance })),
      steps: [
        { label: 'Review violation logs', detail: 'Communication audit trail' },
        { label: 'Issue formal compliance notice', detail: 'Template prepared' },
        { label: 'Suspend activation privileges', detail: 'Requires Super Admin confirmation' },
        { label: 'Schedule retraining session', detail: '48h window' },
      ],
    });
  }

  const declining = LEADERS_DATA.filter(l => l.growth && l.growth.startsWith('-'));
  if (declining.length > 0) {
    actions.push({
      id: 'CP-007',
      title: `Support ${declining.length} declining leader${declining.length > 1 ? 's' : ''}`,
      context: `${declining.map(l => l.name).join(', ')} ${declining.length === 1 ? 'is showing' : 'are showing'} negative network growth trends.`,
      reason: 'Network contraction at leader level compounds downstream. Early intervention reduces permanent attrition.',
      suggestedAction: 'Schedule coaching session and review local market conditions',
      executionTarget: '/admin-dashboard/leaders',
      module: 'Leaders',
      priority: 'high',
      status: 'pending',
      affectedCount: declining.length,
      operator: 'Leadership Coach',
      entities: declining.map(l => ({ id: l.id, name: l.name, country: l.country, growth: l.growth, network: l.network, compliance: l.compliance })),
      steps: [
        { label: 'Analyze network contraction cause', detail: 'Market vs. leadership factor' },
        { label: 'Schedule 1:1 coaching session', detail: 'This week' },
        { label: 'Review local campaign support', detail: 'Marketing resource allocation' },
        { label: 'Set 30-day recovery target', detail: 'KPI checkpoint' },
      ],
    });
  }

  return actions;
}

function buildSupportActions() {
  const actions = [];

  const breached = SUPPORT_CASES_DATA.filter(c => c.sla === 'BREACHED');
  if (breached.length > 0) {
    actions.push({
      id: 'CP-008',
      title: `Resolve ${breached.length} SLA-breached support case${breached.length > 1 ? 's' : ''}`,
      context: `Cases ${breached.map(c => c.id).join(', ')} have exceeded internal SLA thresholds.`,
      reason: 'SLA breaches directly impact participant trust scores and team performance metrics.',
      suggestedAction: 'Escalate to senior support — notify affected participants with resolution timeline',
      executionTarget: '/admin-dashboard/support',
      module: 'Support',
      priority: 'critical',
      status: 'ready',
      affectedCount: breached.length,
      operator: 'Support Lead',
      entities: breached.map(c => ({ id: c.id, title: c.title, type: c.type, participant: c.participant, assigned: c.assigned, age: c.age })),
      steps: [
        { label: 'Escalate cases to senior support', detail: `${breached.length} cases` },
        { label: 'Send participant status update', detail: 'Template message ready' },
        { label: 'Set 4h resolution target', detail: 'Priority flag applied' },
        { label: 'Log resolution outcome', detail: 'Closes SLA breach record' },
      ],
    });
  }

  const unassigned = SUPPORT_CASES_DATA.filter(c => c.assigned === 'Unassigned' && c.status !== 'resolved');
  if (unassigned.length > 0) {
    actions.push({
      id: 'CP-009',
      title: `Assign ${unassigned.length} unowned support case${unassigned.length > 1 ? 's' : ''}`,
      context: `${unassigned.length} open cases have no assigned team member. Idle cases will breach SLA within 24h.`,
      reason: 'Unassigned cases degrade resolution time and participant experience.',
      suggestedAction: 'Distribute cases to available team members based on type and workload',
      executionTarget: '/admin-dashboard/support',
      module: 'Support',
      priority: 'high',
      status: 'pending',
      affectedCount: unassigned.length,
      operator: 'Support Manager',
      entities: unassigned.map(c => ({ id: c.id, title: c.title, type: c.type, priority: c.priority, participant: c.participant })),
      steps: [
        { label: 'Review unassigned case types', detail: `${unassigned.length} cases` },
        { label: 'Check team member availability', detail: 'Workload map' },
        { label: 'Assign by case type specialization', detail: 'Smart routing' },
        { label: 'Confirm assignments', detail: 'Admin confirmation required' },
      ],
    });
  }

  return actions;
}

// ─── MAIN GENERATOR ──────────────────────────────────────────────────────────

export function generateCopilotActions() {
  const all = [
    ...buildPaymentActions(),
    ...buildLeaderActions(),
    ...buildSupportActions(),
    ...buildParticipantActions(),
  ];

  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return all.sort((a, b) => sevOrder[a.priority] - sevOrder[b.priority]);
}

export function getActionsByModule(module) {
  return generateCopilotActions().filter(a => a.module === module);
}