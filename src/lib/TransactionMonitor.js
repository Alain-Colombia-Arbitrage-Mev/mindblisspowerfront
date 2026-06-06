/**
 * Transaction Monitor
 * Real-time payment activity tracking and suspicious pattern detection
 */

import AMLRiskManager from '@/lib/AMLRiskManager';

class TransactionMonitor {
  constructor() {
    this.transactions = {}; // txId -> transaction record
    this.userActivity = {}; // userId -> activity log
    this.reviewQueue = [];
    this.financeQueue = [];
    this.aiAlerts = [];
    this.observers = [];

    // Thresholds
    this.LARGE_TRANSACTION_THRESHOLD = 50000;
    this.VERY_LARGE_THRESHOLD = 100000;
    this.FREQUENCY_THRESHOLD = 5; // transactions in 24h
  }

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
   * Record a new transaction
   */
  recordTransaction(txData) {
    const {
      txId,
      userId,
      amount,
      method, // 'bank_transfer', 'card', 'wallet'
      status, // 'pending', 'completed', 'failed'
      fromCountry,
      toCountry,
      description = '',
    } = txData;

    // Calculate AML risk
    const frequency = this.getUserFrequency(userId, 24 * 60 * 60 * 1000); // 24h
    const amlAssessment = AMLRiskManager.calculatePaymentRisk({
      paymentId: txId,
      userId,
      amount,
      frequency,
      method,
      country: fromCountry,
      toCountry,
    });

    const transaction = {
      txId,
      userId,
      amount,
      method,
      status,
      fromCountry,
      toCountry,
      description,
      createdAt: Date.now(),
      amlRiskScore: amlAssessment.score,
      amlRiskLevel: amlAssessment.level,
      redFlags: [],
      queues: [],
    };

    // Flag suspicious patterns
    const flags = this.detectSuspiciousPatterns(userId, amount, frequency, amlAssessment);
    transaction.redFlags = flags;

    // Route to appropriate queues based on flags
    if (flags.length > 0 || amlAssessment.needsReview) {
      transaction.queues.push('review');
      this.reviewQueue.push(transaction);
      this.notifyObservers({ type: 'transaction_flagged_review', transaction });
    }

    if (amount >= this.VERY_LARGE_THRESHOLD) {
      transaction.queues.push('finance');
      this.financeQueue.push(transaction);
      this.notifyObservers({ type: 'transaction_flagged_finance', transaction });
    }

    if (amlAssessment.level === 'high' || flags.some(f => f.severity === 'critical')) {
      transaction.queues.push('ai_alert');
      this.aiAlerts.push({
        txId,
        userId,
        severity: amlAssessment.level === 'high' ? 'critical' : 'high',
        reason: amlAssessment.recommendedAction,
        redFlags: flags,
        createdAt: Date.now(),
      });
      this.notifyObservers({ type: 'ai_alert_generated', txId });
    }

    // Track user activity
    if (!this.userActivity[userId]) {
      this.userActivity[userId] = [];
    }
    this.userActivity[userId].push({
      txId,
      timestamp: Date.now(),
      amount,
      status: 'recorded',
    });

    this.transactions[txId] = transaction;
    this.notifyObservers({ type: 'transaction_recorded', transaction });

    return transaction;
  }

  /**
   * Detect suspicious patterns
   */
  detectSuspiciousPatterns(userId, amount, frequency, amlAssessment) {
    const flags = [];

    // Large transaction
    if (amount >= this.VERY_LARGE_THRESHOLD) {
      flags.push({
        type: 'very_large_amount',
        severity: 'high',
        message: `Very large transaction: $${amount}`,
      });
    } else if (amount >= this.LARGE_TRANSACTION_THRESHOLD) {
      flags.push({
        type: 'large_amount',
        severity: 'medium',
        message: `Large transaction: $${amount}`,
      });
    }

    // High frequency
    if (frequency > this.FREQUENCY_THRESHOLD) {
      flags.push({
        type: 'high_frequency',
        severity: 'high',
        message: `High frequency: ${frequency} transactions in 24h`,
      });
    } else if (frequency > 3) {
      flags.push({
        type: 'elevated_frequency',
        severity: 'medium',
        message: `Elevated frequency: ${frequency} transactions in 24h`,
      });
    }

    // AML red flags
    if (amlAssessment.redFlags.length > 0) {
      amlAssessment.redFlags.forEach(flag => {
        flags.push({
          type: 'aml_flag',
          severity: 'high',
          message: flag,
        });
      });
    }

    // Structuring pattern (multiple small txs)
    const last24h = this.userActivity[userId]?.filter(
      t => Date.now() - t.timestamp < 24 * 60 * 60 * 1000
    ) || [];
    if (last24h.length > 5) {
      const avgAmount = last24h.reduce((sum, t) => sum + t.amount, 0) / last24h.length;
      if (amount < avgAmount * 0.7 && frequency > 2) {
        flags.push({
          type: 'structuring_pattern',
          severity: 'critical',
          message: 'Potential structuring detected (multiple small transactions)',
        });
      }
    }

    return flags;
  }

