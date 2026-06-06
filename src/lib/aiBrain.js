/**
 * VICION — AI Brain Engine
 * Internal operations intelligence layer.
 * Deterministic analysis of platform data. No hallucinations.
 * Reads from all admin data sources and produces structured operational output.
 */

import { PARTICIPANTS_DATA, LEADERS_DATA, SUPPORT_CASES_DATA } from './SimulatedData';
import { CAMPAIGNS, REFERRAL_CHAINS, getConversionBySource, getTopReferrers } from './acquisitionData';
import { CAMPAIGN_LIFECYCLE } from './campaignIntelligence';

// ─── DATA AGGREGATIONS ──────────────────────────────────────────────────────

function getParticipantStats() {
  const total = PARTICIPANTS_DATA.length;
  const active = PARTICIPANTS_DATA.filter(p => p.status === 'active').length;
  const pending = PARTICIPANTS_DATA.filter(p => p.status === 'pending_verification').length;
  const blocked = PARTICIPANTS_DATA.filter(p => p.status === 'blocked').length;
  const paused = PARTICIPANTS_DATA.filter(p => p.status === 'paused').length;
  const inactive = PARTICIPANTS_DATA.filter(p => p.status === 'inactive').length;
  const underReview = PARTICIPANTS_DATA.filter(p => p.status === 'under_review').length;
  const highRisk = PARTICIPANTS_DATA.filter(p => p.riskScore > 70).length;
  const noAdvisor = PARTICIPANTS_DATA.filter(p => !p.advisor || p.advisor === 'Unassigned').length;
  const highValue = PARTICIPANTS_DATA.filter(p => p.amount >= 5000 && p.status === 'active');
  const stalled = PARTICIPANTS_DATA.filter(p =>
    (p.status === 'pending_verification' || p.status === 'under_review') && p.kyc !== 'verified'
  );
  const dormant = PARTICIPANTS_DATA.filter(p =>
    ['inactive', 'paused'].includes(p.status) && p.kyc === 'verified' && p.amount >= 500
  );
  const verifiedPayments = PARTICIPANTS_DATA.filter(p => p.paymentStatus === 'verified');
  const totalVolume = verifiedPayments.reduce((s, p) => s + p.amount, 0);
  const avgAmount = verifiedPayments.length > 0 ? Math.round(totalVolume / verifiedPayments.length) : 0;
  return { total, active, pending, blocked, paused, inactive, underReview, highRisk, noAdvisor, highValue, stalled, dormant, totalVolume, avgAmount };
}

function getLeaderStats() {
  const active = LEADERS_DATA.filter(l => ['active', 'certified'].includes(l.status));
  const suspended = LEADERS_DATA.filter(l => l.status === 'suspended');
  const underReview = LEADERS_DATA.filter(l => l.status === 'under_review');
  const paused = LEADERS_DATA.filter(l => l.status === 'paused');
  const highViolations = LEADERS_DATA.filter(l => l.violations >= 3);
  const topPerformers = [...LEADERS_DATA]
    .filter(l => ['active', 'certified'].includes(l.status))
    .sort((a, b) => b.network - a.network)
    .slice(0, 3);
  const decliners = LEADERS_DATA.filter(l => l.growth && l.growth.startsWith('-'));
  const lowCompliance = LEADERS_DATA.filter(l => l.compliance < 70 && l.status !== 'suspended');
  return { active, suspended, underReview, paused, highViolations, topPerformers, decliners, lowCompliance };
}

function getPaymentStats() {
  const pending = PARTICIPANTS_DATA.filter(p => p.paymentStatus === 'pending');
  const underReview = PARTICIPANTS_DATA.filter(p => p.paymentStatus === 'under_review' || p.paymentStatus === 'flagged');
  const rejected = PARTICIPANTS_DATA.filter(p => p.paymentStatus === 'rejected');
  const cashHeavy = PARTICIPANTS_DATA.filter(p => p.paymentMethod === 'Cash' && p.paymentStatus === 'pending');
  const highRiskPayments = PARTICIPANTS_DATA.filter(p => p.riskScore > 70 && p.paymentStatus !== 'rejected');
  const methodBreakdown = PARTICIPANTS_DATA.reduce((acc, p) => {
    acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + 1;
    return acc;
  }, {});
  return { pending, underReview, rejected, cashHeavy, highRiskPayments, methodBreakdown };
}

