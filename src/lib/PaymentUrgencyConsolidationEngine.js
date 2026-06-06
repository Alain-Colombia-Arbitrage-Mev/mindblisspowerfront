/**
 * PAYMENT URGENCY CONSOLIDATION ENGINE
 * Urgent payment cases and financial summaries from actual records
 * Supports intervention, case creation, and preventive logic
 */

class PaymentUrgencyConsolidationEngine {
  constructor(masterAccount, members, paymentRecords = []) {
    this.masterAccount = masterAccount;
    this.members = members;
    this.paymentRecords = paymentRecords; // Real payment records
    this.urgentCases = [];
    this.cardSummaries = {};
  }

  /**
   * Get payment records for a user (real source of truth)
   */
  getUserPaymentRecords(userId) {
    return this.paymentRecords.filter(p => p.user_id === userId);
  }

  /**
   * Get all payment records for descendants of a leader
   */
  getDescendantPaymentRecords(leaderId) {
    const descendants = this.members.filter(m => m.upline_id === leaderId);
    return this.paymentRecords.filter(p => descendants.some(d => d.id === p.user_id));
  }

  /**
   * EXECUTE: Consolidate payment urgency and create cases
   */
  execute() {
    console.log('\n⚠️  PAYMENT URGENCY CONSOLIDATION: Computing urgent cases and financial cards...\n');

    // Calculate for root account
    this.calculateLeaderUrgency(this.masterAccount);

    // Calculate for all leaders with descendants
    this.members.forEach(member => {
      const descendants = this.members.filter(m => m.upline_id === member.id);
      if (descendants.length > 0) {
        this.calculateLeaderUrgency(member);
      }
    });

    // Build urgent cases table
    // (urgentCases already populated via createUrgentCases calls above)

    console.log(`📊 PAYMENT URGENCY CONSOLIDATION:`);
    console.log(`   Total urgent cases: ${this.urgentCases.length}`);
    console.log(`   Critical cases: ${this.urgentCases.filter(c => c.priority === 'critical').length}`);
    console.log(`   Urgent cases: ${this.urgentCases.filter(c => c.priority === 'urgent').length}`);
    console.log(`   Attention cases: ${this.urgentCases.filter(c => c.priority === 'attention').length}`);
    console.log(`   Total urgent amount: $${this.urgentCases.reduce((sum, c) => sum + c.amount, 0)}\n`);

    return {
      cardSummaries: this.cardSummaries,
      urgentCases: this.urgentCases,
      urgentCasesTable: this.buildVisibleTable(),
    };
  }

