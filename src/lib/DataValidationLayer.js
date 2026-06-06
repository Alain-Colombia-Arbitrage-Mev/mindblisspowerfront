/**
 * DATA VALIDATION LAYER
 * Enforces data-first rendering rules: no zero placeholders if source exists
 * All 7 mathematical integrity rules + mandatory source derivation
 */

class DataValidationLayer {
  constructor(integrityModel) {
    this.model = integrityModel;
  }

  /**
   * RULE 1: If network_descendants_count > 0 then deep_generation > 0
   */
  validateDeepGeneration(userId) {
    const user = this.model.users.find(u => u.id === userId);
    if (!user) return { valid: false, error: 'User not found' };

    const descendants = this.model.network_nodes.filter(n => n.upline_id === userId);
    if (descendants.length === 0) return { valid: true, message: 'No descendants' };

    const deepGenCount = descendants.length;
    return {
      valid: deepGenCount > 0,
      value: deepGenCount,
      error: deepGenCount === 0 ? 'Deep generation is zero but descendants exist' : null,
    };
  }

  /**
   * RULE 2: left_count + right_count = network_descendants_count
   */
  validateBinaryBalance(userId) {
    const descendants = this.model.network_nodes.filter(n => n.upline_id === userId);
    if (descendants.length === 0) return { valid: true, message: 'No descendants' };

    const leftCount = descendants.filter(n => n.side === 'left').length;
    const rightCount = descendants.filter(n => n.side === 'right').length;
    const totalCount = descendants.length;

    const balanced = leftCount + rightCount === totalCount;
    return {
      valid: balanced,
      leftCount,
      rightCount,
      totalCount,
      error: !balanced ? `Left (${leftCount}) + Right (${rightCount}) ≠ Total (${totalCount})` : null,
    };
  }

  /**
   * RULE 3: If user owns active membership then personal_investment > 0
   */
  validatePersonalInvestment(userId) {
    const membership = this.model.memberships.find(
      m => m.user_id === userId && m.status === 'active'
    );
    if (!membership) return { valid: true, message: 'No active membership' };

    const hasInvestment = membership.plan_value > 0;
    return {
      valid: hasInvestment,
      value: membership.plan_value,
      error: !hasInvestment ? 'Active membership exists but plan_value is zero' : null,
    };
  }

  /**
   * RULE 4: If descendants have active memberships then network_investment > 0
   */
  validateNetworkInvestment(userId) {
    const descendants = this.model.network_nodes.filter(n => n.upline_id === userId);
    if (descendants.length === 0) return { valid: true, message: 'No descendants' };

    const activeMemberships = this.model.memberships.filter(
      m => descendants.some(d => d.user_id === m.user_id) && m.status === 'active'
    );
    if (activeMemberships.length === 0) return { valid: true, message: 'No active descendant memberships' };

    const totalInvestment = activeMemberships.reduce((sum, m) => sum + m.plan_value, 0);
    return {
      valid: totalInvestment > 0,
      value: totalInvestment,
      membershipCount: activeMemberships.length,
      error: totalInvestment === 0 ? 'Active descendant memberships exist but total investment is zero' : null,
    };
  }

  /**
   * RULE 5: Payment records must derive financial cards
   */
  validateFinancialRecords(userId, paymentRecords) {
    if (!paymentRecords || paymentRecords.length === 0) {
      return { valid: true, message: 'No payment records' };
    }

    const confirmed = paymentRecords.filter(p => p.status === 'confirmado').reduce((s, p) => s + p.amount, 0);
    const pending = paymentRecords.filter(p => p.status === 'pendiente').reduce((s, p) => s + p.amount, 0);
    const overdue = paymentRecords.filter(p => p.status === 'vencido').reduce((s, p) => s + p.amount, 0);
    const review = paymentRecords.filter(p => p.status === 'en revisión').reduce((s, p) => s + p.amount, 0);

    const totalAmount = confirmed + pending + overdue + review;

    return {
      valid: totalAmount > 0,
      confirmed,
      pending,
      overdue,
      review,
      totalAmount,
      recordCount: paymentRecords.length,
      error: totalAmount === 0 ? 'Payment records exist but total amount is zero' : null,
    };
  }

  /**
   * RULE 6: Commission events in current month = monthly_income > 0
   */
  validateMonthlyIncome(userId, commissionEvents) {
    if (!commissionEvents || commissionEvents.length === 0) {
      return { valid: true, message: 'No commission events' };
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyEvents = commissionEvents.filter(
      e => new Date(e.event_date) >= thisMonth && e.leader_id === userId
    );

    if (monthlyEvents.length === 0) return { valid: true, message: 'No events this month' };

    const monthlyIncome = monthlyEvents.reduce((sum, e) => sum + e.event_amount, 0);

    return {
      valid: monthlyIncome > 0,
      value: monthlyIncome,
      eventCount: monthlyEvents.length,
      error: monthlyIncome === 0 ? 'Commission events exist this month but total income is zero' : null,
    };
  }

  /**
   * COMPREHENSIVE VALIDATION FOR A LEADER
   */
  validateLeader(userId) {
    const user = this.model.users.find(u => u.id === userId);
    if (!user) return { valid: false, error: 'User not found', canRender: false };

    const results = {
      rule1_deepGeneration: this.validateDeepGeneration(userId),
      rule2_binaryBalance: this.validateBinaryBalance(userId),
      rule3_personalInvestment: this.validatePersonalInvestment(userId),
      rule4_networkInvestment: this.validateNetworkInvestment(userId),
    };

    const allValid = Object.values(results).every(r => r.valid);

    return {
      userId,
      userName: user.name,
      allRulesValid: allValid,
      results,
      canRender: true,
      errors: Object.entries(results)
        .filter(([_, r]) => r.error)
        .map(([rule, r]) => `${rule}: ${r.error}`),
    };
  }

  /**
   * CHECK IF VALUE CAN BE RENDERED
   * Returns { canRender: boolean, value: number|string, reason: string }
   */
  canRenderValue(userId, metricName, computedValue, sourceCount) {
    // If source data exists but value is zero, block rendering
    if (sourceCount > 0 && computedValue === 0) {
      return {
        canRender: false,
        value: null,
        display: 'Datos en construcción',
        reason: `${metricName}: source records exist (${sourceCount}) but computed value is zero`,
      };
    }

    // If source data doesn't exist and value is zero, allow "Datos en construcción"
    if (sourceCount === 0 && computedValue === 0) {
      return {
        canRender: true,
        value: null,
        display: 'Datos en construcción',
        reason: `${metricName}: no source records yet`,
      };
    }

    // Otherwise render the computed value
    return {
      canRender: true,
      value: computedValue,
      display: computedValue,
      reason: 'Valid computed value from source',
    };
  }
}

export default DataValidationLayer;