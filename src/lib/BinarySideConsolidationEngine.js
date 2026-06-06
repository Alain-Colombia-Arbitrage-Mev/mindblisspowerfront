/**
 * BINARY SIDE CONSOLIDATION ENGINE
 * Complete left/right branch breakdown for every leader
 * Economics, behavior, health metrics per side
 * Supports War Room, Network Intervention, AI Brain, Auto Mode
 */

class BinarySideConsolidationEngine {
  constructor(masterAccount, members, aggregations) {
    this.masterAccount = masterAccount;
    this.members = members;
    this.aggregations = aggregations;
    this.sideConsolidations = {};
  }

  /**
   * EXECUTE: Consolidate all leaders' left/right sides
   */
  execute() {
    console.log('\n🌳 BINARY SIDE CONSOLIDATION: Computing left/right branch economics...\n');

    // Consolidate root account
    this.consolidateLeaderSides(this.masterAccount);

    // Consolidate all leaders with descendants
    this.members.forEach(member => {
      if (this.aggregations[member.id] && this.aggregations[member.id].total_descendants > 0) {
        this.consolidateLeaderSides(member);
      }
    });

    console.log(`✅ Binary side consolidation complete for ${Object.keys(this.sideConsolidations).length} leaders.\n`);

    return {
      sideConsolidations: this.sideConsolidations,
    };
  }

  /**
   * Consolidate left and right sides for a leader
   */
  consolidateLeaderSides(leader) {
    const descendants = this.members.filter(m => m.upline_id === leader.id);

    if (descendants.length === 0) return;

    const leftMembers = descendants.filter(m => m.binary_side === 'izquierda');
    const rightMembers = descendants.filter(m => m.binary_side === 'derecha');

    const leftConsolidation = this.consolidateSide(leftMembers);
    const rightConsolidation = this.consolidateSide(rightMembers);

    // BRANCH BALANCE ANALYSIS
    const memberDiff = Math.abs(leftMembers.length - rightMembers.length);
    const investmentDiff = Math.abs(leftConsolidation.investment_total - rightConsolidation.investment_total);
    const paymentHealthDiff = Math.abs(leftConsolidation.payment_health_score - rightConsolidation.payment_health_score);
    const growthDiff = Math.abs(leftConsolidation.growth_velocity_score - rightConsolidation.growth_velocity_score);

    // BALANCE CLASSIFICATION
    const totalMembers = leftMembers.length + rightMembers.length;
    const percentageDiff = totalMembers > 0 ? (memberDiff / totalMembers) * 100 : 0;

    let balance_state;
    if (percentageDiff === 0) {
      balance_state = 'balanced';
    } else if (percentageDiff <= 15) {
      balance_state = 'slightly_unbalanced';
    } else if (percentageDiff <= 40) {
      balance_state = 'materially_unbalanced';
    } else {
      balance_state = 'critical_imbalance';
    }

    this.sideConsolidations[leader.id] = {
      leader_id: leader.id,
      leader_name: leader.full_name,
      // LEFT SIDE
      izquierda: leftConsolidation,
      // RIGHT SIDE
      derecha: rightConsolidation,
      // BALANCE METRICS
      balance_analysis: {
        member_count_difference: memberDiff,
        investment_difference: investmentDiff,
        payment_health_difference: paymentHealthDiff,
        growth_score_difference: growthDiff,
        left_percentage: totalMembers > 0 ? Math.round((leftMembers.length / totalMembers) * 100) : 0,
        right_percentage: totalMembers > 0 ? Math.round((rightMembers.length / totalMembers) * 100) : 0,
        balance_state,
      },
    };

    // Update leader with side consolidation
    leader.side_consolidation = this.sideConsolidations[leader.id];
  }

