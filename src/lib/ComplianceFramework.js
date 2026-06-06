/**
 * Compliance Framework
 * Simulates enterprise-grade compliance processes
 * KYC, AML, transaction monitoring, compliance auditing
 */

class ComplianceFramework {
  constructor() {
    this.kycProfiles = {}; // KYC status by user
    this.amlScores = {}; // AML risk scores by user
    this.transactionLogs = []; // Transaction monitoring
    this.complianceLogs = []; // Audit trail
    this.policies = this.initializePolicies();
    this.observers = [];
  }

  /**
   * Subscribe to compliance updates
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
   * Initialize compliance policies
   */
  initializePolicies() {
    return {
      KYC_LEVELS: {
        tier1: { name: 'Basic', amlThreshold: 10000, required: true },
        tier2: { name: 'Enhanced', amlThreshold: 50000, required: false },
        tier3: { name: 'Full Due Diligence', amlThreshold: 500000, required: false },
      },
      AML_RISK_LEVELS: {
        low: { score: 0, color: '#10b981', threshold: 25 },
        medium: { score: 1, color: '#fb923c', threshold: 50 },
        high: { score: 2, color: '#ef4444', threshold: 75 },
        critical: { score: 3, color: '#991b1b', threshold: 100 },
      },
      TRANSACTION_LIMITS: {
        daily: 100000,
        weekly: 500000,
        monthly: 2000000,
      },
      MONITORING_FLAGS: {
        high_volume: { weight: 15, description: 'Unusual transaction volume' },
        rapid_movement: { weight: 20, description: 'Rapid movement of funds' },
        round_numbers: { weight: 10, description: 'Suspicious round number patterns' },
        multiple_small: { weight: 15, description: 'Structuring pattern detected' },
        high_risk_country: { weight: 25, description: 'High-risk jurisdiction activity' },
        new_beneficiary: { weight: 10, description: 'New beneficiary account' },
      },
    };
  }

  /**
   * Create/Update KYC Profile
   */
  createKYCProfile(userId, userData) {
    const profile = {
      userId,
      fullName: userData.fullName,
      email: userData.email,
      country: userData.country || 'US',
      documentType: userData.documentType || 'PASSPORT',
      documentVerified: userData.documentVerified !== false,
      level: userData.level || 'tier1',
      status: userData.documentVerified !== false ? 'verified' : 'pending',
      riskProfile: 'low',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      pep: false, // Politically Exposed Person
      sanctions: false,
      adverseMedia: false,
      notes: [],
    };

    this.kycProfiles[userId] = profile;
    this.logCompliance('KYC_CREATED', userId, `KYC profile created - Level: ${profile.level}`);
    this.notifyObservers({ type: 'kyc_updated', userId, profile });

    return profile;
  }

  /**
   * Get KYC Profile
   */
  getKYCProfile(userId) {
    return this.kycProfiles[userId] || null;
  }

  /**
   * Calculate AML Risk Score
   */
  calculateAMLScore(userId, transactionData = {}) {
    const profile = this.kycProfiles[userId];
    if (!profile) return null;

    let score = 0;
    const factors = [];

    // Base risk by country
    const countryRiskMap = {
      US: 10,
      GB: 12,
      CA: 10,
      AE: 20,
      CN: 40,
      RU: 45,
      IR: 50,
      KP: 60,
      SY: 55,
    };
    const countryRisk = countryRiskMap[profile.country] || 25;
    score += countryRisk;
    factors.push(`Country risk (${profile.country}): +${countryRisk}`);

    // PEP status
    if (profile.pep) {
      score += 30;
      factors.push('PEP Status: +30');
    }

    // Sanctions
    if (profile.sanctions) {
      score += 50;
      factors.push('Sanctions match: +50');
    }

    // Adverse media
    if (profile.adverseMedia) {
      score += 25;
      factors.push('Adverse media: +25');
    }

    // Transaction patterns
    if (transactionData.volume > 50000) {
      score += 15;
      factors.push('High volume: +15');
    }

    if (transactionData.frequency > 10) {
      score += 10;
      factors.push('High frequency: +10');
    }

    // Cap score at 100
    score = Math.min(score, 100);

    const riskLevel = this.getRiskLevel(score);
    const amlScore = {
      userId,
      score,
      riskLevel,
      factors,
      calculatedAt: Date.now(),
      transactionData,
    };

    this.amlScores[userId] = amlScore;
    this.logCompliance('AML_SCORE_CALCULATED', userId, `AML Score: ${score} (${riskLevel})`);
    this.notifyObservers({ type: 'aml_updated', userId, amlScore });

    return amlScore;
  }

  /**
   * Get Risk Level
   */
  getRiskLevel(score) {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }

