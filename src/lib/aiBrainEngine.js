/**
 * VICION AI Brain Engine
 * Internal operations intelligence layer — admin only.
 * Derives all signals from live simulation data + static admin datasets.
 * Outputs evolve as simulation state changes.
 */

import { PARTICIPANTS_DATA } from '@/lib/simulatedData';
import { PAYMENTS_DATA } from '@/lib/simulatedData';
import { CRM_DATA } from '@/lib/simulatedData';
import { CAMPAIGN_LIFECYCLE } from '@/lib/campaignIntelligence';

// ─── LEADER DATASET ──────────────────────────────────────────────────────────
const LEADERS_DATASET = [
  { id: 'L-001', name: 'Carlos López',    country: 'MX', directReferrals: 28, networkSize: 142, conversionRate: 68, complianceScore: 91, weeklyActivity: 'high',   trend: 'growing',   status: 'active', issue: null },
  { id: 'L-002', name: 'Ana Silva',       country: 'BR', directReferrals: 22, networkSize: 118, conversionRate: 71, complianceScore: 88, weeklyActivity: 'high',   trend: 'growing',   status: 'active', issue: null },
  { id: 'L-003', name: 'Roberto Díaz',    country: 'ES', directReferrals: 14, networkSize: 76,  conversionRate: 54, complianceScore: 72, weeklyActivity: 'medium', trend: 'stable',    status: 'active', issue: 'compliance_drift' },
  { id: 'L-004', name: 'Isabella Moreno', country: 'CO', directReferrals: 18, networkSize: 94,  conversionRate: 62, complianceScore: 85, weeklyActivity: 'medium', trend: 'stable',    status: 'active', issue: null },
  { id: 'L-005', name: 'Kevin Osei',      country: 'GH', directReferrals: 11, networkSize: 54,  conversionRate: 73, complianceScore: 94, weeklyActivity: 'high',   trend: 'growing',   status: 'active', issue: null },
  { id: 'L-006', name: 'Priya Sharma',    country: 'IN', directReferrals: 7,  networkSize: 31,  conversionRate: 44, complianceScore: 69, weeklyActivity: 'low',    trend: 'declining', status: 'paused', issue: 'low_activity' },
  { id: 'L-007', name: 'James Okafor',    country: 'NG', directReferrals: 9,  networkSize: 43,  conversionRate: 58, complianceScore: 78, weeklyActivity: 'medium', trend: 'stable',    status: 'active', issue: null },
  { id: 'L-008', name: 'Valentina Cruz',  country: 'AR', directReferrals: 16, networkSize: 88,  conversionRate: 65, complianceScore: 83, weeklyActivity: 'high',   trend: 'growing',   status: 'active', issue: null },
  { id: 'L-009', name: 'Mei Lin Chen',    country: 'TW', directReferrals: 5,  networkSize: 22,  conversionRate: 38, complianceScore: 61, weeklyActivity: 'low',    trend: 'declining', status: 'active', issue: 'compliance_drift' },
  { id: 'L-010', name: 'David Mensah',    country: 'GH', directReferrals: 12, networkSize: 61,  conversionRate: 67, complianceScore: 90, weeklyActivity: 'high',   trend: 'growing',   status: 'active', issue: null },
];

const SUPPORT_DATASET = [
  { id: 'CS-4801', category: 'payment_dispute', priority: 'critical', daysOpen: 5, leader: 'Carlos López',     participant: 'Pedro Martínez' },
  { id: 'CS-4802', category: 'kyc_issue',        priority: 'high',     daysOpen: 4, leader: 'Roberto Díaz',    participant: 'Luisa Fernández' },
  { id: 'CS-4803', category: 'plan_question',    priority: 'medium',   daysOpen: 2, leader: 'Ana Silva',       participant: 'M. Rodríguez' },
  { id: 'CS-4804', category: 'payment_dispute',  priority: 'high',     daysOpen: 6, leader: 'Isabella Moreno', participant: 'A. Torres' },
  { id: 'CS-4805', category: 'network_issue',    priority: 'medium',   daysOpen: 1, leader: 'Kevin Osei',      participant: 'S. Boateng' },
  { id: 'CS-4806', category: 'compliance',       priority: 'critical', daysOpen: 3, leader: 'Mei Lin Chen',    participant: 'R. Chen' },
  { id: 'CS-4807', category: 'payout_delay',     priority: 'high',     daysOpen: 7, leader: 'Valentina Cruz',  participant: 'D. Ramírez' },
  { id: 'CS-4808', category: 'kyc_issue',        priority: 'medium',   daysOpen: 2, leader: 'James Okafor',    participant: 'K. Adeyemi' },
  { id: 'CS-4809', category: 'payment_dispute',  priority: 'critical', daysOpen: 4, leader: 'Carlos López',    participant: 'J. García' },
];

