/**
 * DATA CONSISTENCY HELPER
 * Detects impossible summary states and forces regeneration from source records
 * Applied before rendering War Room, DNA panels, financial cards, dashboards
 */

class DataConsistencyHelper {
  constructor(masterAccount, members, aggregations, sideConsolidations, cardSummaries) {
    this.masterAccount = masterAccount;
    this.members = members;
    this.aggregations = aggregations;
    this.sideConsolidations = sideConsolidations;
    this.cardSummaries = cardSummaries;
    this.repairsApplied = [];
  }

  /**
   * VALIDATE & REPAIR: Check all leaders for impossible states
   */
  validateAndRepair() {
    console.log('\n🔧 DATA CONSISTENCY HELPER: Detecting impossible states...\n');

    const leaderIds = [this.masterAccount.id, ...this.members.map(m => m.id)];
    const violatedLeaders = [];

    leaderIds.forEach(leaderId => {
      const violations = this.detectViolations(leaderId);
      if (violations.length > 0) {
        violatedLeaders.push({ leaderId, violations });
        this.repairLeader(leaderId, violations);
      }
    });

    console.log(`🔧 CONSISTENCY VALIDATION COMPLETE:`);
    console.log(`   Violations detected: ${violatedLeaders.length}`);
    console.log(`   Repairs applied: ${this.repairsApplied.length}\n`);

    return {
      violatedLeaders,
      repairsApplied: this.repairsApplied,
      isConsistent: violatedLeaders.length === 0,
    };
  }

  /**
   * Detect all violations for a leader
   */
  detectViolations(leaderId) {
    const violations = [];
    const descendants = this.members.filter(m => m.upline_id === leaderId);
    const agg = this.aggregations[leaderId];
    const consolidation = this.sideConsolidations[leaderId];

    if (!agg || descendants.length === 0) return violations;

    // RULE 1: members > 0 but branch counts = 0
    if (agg.total_descendants > 0 && (agg.left_count === 0 && agg.right_count === 0)) {
      violations.push({
        rule: 'members_without_branches',
        message: `Leader has ${agg.total_descendants} descendants but left_count=0, right_count=0`,
        severity: 'critical',
      });
    }

    // RULE 2: members > 0 but network investment = 0
    if (agg.total_descendants > 0 && agg.total_investment === 0) {
      violations.push({
        rule: 'members_without_investment',
        message: `Leader has ${agg.total_descendants} descendants but total_investment=0`,
        severity: 'critical',
      });
    }

    // RULE 3: members > 0 but monthly income = 0 (if commission events exist)
    const hasCommissionEvents = agg.commission_count && agg.commission_count > 0;
    if (agg.total_descendants > 0 && agg.monthly_income === 0 && hasCommissionEvents) {
      violations.push({
        rule: 'members_with_commissions_but_zero_income',
        message: `Leader has ${agg.commission_count} commission events but monthly_income=0`,
        severity: 'critical',
      });
    }

    // RULE 4: deep_generation doesn't match descendant count
    if (agg.deep_generation !== agg.total_descendants) {
      violations.push({
        rule: 'generation_mismatch',
        message: `deep_generation=${agg.deep_generation} but total_descendants=${agg.total_descendants}`,
        severity: 'high',
      });
    }

    // RULE 5: left_count + right_count != total descendants
    const branchTotal = (agg.left_count || 0) + (agg.right_count || 0);
    if (branchTotal !== agg.total_descendants && agg.total_descendants > 0) {
      violations.push({
        rule: 'branch_count_mismatch',
        message: `left_count(${agg.left_count}) + right_count(${agg.right_count}) = ${branchTotal}, but total_descendants=${agg.total_descendants}`,
        severity: 'high',
      });
    }

    // RULE 6: All financial cards show zero while payment records exist
    const summary = this.cardSummaries[leaderId];
    const hasPaymentRecords = descendants.some(m => m.payment_status && m.investment_amount > 0);
    if (summary && hasPaymentRecords) {
      const allCardsZero = summary.confirmed_count === 0 && summary.pending_count === 0 && 
                           summary.overdue_count === 0 && summary.under_review_count === 0;
      if (allCardsZero) {
        violations.push({
          rule: 'financial_cards_empty_with_records',
          message: `All financial cards are zero but ${descendants.length} payment records exist`,
          severity: 'critical',
        });
      }
    }

    // RULE 7: Consolidation left + right != total descendants
    if (consolidation && consolidation.izquierda && consolidation.derecha) {
      const consolidatedTotal = consolidation.izquierda.members_count + consolidation.derecha.members_count;
      if (consolidatedTotal !== descendants.length && descendants.length > 0) {
        violations.push({
          rule: 'consolidation_member_count_mismatch',
          message: `Consolidation: left(${consolidation.izquierda.members_count}) + right(${consolidation.derecha.members_count}) = ${consolidatedTotal}, but descendants=${descendants.length}`,
          severity: 'high',
        });
      }
    }

    return violations;
  }

