/**
 * BEHAVIOR ANALYZER — Intelligent user classification
 * Track patterns, commitment, activity, payment behavior
 */

class BehaviorAnalyzer {
  analyzeUser(user, investments, payments, history) {
    const behavior = {
      userId: user.id,
      investmentFrequency: this.calculateInvestmentFrequency(investments),
      reinvestmentRate: this.calculateReinvestmentRate(investments),
      paymentReliability: this.calculatePaymentReliability(payments),
      activityLevel: this.calculateActivityLevel(user, history),
      commitmentScore: 0,
      classification: 'neutral',
      riskLevel: 'bajo',
    };

    // Calculate commitment score
    behavior.commitmentScore = Math.round(
      (behavior.investmentFrequency * 0.25) +
      (behavior.reinvestmentRate * 0.25) +
      (behavior.paymentReliability * 0.3) +
      (behavior.activityLevel * 0.2)
    );

    // Classify user
    behavior.classification = this.classifyUser(behavior, user.status);
    behavior.riskLevel = this.assessRisk(behavior, user, payments);

    return behavior;
  }

  calculateInvestmentFrequency(investments) {
    if (investments.length === 0) return 0;
    // Score 0-100 based on how many investments made
    return Math.min(100, investments.length * 10);
  }

  calculateReinvestmentRate(investments) {
    if (investments.length === 0) return 0;
    const reinvested = investments.filter(inv => inv.isReinvestment).length;
    return (reinvested / investments.length) * 100;
  }

  calculatePaymentReliability(payments) {
    if (payments.length === 0) return 50;
    const onTime = payments.filter(p => p.status === 'completado').length;
    return (onTime / payments.length) * 100;
  }

  calculateActivityLevel(user, history) {
    // Based on last activity and history count
    const daysInactive = (Date.now() - new Date(user.lastActivity)) / (1000 * 60 * 60 * 24);
    const activityScore = Math.max(0, 100 - (daysInactive * 5));
    const historyBonus = Math.min(30, history.length * 2);
    return Math.min(100, activityScore + historyBonus);
  }

  classifyUser(behavior, userStatus) {
    if (userStatus !== 'activo') return 'inactivo';
    if (behavior.commitmentScore >= 80) return 'creciente';
    if (behavior.commitmentScore >= 60) return 'activo';
    if (behavior.commitmentScore >= 40) return 'pasivo';
    return 'en_riesgo';
  }

  assessRisk(behavior, user, payments) {
    let riskScore = 0;

    // Payment history risk
    const overduePayments = payments.filter(p => p.status === 'vencido').length;
    riskScore += overduePayments * 10;

    // Inactivity risk
    const daysInactive = (Date.now() - new Date(user.lastActivity)) / (1000 * 60 * 60 * 24);
    if (daysInactive > 30) riskScore += 20;

    // Low commitment risk
    if (behavior.commitmentScore < 40) riskScore += 15;

    // Payment reliability risk
    if (behavior.paymentReliability < 70) riskScore += 25;

    if (riskScore >= 50) return 'critico';
    if (riskScore >= 30) return 'alto';
    if (riskScore >= 15) return 'medio';
    return 'bajo';
  }

  detectPatterns(users, investments, payments, history) {
    return {
      nonReinvestors: users.filter(u => {
        const userInv = investments.filter(inv => inv.userId === u.id);
        return userInv.length > 0 && userInv.every(inv => !inv.isReinvestment);
      }).map(u => u.id),

      latePayersPattern: users.filter(u => {
        const userPayments = payments.filter(p => p.userId === u.id);
        return userPayments.filter(p => p.status === 'vencido').length > userPayments.length * 0.3;
      }).map(u => u.id),

      fastGrowers: users.filter(u => {
        const recentHistory = history.filter(h => h.userId === u.id && new Date(h.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        return recentHistory.length > 5;
      }).map(u => u.id),

      abandonedAccounts: users.filter(u => {
        const daysInactive = (Date.now() - new Date(u.lastActivity)) / (1000 * 60 * 60 * 24);
        return daysInactive > 60;
      }).map(u => u.id),
    };
  }
}

export default new BehaviorAnalyzer();