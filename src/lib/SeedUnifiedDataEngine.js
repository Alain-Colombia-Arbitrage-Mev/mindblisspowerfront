/**
 * SEED UNIFIED DATA ENGINE
 * Populates UnifiedDataEngine with MVP Master Dataset
 * Integrates with DataIntegrityModel
 */

import DataIntegrityModel, { VALID_PLANS, DURATION_TYPES } from './DataIntegrityModel';
import BinaryNetworkOrchestrator from './BinaryNetworkOrchestrator';
import FinancialConsolidationEngine from './FinancialConsolidationEngine';
import MVPMasterDatasetBuilder from './MVPMasterDatasetBuilder';
import HierarchyOrchestrator from './HierarchyOrchestrator';
import BinaryAssigner from './BinaryAssigner';
import MembershipEnricher from './MembershipEnricher';
import RealAggregationEngine from './RealAggregationEngine';
import BinarySideConsolidationEngine from './BinarySideConsolidationEngine';
import PaymentUrgencyConsolidationEngine from './PaymentUrgencyConsolidationEngine';
import DataConsistencyHelper from './DataConsistencyHelper';

// RANK ICON MAP — Single source of truth
const rankIcons = {
  'E. Corona': '👑',
  'Diamante Negro': '🖤',
  'Diamante Azul': '💙',
  'Diamante': '💎',
  'Esmeralda': '💚',
  'Rubí': '❤️',
  'Zafiro': '🔵',
  'Platino': '⭐',
  'Oro': '🥇',
  'Plata': '🥈',
  'Bronce': '🥉',
  'Principiante': '🌱',
};