  /**
   * Monitor Transaction
   */
  monitorTransaction(transactionData) {
    const {
      transactionId,
      userId,
      amount,
      toUserId,
      type, // 'payment', 'payout', 'investment'
      timestamp = Date.now(),
    } = transactionData;

    const flags = [];
    const details = {};

    // Get current AML score
    const amlScore = this.amlScores[userId];
    if (amlScore?.riskLevel === 'high' || amlScore?.riskLevel === 'critical') {
      flags.push('high_risk_user');
    }

    // Check transaction limits
    const dailyTotal = this.getTransactionTotal(userId, 'daily');
    if (dailyTotal + amount > this.policies.TRANSACTION_LIMITS.daily) {
      flags.push('daily_limit_exceeded');
      details.dailyTotal = dailyTotal;
    }

    // Check for structuring (multiple small transactions)
    const recentTxns = this.transactionLogs.filter(
      t => t.userId === userId && Date.now() - t.timestamp < 3600000
    ); // Last hour
    if (recentTxns.length > 5 && amount < 10000) {
      flags.push('multiple_small');
    }

    // Check round numbers
    if (amount % 5000 === 0 && amount > 10000) {
      flags.push('round_numbers');
    }

    // Create transaction log entry
    const logEntry = {
      transactionId,
      userId,
      toUserId,
      amount,
      type,
      timestamp,
      flags,
      details,
      status: flags.length > 0 ? 'flagged' : 'monitored',
      reviewedAt: null,
      reviewedBy: null,
    };

    this.transactionLogs.push(logEntry);
    this.logCompliance('TRANSACTION_MONITORED', userId, `Transaction ${transactionId}: $${amount} - Status: ${logEntry.status}`);
    this.notifyObservers({ type: 'transaction_monitored', transaction: logEntry });

    return logEntry;
  }

  /**
   * Get Transaction Total
   */
  getTransactionTotal(userId, period = 'daily') {
    const now = Date.now();
    let timeWindow = 86400000; // 24 hours

    if (period === 'weekly') timeWindow = 7 * 86400000;
    if (period === 'monthly') timeWindow = 30 * 86400000;

    return this.transactionLogs
      .filter(t => t.userId === userId && now - t.timestamp < timeWindow)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Review Flagged Transaction
   */
  reviewTransaction(transactionId, decision, reviewer, notes = '') {
    const txn = this.transactionLogs.find(t => t.transactionId === transactionId);
    if (!txn) return null;

    txn.reviewedAt = Date.now();
    txn.reviewedBy = reviewer;
    txn.decision = decision; // 'approved', 'rejected', 'investigate'
    txn.notes = notes;
    txn.status = 'reviewed';

    this.logCompliance('TRANSACTION_REVIEWED', txn.userId, `Transaction ${transactionId}: Decision=${decision}`);
    this.notifyObservers({ type: 'transaction_reviewed', transaction: txn });

    return txn;
  }

  /**
   * Log Compliance Event
   */
  logCompliance(eventType, relatedUserId, description, metadata = {}) {
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType, // KYC_CREATED, AML_SCORE_CALCULATED, TRANSACTION_MONITORED, etc.
      relatedUserId,
      description,
      metadata,
      timestamp: Date.now(),
      severity: this.getEventSeverity(eventType),
    };

    this.complianceLogs.push(logEntry);
    this.notifyObservers({ type: 'compliance_logged', log: logEntry });

    return logEntry;
  }

  /**
   * Get Event Severity
   */
  getEventSeverity(eventType) {
    const severityMap = {
      KYC_CREATED: 'info',
      KYC_UPDATED: 'info',
      AML_SCORE_CALCULATED: 'info',
      TRANSACTION_MONITORED: 'warning',
      TRANSACTION_FLAGGED: 'warning',
      TRANSACTION_REVIEWED: 'info',
      POLICY_VIOLATION: 'critical',
      SANCTIONS_MATCH: 'critical',
    };
    return severityMap[eventType] || 'info';
  }

  /**
   * Get Compliance Dashboard Data
   */
  getComplianceDashboard() {
    const totalProfiles = Object.keys(this.kycProfiles).length;
    const verifiedProfiles = Object.values(this.kycProfiles).filter(p => p.status === 'verified').length;
    const flaggedTransactions = this.transactionLogs.filter(t => t.status === 'flagged').length;
    const highRiskUsers = Object.values(this.amlScores).filter(
      s => s.riskLevel === 'high' || s.riskLevel === 'critical'
    ).length;

    const recentLogs = this.complianceLogs.slice(-20).reverse();

    return {
      summary: {
        totalProfiles,
        verifiedProfiles,
        pendingKYC: totalProfiles - verifiedProfiles,
        flaggedTransactions,
        highRiskUsers,
        totalTransactionsMonitored: this.transactionLogs.length,
      },
      recentLogs,
    };
  }

  /**
   * Get Compliance Report
   */
  getComplianceReport(userId) {
    const profile = this.kycProfiles[userId];
    const amlScore = this.amlScores[userId];
    const userTransactions = this.transactionLogs.filter(t => t.userId === userId);
    const userLogs = this.complianceLogs.filter(l => l.relatedUserId === userId);

    return {
      userId,
      kycProfile: profile,
      amlScore,
      transactions: {
        total: userTransactions.length,
        flagged: userTransactions.filter(t => t.status === 'flagged').length,
        reviewed: userTransactions.filter(t => t.status === 'reviewed').length,
        totalAmount: userTransactions.reduce((sum, t) => sum + t.amount, 0),
      },
      complianceHistory: userLogs,
      overallStatus: this.getOverallStatus(profile, amlScore),
    };
  }

  /**
   * Get Overall Compliance Status
   */
  getOverallStatus(profile, amlScore) {
    if (!profile) return 'incomplete';
    if (profile.status !== 'verified') return 'pending_verification';
    if (amlScore?.riskLevel === 'critical') return 'high_risk';
    if (amlScore?.riskLevel === 'high') return 'elevated_risk';
    return 'compliant';
  }

  /**
   * Reset (testing only)
   */
  reset() {
    this.kycProfiles = {};
    this.amlScores = {};
    this.transactionLogs = [];
    this.complianceLogs = [];
  }
}

export default new ComplianceFramework();