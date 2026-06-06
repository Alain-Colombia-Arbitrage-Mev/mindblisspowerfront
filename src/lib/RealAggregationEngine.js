/**
 * REAL AGGREGATION ENGINE
 * Derives all visible metrics from actual member data
 * NO hardcoded totals, NO zero placeholders
 * Supports root account, leaders, Roberto Díaz, and admin validation
 */

class RealAggregationEngine {
  constructor(masterAccount, members) {
    this.masterAccount = masterAccount;
    this.members = members;
    this.leaderMap = this.buildLeaderMap();
    this.aggregations = {};
    this.validationTable = [];
  }

  /**
   * Build map of leader -> descendants
   */
  buildLeaderMap() {
    const map = {};
    [this.masterAccount, ...this.members].forEach(user => {
      map[user.id] = {
        user,
        descendants: [],
      };
    });

    this.members.forEach(member => {
      if (member.upline_id && map[member.upline_id]) {
        map[member.upline_id].descendants.push(member);
      }
    });

    return map;
  }

  /**
   * PHASE 1-10: Calculate all aggregations
   */
  execute() {
    console.log('\n📊 REAL AGGREGATION ENGINE: Deriving metrics from actual member data...\n');

    // Calculate for root account
    this.calculateLeaderAggregation(this.masterAccount);

    // Calculate for all leaders (users with descendants)
    this.members.forEach(member => {
      if (this.leaderMap[member.id].descendants.length > 0) {
        this.calculateLeaderAggregation(member);
      }
    });

    // Build validation table
    this.buildValidationTable();

    console.log(`📈 AGGREGATION RESULTS:\n`);
    console.log(`ROOT ACCOUNT: ${this.masterAccount.full_name}`);
    console.log(`  Total Descendants: ${this.aggregations[this.masterAccount.id].total_descendants}`);
    console.log(`  Left Branch: ${this.aggregations[this.masterAccount.id].left_count}`);
    console.log(`  Right Branch: ${this.aggregations[this.masterAccount.id].right_count}`);
    console.log(`  Network Investment: $${this.aggregations[this.masterAccount.id].network_investment}`);
    console.log(`  Monthly Income: $${this.aggregations[this.masterAccount.id].monthly_income}`);
    console.log();

    // Roberto Díaz
    const roberto = this.members.find(m => m.full_name === 'Roberto Díaz');
    if (roberto && this.aggregations[roberto.id]) {
      console.log(`ROBERTO DÍAZ:`);
      console.log(`  Red Activa: ${this.aggregations[roberto.id].total_descendants}`);
      console.log(`  Línea Izquierda: ${this.aggregations[roberto.id].left_count}`);
      console.log(`  Línea Derecha: ${this.aggregations[roberto.id].right_count}`);
      console.log(`  Inversión de Red: $${this.aggregations[roberto.id].network_investment}`);
      console.log(`  Ingresos Mensuales: $${this.aggregations[roberto.id].monthly_income}`);
      console.log();
    }

    console.log(`✅ Aggregation complete. Validation table created with ${this.validationTable.length} leaders.\n`);

    return {
      aggregations: this.aggregations,
      validationTable: this.validationTable,
      masterAccount: this.masterAccount,
    };
  }

