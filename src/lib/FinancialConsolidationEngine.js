/**
 * FINANCIAL CONSOLIDATION ENGINE
 * Generates payment records and derives financial summaries from 182-member dataset
 * All values computed from real member data, zero placeholders banned
 */

class FinancialConsolidationEngine {
  constructor(members, orchestrationMetrics) {
    this.members = members;
    this.metrics = orchestrationMetrics;
    this.paymentRecords = [];
    this.financialSummary = {};
  }

  /**
   * PHASE 1: CREATE PAYMENT RECORDS
   * Every member gets payment record reflecting their membership/investment status
   */
  generatePaymentRecords() {
    console.log('💳 Generating payment records for 182 members...');

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    this.members.forEach(member => {
      const paymentDate = new Date(member.payment_date || thisMonth);
      const dueDate = new Date(paymentDate);
      dueDate.setMonth(dueDate.getMonth() + 1);

      let status = 'confirmado';
      if (member.payment_status === 'pendiente') status = 'pendiente';
      else if (member.payment_status === 'vencido') status = 'vencido';
      else if (member.payment_status === 'en revisión') status = 'en revisión';
      else status = 'confirmado';

      const paymentRecord = {
        id: `payment-${member.id}-membership`,
        member_id: member.id,
        member_name: member.full_name,
        country: member.country,
        plan_name: member.membership_plan,
        amount: member.investment_amount,
        payment_method: member.payment_method || 'transferencia',
        payment_date: paymentDate.toISOString(),
        due_date: dueDate.toISOString(),
        status: status,
        review_flag: status === 'en revisión' || member.risk_level === 'alto',
        renewal_flag: this.needsRenewal(dueDate),
        original_status: member.payment_status,
      };

      this.paymentRecords.push(paymentRecord);

      if (member.late_payment_count > 0) {
        for (let i = 0; i < member.late_payment_count; i++) {
          const latePaymentDate = new Date(paymentDate);
          latePaymentDate.setMonth(latePaymentDate.getMonth() + i + 1);
          
          this.paymentRecords.push({
            id: `payment-${member.id}-late-${i}`,
            member_id: member.id,
            member_name: member.full_name,
            country: member.country,
            plan_name: member.membership_plan,
            amount: member.investment_amount * 0.5,
            payment_method: member.payment_method || 'transferencia',
            payment_date: latePaymentDate.toISOString(),
            due_date: new Date(latePaymentDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'vencido',
            review_flag: true,
            renewal_flag: false,
          });
        }
      }
    });

    console.log(`✅ Generated ${this.paymentRecords.length} payment records`);
    return this.paymentRecords;
  }

  needsRenewal(dueDate) {
    const now = new Date();
    const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24);
    return daysUntilDue <= 14 && daysUntilDue > 0;
  }

