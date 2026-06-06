/**
 * PATTERN DETECTOR — Intelligent pattern recognition
 * Identifies trends, behaviors, and anomalies
 */

class PatternDetector {
  detectAllPatterns(users, investments, payments, history) {
    return {
      nonReinvestors: this.detectNonReinvestors(users, investments),
      latePayerPattern: this.detectLatePayers(users, payments),
      fastGrowers: this.detectFastGrowers(users, history),
      abandonedAccounts: this.detectAbandoned(users),
      highValueUsers: this.detectHighValue(users, investments),
      riskyClusters: this.detectRiskyClusters(users, payments),
    };
  }

  detectNonReinvestors(users, investments) {
    return users
      .filter(u => u.role === 'leader')
      .map(u => {
        const userInv = investments.filter(inv => inv.userId === u.id);
        const reinvestments = userInv.filter(inv => inv.isReinvestment);
        
        if (userInv.length === 0) return null;
        if (reinvestments.length === 0) return { userId: u.id, name: u.name, type: 'no_reinvestment' };
        return null;
      })
      .filter(Boolean);
  }

  detectLatePayers(users, payments) {
    return users
      .map(u => {
        const userPayments = payments.filter(p => p.userId === u.id);
        if (userPayments.length === 0) return null;

        const latePayments = userPayments.filter(p => p.status === 'vencido' || p.status === 'pendiente');
        const lateRate = (latePayments.length / userPayments.length);

        if (lateRate > 0.5) {
          return {
            userId: u.id,
            name: u.name,
            lateRate: Math.round(lateRate * 100),
            pattern: 'chronic_delays',
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  detectFastGrowers(users, history) {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    return users
      .map(u => {
        const recentActions = history.filter(h => 
          h.userId === u.id && new Date(h.createdAt) > monthAgo
        );

        if (recentActions.length >= 5) {
          return {
            userId: u.id,
            name: u.name,
            actionsLastMonth: recentActions.length,
            pattern: 'rapid_growth',
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  detectAbandoned(users) {
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    return users
      .filter(u => new Date(u.lastActivity) < twoMonthsAgo && u.status === 'activo')
      .map(u => ({
        userId: u.id,
        name: u.name,
        daysInactive: Math.floor((Date.now() - new Date(u.lastActivity)) / (1000 * 60 * 60 * 24)),
        pattern: 'potential_churn',
      }));
  }

  detectHighValue(users, investments) {
    return users
      .filter(u => u.totalInvestment > 15000)
      .map(u => ({
        userId: u.id,
        name: u.name,
        totalInvestment: u.totalInvestment,
        pattern: 'high_value_asset',
      }));
  }

  detectRiskyClusters(users, payments) {
    // Find groups of related users with payment issues
    return users
      .filter(u => {
        const userPayments = payments.filter(p => p.userId === u.id);
        const overdueRate = userPayments.filter(p => p.status === 'vencido').length / Math.max(userPayments.length, 1);
        return overdueRate > 0.3;
      })
      .map(u => ({
        userId: u.id,
        name: u.name,
        pattern: 'risky_cluster',
        upline: u.upline,
      }));
  }
}

export default new PatternDetector();