// Policy Enforcement Engine - Manages compliance rules and validates workflows
class PolicyEngine {
  constructor() {
    this.rules = [
      {
        id: 'kyc-required-activation',
        name: 'KYC Required for Activation',
        description: 'User must complete KYC verification before full activation',
        type: 'kyc',
        condition: (user) => !user.kycVerified,
        action: 'BLOCK',
        message: 'KYC verification required before activation',
        severity: 'critical',
      },
      {
        id: 'high-risk-payment-review',
        name: 'High Risk Payment Requires Review',
        description: 'Payments flagged as high-risk must undergo admin review',
        type: 'payment',
        condition: (payment, amlData) => amlData?.riskLevel === 'high',
        action: 'REQUIRE_REVIEW',
        message: 'High-risk payment requires admin approval',
        severity: 'high',
      },
      {
        id: 'large-amount-approval',
        name: 'Large Amount Requires Approval',
        description: 'Payments exceeding threshold require explicit approval',
        type: 'payment',
        condition: (payment) => payment.amount > 5000,
        action: 'REQUIRE_APPROVAL',
        message: 'Large amount payment requires admin approval',
        severity: 'high',
        threshold: 5000,
      },
      {
        id: 'unverified-user-restriction',
        name: 'Unverified User Cannot Fully Activate',
        description: 'Users without KYC verification have restricted access',
        type: 'activation',
        condition: (user) => !user.kycVerified,
        action: 'RESTRICT',
        message: 'Complete KYC to unlock full platform access',
        severity: 'high',
      },
      {
        id: 'medium-risk-monitoring',
        name: 'Medium Risk Transaction Monitoring',
        description: 'Medium-risk transactions are flagged for monitoring',
        type: 'payment',
        condition: (payment, amlData) => amlData?.riskLevel === 'medium',
        action: 'FLAG',
        message: 'Medium-risk transaction flagged for monitoring',
        severity: 'medium',
      },
      {
        id: 'frequent-large-payments',
        name: 'Frequent Large Payments Detection',
        description: 'Multiple large payments in short period trigger review',
        type: 'payment',
        condition: (payment, amlData) => amlData?.frequencyRisk === 'high',
        action: 'REQUIRE_REVIEW',
        message: 'Unusual payment frequency pattern detected',
        severity: 'high',
      },
      {
        id: 'kyc-expiry-check',
        name: 'KYC Expiry Enforcement',
        description: 'Expired KYC must be renewed to continue operations',
        type: 'kyc',
        condition: (user) => user.kycExpired,
        action: 'BLOCK',
        message: 'KYC verification expired - renewal required',
        severity: 'critical',
      },
    ];

    this.violations = [];
    this.enforcementLog = [];
  }

  // Evaluate all policies for a given context
  evaluatePolicies(context) {
    const { user, payment, amlData, action } = context;
    const applicableRules = this.rules.filter(rule => {
      if (action === 'activation' && rule.type !== 'activation' && rule.type !== 'kyc') return false;
      if (action === 'payment' && rule.type !== 'payment') return false;
      return true;
    });

    const violations = [];
    const enforcedRules = [];

    applicableRules.forEach(rule => {
      try {
        const isViolated = rule.condition(user || payment, amlData);
        if (isViolated) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            action: rule.action,
            message: rule.message,
            severity: rule.severity,
            timestamp: new Date(),
            context: { user: user?.id, payment: payment?.id },
          });

          this.enforcementLog.push({
            timestamp: new Date(),
            ruleId: rule.id,
            action: rule.action,
            userId: user?.id,
            paymentId: payment?.id,
            message: rule.message,
          });

          enforcedRules.push({
            rule: rule.name,
            action: rule.action,
            severity: rule.severity,
          });
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    });