export function seedUnifiedDataEngine(unifiedDataEngine) {
  console.log('🌱 Seeding UnifiedDataEngine with MVP Master Dataset...');

  // BUILD MVP MASTER DATASET
  const mvpBuilder = new MVPMasterDatasetBuilder();
  const mvpDataset = mvpBuilder.buildNetwork();
  const { masterAccount, robertoDiaz, members } = mvpDataset;

  console.log('\n✅ MVP Master Dataset built successfully');

  // CREATE MASTER ACCOUNT IN INTEGRITY MODEL
  const master = unifiedDataEngine.integrityModel.createUser({
    id: masterAccount.id,
    name: masterAccount.full_name,
    email: masterAccount.email,
    phone: masterAccount.phone,
    country: masterAccount.country,
    role: masterAccount.role,
    rank: masterAccount.rank || 'E. Corona',
    rank_icon: rankIcons[masterAccount.rank || 'E. Corona'] || '👑',
    status: masterAccount.status,
  });

  const masterMembership = unifiedDataEngine.integrityModel.createMembership(
    master.id,
    'Elite',
    DURATION_TYPES.long
  );

  console.log(`✅ Master Account: ${master.name} (${master.rank})`);

  // ADD ALL MVP MEMBERS TO INTEGRITY MODEL
  members.forEach(memberData => {
    const user = unifiedDataEngine.integrityModel.createUser({
      id: memberData.id,
      name: memberData.full_name,
      email: memberData.email,
      phone: memberData.phone,
      country: memberData.country,
      role: memberData.role === 'lider' ? 'lider' : 'inversor',  // NORMALIZE ROLE
      rank: memberData.rank || 'Principiante',
      rank_icon: rankIcons[memberData.rank || 'Principiante'] || '⭐',
      status: memberData.status,
    });

    // Create membership for each member
    const membership = unifiedDataEngine.integrityModel.createMembership(
      user.id,
      memberData.membership_plan,
      DURATION_TYPES.medium
    );

    // CREATE REAL PAYMENT RECORDS FOR EVERY MEMBERSHIP
    const paymentDate = new Date(memberData.registration_date);
    const paymentTime = memberData.registration_time || `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
    const dueDate = new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const renewalDate = new Date(dueDate.getTime() + 1 * 24 * 60 * 60 * 1000);
    
    // Map membership status to payment status
    let paymentStatus = 'confirmado';
    if (memberData.payment_status === 'pendiente') paymentStatus = 'pendiente';
    else if (memberData.payment_status === 'vencido') paymentStatus = 'vencido';
    else if (memberData.payment_status === 'en revisión') paymentStatus = 'en revisión';
    else paymentStatus = 'confirmado';
    
    const paymentRecord = {
      id: `pay-${user.id}-${membership.id}`,
      membership_id: membership.id,
      user_id: user.id,
      amount: memberData.investment_amount,
      payment_method: 'transferencia',
      payment_date: paymentDate.toISOString().split('T')[0],
      payment_time: paymentTime,
      status: paymentStatus,
      due_date: dueDate.toISOString().split('T')[0],
      renewal_date: renewalDate.toISOString().split('T')[0],
      review_flag: paymentStatus === 'en revisión' || memberData.risk_level === 'alto',
      renewal_flag: (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 14,
      created_at: paymentDate.toISOString(),
    };
    
    unifiedDataEngine.integrityModel.payments.push(paymentRecord);

    // Create network node with proper structure
    unifiedDataEngine.integrityModel.createNetworkNode(
      user.id,
      memberData.upline_id,
      memberData.binary_side,
      memberData.generation_depth
    );
  });

  console.log(`✅ Created ${members.length} member records with memberships`);

  // ─── HIERARCHY ORCHESTRATION ───
  const hierarchyOrch = new HierarchyOrchestrator(masterAccount, members);
  const hierarchyResult = hierarchyOrch.orchestrate();
  console.log(`✅ Hierarchy orchestrated: ${hierarchyResult.stats.leadersWithDescendants} leaders with descendants`);

  // ─── BINARY ASSIGNMENT ───
  const binaryAssigner = new BinaryAssigner(masterAccount, members, hierarchyResult.hierarchy);
  const binaryResult = binaryAssigner.execute();
  console.log(`✅ Binary structure assigned: ${binaryResult.stats.rootLeft} left | ${binaryResult.stats.rootRight} right`);

  // ─── MEMBERSHIP ENRICHMENT ───
  const enricher = new MembershipEnricher(members);
  const enrichmentResult = enricher.execute();
  console.log(`✅ Membership profiles enriched with plans, terms, and behaviors`);

  // ─── REAL AGGREGATION ENGINE ───
  const aggregationEngine = new RealAggregationEngine(masterAccount, members);
  const aggregationResult = aggregationEngine.execute();

  // ─── BINARY SIDE CONSOLIDATION ───
  const sideConsolidationEngine = new BinarySideConsolidationEngine(masterAccount, members, aggregationResult.aggregations);
  const sideConsolidationResult = sideConsolidationEngine.execute();

  // ─── PAYMENT URGENCY CONSOLIDATION ───
  const urgencyEngine = new PaymentUrgencyConsolidationEngine(masterAccount, members, unifiedDataEngine.integrityModel.payments);
  const urgencyResult = urgencyEngine.execute();

  // ─── CONSISTENCY SELF-REPAIR ───
  const consistencyHelper = new DataConsistencyHelper(
    masterAccount,
    members,
    aggregationResult.aggregations,
    sideConsolidationResult.sideConsolidations,
    urgencyResult.cardSummaries
  );
  const consistencyValidation = consistencyHelper.validateAndRepair();

  // ─── BINARY ORCHESTRATION ───
  const orchestrator = new BinaryNetworkOrchestrator(
    unifiedDataEngine.integrityModel,
    members
  );
  const orchestrationResult = orchestrator.orchestrate(master);

  // Add commission events from orchestrator
  orchestrationResult.metrics.commissionEvents.forEach(event => {
    event.leader_id = master.id;
    unifiedDataEngine.integrityModel.commission_ledger.push(event);
  });

  // Store payment records in engine for access by consolidation layers
  unifiedDataEngine.paymentRecords = unifiedDataEngine.integrityModel.payments;

  // ─── FINANCIAL CONSOLIDATION ───
  const financialEngine = new FinancialConsolidationEngine(
    members,
    orchestrationResult.metrics
  );
  const financialResult = financialEngine.execute();
  unifiedDataEngine.paymentRecords = financialResult.paymentRecords;
  unifiedDataEngine.financialSummary = financialResult.financialSummary;
  unifiedDataEngine.leaderFinancialView = financialResult.leaderView;

  console.log(`✅ Created ${orchestrationResult.metrics.networkInvestment} total investment across network`);
  console.log(`✅ Network structure: ${orchestrationResult.metrics.leftCount} left | ${orchestrationResult.metrics.rightCount} right`);

  // Validate integrity
  const validation = unifiedDataEngine.validator.validateNetwork(master.id);
  console.log(`✅ Integrity validation: ${validation.valid ? '✓ VALID' : '✗ FAILED'}`);

  if (!validation.valid) {
    console.warn('Validation errors:', validation.errors);
  }

  return {
    master,
    robertoDiaz,
    members,
    stats: mvpDataset.stats,
    validation,
    orchestration: orchestrationResult,
    financial: financialResult,
    hierarchy: hierarchyResult,
    binary: binaryResult,
    membership: enrichmentResult,
    aggregation: aggregationResult,
    sideConsolidation: sideConsolidationResult,
    urgency: urgencyResult,
    consistency: consistencyValidation,
  };
}

export default seedUnifiedDataEngine;