function getSupportStats() {
  const open = SUPPORT_CASES_DATA.filter(c => !['resolved'].includes(c.status));
  const critical = SUPPORT_CASES_DATA.filter(c => c.priority === 'critical');
  const slaBreached = SUPPORT_CASES_DATA.filter(c => c.sla === 'BREACHED');
  const unassigned = SUPPORT_CASES_DATA.filter(c => c.assigned === 'Unassigned');
  const byType = SUPPORT_CASES_DATA.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc; }, {});
  const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
  return { open, critical, slaBreached, unassigned, byType, topType };
}

function getCampaignStats() {
  const fatigued = Object.entries(CAMPAIGN_LIFECYCLE).filter(([, v]) => v.currentHealth < 35);
  const healthy = Object.entries(CAMPAIGN_LIFECYCLE).filter(([, v]) => v.currentHealth >= 70);
  const avgHealth = Math.round(
    Object.values(CAMPAIGN_LIFECYCLE).reduce((s, c) => s + c.currentHealth, 0) / Object.keys(CAMPAIGN_LIFECYCLE).length
  );
  const bestCampaign = CAMPAIGNS.reduce((best, c) => c.conversionRate > (best?.conversionRate || 0) ? c : best, null);
  const worstCPA = CAMPAIGNS.filter(c => c.status === 'active').reduce((worst, c) => c.cpa > (worst?.cpa || 0) ? c : worst, null);
  return { fatigued, healthy, avgHealth, bestCampaign, worstCPA };
}

// ─── MODULE GENERATORS ──────────────────────────────────────────────────────

export function generateExecutiveInsights(kpis) {
  const p = getParticipantStats();
  const l = getLeaderStats();
  const pay = getPaymentStats();
  const s = getSupportStats();
  const c = getCampaignStats();
  const insights = [];

  if (p.pending > 5) {
    insights.push({ type: 'warning', area: 'Registrations', text: `${p.pending} participants are pending verification. KYC backlog is accumulating and requires reviewer attention to prevent SLA breach.` });
  } else {
    insights.push({ type: 'info', area: 'Registrations', text: `Registration pipeline is active with ${p.total} total participants. KYC queue is within normal operating range.` });
  }

  const topLeader = l.topPerformers[0];
  if (topLeader) {
    insights.push({ type: 'info', area: 'Leadership', text: `${topLeader.name} is driving disproportionate network growth with ${topLeader.network} network members. This represents a concentration point that should be monitored for dependency risk.` });
  }

  const dominantMethod = Object.entries(pay.methodBreakdown).sort((a, b) => b[1] - a[1])[0];
  if (dominantMethod && dominantMethod[0] === 'Cash') {
    insights.push({ type: 'warning', area: 'Payments', text: `Cash deposit is the leading payment method with ${dominantMethod[1]} records. This channel carries higher verification complexity and requires agent confirmation workflow.` });
  }

  if (s.open.length >= 8) {
    insights.push({ type: 'warning', area: 'Support', text: `${s.open.length} support cases are currently open. The ${s.topType?.[0] || 'payment'} category is generating the most volume — consider dedicated reviewer allocation.` });
  }

  const convData = getConversionBySource();
  const bestSource = convData.reduce((best, src) => src.conversionRate > (best?.conversionRate || 0) ? src : best, null);
  if (bestSource) {
    insights.push({ type: 'opportunity', area: 'Conversion', text: `${bestSource.source} is delivering the highest investor conversion rate at ${bestSource.conversionRate}%. This channel is producing the highest-quality entrants and warrants increased investment prioritization.` });
  }

  if (c.fatigued.length > 0) {
    insights.push({ type: 'warning', area: 'Campaigns', text: `${c.fatigued.length} campaign${c.fatigued.length > 1 ? 's are' : ' is'} in critical fatigue phase. Creative refresh or pause-and-relaunch is required to recover performance metrics.` });
  }

  if (p.dormant.length >= 3) {
    insights.push({ type: 'opportunity', area: 'CRM', text: `${p.dormant.length} verified participants with active plans are dormant. These represent reactivation candidates with verified KYC and confirmed payment history — highest ROI of any outreach segment.` });
  }

  if (l.highViolations.length > 0) {
    insights.push({ type: 'critical', area: 'Compliance', text: `${l.highViolations.length} leader${l.highViolations.length > 1 ? 's have' : ' has'} 3 or more communication violations. Immediate intervention is required to prevent regulatory exposure and participant misguidance.` });
  }

  return insights;
}

