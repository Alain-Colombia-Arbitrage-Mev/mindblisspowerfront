/**
 * NETWORK ANALYZER — Real consolidation from bottom-up
 * Calculates network totals, balance, health, risk
 */

class NetworkAnalyzer {
  analyzeNetwork(leader, users, investments, payments) {
    const networkMembers = users.filter(u => u.upline === leader.id);
    const leftMembers = users.filter(u => u.leftSide?.includes(leader.id)).length;
    const rightMembers = users.filter(u => u.rightSide?.includes(leader.id)).length;

    return {
      leaderId: leader.id,
      totalMembers: networkMembers.length,
      activeMembers: networkMembers.filter(u => u.status === 'activo').length,
      totalInvestment: this.calculateTotalInvestment(networkMembers, investments),
      leftInvestment: this.calculateSideInvestment(leader.leftSide, users, investments),
      rightInvestment: this.calculateSideInvestment(leader.rightSide, users, investments),
      balance: this.calculateBalance(leader, users, investments),
      pendingPayments: this.countPendingPayments(networkMembers, payments),
      overduePayments: this.countOverduePayments(networkMembers, payments),
      networkHealth: this.assessNetworkHealth(networkMembers, investments, payments),
      growth: this.calculateMonthlyGrowth(networkMembers, users),
      stability: this.assessStability(networkMembers, investments),
      riskLevel: this.assessNetworkRisk(networkMembers, investments, payments),
    };
  }

  calculateTotalInvestment(members, investments) {
    return members.reduce((sum, member) => {
      const memberInvestments = investments.filter(inv => inv.userId === member.id && inv.status === 'activo');
      return sum + memberInvestments.reduce((s, inv) => s + inv.amount, 0);
    }, 0);
  }

  calculateSideInvestment(sideIds, users, investments) {
    const sideMembers = sideIds.map(id => users.find(u => u.id === id)).filter(Boolean);
    return this.calculateTotalInvestment(sideMembers, investments);
  }

  calculateBalance(leader, users, investments) {
    const leftInvestment = this.calculateSideInvestment(leader.leftSide, users, investments);
    const rightInvestment = this.calculateSideInvestment(leader.rightSide, users, investments);
    const total = leftInvestment + rightInvestment;
    
    if (total === 0) return 50;
    return Math.round((leftInvestment / total) * 100);
  }

  countPendingPayments(members, payments) {
    return payments.filter(p => 
      members.some(m => m.id === p.userId) && p.status === 'pendiente'
    ).length;
  }

  countOverduePayments(members, payments) {
    return payments.filter(p => 
      members.some(m => m.id === p.userId) && p.status === 'vencido'
    ).length;
  }

  assessNetworkHealth(members, investments, payments) {
    const activeRate = members.filter(m => m.status === 'activo').length / Math.max(members.length, 1);
    const healthScore = Math.round(activeRate * 100);
    
    if (healthScore >= 80) return 'excelente';
    if (healthScore >= 60) return 'buena';
    if (healthScore >= 40) return 'regular';
    return 'critica';
  }

  calculateMonthlyGrowth(members, allUsers) {
    // Growth based on new members added this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    const newMembers = members.filter(m => new Date(m.createdAt) > thisMonth);
    return newMembers.length;
  }

  assessStability(members, investments) {
    const withInvestments = members.filter(m => 
      investments.some(inv => inv.userId === m.id && inv.status === 'activo')
    ).length;
    
    const stabilityRate = (withInvestments / Math.max(members.length, 1)) * 100;
    return Math.round(stabilityRate);
  }

  assessNetworkRisk(members, investments, payments) {
    let riskScore = 0;

    // Inactive members risk
    const inactiveRate = members.filter(m => m.status !== 'activo').length / Math.max(members.length, 1);
    riskScore += inactiveRate * 30;

    // Payment delays risk
    const totalPayments = payments.length;
    const delayedPayments = payments.filter(p => p.status === 'pendiente' || p.status === 'vencido').length;
    riskScore += (delayedPayments / Math.max(totalPayments, 1)) * 25;

    // Low investment ratio
    const investedMembers = investments.filter(inv => inv.status === 'activo').length;
    riskScore += ((members.length - investedMembers) / Math.max(members.length, 1)) * 25;

    if (riskScore >= 60) return 'critico';
    if (riskScore >= 40) return 'alto';
    if (riskScore >= 20) return 'medio';
    return 'bajo';
  }
}

export default new NetworkAnalyzer();