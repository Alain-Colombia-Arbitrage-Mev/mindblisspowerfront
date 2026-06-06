/**
 * AML Risk Manager
 * Simulates financial risk scoring for anti-money laundering compliance
 */

class AMLRiskManager {
  constructor() {
    this.userRiskProfiles = {}; // userId -> risk profile
    this.paymentRisks = {}; // paymentId -> risk assessment
    this.observers = [];
  }

  /**
   * Subscribe to risk updates
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }

  notifyObservers(event) {
    this.observers.forEach(cb => cb(event));
  }

  /**
   * Risk level definitions
   */
  RISK_LEVELS = {
    low: { score: 0, color: '#10b981', label: 'Low Risk', threshold: 30 },
    medium: { score: 1, color: '#fb923c', label: 'Medium Risk', threshold: 60 },
    high: { score: 2, color: '#ef4444', label: 'High Risk', threshold: 100 },
  };

  /**
   * Country risk mapping
   */
  COUNTRY_RISK = {
    // High risk countries
    IR: 40, SY: 45, KP: 50, CU: 35, VE: 40,
    // Medium risk
    CN: 25, RU: 30, PK: 28, AE: 20, ZA: 18,
    // Low risk
    US: 5, GB: 5, CA: 5, AU: 5, DE: 5, FR: 5, JP: 5,
  };

  /**
   * Calculate user risk profile
   */
  calculateUserRiskScore(userId, userData = {}) {
    let score = 0;
    const factors = [];

    // Base profile risk
    const countryRisk = this.COUNTRY_RISK[userData.country] || 20;
    score += countryRisk;
    factors.push(`Country (${userData.country}): +${countryRisk}`);

    // Account age factor
    if (userData.accountAgesDays && userData.accountAgeDays < 30) {
      score += 15;
      factors.push('New account (< 30 days): +15');
    } else if (userData.accountAgeDays && userData.accountAgeDays < 90) {
      score += 8;
      factors.push('Relatively new account (< 90 days): +8');
    }

    // Verification status
    if (!userData.kycVerified) {
      score += 20;
      factors.push('KYC not verified: +20');
    }

    // Store profile
    const profile = {
      userId,
      score: Math.min(score, 100),
      level: this.getScoreLevel(score),
      factors,
      lastCalculated: Date.now(),
      paymentCount: userData.paymentCount || 0,
      totalVolume: userData.totalVolume || 0,
    };

    this.userRiskProfiles[userId] = profile;
    this.notifyObservers({ type: 'user_risk_updated', userId, profile });

    return profile;
  }

  /**
   * Calculate payment risk
   */
  calculatePaymentRisk(paymentData) {
    const {
      paymentId,
      userId,
      amount,
      frequency, // payments in last 24h
      method, // 'bank_transfer', 'card', 'wallet'
      country,
      toCountry,
    } = paymentData;

    let score = 0;
    const factors = [];
    const redFlags = [];

    // Amount-based risk
    if (amount > 100000) {
      score += 20;
      factors.push(`Large amount ($${amount}): +20`);
    } else if (amount > 50000) {
      score += 10;
      factors.push(`Medium-high amount ($${amount}): +10`);
    }

    // Frequency-based risk (structuring detection)
    if (frequency > 5) {
      score += 25;
      factors.push(`High frequency (${frequency} in 24h): +25`);
      redFlags.push('Potential structuring pattern detected');
    } else if (frequency > 3) {
      score += 12;
      factors.push(`Medium frequency (${frequency} in 24h): +12`);
    }

    // Payment method risk
    const methodRisk = { bank_transfer: 5, card: 10, wallet: 15, cash: 30 };
    const mRisk = methodRisk[method] || 10;
    score += mRisk;
    factors.push(`Payment method (${method}): +${mRisk}`);

    // Country risk
    const countryRisk = this.COUNTRY_RISK[country] || 20;
    score += countryRisk;
    factors.push(`Origin country (${country}): +${countryRisk}`);

    // Destination country risk (higher weight for cross-border)
    if (toCountry && toCountry !== country) {
      const destRisk = this.COUNTRY_RISK[toCountry] || 20;
      score += destRisk * 1.2; // 20% higher for cross-border
      factors.push(`Destination country (${toCountry}): +${Math.round(destRisk * 1.2)}`);
      redFlags.push('Cross-border transaction');
    }

    // Suspicious patterns
    if (amount % 10000 === 0 && amount > 50000) {
      score += 10;
      factors.push('Round number pattern: +10');
      redFlags.push('Suspicious round number');
    }

    // Round amount (round numbers can indicate structuring)
    if (amount < 10000 && frequency > 2) {
      score += 8;
      redFlags.push('Multiple small transactions');
    }

    // Cap score at 100
    score = Math.min(score, 100);

    const assessment = {
      paymentId,
      userId,
      amount,
      score,
      level: this.getScoreLevel(score),
      factors,
      redFlags,
      needsReview: score >= 60,
      recommendedAction: this.getRecommendedAction(score, redFlags),
      assessedAt: Date.now(),
    };

    this.paymentRisks[paymentId] = assessment;
    this.notifyObservers({ type: 'payment_risk_assessed', paymentId, assessment });

    return assessment;
  }

  /**
   * Get risk level from score
   */
  getScoreLevel(score) {
    if (score < 30) return 'low';
    if (score < 60) return 'medium';
    return 'high';
  }

  /**
   * Get recommended action based on risk
   */
  getRecommendedAction(score, redFlags = []) {
    if (score < 30) {
      return 'Auto-approve payment';
    }
    if (score < 60) {
      return 'Manual review recommended';
    }
    if (redFlags.includes('Potential structuring pattern detected')) {
      return 'BLOCK - Structuring suspected. Require SAR filing.';
    }
    if (redFlags.includes('Cross-border transaction') && score > 70) {
      return 'ESCALATE - High-risk cross-border. Require additional verification.';
    }
    return 'BLOCK pending compliance review';
  }

  /**
   * Get user risk profile
   */
  getUserRiskProfile(userId) {
    return this.userRiskProfiles[userId] || null;
  }

  /**
   * Get payment risk assessment
   */
  getPaymentRiskAssessment(paymentId) {
    return this.paymentRisks[paymentId] || null;
  }

  /**
   * Get high-risk payments
   */
  getHighRiskPayments(limit = 20) {
    return Object.values(this.paymentRisks)
      .filter(p => p.level === 'high')
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get high-risk users
   */
  getHighRiskUsers(limit = 10) {
    return Object.values(this.userRiskProfiles)
      .filter(u => u.level === 'high')
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get AML dashboard summary
   */
  getAMLSummary() {
    const payments = Object.values(this.paymentRisks);
    const users = Object.values(this.userRiskProfiles);

    return {
      totalPaymentsAssessed: payments.length,
      highRiskPayments: payments.filter(p => p.level === 'high').length,
      mediumRiskPayments: payments.filter(p => p.level === 'medium').length,
      blockedPayments: payments.filter(p => p.needsReview).length,
      totalUsersMonitored: users.length,
      highRiskUsers: users.filter(u => u.level === 'high').length,
      avgRiskScore: Math.round(payments.reduce((sum, p) => sum + p.score, 0) / (payments.length || 1)),
    };
  }

  /**
   * Reset (testing only)
   */
  reset() {
    this.userRiskProfiles = {};
    this.paymentRisks = {};
  }
}

export default new AMLRiskManager();