export function generateRisks() {
  const p = getParticipantStats();
  const l = getLeaderStats();
  const pay = getPaymentStats();
  const s = getSupportStats();
  const c = getCampaignStats();
  const risks = [];

  if (p.pending >= 5) risks.push({ id: 'R-001', title: 'KYC Backlog Accumulating', severity: 'high', area: 'Participants', detail: `${p.pending} participants are pending KYC verification. If unresolved, activation delays will increase churn risk among new entrants.`, action: 'Assign KYC reviewer and clear queue within 48h' });

  if (pay.underReview.length >= 3) risks.push({ id: 'R-002', title: 'Payment Review Concentration', severity: 'critical', area: 'Payments', detail: `${pay.underReview.length} payments are under AML review or flagged. Delayed resolution creates compliance exposure and participant trust erosion.`, action: 'Prioritize AML review queue — assign senior finance reviewer' });

  if (l.highViolations.length > 0) risks.push({ id: 'R-003', title: 'Leader Communication Violations', severity: 'critical', area: 'Leaders', detail: `${l.highViolations.map(ld => ld.name).join(', ')} ${l.highViolations.length === 1 ? 'has' : 'have'} 3+ communication violations. Off-script messaging increases regulatory risk.`, action: 'Initiate mandatory retraining — consider suspension pending review' });

  if (l.decliners.length > 0) risks.push({ id: 'R-004', title: 'Leader Network Decline', severity: 'medium', area: 'Leaders', detail: `${l.decliners.length} leader${l.decliners.length > 1 ? 's are' : ' is'} showing negative network growth. Network contraction at leader level compounds downstream.`, action: 'Schedule leadership review session — identify root cause of decline' });

  if (s.slaBreached.length > 0) risks.push({ id: 'R-005', title: 'Support SLA Breach', severity: 'high', area: 'Support', detail: `${s.slaBreached.length} support case${s.slaBreached.length > 1 ? 's have' : ' has'} breached internal SLA thresholds. Case IDs: ${s.slaBreached.map(cs => cs.id).join(', ')}.`, action: 'Escalate to senior support — notify affected participants with resolution timeline' });

  if (s.unassigned.length > 0) risks.push({ id: 'R-006', title: 'Unassigned Support Cases', severity: 'medium', area: 'Support', detail: `${s.unassigned.length} case${s.unassigned.length > 1 ? 's are' : ' is'} currently unassigned. Unowned cases degrade resolution speed and participant experience.`, action: 'Assign to available team members based on case type and workload' });

  if (c.fatigued.length > 0) risks.push({ id: 'R-007', title: 'Campaign Fatigue Risk', severity: 'medium', area: 'Marketing', detail: `${c.fatigued.length} active campaign${c.fatigued.length > 1 ? 's are' : ' is'} in deep fatigue phase with health below 35. Continued spend yields diminishing returns.`, action: 'Pause and relaunch with fresh creative before next billing cycle' });

  if (p.highRisk >= 3) risks.push({ id: 'R-008', title: 'High-Risk Participant Cluster', severity: 'high', area: 'AML', detail: `${p.highRisk} participants carry risk scores above 70. Cluster review required to rule out coordinated behavior or third-party funding.`, action: 'Request full documentation from high-risk cluster — escalate if patterns confirmed' });

  if (l.underReview.length > 0) risks.push({ id: 'R-009', title: 'Leaders Under Compliance Review', severity: 'high', area: 'Leaders', detail: `${l.underReview.map(ld => ld.name).join(', ')} ${l.underReview.length === 1 ? 'is' : 'are'} currently under compliance review. Network activity should be monitored until review concludes.`, action: 'Freeze leader activation privileges pending review completion' });

  return risks.sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2, low: 3 };
    return sev[a.severity] - sev[b.severity];
  });
}