    return {
      hasViolations: violations.length > 0,
      violations,
      enforcedRules,
      blockingViolations: violations.filter(v => v.action === 'BLOCK'),
      isBlocked: violations.some(v => v.action === 'BLOCK'),
    };
  }

  // Check if user can perform action
  canActivate(user) {
    const evaluation = this.evaluatePolicies({ user, action: 'activation' });
    return {
      allowed: !evaluation.isBlocked,
      violations: evaluation.violations,
      restrictions: evaluation.enforcedRules,
    };
  }

  // Check if payment can proceed
  canProcessPayment(payment, amlData) {
    const evaluation = this.evaluatePolicies({ payment, amlData, action: 'payment' });
    return {
      allowed: !evaluation.isBlocked && !evaluation.violations.some(v => v.action === 'REQUIRE_APPROVAL'),
      requiresReview: evaluation.violations.some(v => v.action === 'REQUIRE_REVIEW'),
      requiresApproval: evaluation.violations.some(v => v.action === 'REQUIRE_APPROVAL'),
      violations: evaluation.violations,
    };
  }

  // Get enforcement status for display
  getEnforcementStatus(user, payment, amlData) {
    const evaluation = this.evaluatePolicies({ user, payment, amlData, action: 'payment' });
    return {
      isCompliant: evaluation.violations.length === 0,
      riskLevel: amlData?.riskLevel || 'unknown',
      violations: evaluation.violations,
      enforcedRules: evaluation.enforcedRules,
      summary: {
        blocked: evaluation.violations.filter(v => v.action === 'BLOCK').length,
        requiresReview: evaluation.violations.filter(v => v.action === 'REQUIRE_REVIEW').length,
        requiresApproval: evaluation.violations.filter(v => v.action === 'REQUIRE_APPROVAL').length,
        flagged: evaluation.violations.filter(v => v.action === 'FLAG').length,
      },
    };
  }

  // Get all rules
  getAllRules() {
    return this.rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      action: rule.action,
      severity: rule.severity,
      threshold: rule.threshold,
    }));
  }

  // Get enforcement log (recent)
  getEnforcementLog(limit = 100) {
    return this.enforcementLog.slice(-limit).reverse();
  }

  // Get violations by severity
  getViolationsBySeverity(severity) {
    return this.violations.filter(v => v.severity === severity);
  }

  // Clear old enforcement logs
  clearOldLogs(olderThanDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    this.enforcementLog = this.enforcementLog.filter(log => log.timestamp > cutoffDate);
  }

  // Get compliance report
  getComplianceReport() {
    const totalEnforcements = this.enforcementLog.length;
    const byAction = {
      BLOCK: this.enforcementLog.filter(l => l.action === 'BLOCK').length,
      REQUIRE_REVIEW: this.enforcementLog.filter(l => l.action === 'REQUIRE_REVIEW').length,
      REQUIRE_APPROVAL: this.enforcementLog.filter(l => l.action === 'REQUIRE_APPROVAL').length,
      FLAG: this.enforcementLog.filter(l => l.action === 'FLAG').length,
      RESTRICT: this.enforcementLog.filter(l => l.action === 'RESTRICT').length,
    };

    const last24h = this.enforcementLog.filter(log => {
      const time = new Date();
      time.setHours(time.getHours() - 24);
      return log.timestamp > time;
    });

    return {
      totalEnforcements,
      last24hEnforcements: last24h.length,
      byAction,
      mostTriggeredRules: this.getMostTriggeredRules(),
    };
  }

  // Get most frequently triggered rules
  getMostTriggeredRules(limit = 10) {
    const ruleCounts = {};
    this.enforcementLog.forEach(log => {
      ruleCounts[log.ruleId] = (ruleCounts[log.ruleId] || 0) + 1;
    });

    return Object.entries(ruleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([ruleId, count]) => {
        const rule = this.rules.find(r => r.id === ruleId);
        return { ruleId, ruleName: rule?.name, count };
      });
  }

  // Subscribe to policy changes (for reactive updates)
  subscribe(callback) {
    const checkInterval = setInterval(() => {
      callback(this.getComplianceReport());
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }
}

// Singleton instance
let policyEngineInstance = null;

const policyEngine = {
  getInstance: () => {
    if (!policyEngineInstance) {
      policyEngineInstance = new PolicyEngine();
    }
    return policyEngineInstance;
  },

  // Quick evaluation methods
  canActivateUser: (user) => {
    const engine = policyEngine.getInstance();
    return engine.canActivate(user);
  },

  canProcessPayment: (payment, amlData) => {
    const engine = policyEngine.getInstance();
    return engine.canProcessPayment(payment, amlData);
  },

  getStatus: (user, payment, amlData) => {
    const engine = policyEngine.getInstance();
    return engine.getEnforcementStatus(user, payment, amlData);
  },

  getAllRules: () => {
    const engine = policyEngine.getInstance();
    return engine.getAllRules();
  },

  getReport: () => {
    const engine = policyEngine.getInstance();
    return engine.getComplianceReport();
  },
};

export default policyEngine;