  /**
   * Get user transaction frequency (in time window)
   */
  getUserFrequency(userId, timeWindow) {
    if (!this.userActivity[userId]) return 0;
    const cutoff = Date.now() - timeWindow;
    return this.userActivity[userId].filter(t => t.timestamp > cutoff).length;
  }

  /**
   * Update transaction status
   */
  updateTransactionStatus(txId, newStatus) {
    const tx = this.transactions[txId];
    if (!tx) return null;

    tx.status = newStatus;
    tx.updatedAt = Date.now();

    this.notifyObservers({ type: 'transaction_status_updated', txId, status: newStatus });
    return tx;
  }

  /**
   * Approve from review queue
   */
  approveTransaction(txId, approvedBy) {
    const tx = this.transactions[txId];
    if (!tx) return null;

    tx.status = 'approved';
    tx.approvedBy = approvedBy;
    tx.approvedAt = Date.now();
    tx.queues = tx.queues.filter(q => q !== 'review');

    this.reviewQueue = this.reviewQueue.filter(t => t.txId !== txId);
    this.notifyObservers({ type: 'transaction_approved', txId });
    return tx;
  }

  /**
   * Reject from review queue
   */
  rejectTransaction(txId, rejectedBy, reason) {
    const tx = this.transactions[txId];
    if (!tx) return null;

    tx.status = 'rejected';
    tx.rejectedBy = rejectedBy;
    tx.rejectionReason = reason;
    tx.rejectedAt = Date.now();
    tx.queues = tx.queues.filter(q => q !== 'review');

    this.reviewQueue = this.reviewQueue.filter(t => t.txId !== txId);
    this.notifyObservers({ type: 'transaction_rejected', txId });
    return tx;
  }

  /**
   * Get transaction details
   */
  getTransaction(txId) {
    return this.transactions[txId] || null;
  }

  /**
   * Get all transactions
   */
  getAllTransactions(filter = {}) {
    let results = Object.values(this.transactions);

    if (filter.userId) {
      results = results.filter(t => t.userId === filter.userId);
    }
    if (filter.status) {
      results = results.filter(t => t.status === filter.status);
    }
    if (filter.riskLevel) {
      results = results.filter(t => t.amlRiskLevel === filter.riskLevel);
    }
    if (filter.minAmount) {
      results = results.filter(t => t.amount >= filter.minAmount);
    }

    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get review queue
   */
  getReviewQueue() {
    return this.reviewQueue.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get finance review queue
   */
  getFinanceQueue() {
    return this.financeQueue.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get AI alerts
   */
  getAIAlerts(limit = 50) {
    return this.aiAlerts.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  /**
   * Get monitoring dashboard summary
   */
  getDashboardSummary() {
    const allTxs = Object.values(this.transactions);
    const last24h = allTxs.filter(t => Date.now() - t.createdAt < 24 * 60 * 60 * 1000);

    return {
      totalTransactions: allTxs.length,
      transactionsLast24h: last24h.length,
      totalVolume: allTxs.reduce((sum, t) => sum + t.amount, 0),
      volumeLast24h: last24h.reduce((sum, t) => sum + t.amount, 0),
      highRiskCount: allTxs.filter(t => t.amlRiskLevel === 'high').length,
      pendingReview: this.reviewQueue.length,
      financeReview: this.financeQueue.length,
      activeAlerts: this.aiAlerts.filter(a => !a.resolved).length,
      flaggedTransactions: allTxs.filter(t => t.redFlags.length > 0).length,
    };
  }

  /**
   * Reset (testing)
   */
  reset() {
    this.transactions = {};
    this.userActivity = {};
    this.reviewQueue = [];
    this.financeQueue = [];
    this.aiAlerts = [];
  }
}

export default new TransactionMonitor();