export function generateGrowthOpportunities() {
  const p = getParticipantStats();
  const l = getLeaderStats();
  const convData = getConversionBySource();
  const topRefs = getTopReferrers();
  const opps = [];

  const bestSource = convData.reduce((best, src) => src.conversionRate > (best?.conversionRate || 0) ? src : best, null);
  if (bestSource) opps.push({ id: 'G-001', title: `Scale ${bestSource.source} Acquisition`, confidence: 91, area: 'Acquisition', detail: `${bestSource.source} is converting at ${bestSource.conversionRate}% — the highest across all channels. Increasing allocation to this source has the clearest ROI signal in the current portfolio.`, action: `Increase ${bestSource.source} budget allocation by 25% in next cycle`, module: 'Marketing' });

  if (p.dormant.length >= 3) opps.push({ id: 'G-002', title: 'Reactivate Dormant Verified Participants', confidence: 84, area: 'CRM', detail: `${p.dormant.length} participants with verified KYC and confirmed payment history are currently dormant. Re-engagement outreach to this segment has minimal cost and high conversion probability.`, action: 'Launch reactivation sequence via advisor direct contact — target within 7 days', module: 'CRM' });

  const topRef = topRefs[0];
  if (topRef) opps.push({ id: 'G-003', title: `Amplify ${topRef.name} Referral Chain`, confidence: 88, area: 'Referral', detail: `${topRef.name} has generated ${topRef.total} referrals with ${topRef.converted} conversions. Providing incremental support to this referrer will compound downstream network growth.`, action: 'Assign dedicated advisor support and expedite referral KYC for this chain', module: 'Leaders' });

  const premiumActive = p.highValue;
  if (premiumActive.length >= 3) opps.push({ id: 'G-004', title: 'VIP Upgrade Path for Premium Tier', confidence: 76, area: 'Plans', detail: `${premiumActive.length} participants are on Premium/Elite plans with active status. These participants show highest retention and referral rates — structured upgrade incentives could increase plan volume.`, action: 'Create VIP track communication and cycle benefit preview for $5K+ participants', module: 'Investments' });

  const growingLeaders = l.topPerformers.filter(ldr => ldr.growth && ldr.growth.startsWith('+'));
  if (growingLeaders.length > 0) opps.push({ id: 'G-005', title: `Expand ${growingLeaders[0].name} Network Capacity`, confidence: 79, area: 'Leadership', detail: `${growingLeaders[0].name} is showing ${growingLeaders[0].growth} growth. Providing additional tools and faster participant approval in their region will accelerate this momentum.`, action: "Prioritize KYC approvals in this leader's network — assign dedicated reviewer", module: 'Leaders' });

  const communityCAM = CAMPAIGNS.find(c => c.channel === 'Community Referral');
  if (communityCAM && communityCAM.cpa < 200) opps.push({ id: 'G-006', title: 'Community Referral Is Most Cost-Efficient Channel', confidence: 93, area: 'Campaigns', detail: `Community Referral CPA is $${communityCAM.cpa} — 5–10x cheaper than paid channels. Increasing investment in leader activation directly reduces blended CPA across the portfolio.`, action: 'Onboard 2 additional leaders in underrepresented markets (IN, NG) to extend referral reach', module: 'Marketing' });

  return opps;
}