  /**
   * Calculate urgency metrics for a leader (reading from payment records)
   */
  calculateLeaderUrgency(leader) {
    const descendants = this.members.filter(m => m.upline_id === leader.id);

    if (descendants.length === 0) {
      this.cardSummaries[leader.id] = this.getEmptySummary(leader);
      return;
    }

    // Get payment records for descendants (real source of truth)
    const descendantPayments = this.getDescendantPaymentRecords(leader.id);

    // CONFIRMED PAYMENTS
    const confirmed = descendantPayments.filter(p => p.status === 'confirmado');
    const confirmed_amount = confirmed.reduce((sum, p) => sum + (p.amount || 0), 0);
    const confirmed_count = confirmed.length;

    // PENDING PAYMENTS
    const pending = descendantPayments.filter(p => p.status === 'pendiente');
    const pending_amount = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pending_count = pending.length;

    // OVERDUE PAYMENTS
    const overdue = descendantPayments.filter(p => p.status === 'vencido');
    const overdue_amount = overdue.reduce((sum, p) => sum + (p.amount || 0), 0);
    const overdue_count = overdue.length;

    // UNDER REVIEW
    const underReview = descendantPayments.filter(p => p.status === 'en revisión');
    const under_review_amount = underReview.reduce((sum, p) => sum + (p.amount || 0), 0);
    const under_review_count = underReview.length;

    // DUE SOON (14 days)
    const dueSoon = descendantPayments.filter(p => {
      const dueDate = new Date(p.due_date);
      const daysUntilDue = (dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      return daysUntilDue > 0 && daysUntilDue <= 14;
    });
    const due_soon_count = dueSoon.length;
    const due_soon_amount = dueSoon.reduce((sum, p) => sum + (p.amount || 0), 0);

    // URGENT (pending + overdue with high value)
    const urgentFiltered = [...pending, ...overdue].filter(p => p.amount >= 5000);
    const urgent_amount = urgentFiltered.reduce((sum, p) => sum + (p.amount || 0), 0);
    const urgent_count = urgentFiltered.length;

    // Create urgent cases for this leader's descendants
    this.createUrgentCases(leader, descendants);

    // Build summary card
    this.cardSummaries[leader.id] = {
      leader_id: leader.id,
      leader_name: leader.full_name,
      // CONFIRMED
      confirmed_amount: Math.round(confirmed_amount * 100) / 100,
      confirmed_count,
      confirmed_severity: confirmed_count > 0 ? 'normal' : 'none',
      // PENDING
      pending_amount: Math.round(pending_amount * 100) / 100,
      pending_count,
      pending_severity: pending_count > 0 ? (pending_amount > 25000 ? 'urgent' : 'attention') : 'none',
      // OVERDUE
      overdue_amount: Math.round(overdue_amount * 100) / 100,
      overdue_count,
      overdue_severity: overdue_count > 0 ? (overdue_amount > 25000 ? 'critical' : 'urgent') : 'none',
      // UNDER REVIEW
      under_review_amount: Math.round(under_review_amount * 100) / 100,
      under_review_count,
      under_review_severity: under_review_count > 0 ? 'attention' : 'none',
      // URGENT
      urgent_amount: Math.round(urgent_amount * 100) / 100,
      urgent_count,
      urgent_severity: urgent_count > 0 ? (urgent_count > 5 ? 'critical' : 'urgent') : 'none',
      // DUE SOON
      due_soon_amount: Math.round(due_soon_amount * 100) / 100,
      due_soon_count,
    };

    // Update leader with summary
    leader.payment_urgency = this.cardSummaries[leader.id];
  }

  /**
   * Create urgent cases for a leader's descendants (from payment records)
   */
  createUrgentCases(leader, descendants) {
    const now = new Date();
    const descendantPayments = this.getDescendantPaymentRecords(leader.id);

    descendantPayments.forEach(payment => {
      const member = this.members.find(m => m.id === payment.user_id);
      if (!member) return;
      
      if (payment.status === 'pendiente' || payment.status === 'vencido' || payment.status === 'en revisión') {
        const dueDate = new Date(payment.due_date);
        const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        const daysOverdue = daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0;

        // Classify priority from payment record
        let priority = 'normal';
        if (payment.status === 'vencido') {
          priority = daysOverdue > 7 ? 'critical' : 'urgent';
        } else if (payment.status === 'pendiente') {
          priority = payment.amount >= 5000 ? 'urgent' : 'attention';
        } else if (payment.status === 'en revisión') {
          priority = 'attention';
        }

        // High value flag
        const is_high_value = payment.amount >= 5000;
        const affects_balance = member.left_count > 0 || member.right_count > 0;

        this.urgentCases.push({
          case_id: `case-${member.id}-${Date.now()}`,
          member_id: member.id,
          member_name: member.full_name,
          leader_name: leader.full_name,
          leader_id: leader.id,
          plan_name: member.membership_plan,
          amount: payment.amount,
          status: payment.status,
          renewal_status: payment.renewal_flag ? 'pending_renewal' : 'active',
          days_to_due: daysUntilDue > 0 ? daysUntilDue : 0,
          days_overdue: daysOverdue,
          branch_side: member.binary_side,
          priority,
          is_high_value,
          affects_balance,
          country: member.country,
          // Case actions
          open_followup_case: true,
          open_finance_review: payment.status === 'vencido',
          open_leader_alert: affects_balance,
          mark_urgent: priority === 'urgent' || priority === 'critical',
          created_date: new Date().toISOString().split('T')[0],
        });
      }
    });
  }

  /**
   * Build visible urgent cases table
   */
  buildVisibleTable() {
    return this.urgentCases
      .sort((a, b) => {
        const priorityOrder = { critical: 0, urgent: 1, attention: 2, normal: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .map(c => ({
        member_name: c.member_name,
        leader_name: c.leader_name,
        plan_name: c.plan_name,
        amount: `$${c.amount}`,
        status: c.status,
        days_to_due_or_overdue: c.days_overdue > 0 ? `${c.days_overdue}d overdue` : `${c.days_to_due}d remaining`,
        branch_side: c.branch_side,
        priority: c.priority.toUpperCase(),
        is_high_value: c.is_high_value ? '⭐' : '',
      }));
  }

  /**
   * Get empty summary for leader with no descendants
   */
  getEmptySummary(leader) {
    return {
      leader_id: leader.id,
      leader_name: leader.full_name,
      confirmed_amount: 0,
      confirmed_count: 0,
      confirmed_severity: 'none',
      pending_amount: 0,
      pending_count: 0,
      pending_severity: 'none',
      overdue_amount: 0,
      overdue_count: 0,
      overdue_severity: 'none',
      under_review_amount: 0,
      under_review_count: 0,
      under_review_severity: 'none',
      urgent_amount: 0,
      urgent_count: 0,
      urgent_severity: 'none',
      due_soon_amount: 0,
      due_soon_count: 0,
    };
  }

  /**
   * Get summary for specific leader
   */
  getLeaderSummary(leaderId) {
    return this.cardSummaries[leaderId] || null;
  }

  /**
   * Get urgent cases for specific leader
   */
  getLeaderUrgentCases(leaderId) {
    return this.urgentCases.filter(c => c.leader_id === leaderId);
  }

  /**
   * Get critical cases requiring immediate action
   */
  getCriticalCases() {
    return this.urgentCases.filter(c => c.priority === 'critical');
  }
}

export default PaymentUrgencyConsolidationEngine;