  /**
   * Repair a leader's data from source records
   */
  repairLeader(leaderId, violations) {
    console.log(`⚠️  Repairing leader ${leaderId}...`);
    const descendants = this.members.filter(m => m.upline_id === leaderId);
    const leader = leaderId === this.masterAccount.id ? this.masterAccount : this.members.find(m => m.id === leaderId);

    if (!leader || descendants.length === 0) return;

    // REPAIR: Branch counts
    const leftMembers = descendants.filter(m => m.binary_side === 'left');
    const rightMembers = descendants.filter(m => m.binary_side === 'right');
    const left_count = leftMembers.length;
    const right_count = rightMembers.length;

    if (this.aggregations[leaderId]) {
      this.aggregations[leaderId].left_count = left_count;
      this.aggregations[leaderId].right_count = right_count;
      this.aggregations[leaderId].total_descendants = descendants.length;
      this.repairsApplied.push({
        leaderId,
        rule: 'branch_counts',
        before: { left: this.aggregations[leaderId].left_count, right: this.aggregations[leaderId].right_count },
        after: { left: left_count, right: right_count },
      });
    }

    // REPAIR: Total investment
    const totalInvestment = descendants.reduce((sum, m) => sum + (m.investment_amount || 0), 0);
    if (this.aggregations[leaderId] && this.aggregations[leaderId].total_investment === 0 && totalInvestment > 0) {
      this.aggregations[leaderId].total_investment = totalInvestment;
      this.repairsApplied.push({
        leaderId,
        rule: 'total_investment',
        before: 0,
        after: totalInvestment,
      });
    }

    // REPAIR: Financial cards
    const summary = this.cardSummaries[leaderId];
    if (summary) {
      const confirmed = descendants.filter(m => m.payment_status === 'pagado');
      const pending = descendants.filter(m => m.payment_status === 'pendiente');
      const overdue = descendants.filter(m => m.payment_status === 'vencido');
      const underReview = descendants.filter(m => m.renewal_status === 'por_vencer');

      const confirmedAmount = confirmed.reduce((sum, m) => sum + (m.investment_amount || 0), 0);
      const pendingAmount = pending.reduce((sum, m) => sum + (m.investment_amount || 0), 0);
      const overdueAmount = overdue.reduce((sum, m) => sum + (m.investment_amount || 0), 0);
      const underReviewAmount = underReview.reduce((sum, m) => sum + (m.investment_amount || 0), 0);

      const hadZeroCounts = summary.confirmed_count === 0 && summary.pending_count === 0;

      summary.confirmed_amount = confirmedAmount;
      summary.confirmed_count = confirmed.length;
      summary.pending_amount = pendingAmount;
      summary.pending_count = pending.length;
      summary.overdue_amount = overdueAmount;
      summary.overdue_count = overdue.length;
      summary.under_review_amount = underReviewAmount;
      summary.under_review_count = underReview.length;

      if (hadZeroCounts && confirmedAmount > 0) {
        this.repairsApplied.push({
          leaderId,
          rule: 'financial_cards',
          message: 'Regenerated from source payment records',
        });
      }
    }

    // REPAIR: Side consolidation
    if (this.sideConsolidations[leaderId]) {
      this.sideConsolidations[leaderId].izquierda.members_count = leftMembers.length;
      this.sideConsolidations[leaderId].derecha.members_count = rightMembers.length;
    }

    console.log(`   ✅ Repairs applied for ${leader.full_name}`);
  }

  /**
   * Get repair report
   */
  getRepairReport() {
    return {
      totalRepairs: this.repairsApplied.length,
      repairs: this.repairsApplied,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check consistency before rendering a panel
   */
  ensureConsistency(panelType, leaderId) {
    const violations = this.detectViolations(leaderId);
    if (violations.length > 0) {
      console.warn(`⚠️  Consistency violations detected in ${panelType} for leader ${leaderId}. Repairing...`);
      this.repairLeader(leaderId, violations);
      return false; // Data was repaired
    }
    return true; // Data is consistent
  }
}

export default DataConsistencyHelper;