export function generateLeaderIntelligence() {
  const topRefs = getTopReferrers().filter(r => r.type === 'leader');

  return LEADERS_DATA.map(leader => {
    const refData = topRefs.find(r => r.id === leader.id) || { total: 0, converted: 0 };
    const convRate = refData.total > 0 ? Math.round((refData.converted / refData.total) * 100) : 0;
    let signal = 'stable';
    let note = '';

    if (leader.violations >= 3) { signal = 'critical'; note = 'Multiple communication violations. Intervention required.'; }
    else if (leader.status === 'suspended') { signal = 'suspended'; note = 'Suspended — legal team engaged. Network under review.'; }
    else if (leader.status === 'under_review') { signal = 'warning'; note = 'Under compliance review. Activation privileges frozen.'; }
    else if (leader.growth && leader.growth.startsWith('-')) { signal = 'declining'; note = 'Network contraction detected. Coaching intervention recommended.'; }
    else if (parseInt(leader.growth) >= 20) { signal = 'high_growth'; note = 'Above-average growth velocity. Monitor for capacity support needs.'; }
    else if (leader.compliance >= 90 && leader.status === 'certified') { signal = 'excellent'; note = 'Top compliance + certified status. Candidate for global mentor role.'; }
    else { signal = 'stable'; note = 'Operating within normal parameters. Regular monitoring applies.'; }

    return {
      id: leader.id,
      name: leader.name,
      country: leader.country,
      status: leader.status,
      network: leader.network,
      directs: leader.directs,
      growth: leader.growth,
      compliance: leader.compliance,
      violations: leader.violations,
      volume: leader.volume,
      refTotal: refData.total,
      refConverted: refData.converted,
      convRate,
      signal,
      note,
    };
  }).sort((a, b) => {
    const sigOrder = { critical: 0, suspended: 1, warning: 2, declining: 3, stable: 4, high_growth: 5, excellent: 6 };
    return (sigOrder[a.signal] ?? 9) - (sigOrder[b.signal] ?? 9);
  });
}

