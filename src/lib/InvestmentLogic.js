/**
 * INVESTMENT LOGIC — Coherent financial structure
 * All investments validated, realistic, and derived from plans
 */

export const INVESTMENT_PLANS = {
  Start: { min: 500, max: 500, monthlyReturn: 50, duration: 'corto' },
  Growth: { min: 1000, max: 1000, monthlyReturn: 120, duration: 'medio' },
  Advance: { min: 2500, max: 2500, monthlyReturn: 350, duration: 'medio' },
  Pro: { min: 5000, max: 10000, monthlyReturn: 750, duration: 'largo' },
  Elite: { min: 25000, max: 50000, monthlyReturn: 2500, duration: 'largo' },
};

class InvestmentLogic {
  validateInvestment(amount) {
    for (const [planName, planData] of Object.entries(INVESTMENT_PLANS)) {
      if (amount >= planData.min && amount <= planData.max) {
        return { valid: true, plan: planName, ...planData };
      }
    }
    return { valid: false, error: 'Monto no válido' };
  }

  createInvestment(userId, amount, isReinvestment = false) {
    const validation = this.validateInvestment(amount);
    if (!validation.valid) return null;

    const now = new Date();
    const durationDays = validation.duration === 'corto' ? 30 : validation.duration === 'medio' ? 60 : 90;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    return {
      id: `inv-${userId}-${Date.now()}`,
      userId: userId,
      plan: validation.plan,
      amount: amount,
      monthlyReturn: validation.monthlyReturn,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      duration: validation.duration,
      status: 'activo',
      isReinvestment: isReinvestment,
      createdAt: now.toISOString(),
    };
  }

  calculateNetworkInvestmentTotal(users, leaderId) {
    const networkUsers = users.filter(u => u.upline === leaderId);
    return networkUsers.reduce((sum, u) => sum + u.totalInvestment, 0);
  }

  calculateMonthlyIncome(user, investments) {
    if (user.role !== 'leader') return 0;
    
    // Direct income from network
    const directCount = user.directReferrals.length;
    const directIncome = directCount * 100; // Fixed per referral

    // Network investment-based income
    const userInvestments = investments.filter(inv => inv.userId === user.id && inv.status === 'activo');
    const investmentIncome = userInvestments.reduce((sum, inv) => sum + (inv.monthlyReturn * 0.1), 0); // 10% commission

    // Network depth income
    const networkIncome = user.directReferrals.length * 25; // Per active network member

    return Math.floor(directIncome + investmentIncome + networkIncome);
  }

  getReinvestmentRate(user, userInvestments) {
    if (userInvestments.length === 0) return 0;
    const reinvested = userInvestments.filter(inv => inv.isReinvestment).length;
    return (reinvested / userInvestments.length) * 100;
  }

  checkInvestmentHealth(investments) {
    const now = new Date();
    return {
      active: investments.filter(inv => inv.status === 'activo').length,
      expiring: investments.filter(inv => {
        const daysUntilEnd = (new Date(inv.endDate) - now) / (1000 * 60 * 60 * 24);
        return daysUntilEnd < 7 && daysUntilEnd > 0 && inv.status === 'activo';
      }).length,
      expired: investments.filter(inv => inv.status === 'vencido').length,
    };
  }
}

export default new InvestmentLogic();