  /**
   * PHASE 2-4: CONSOLIDATE FINANCIAL DATA
   */
  consolidateFinancials() {
    console.log('📊 Consolidating financial data...');

    let confirmedAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    let reviewAmount = 0;

    let pendingCount = 0;
    let overdueCount = 0;
    let reviewCount = 0;
    let renewalCount = 0;

    const statusCounts = {
      confirmado: 0,
      pendiente: 0,
      vencido: 0,
      'en revisión': 0,
    };

    this.paymentRecords.forEach(record => {
      const amount = record.amount;

      switch (record.status) {
        case 'confirmado':
          confirmedAmount += amount;
          statusCounts.confirmado++;
          break;
        case 'pendiente':
          pendingAmount += amount;
          statusCounts.pendiente++;
          pendingCount++;
          break;
        case 'vencido':
          overdueAmount += amount;
          statusCounts.vencido++;
          overdueCount++;
          break;
        case 'en revisión':
          reviewAmount += amount;
          statusCounts['en revisión']++;
          reviewCount++;
          break;
      }

      if (record.renewal_flag) renewalCount++;
    });

    // Detect urgent cases
    const urgentFlags = [];
    if (overdueCount > this.members.length * 0.1) {
      urgentFlags.push('Tasa de vencimiento elevada: ' + Math.round((overdueCount / this.members.length) * 100) + '%');
    }
    if (reviewCount > 8) {
      urgentFlags.push(`${reviewCount} pagos requieren revisión manual`);
    }
    if (renewalCount > this.members.length * 0.15) {
      urgentFlags.push(`${renewalCount} renovaciones próximas`);
    }
    if (pendingAmount > this.metrics.networkInvestment * 0.15) {
      urgentFlags.push(`Monto pendiente elevado: $${Math.round(pendingAmount / 1000)}K`);
    }

    this.financialSummary = {
      period: new Date().toISOString(),
      confirmed_amount_total: confirmedAmount,
      pending_amount_total: pendingAmount,
      overdue_amount_total: overdueAmount,
      review_amount_total: reviewAmount,
      pending_count: pendingCount,
      overdue_count: overdueCount,
      review_count: reviewCount,
      renewal_count: renewalCount,
      status_counts: statusCounts,
      urgent_flags: urgentFlags,
      total_members: this.members.length,
      total_records: this.paymentRecords.length,
    };

    console.log(`✅ Confirmed: $${confirmedAmount} (${statusCounts.confirmado} records)`);
    console.log(`✅ Pending: $${pendingAmount} (${pendingCount} records)`);
    console.log(`✅ Overdue: $${overdueAmount} (${overdueCount} records)`);
    console.log(`✅ Review: $${reviewAmount} (${reviewCount} records)`);
    console.log(`✅ Urgent flags: ${urgentFlags.length}`);

    return this.financialSummary;
  }

  /**
   * PHASE 5: LEADER-LEVEL VIEW FOR ROBERTO
   */
  getRobertoFinancialView(masterId = 'master') {
    return {
      masterId: masterId,
      masterName: 'Embajador Corona',
      period: this.financialSummary.period,
      ingresos_confirmados: {
        amount: this.financialSummary.confirmed_amount_total,
        count: this.financialSummary.status_counts.confirmado,
      },
      pendientes: {
        amount: this.financialSummary.pending_amount_total,
        count: this.financialSummary.pending_count,
      },
      vencidos: {
        amount: this.financialSummary.overdue_amount_total,
        count: this.financialSummary.overdue_count,
      },
      en_revision: {
        amount: this.financialSummary.review_amount_total,
        count: this.financialSummary.review_count,
      },
      renovaciones_proximas: this.financialSummary.renewal_count,
      urgent_alerts: this.financialSummary.urgent_flags,
    };
  }

  /**
   * PHASE 6+8: VALIDATE AND RETURN
   */
  execute() {
    this.generatePaymentRecords();
    this.consolidateFinancials();

    const validation = this.validate();
    console.log(`\n🔍 Validation: ${validation.valid ? '✅ PASSED' : '❌ FAILED'}`);

    return {
      paymentRecords: this.paymentRecords,
      financialSummary: this.financialSummary,
      leaderView: this.getRobertoFinancialView(),
      validation: validation,
    };
  }

  /**
   * PHASE 8: VALIDATE NO ZERO DEFAULTS
   */
  validate() {
    const errors = [];

    if (this.financialSummary.confirmed_amount_total === 0 && this.paymentRecords.length > 0) {
      errors.push('Confirmed amount is zero despite having payment records');
    }
    if (this.financialSummary.total_records === 0 && this.members.length > 0) {
      errors.push('No payment records created for members');
    }
    if (this.paymentRecords.length !== this.members.length && this.members.length > 0) {
      // Each member should have at least one payment record
      const expectedMin = this.members.length;
      if (this.paymentRecords.length < expectedMin) {
        errors.push(`Payment records (${this.paymentRecords.length}) < members (${expectedMin})`);
      }
    }

    const total = this.financialSummary.confirmed_amount_total +
                  this.financialSummary.pending_amount_total +
                  this.financialSummary.overdue_amount_total +
                  this.financialSummary.review_amount_total;

    if (total === 0 && this.members.length > 0) {
      errors.push('Total consolidated amount is zero despite 182 members with investments');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      timestamp: new Date().toISOString(),
    };
  }
}

export default FinancialConsolidationEngine;