export function generateConversionIntelligence() {
  const convData = getConversionBySource();
  const p = getParticipantStats();

  const planBreakdown = PARTICIPANTS_DATA.reduce((acc, part) => {
    if (!acc[part.plan]) acc[part.plan] = { plan: part.plan, total: 0, active: 0, amount: 0, referrals: 0 };
    acc[part.plan].total++;
    if (part.status === 'active' && part.paymentStatus === 'verified') acc[part.plan].active++;
    acc[part.plan].amount += part.amount;
    acc[part.plan].referrals += (part.referrals || 0);
    return acc;
  }, {});

  const planRanked = Object.values(planBreakdown)
    .map(pl => ({
      ...pl,
      convRate: Math.round((pl.active / pl.total) * 100),
      volume: pl.amount,
      avgReferrals: Math.round(pl.referrals / pl.total),
      category: pl.plan,
    }))
    .sort((a, b) => b.convRate - a.convRate);

  const convRanked = [...convData]
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .map(src => ({
      ...src,
      investors: src.investors || Math.round((src.total || 10) * src.conversionRate / 100),
    }));

  const dropOffStages = [
    { stage: 'KYC Verification', count: p.stalled.filter(x => x.kyc !== 'verified').length, issue: 'Document submission incomplete or identity mismatch' },
    { stage: 'Payment Review', count: p.stalled.filter(x => x.kyc === 'verified').length, issue: 'Manual review adding 48–72h delay' },
    { stage: 'Advisor Assignment', count: p.noAdvisor, issue: `${p.noAdvisor} active participants without assigned advisor` },
  ];

  const stallPriority = p.stalled
    .filter(part => part.amount >= 500)
    .map(part => ({
      id: part.id,
      name: part.name,
      country: part.country,
      plan: part.plan,
      amount: part.amount,
      riskScore: part.riskScore,
      stage: part.kyc !== 'verified' ? 'KYC stalled' : 'Payment stalled',
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  return { convRanked, planRanked, dropOffStages, stallPriority };
}

export function generatePaymentIntelligence() {
  const pay = getPaymentStats();
  const alerts = [];

  pay.underReview.forEach(p => {
    alerts.push({ id: `PAY-${p.id}`, title: `Payment Under Review — ${p.name}`, severity: 'critical', participant: p.name, participantId: p.id, method: p.paymentMethod, amount: `$${p.amount.toLocaleString()}`, riskScore: p.riskScore, action: 'Assign senior reviewer — request bank documentation within 48h' });
  });

  pay.cashHeavy.forEach(p => {
    alerts.push({ id: `PAY-C-${p.id}`, title: `Cash Deposit Pending — ${p.name}`, severity: 'high', participant: p.name, participantId: p.id, method: 'Cash', amount: `$${p.amount.toLocaleString()}`, riskScore: p.riskScore, action: 'Confirm physical receipt with local agent — apply cash verification checklist' });
  });

  pay.highRiskPayments.forEach(p => {
    if (!pay.underReview.includes(p)) {
      alerts.push({ id: `PAY-R-${p.id}`, title: `High-Risk Score — ${p.name}`, severity: 'high', participant: p.name, participantId: p.id, method: p.paymentMethod, amount: `$${p.amount.toLocaleString()}`, riskScore: p.riskScore, action: 'Cross-reference identity with payment origin — escalate if third-party suspected' });
    }
  });

  return alerts.sort((a, b) => {
    const sev = { critical: 0, high: 1, medium: 2, low: 3 };
    return sev[a.severity] - sev[b.severity];
  });
}

export function generateCRMPriority() {
  const queue = [];

  PARTICIPANTS_DATA.forEach(p => {
    let priority = null;
    let reason = '';
    let action = '';

    if (p.riskScore > 70 && p.paymentStatus !== 'rejected') {
      priority = 'critical'; reason = `Risk score ${p.riskScore} — payment or identity concerns unresolved`; action = 'Finance + compliance review';
    } else if (p.status === 'under_review' || p.paymentStatus === 'flagged') {
      priority = 'high'; reason = 'Under compliance review — activation blocked'; action = 'Assign reviewer — resolve within 48h';
    } else if (p.status === 'pending_verification' && p.amount >= 1000) {
      priority = 'high'; reason = `High-value pending KYC — $${p.amount.toLocaleString()} plan not yet activated`; action = 'Expedite KYC — assign to senior advisor';
    } else if (p.followUp === 'inactive' && p.kyc === 'verified' && p.amount >= 500) {
      priority = 'medium'; reason = 'Dormant verified participant — reactivation opportunity'; action = 'Personal advisor contact within 3 days';
    } else if (p.status === 'active' && !p.advisor) {
      priority = 'medium'; reason = 'Active participant without assigned advisor'; action = 'Assign advisor immediately';
    } else if (p.referrals === 0 && p.status === 'active' && p.amount >= 1000) {
      priority = 'low'; reason = 'Active mid-tier participant with zero referrals — potential to activate'; action = 'Include in next referral activation campaign';
    }

    if (priority) queue.push({ id: p.id, name: p.name, country: p.country, plan: p.plan, amount: p.amount, advisor: p.advisor, priority, reason, action });
  });

  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return queue.sort((a, b) => sevOrder[a.priority] - sevOrder[b.priority]);
}

export function generateSupportPriority() {
  return SUPPORT_CASES_DATA
    .filter(c => c.status !== 'resolved')
    .map(c => {
      let reason = '';
      if (c.sla === 'BREACHED') reason = `SLA breached — ${c.age} days unresolved`;
      else if (c.priority === 'critical') reason = 'Critical priority — participant impact imminent';
      else if (c.sla === 'At Risk') reason = 'SLA at risk — action required today';
      else reason = `${c.type} case — ${c.age} days open`;

      return {
        id: c.id, title: c.title, type: c.type, priority: c.priority,
        participant: c.participant, assigned: c.assigned, sla: c.sla, age: c.age, reason,
        action: c.assigned === 'Unassigned' ? 'Assign to available team member' : `${c.assigned} to resolve within SLA window`,
      };
    })
    .sort((a, b) => {
      const pOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return pOrder[a.priority] - pOrder[b.priority];
    });
}

export function generateMarketingRecommendations() {
  const convData = getConversionBySource();
  const recs = [];

  const sorted = [...convData].sort((a, b) => b.conversionRate - a.conversionRate);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  if (best) recs.push({ id: 'MR-001', title: `Increase investment in ${best.source}`, priority: 'high', detail: `${best.source} is converting at ${best.conversionRate}% — the highest in the portfolio. Budget reallocation from underperforming channels will improve blended CPA.`, impact: 'High', channel: best.source });

  if (worst && worst.conversionRate < 50) recs.push({ id: 'MR-002', title: `Review ${worst.source} channel quality`, priority: 'medium', detail: `${worst.source} is converting at ${worst.conversionRate}% — below breakeven threshold. Audience targeting or creative quality review required before continuing spend.`, impact: 'Medium', channel: worst.source });

  const fatigued = Object.entries(CAMPAIGN_LIFECYCLE).filter(([, v]) => v.phase === 'fatigued');
  fatigued.forEach(([id]) => {
    const cam = CAMPAIGNS.find(c => c.id === id);
    if (cam) recs.push({ id: `MR-CAM-${id}`, title: `Pause & refresh: ${cam.name}`, priority: 'high', detail: `Campaign health at ${CAMPAIGN_LIFECYCLE[id].currentHealth}/100. Continued spend generates diminishing returns. Creative refresh or 7-day pause recommended before relaunch.`, impact: 'High', channel: cam.channel });
  });

  const communityCAM = CAMPAIGNS.find(c => c.channel === 'Community Referral');
  if (communityCAM) recs.push({ id: 'MR-003', title: 'Scale Community Referral program', priority: 'medium', detail: `Community Referral has CPA of $${communityCAM.cpa} — 5–8x cheaper than paid. Onboarding 2 additional leaders in new markets would expand this channel without paid media cost.`, impact: 'High', channel: 'Community Referral' });

  return recs;
}

export function generateActionQueue(kpis) {
  const p = getParticipantStats();
  const pay = getPaymentStats();
  const s = getSupportStats();
  const l = getLeaderStats();
  const c = getCampaignStats();
  const actions = [];

  if (pay.underReview.length > 0) actions.push({ id: 'AQ-001', title: 'Clear AML payment review queue', reason: `${pay.underReview.length} payments are flagged or under AML review — compliance exposure increasing with delay.`, priority: 'critical', module: 'Payments', owner: 'Finance Reviewer', urgency: 1 });

  if (s.slaBreached.length > 0) actions.push({ id: 'AQ-002', title: 'Resolve SLA-breached support cases', reason: `${s.slaBreached.length} cases have exceeded internal SLA. Participant trust is at risk.`, priority: 'critical', module: 'Support', owner: 'Support Lead', urgency: 2 });

  if (l.highViolations.length > 0) actions.push({ id: 'AQ-003', title: `Intervene on ${l.highViolations[0].name}'s compliance violations`, reason: `${l.highViolations[0].violations} communication violations recorded. Regulatory exposure increasing.`, priority: 'critical', module: 'Leaders', owner: 'Compliance Officer', urgency: 3 });

  if (p.pending > 4) actions.push({ id: 'AQ-004', title: 'Process KYC backlog', reason: `${p.pending} participants are pending verification. Activation delays reducing conversion.`, priority: 'high', module: 'Participants', owner: 'KYC Reviewer', urgency: 4 });

  if (s.unassigned.length > 0) actions.push({ id: 'AQ-005', title: 'Assign unowned support cases', reason: `${s.unassigned.length} support cases have no assigned team member. Idle cases will breach SLA.`, priority: 'high', module: 'Support', owner: 'Support Manager', urgency: 5 });

  if (p.dormant.length >= 3) actions.push({ id: 'AQ-006', title: 'Launch dormant participant reactivation', reason: `${p.dormant.length} verified participants are dormant. Personal advisor outreach has the highest reactivation rate.`, priority: 'medium', module: 'CRM', owner: 'Advisor Team', urgency: 6 });

  if (c.fatigued.length > 0) actions.push({ id: 'AQ-007', title: 'Refresh fatigued campaign creatives', reason: `${c.fatigued.length} campaign(s) in fatigue phase — continued spend yields negative ROI.`, priority: 'medium', module: 'Marketing', owner: 'Growth Manager', urgency: 7 });

  if (l.decliners.length > 0) actions.push({ id: 'AQ-008', title: `Support declining leader${l.decliners.length > 1 ? 's' : ''}: ${l.decliners.map(ld => ld.name).join(', ')}`, reason: 'Network contraction detected. Early coaching intervention reduces churn risk.', priority: 'medium', module: 'Leaders', owner: 'Leadership Coach', urgency: 8 });

  actions.push({ id: 'AQ-009', title: 'Review high-value stalled participants', reason: `${p.stalled.filter(pt => pt.amount >= 1000).length} participants with plans >=\$1,000 are stuck pre-activation. Direct advisor intervention converts at 2x cold outreach.`, priority: 'medium', module: 'CRM', owner: 'Senior Advisor', urgency: 9 });

  actions.push({ id: 'AQ-010', title: 'Quarterly leader performance review', reason: 'Structured review of all active leaders against KPIs ensures early detection of performance decay.', priority: 'low', module: 'Leaders', owner: 'Operations Manager', urgency: 10 });

  return actions.sort((a, b) => a.urgency - b.urgency);
}