  /**
   * Consolidate all metrics for a single side
   */
  consolidateSide(members) {
    const members_count = members.length;
    const active_members_count = members.filter(m => m.renewal_status === 'activo' || m.renewal_status === 'nuevo').length;
    const pending_members_count = members.filter(m => m.payment_status === 'pendiente').length;
    const expired_members_count = members.filter(m => m.renewal_status === 'vencido').length;
    const reinvested_members_count = members.filter(m => m.renewal_status === 'reinvertido').length;
    const late_payers_count = members.filter(m => m.payment_status === 'vencido').length;
    const critical_members_count = members.filter(m => m.risk_level === 'alto').length;

    // FINANCIAL
    const investment_total = members.reduce((sum, m) => sum + (m.investment_amount || 0), 0);
    const confirmed_amount_total = members.filter(m => m.payment_status === 'pagado').reduce((sum, m) => sum + (m.investment_amount || 0), 0);
    const pending_amount_total = members.filter(m => m.payment_status === 'pendiente').reduce((sum, m) => sum + (m.investment_amount || 0), 0);
    const overdue_amount_total = members.filter(m => m.payment_status === 'vencido').reduce((sum, m) => sum + (m.investment_amount || 0), 0);
    const under_review_amount_total = members.filter(m => m.renewal_status === 'por_vencer').reduce((sum, m) => sum + (m.investment_amount || 0), 0);

    // PLAN ANALYSIS
    const average_plan_value = members_count > 0 ? Math.round(investment_total / members_count) : 0;
    const high_value_members_count = members.filter(m => m.investment_amount >= 5000).length;

    // GROWTH & RISK SCORES
    const active_rate = members_count > 0 ? (active_members_count / members_count) * 100 : 0;
    const reinvestment_rate = members_count > 0 ? (reinvested_members_count / members_count) * 100 : 0;
    const growth_velocity_score = Math.round((active_rate * 0.6 + reinvestment_rate * 0.4) * 100) / 100;

    const payment_health_score = members_count > 0 
      ? Math.round(((members_count - late_payers_count) / members_count) * 100 * 100) / 100 
      : 0;

    const risk_rate = members_count > 0 ? (critical_members_count / members_count) * 100 : 0;
    const risk_score = Math.round((100 - risk_rate) * 100) / 100;

    return {
      members_count,
      active_members_count,
      pending_members_count,
      expired_members_count,
      reinvested_members_count,
      late_payers_count,
      critical_members_count,
      // FINANCIAL TOTALS
      investment_total,
      confirmed_amount_total,
      pending_amount_total,
      overdue_amount_total,
      under_review_amount_total,
      // PLAN & QUALITY
      average_plan_value,
      high_value_members_count,
      // SCORES
      active_rate: Math.round(active_rate * 100) / 100,
      reinvestment_rate: Math.round(reinvestment_rate * 100) / 100,
      growth_velocity_score,
      payment_health_score,
      risk_rate: Math.round(risk_rate * 100) / 100,
      risk_score,
    };
  }

  /**
   * Get consolidation for specific leader
   */
  getLeaderConsolidation(leaderId) {
    return this.sideConsolidations[leaderId] || null;
  }

  /**
   * Get all consolidations
   */
  getAllConsolidations() {
    return this.sideConsolidations;
  }

  /**
   * Get balance state for specific leader
   */
  getBalanceState(leaderId) {
    const consolidation = this.sideConsolidations[leaderId];
    if (!consolidation) return null;
    return consolidation.balance_analysis;
  }

  /**
   * Identify leaders with critical imbalance (intervention target)
   */
  getCriticalImbalanceLeaders() {
    const critical = [];
    Object.values(this.sideConsolidations).forEach(consolidation => {
      if (consolidation.balance_analysis.balance_state === 'critical_imbalance') {
        critical.push({
          leader_name: consolidation.leader_name,
          member_diff: consolidation.balance_analysis.member_count_difference,
          investment_diff: consolidation.balance_analysis.investment_difference,
          stronger_side: consolidation.izquierda.investment_total > consolidation.derecha.investment_total ? 'izquierda' : 'derecha',
        });
      }
    });
    return critical;
  }
}

export default BinarySideConsolidationEngine;