  /**
   * Calculate complete aggregation for a leader
   */
  calculateLeaderAggregation(leader) {
    const descendants = this.leaderMap[leader.id].descendants;

    if (descendants.length === 0) return;

    // PHASE 1: Binary and descendant totals
    const leftDescendants = descendants.filter(m => m.binary_side === 'izquierda');
    const rightDescendants = descendants.filter(m => m.binary_side === 'derecha');

    const total_descendants = descendants.length;
    const left_count = leftDescendants.length;
    const right_count = rightDescendants.length;
    const direct_referrals = descendants.length;
    const deep_generation = this.calculateDeepGeneration(descendants);

    // PHASE 2: Investment totals
    const personal_investment = leader.investment_amount || 0;
    const network_investment = descendants.reduce((sum, m) => sum + (m.investment_amount || 0), 0);
    const left_investment = leftDescendants.reduce((sum, m) => sum + (m.investment_amount || 0), 0);
    const right_investment = rightDescendants.reduce((sum, m) => sum + (m.investment_amount || 0), 0);

    // PHASE 3: Member status counts
    const active_members = descendants.filter(m => m.renewal_status === 'activo' || m.renewal_status === 'nuevo').length;
    const pending_members = descendants.filter(m => m.payment_status === 'pendiente').length;
    const expired_members = descendants.filter(m => m.renewal_status === 'vencido').length;
    const reinvested_members = descendants.filter(m => m.renewal_status === 'reinvertido').length;
    const late_payers = descendants.filter(m => m.payment_status === 'vencido').length;
    const critical_members = descendants.filter(m => m.risk_level === 'alto').length;

    // PHASE 4: Plan distribution
    const plans = {
      Start: 0,
      Growth: 0,
      Advance: 0,
      Pro: 0,
      Pro2: 0,
      Elite: 0,
    };
    const planTotals = {
      Start: 0,
      Growth: 0,
      Advance: 0,
      Pro: 0,
      Pro2: 0,
      Elite: 0,
    };

    descendants.forEach(m => {
      if (m.plan_name) {
        plans[m.plan_name] = (plans[m.plan_name] || 0) + 1;
        planTotals[m.plan_name] = (planTotals[m.plan_name] || 0) + (m.investment_amount || 0);
      }
    });

    // PHASE 5: Financial consolidation from payment records
    const confirmed_count = descendants.filter(m => m.payment_status === 'pagado').length;
    const pending_count = descendants.filter(m => m.payment_status === 'pendiente').length;
    const overdue_count = descendants.filter(m => m.payment_status === 'vencido').length;
    const under_review_count = descendants.filter(m => m.renewal_status === 'por_vencer').length;

    const confirmed_amount = descendants.filter(m => m.payment_status === 'pagado').reduce((sum, m) => sum + (m.investment_amount || 0), 0);
    const pending_amount = descendants.filter(m => m.payment_status === 'pendiente').reduce((sum, m) => sum + (m.investment_amount || 0), 0);
    const overdue_amount = descendants.filter(m => m.payment_status === 'vencido').reduce((sum, m) => sum + (m.investment_amount || 0), 0);
    const under_review_amount = descendants.filter(m => m.renewal_status === 'por_vencer').reduce((sum, m) => sum + (m.investment_amount || 0), 0);

    // PHASE 6: Monthly income (from commission events simulated)
    const monthly_income = this.calculateMonthlyIncome(leader, descendants);

    // PHASE 7: Payment pressure metrics
    const payments_due_soon_count = descendants.filter(m => {
      const expiryDate = new Date(m.expiry_date);
      const daysUntilExpiry = (expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      return daysUntilExpiry > 0 && daysUntilExpiry <= 14;
    }).length;

    const payments_overdue_count = late_payers;
    const high_value_pending_count = descendants.filter(m => m.payment_status === 'pendiente' && m.investment_amount >= 5000).length;
    const high_value_overdue_count = descendants.filter(m => m.payment_status === 'vencido' && m.investment_amount >= 5000).length;

    // PHASE 8: Network health scores
    const branch_balance_score = left_count > 0 && right_count > 0 ? Math.min(left_count, right_count) / Math.max(left_count, right_count) * 100 : 0;
    const active_rate = total_descendants > 0 ? (active_members / total_descendants) * 100 : 0;
    const payment_rate = total_descendants > 0 ? (confirmed_count / total_descendants) * 100 : 0;
    const risk_rate = total_descendants > 0 ? (critical_members / total_descendants) * 100 : 0;
    const reinvestment_rate = total_descendants > 0 ? (reinvested_members / total_descendants) * 100 : 0;

    const payment_risk_score = 100 - risk_rate;
    const growth_score = reinvestment_rate;
    const stability_score = payment_rate;
    const network_health_score = (branch_balance_score * 0.25 + active_rate * 0.25 + stability_score * 0.25 + growth_score * 0.25);

    // Store aggregation
    this.aggregations[leader.id] = {
      leader_id: leader.id,
      leader_name: leader.full_name,
      total_descendants,
      left_count,
      right_count,
      direct_referrals,
      deep_generation,
      personal_investment,
      network_investment,
      left_investment,
      right_investment,
      active_members,
      pending_members,
      expired_members,
      reinvested_members,
      late_payers,
      critical_members,
      // Plan distribution
      plan_counts: plans,
      plan_totals: planTotals,
      // Financial
      confirmed_count,
      pending_count,
      overdue_count,
      under_review_count,
      confirmed_amount,
      pending_amount,
      overdue_amount,
      under_review_amount,
      // Income
      monthly_income,
      // Payment pressure
      payments_due_soon_count,
      payments_overdue_count,
      high_value_pending_count,
      high_value_overdue_count,
      // Health scores
      branch_balance_score: Math.round(branch_balance_score * 100) / 100,
      active_rate: Math.round(active_rate * 100) / 100,
      payment_rate: Math.round(payment_rate * 100) / 100,
      risk_rate: Math.round(risk_rate * 100) / 100,
      reinvestment_rate: Math.round(reinvestment_rate * 100) / 100,
      payment_risk_score: Math.round(payment_risk_score * 100) / 100,
      growth_score: Math.round(growth_score * 100) / 100,
      stability_score: Math.round(stability_score * 100) / 100,
      network_health_score: Math.round(network_health_score * 100) / 100,
    };

    // Update leader record with aggregated values
    Object.assign(leader, this.aggregations[leader.id]);
  }

  /**
   * Calculate deep generation count
   */
  calculateDeepGeneration(descendants) {
    const descendantIds = new Set(descendants.map(m => m.id));
    let deep = 0;

    descendants.forEach(member => {
      const childrenOfMember = this.members.filter(m => m.upline_id === member.id);
      deep += childrenOfMember.filter(c => !descendantIds.has(c.id)).length;
    });

    return deep;
  }

  /**
   * Calculate monthly income from commission events
   * Simulated: direct referral + binary + leadership bonus
   */
  calculateMonthlyIncome(leader, descendants) {
    let income = 0;

    // Direct referral commission (5% of direct referrals' investment)
    const directReferrals = descendants;
    const directCommission = directReferrals.reduce((sum, m) => sum + ((m.investment_amount || 0) * 0.05), 0);

    // Binary commission (3% if both lines have members)
    const leftCount = descendants.filter(m => m.binary_side === 'izquierda').length;
    const rightCount = descendants.filter(m => m.binary_side === 'derecha').length;
    let binaryCommission = 0;
    if (leftCount > 0 && rightCount > 0) {
      const lesserSide = Math.min(leftCount, rightCount);
      binaryCommission = lesserSide * 25; // $25 per balanced pair
    }

    // Leadership bonus (if has 5+ active descendants)
    let leadershipBonus = 0;
    const activeDirect = descendants.filter(m => m.renewal_status === 'activo' || m.renewal_status === 'nuevo').length;
    if (activeDirect >= 5) {
      leadershipBonus = activeDirect * 15; // $15 per active member
    }

    // Renewal bonus (5% of renewed members)
    const renewedMembers = descendants.filter(m => m.renewal_status === 'reinvertido');
    const renewalBonus = renewedMembers.reduce((sum, m) => sum + ((m.investment_amount || 0) * 0.05), 0);

    income = directCommission + binaryCommission + leadershipBonus + renewalBonus;

    return Math.round(income * 100) / 100;
  }

  /**
   * Build visible validation table for admin
   */
  buildValidationTable() {
    [this.masterAccount, ...this.members].forEach(leader => {
      if (this.aggregations[leader.id]) {
        const agg = this.aggregations[leader.id];
        this.validationTable.push({
          leader_name: agg.leader_name,
          descendant_count: agg.total_descendants,
          left_count: agg.left_count,
          right_count: agg.right_count,
          network_investment: agg.network_investment,
          monthly_income: agg.monthly_income,
          confirmed_amount: agg.confirmed_amount,
          pending_amount: agg.pending_amount,
          overdue_amount: agg.overdue_amount,
          under_review_amount: agg.under_review_amount,
          active_members: agg.active_members,
          risk_rate: `${agg.risk_rate}%`,
          network_health_score: agg.network_health_score,
        });
      }
    });

    // Sort by network investment descending
    this.validationTable.sort((a, b) => b.network_investment - a.network_investment);
  }

  /**
   * Get aggregation for specific leader
   */
  getLeaderAggregation(leaderId) {
    return this.aggregations[leaderId] || null;
  }

  /**
   * Get validation table
   */
  getValidationTable() {
    return this.validationTable;
  }
}

export default RealAggregationEngine;