// ─── BRAIN ENGINE ─────────────────────────────────────────────────────────────

export function deriveAIBrainSignals(simKpis, simActivityLog, tick) {
  const t = tick || 0;

  // ── Participants ──
  const pendingKyc = PARTICIPANTS_DATA.filter(function(p) { return p.status === 'pending_verification'; }).length;
  const inactiveParticipants = PARTICIPANTS_DATA.filter(function(p) { return p.status === 'inactive'; }).length;

  // ── Payments ──
  const pendingPayments = PAYMENTS_DATA.filter(function(p) { return ['pending', 'under_review', 'flagged'].includes(p.status); }).length;
  const flaggedPayments = PAYMENTS_DATA.filter(function(p) { return p.status === 'flagged'; }).length;
  const cashPayments = PAYMENTS_DATA.filter(function(p) { return p.method === 'Cash'; }).length;
  const highRiskPayments = PAYMENTS_DATA.filter(function(p) { return p.riskScore > 70; }).length;
  const avgRisk = Math.round(PAYMENTS_DATA.reduce(function(s, p) { return s + p.riskScore; }, 0) / PAYMENTS_DATA.length);

  // ── CRM ──
  const noAdvisor = CRM_DATA.filter(function(p) { return !p.advisor || p.advisor === 'Unassigned'; }).length;
  const planSelectedNoPay = CRM_DATA.filter(function(p) { return p.followUp === 'plan_selected' && p.status !== 'active'; }).length;

  // ── Leaders ──
  const decliningLeaders = LEADERS_DATASET.filter(function(l) { return l.trend === 'declining'; });
  const complianceIssueLeaders = LEADERS_DATASET.filter(function(l) { return l.issue === 'compliance_drift'; });
  const sortedByNetwork = LEADERS_DATASET.slice().sort(function(a, b) { return b.networkSize - a.networkSize; });
  const topLeader = sortedByNetwork[0];

  // ── Support ──
  const criticalCases = SUPPORT_DATASET.filter(function(s) { return s.priority === 'critical'; });
  const agingCases = SUPPORT_DATASET.filter(function(s) { return s.daysOpen >= 4; });
  const categoryCount = SUPPORT_DATASET.reduce(function(acc, s) {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});

  // ── Campaigns ──
  const campaignEntries = Object.entries(CAMPAIGN_LIFECYCLE);
  const fatiguedCampaigns = campaignEntries.filter(function(entry) { return entry[1].currentHealth < 35; });

  // ── Sim drift ──
  const registrationTrend = t % 8 < 4 ? 'accelerating' : 'stabilizing';

  const cam001Health = CAMPAIGN_LIFECYCLE['CAM-001'] ? CAMPAIGN_LIFECYCLE['CAM-001'].currentHealth : 28;
  const cam002Health = CAMPAIGN_LIFECYCLE['CAM-002'] ? CAMPAIGN_LIFECYCLE['CAM-002'].currentHealth : 41;
  const cam003Health = CAMPAIGN_LIFECYCLE['CAM-003'] ? CAMPAIGN_LIFECYCLE['CAM-003'].currentHealth : 82;
  const cam005Health = CAMPAIGN_LIFECYCLE['CAM-005'] ? CAMPAIGN_LIFECYCLE['CAM-005'].currentHealth : 61;

  // ──────────────────────────────────────────────────────────────────────────
  // MODULE 1: EXECUTIVE INSIGHTS
  // ──────────────────────────────────────────────────────────────────────────
  const executiveInsights = [
    {
      type: 'info',
      title: 'Platform registrations are ' + registrationTrend,
      body: 'New participant intake is ' + registrationTrend + '. Current active base stands at ' + simKpis.totalParticipants.toLocaleString() + ' with ' + simKpis.activePlans.toLocaleString() + ' confirmed active plans. Conversion from registration to activation is tracking at ' + simKpis.conversionRate + '%.',
      module: 'Participants',
    },
    {
      type: pendingPayments > 8 ? 'warning' : 'info',
      title: pendingPayments + ' payments require financial review',
      body: 'Payment verification queue has ' + pendingPayments + ' open items including ' + flaggedPayments + ' AML-flagged transactions. Cash-method payments account for ' + cashPayments + ' records currently under hold. Finance team attention required before end of cycle.',
      module: 'Payments',
    },
    {
      type: 'info',
      title: topLeader.name + ' is driving disproportionate network growth',
      body: topLeader.name + ' (' + topLeader.country + ') is the highest-performing leader with a network of ' + topLeader.networkSize + ' participants and ' + topLeader.directReferrals + ' direct referrals. Two additional leaders — Ana Silva and Valentina Cruz — are showing consistent growth trends and should be monitored for support capacity needs.',
      module: 'Leaders',
    },
    {
      type: 'opportunity',
      title: 'Mid-tier plan activation is outperforming premium tier',
      body: 'Standard and Premium plan conversions are showing stronger completion rates than Elite. Approval delays in the Elite tier ($500+) are adding 48–72 hours to activation time. Mid-tier pipeline velocity is the strongest signal in the current cycle.',
      module: 'Investments',
    },
    {
      type: criticalCases.length > 2 ? 'warning' : 'info',
      title: 'Support caseload: ' + (categoryCount['payment_dispute'] || 0) + ' payment disputes trending',
      body: 'Payment dispute cases represent the largest support category this period (' + (categoryCount['payment_dispute'] || 0) + ' open). ' + agingCases.length + ' cases are aging beyond 4 days. Two leaders — Carlos López and Isabella Moreno — have multiple linked participants with open cases.',
      module: 'Support',
    },
    {
      type: 'info',
      title: 'Referral network generating higher quality conversions than paid channels',
      body: 'Community referral-driven participants show a 34% higher activation completion rate versus paid acquisition. Referral CPA is significantly below campaign average. The Africa network expansion is adding measurable velocity to organic growth.',
      module: 'Marketing',
    },
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // MODULE 2: RISK DETECTION
  // ──────────────────────────────────────────────────────────────────────────
  const risksRaw = [];

  if (pendingKyc > 5) {
    risksRaw.push({ id: 'RISK-001', severity: 'high', title: pendingKyc + ' participants pending KYC verification', area: 'Participants', detail: 'Verification backlog is growing and approaching SLA breach threshold. 3 participants are within 12h of 48h limit.', action: 'Assign additional KYC reviewers. Prioritize oldest entries first.', link: '/admin-dashboard/participants' });
  }
  if (flaggedPayments > 0) {
    risksRaw.push({ id: 'RISK-002', severity: 'critical', title: flaggedPayments + ' AML-flagged transactions unreviewed', area: 'Payments', detail: flaggedPayments + ' transactions have been auto-flagged by the AML engine. Potential third-party funding or identity mismatch detected. Each flag requires manual review before funds can be released.', action: 'Finance lead must review all flagged transactions within 24h. Do not release holds without sign-off.', link: '/admin-dashboard/payments' });
  }
  if (decliningLeaders.length > 0) {
    risksRaw.push({ id: 'RISK-003', severity: 'medium', title: decliningLeaders.length + ' leaders showing performance decay', area: 'Leaders', detail: decliningLeaders.map(function(l) { return l.name; }).join(', ') + ' have declining conversion rates and low weekly activity. Risk of network attrition if not re-engaged within 14 days.', action: 'Schedule 1:1 coaching sessions. Review messaging compliance and pipeline status.', link: '/admin-dashboard/leaders' });
  }
  if (complianceIssueLeaders.length > 0) {
    risksRaw.push({ id: 'RISK-004', severity: 'high', title: complianceIssueLeaders.length + ' leaders with communication compliance drift', area: 'Leaders', detail: complianceIssueLeaders.map(function(l) { return l.name + ' (' + l.country + ')'; }).join(', ') + ' have been flagged for off-script messaging patterns. Compliance score below acceptable threshold.', action: 'Initiate messaging audit. Issue formal compliance reminder and schedule training reinforcement.', link: '/admin-dashboard/leaders' });
  }
  if (inactiveParticipants > 10) {
    risksRaw.push({ id: 'RISK-005', severity: 'medium', title: inactiveParticipants + ' inactive participants not re-engaged', area: 'CRM', detail: inactiveParticipants + ' participants have fallen into inactive status. Many have historical investment activity suggesting high reactivation potential if contacted within 30 days.', action: 'Generate reactivation list. Assign to available advisors for outreach campaign.', link: '/admin-dashboard/crm' });
  }
  if (agingCases.length > 3) {
    risksRaw.push({ id: 'RISK-006', severity: 'high', title: agingCases.length + ' support cases aging beyond 4 days', area: 'Support', detail: agingCases.length + ' unresolved support cases are past internal SLA. CS-4807 (payout delay) has been open 7 days. Risk of participant escalation and trust erosion.', action: 'Escalate to tier-2 support. Assign case owner to each aging case. Prioritize payout-related issues.', link: '/admin-dashboard/support' });
  }
  if (highRiskPayments > 2) {
    risksRaw.push({ id: 'RISK-007', severity: 'high', title: highRiskPayments + ' transactions with risk score >70', area: 'Payments', detail: highRiskPayments + ' payments have elevated AML risk scores above the 70/100 threshold. Concentration pattern observed in transfer-method transactions from 2 countries.', action: 'Cross-reference participant identity documents. Hold pending compliance sign-off.', link: '/admin-dashboard/payments' });
  }
  if (fatiguedCampaigns.length > 0) {
    risksRaw.push({ id: 'RISK-008', severity: 'medium', title: fatiguedCampaigns.length + ' campaigns in fatigue/saturation phase', area: 'Marketing', detail: fatiguedCampaigns.map(function(entry) { return entry[0]; }).join(', ') + ' have health scores below 35. CPA is rising and conversion rate is declining. Continued spend without creative refresh will reduce ROI further.', action: 'Pause or refresh fatigued campaigns. Reallocate budget to healthy campaigns temporarily.', link: '/admin-dashboard/analytics' });
  }

  const risks = risksRaw;

  // ──────────────────────────────────────────────────────────────────────────
  // MODULE 3: GROWTH OPPORTUNITIES
  // ──────────────────────────────────────────────────────────────────────────
  const opportunities = [
    {
      id: 'OPP-001', confidence: 91,
      title: 'Community referral channel has lowest CPA and highest activation rate',
      detail: 'Referral-acquired participants complete activation 34% more often than paid channel entrants. CPA is 3.2x lower. Increasing leader incentive focus on referral output would compound this advantage.',
      action: 'Increase referral incentive visibility in leader dashboard. Run referral sprint with top 5 leaders.',
      module: 'Marketing / Leaders',
    },
    {
      id: 'OPP-002', confidence: 87,
      title: 'Africa market (GH + NG) is underserved relative to conversion quality',
      detail: 'Kevin Osei and David Mensah both show >67% conversion rates with high compliance scores. The Africa market is generating quality participants but receiving below-average marketing budget allocation.',
      action: 'Increase Africa influencer campaign budget by 20%. Onboard 2 additional leaders in Lagos.',
      module: 'Marketing / Leaders',
    },
    {
      id: 'OPP-003', confidence: 78,
      title: (inactiveParticipants + noAdvisor) + ' CRM records represent reactivation pipeline',
      detail: inactiveParticipants + ' inactive participants and ' + noAdvisor + ' unassigned CRM records represent an existing audience with demonstrable intent. Re-engagement cost is significantly lower than new acquisition.',
      action: 'Build targeted re-engagement sequence for inactive records. Prioritize those with prior plan selection history.',
      module: 'CRM',
    },
    {
      id: 'OPP-004', confidence: 82,
      title: 'Google Discovery EU campaign is in efficiency zone — ready to scale',
      detail: 'CAM-003 health score: ' + cam003Health + '/100. tCPA bidding has stabilized 15% below target. Incremental budget increase would capture remaining EU intent without diminishing returns.',
      action: 'Increase CAM-003 daily budget by 20%. Expand to FR market in parallel.',
      module: 'Marketing',
    },
    {
      id: 'OPP-005', confidence: 74,
      title: 'Standard plan tier ($250) converting faster than other tiers',
      detail: 'Mid-tier plans are completing the approval-to-activation sequence 41% faster than premium tier plans. Higher volume at this price point with lower friction represents compoundable growth if leader focus is directed here.',
      action: 'Brief leaders on Standard plan conversion speed. Use as primary entry point for new participant acquisition.',
      module: 'Investments',
    },
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // MODULE 4: LEADER INTELLIGENCE
  // ──────────────────────────────────────────────────────────────────────────
  const totalNetworkSize = LEADERS_DATASET.reduce(function(s, l) { return s + l.networkSize; }, 0);
  const leaderIntelligence = {
    ranked: sortedByNetwork.map(function(l, i) {
      return Object.assign({}, l, {
        rank: i + 1,
        signal: l.trend === 'growing' ? 'positive' : l.trend === 'declining' ? 'negative' : 'neutral',
        note: l.issue === 'compliance_drift' ? 'Compliance audit required' : l.issue === 'low_activity' ? 'Re-engagement needed' : l.weeklyActivity === 'high' ? 'Strong performer' : 'Monitor',
      });
    }),
    insights: [
      'Carlos López and Ana Silva together account for ' + Math.round((142 + 118) / totalNetworkSize * 100) + '% of total network size. Dependency risk if either reduces activity.',
      'Priya Sharma (IN) has not generated referrals in the current period. Reactivation outreach is overdue — IN market represents significant untapped potential.',
      'Kevin Osei has the highest conversion rate (73%) among all active leaders with strong compliance. Candidate for mentor role in Africa expansion.',
      'Mei Lin Chen and Priya Sharma both show declining trends with compliance issues. Supervision intervention recommended within 7 days.',
    ],
  };

  // ──────────────────────────────────────────────────────────────────────────
  // MODULE 5: CONVERSION INTELLIGENCE
  // ──────────────────────────────────────────────────────────────────────────
  const conversionIntelligence = {
    bySource: [
      { source: 'Community Referral',  convRate: 71, volume: 48, cpa: 108,  trend: 'rising',     signal: 'positive' },
      { source: 'Organic Search',      convRate: 58, volume: 34, cpa: 210,  trend: 'stable',     signal: 'neutral' },
      { source: 'Google Ads (EU)',      convRate: 52, volume: 29, cpa: 1360, trend: 'stable',     signal: 'neutral' },
      { source: 'Influencer (Africa)', convRate: 48, volume: 18, cpa: 690,  trend: 'recovering', signal: 'neutral' },
      { source: 'Meta Ads (LATAM)',     convRate: 31, volume: 22, cpa: 1040, trend: 'declining',  signal: 'negative' },
      { source: 'TikTok Ads',          convRate: 28, volume: 16, cpa: 1080, trend: 'declining',  signal: 'negative' },
    ],
    byPlan: [
      { plan: 'Standard ($250)', convRate: 64, avgDaysToActivate: 3.2, dropoffStage: null,               signal: 'positive' },
      { plan: 'Premium ($500)',  convRate: 58, avgDaysToActivate: 4.8, dropoffStage: 'payment_review',    signal: 'neutral' },
      { plan: 'Elite ($1000)',   convRate: 41, avgDaysToActivate: 7.1, dropoffStage: 'kyc_verification',  signal: 'negative' },
      { plan: 'Basic ($100)',    convRate: 55, avgDaysToActivate: 2.9, dropoffStage: null,               signal: 'neutral' },
    ],
    dropoffPoints: [
      { stage: 'KYC Verification',   dropRate: 18, note: 'Document submission incomplete' },
      { stage: 'Payment Review',      dropRate: 22, note: 'Manual review adding 48h delay' },
      { stage: 'Advisor Assignment',  dropRate: 9,  note: noAdvisor + ' records unassigned' },
    ],
    recommendations: [
      'Prioritize Elite plan leads for dedicated advisor fast-track — delay at KYC/payment review is costing activations.',
      'Standard plan participants should be the primary acquisition target for new leaders — highest conversion speed.',
      'TikTok and Meta acquisition quality is declining — reduce reliance on these sources until creative refresh completes.',
      'Community referral path should be amplified — no paid channel is matching its conversion efficiency.',
    ],
  };

  // ──────────────────────────────────────────────────────────────────────────
  // MODULE 6: PAYMENT INTELLIGENCE
  // ──────────────────────────────────────────────────────────────────────────
  const paymentIntelligence = {
    alerts: [
      { id: 'PAY-001', severity: 'critical', title: flaggedPayments + ' AML-flagged transactions pending review',                             participant: 'Multiple', method: 'Bank Transfer', detail: 'AML engine flagged potential third-party funding. Transactions from 2 participants exceed individual source pattern.',                                                     action: 'Finance lead review required. Do not release holds.' },
      { id: 'PAY-002', severity: 'high',     title: cashPayments + ' cash-method transactions require enhanced due diligence',               participant: 'Various',  method: 'Cash',          detail: 'Cash payment concentration above threshold. Origin documentation incomplete for 3 records.',                                                                            action: 'Request source-of-funds documentation from each participant.' },
      { id: 'PAY-003', severity: 'high',     title: 'Payment review queue has grown 31% in the current period',                              participant: null,       method: null,            detail: pendingPayments + ' transactions are currently in review or pending status. Queue growth rate exceeds processing capacity.',                                              action: 'Assign additional finance reviewer. Consider fast-track verification for low-risk accounts.' },
      { id: 'PAY-004', severity: 'medium',   title: 'Crypto method approval time averaging 6.2 days',                                       participant: null,       method: 'Crypto',        detail: 'Crypto transactions are taking longer to verify than other methods. 2 participants have been waiting 5+ days.',                                                         action: 'Review crypto verification workflow. Consider third-party blockchain analytics tool.' },
      { id: 'PAY-005', severity: 'medium',   title: 'High-risk score concentration: ' + highRiskPayments + ' transactions above 70/100',   participant: null,       method: null,            detail: 'Average platform risk score is ' + avgRisk + '. ' + highRiskPayments + ' transactions are significantly above baseline, suggesting a pattern rather than isolated cases.', action: 'Cross-reference participating accounts for common origin indicators.' },
    ],
    methodBreakdown: [
      { method: 'Card',       count: PAYMENTS_DATA.filter(function(p) { return p.method === 'Card'; }).length,       avgRisk: 38, avgDays: 1.2 },
      { method: 'Transfer',   count: PAYMENTS_DATA.filter(function(p) { return p.method === 'Transfer'; }).length,   avgRisk: 51, avgDays: 2.8 },
      { method: 'Cash',       count: PAYMENTS_DATA.filter(function(p) { return p.method === 'Cash'; }).length,       avgRisk: 68, avgDays: 4.1 },
      { method: 'Crypto',     count: PAYMENTS_DATA.filter(function(p) { return p.method === 'Crypto'; }).length,     avgRisk: 62, avgDays: 6.2 },
      { method: 'Bank Draft', count: PAYMENTS_DATA.filter(function(p) { return p.method === 'Bank Draft'; }).length, avgRisk: 44, avgDays: 3.4 },
    ],
  };

  // ──────────────────────────────────────────────────────────────────────────
  // MODULE 7: CRM PRIORITIZATION
  // ──────────────────────────────────────────────────────────────────────────
  const underReviewCount = PARTICIPANTS_DATA.filter(function(p) { return p.status === 'under_review'; }).length;
  const crmPrioritization = [
    { priority: 1, urgency: 'critical', segment: 'High-intent inactive — plan selected, no payment',   count: planSelectedNoPay || 12,  reason: 'These participants completed plan selection but have not submitted payment. Conversion window is closing.',                                        action: 'Immediate advisor outreach. Offer payment method assistance.',                           module: 'CRM / Payments',    owner: 'Advisor Team' },
    { priority: 2, urgency: 'high',     segment: 'No advisor assigned — active participants',           count: noAdvisor || 8,           reason: 'Participants without advisor assignment have 2.3x higher dropout rate. Assignment gap is creating conversion leakage.',                          action: 'Auto-assign from available advisor pool. Alert team lead to coverage gap.',               module: 'CRM / Participants', owner: 'Operations Lead' },
    { priority: 3, urgency: 'high',     segment: 'Payment submitted — no follow-up logged (>48h)',      count: 9,                        reason: 'Post-payment follow-up window is critical for activation completion. 9 participants have passed 48h with no advisor contact recorded.',         action: 'Immediate advisor check-in. Confirm activation intent and document interaction.',         module: 'CRM',               owner: 'Advisor Team' },
    { priority: 4, urgency: 'medium',   segment: 'High-value leads inactive >14 days ($500+ interest)', count: 7,                        reason: 'High-value plan interest with no recent engagement. Intent signal was strong at registration.',                                                  action: 'Premium outreach sequence. Offer direct leader introduction.',                            module: 'CRM',               owner: 'Senior Advisor' },
    { priority: 5, urgency: 'medium',   segment: 'Under review — no decision for >72h',                 count: underReviewCount,         reason: 'Participants in review status without decision are experiencing uncertainty. Delay erodes trust.',                                               action: 'Accelerate review decision. Communicate expected timeline to participant.',               module: 'Participants',      owner: 'Compliance Team' },
    { priority: 6, urgency: 'low',      segment: 'Reactivation candidates — inactive >30 days',         count: inactiveParticipants,     reason: 'Inactive participants with historical activity are cheaper to re-engage than new acquisition.',                                                  action: 'Add to re-engagement email sequence. Leader introduction if applicable.',                module: 'CRM',               owner: 'Growth Team' },
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // MODULE 8: SUPPORT PRIORITIZATION
  // ──────────────────────────────────────────────────────────────────────────
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const supportPrioritization = SUPPORT_DATASET.map(function(c) {
    return Object.assign({}, c, {
      urgencyReason: c.daysOpen >= 5 ? 'SLA breach — escalation required' : c.priority === 'critical' ? 'Critical case — compliance or fraud risk' : c.category === 'payment_dispute' ? 'Financial impact — fast resolution needed' : 'Standard resolution path',
      recommendedAssignment: c.category === 'payment_dispute' || c.category === 'compliance' ? 'Finance / Compliance Lead' : c.category === 'payout_delay' ? 'Finance Team' : c.category === 'kyc_issue' ? 'KYC Reviewer' : 'Support Tier 2',
    });
  }).sort(function(a, b) {
    return priorityOrder[a.priority] - priorityOrder[b.priority] || b.daysOpen - a.daysOpen;
  });

  // ──────────────────────────────────────────────────────────────────────────
  // MODULE 9: MARKETING RECOMMENDATIONS
  // ──────────────────────────────────────────────────────────────────────────
  const marketingRecommendations = [
    { id: 'MKT-001', signal: 'critical',    title: 'Pause or urgently refresh Meta LATAM campaign (CAM-001)',              detail: 'Health score: ' + cam001Health + '/100. CTR has declined 44% from peak. CPA is up 34%. Continued spend at current trajectory has negative ROI signal.',                                       action: 'Deploy new creative set targeting CO/PE. 3-day pause recommended before relaunch.',            budget_impact: 'Reallocate $940/week to CAM-003 or CAM-004' },
    { id: 'MKT-002', signal: 'opportunity', title: 'Scale community referral program — highest ROI channel',                detail: "Referral CPA ($108 avg) is 10x lower than paid channels. Activation completion rate is 34% higher. This is the platform's strongest acquisition channel.",                                        action: 'Increase referral incentive by 10%. Run 30-day leader sprint focused on referral output.',     budget_impact: 'Low incremental cost, high compounding return' },
    { id: 'MKT-003', signal: 'opportunity', title: 'Scale Google EU campaign — in efficiency zone',                         detail: 'CAM-003 health: ' + cam003Health + '/100. tCPA bidding stabilized. DE/FR markets have room to absorb budget increase.',                                                                          action: 'Increase CAM-003 budget 20%. Add FR geo targeting.',                                           budget_impact: '+$400/week estimated, expected CPA stable or improving' },
    { id: 'MKT-004', signal: 'warning',     title: 'TikTok campaign needs hook winner decision before continued spend',     detail: 'CAM-002 health: ' + cam002Health + '/100. A/B test running but budget split across underperformers. Hook C is outperforming by 31%.',                                                          action: 'Pause Hooks A and B. Double budget on Hook C. Reassess in 7 days.',                            budget_impact: 'Budget neutral — reallocate within campaign' },
    { id: 'MKT-005', signal: 'info',        title: 'Africa influencer network recovery underway — support with budget',     detail: 'CAM-005 health: ' + cam005Health + '/100. Lagos diversification is working. IN market (Priya reactivation) is the next logical expansion.',                                                    action: 'Activate Priya Sharma reactivation plan. Add Mumbai influencer to roster.',                    budget_impact: 'Estimated $600/month for IN market entry' },
    { id: 'MKT-006', signal: 'info',        title: 'APAC email reactivation — plan phase 2 sequence',                      detail: '12 non-converters from completed CAM-006 should enter a 90-day nurture sequence. Cost is near-zero, conversion probability increases at day 45 and day 80 touchpoints.',                       action: 'Configure email automation for 90-day sequence. Segment by original plan interest level.',     budget_impact: 'Minimal — uses existing email infrastructure' },
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // MODULE 10: ACTION QUEUE
  // ──────────────────────────────────────────────────────────────────────────
  const actionQueue = [
    { rank: 1,  priority: 'critical', title: 'Review all AML-flagged payments immediately',                             reason: flaggedPayments + ' transactions are flagged and on hold. Financial compliance risk. SLA breach possible if not resolved today.',                                               module: 'Payments',      owner: 'Finance Lead',      link: '/admin-dashboard/payments',    estTime: '2–4 hours' },
    { rank: 2,  priority: 'critical', title: 'Resolve aging support cases (CS-4807, CS-4801, CS-4809)',                  reason: agingCases.length + ' cases are past internal SLA. CS-4807 is 7 days old. Participant trust erosion is measurable beyond 5 days.',                                          module: 'Support',       owner: 'Support Lead',      link: '/admin-dashboard/support',     estTime: '1–2 hours' },
    { rank: 3,  priority: 'high',     title: 'Clear KYC verification backlog — 3 at SLA limit',                         reason: pendingKyc + ' participants awaiting KYC. 3 are within 12h of 48h SLA breach. Delayed verification is blocking activation.',                                                module: 'Participants',  owner: 'KYC Reviewer',      link: '/admin-dashboard/participants', estTime: '3 hours' },
    { rank: 4,  priority: 'high',     title: 'Assign advisors to ' + noAdvisor + ' unowned CRM records',                reason: 'Unassigned participants convert at 43% lower rate. Coverage gap is creating direct revenue leakage in current cycle.',                                                        module: 'CRM',           owner: 'Operations Lead',   link: '/admin-dashboard/crm',         estTime: '30 minutes' },
    { rank: 5,  priority: 'high',     title: 'Initiate compliance audit for Roberto Díaz and Mei Lin Chen',              reason: 'Both leaders have been flagged for messaging compliance drift. Off-script communication detected in recent period. Risk of regulatory exposure.',                            module: 'Leaders',       owner: 'Compliance Team',   link: '/admin-dashboard/leaders',     estTime: '1 day' },
    { rank: 6,  priority: 'high',     title: 'Follow up on 12 high-intent participants with no payment submitted',       reason: 'Plan was selected, payment not submitted. Conversion window closing. Every 24h of delay reduces conversion probability by ~8%.',                                          module: 'CRM',           owner: 'Advisor Team',      link: '/admin-dashboard/crm',         estTime: '2 hours' },
    { rank: 7,  priority: 'medium',   title: 'Pause Meta LATAM campaign or deploy new creative',                         reason: 'CAM-001 health at ' + cam001Health + '/100. Continued spend at current CPA is below efficiency threshold.',                                                               module: 'Marketing',     owner: 'Growth Team',       link: '/admin-dashboard/analytics',   estTime: '4 hours (creative brief)' },
    { rank: 8,  priority: 'medium',   title: 'Re-engage Priya Sharma — IN market reactivation',                         reason: 'IN leader has been inactive this period. IN market is identified as a high-opportunity, under-served segment for the Africa Influencer program.',                          module: 'Leaders',       owner: 'Regional Manager',  link: '/admin-dashboard/leaders',     estTime: '30 minutes' },
    { rank: 9,  priority: 'medium',   title: 'Scale Google EU campaign budget by 20%',                                   reason: 'CAM-003 is in efficiency zone with health ' + cam003Health + '/100. Stable CPA below target. Budget increase will compound returns.',                                     module: 'Marketing',     owner: 'Growth Team',       link: '/admin-dashboard/analytics',   estTime: '15 minutes' },
    { rank: 10, priority: 'low',      title: 'Build 90-day reactivation sequence for ' + inactiveParticipants + ' inactive participants', reason: 'Cost-efficient pipeline expansion using existing audience. Reactivation cost is 4x lower than new acquisition.',                                       module: 'CRM / Marketing', owner: 'Growth Team',     link: '/admin-dashboard/crm',         estTime: '1 day (setup)' },
  ];

  return {
    executiveInsights,
    risks,
    opportunities,
    leaderIntelligence,
    conversionIntelligence,
    paymentIntelligence,
    crmPrioritization,
    supportPrioritization,
    marketingRecommendations,
    actionQueue,
    meta: {
      generatedAt: new Date().toISOString(),
      tick: tick,
      totalRisks: risks.length,
      criticalRisks: risks.filter(function(r) { return r.severity === 'critical'; }).length,
      totalOpportunities: opportunities.length,
      actionCount: actionQueue.length,
    },
  };
}