// AI Compliance Intelligence - Analyzes compliance risks and recommends actions
import { base44 } from '@/api/base44Client';

class ComplianceAI {
  constructor() {
    this.riskAnalysis = [];
    this.suspiciousPatterns = [];
    this.highRiskUsers = [];
    this.recommendations = [];
    this.lastUpdate = null;
  }

  // Analyze user profile for compliance risks
  analyzeUserRisk(user, amlData, transactions = []) {
    const risks = [];
    const score = { kycRisk: 0, amlRisk: 0, activityRisk: 0, frequencyRisk: 0 };

    // KYC Risk Assessment
    if (!user.kycVerified) {
      risks.push({ type: 'kyc', severity: 'critical', message: 'No KYC verification' });
      score.kycRisk = 100;
    } else if (user.kycExpired) {
      risks.push({ type: 'kyc', severity: 'high', message: 'KYC verification expired' });
      score.kycRisk = 80;
    } else if (user.kycAge > 365) {
      risks.push({ type: 'kyc', severity: 'medium', message: 'KYC verification aging (>1 year)' });
      score.kycRisk = 40;
    }

    // AML Risk Assessment
    if (amlData) {
      if (amlData.riskLevel === 'high') {
        risks.push({ type: 'aml', severity: 'critical', message: 'High AML risk profile' });
        score.amlRisk = 90;
      } else if (amlData.riskLevel === 'medium') {
        risks.push({ type: 'aml', severity: 'high', message: 'Medium AML risk profile' });
        score.amlRisk = 60;
      }

      // Geographic risk
      if (amlData.geographicRisk) {
        risks.push({ type: 'geo', severity: 'high', message: `High-risk jurisdiction: ${amlData.geographicRisk}` });
        score.amlRisk += 20;
      }

      // Frequency risk
      if (amlData.frequencyRisk === 'high') {
        risks.push({ type: 'frequency', severity: 'high', message: 'Unusual transaction frequency' });
        score.frequencyRisk = 85;
      }
    }

    // Activity Risk Assessment
    if (transactions.length === 0 && user.activated > 30) {
      risks.push({ type: 'activity', severity: 'medium', message: 'Inactive account after 30+ days' });
      score.activityRisk = 50;
    } else if (transactions.length > 50) {
      risks.push({ type: 'activity', severity: 'medium', message: 'Exceptionally high transaction volume' });
      score.activityRisk = 40;
    }

    const overallRisk = Math.min(100, (score.kycRisk + score.amlRisk + score.activityRisk + score.frequencyRisk) / 4);

    return {
      userId: user.id,
      userName: user.name,
      overallRiskScore: Math.round(overallRisk),
      riskLevel: overallRisk >= 70 ? 'critical' : overallRisk >= 40 ? 'high' : 'medium',
      risks,
      scoreBreakdown: {
        kyc: Math.round(score.kycRisk),
        aml: Math.round(score.amlRisk),
        activity: Math.round(score.activityRisk),
        frequency: Math.round(score.frequencyRisk),
      },
      flaggedAt: new Date(),
    };
  }

  // Detect suspicious patterns across user base
  detectSuspiciousPatterns(users, amlDatabase) {
    const patterns = [];

    // Pattern 1: Rapid KYC churn
    const unverifiedRapid = users.filter(u => !u.kycVerified && Date.now() - u.createdAt < 7 * 24 * 60 * 60 * 1000);
    if (unverifiedRapid.length > 20) {
      patterns.push({
        id: 'rapid-kyc-churn',
        name: 'Rapid KYC Churn',
        severity: 'high',
        description: `${unverifiedRapid.length} new accounts without KYC in last 7 days`,
        count: unverifiedRapid.length,
        recommendation: 'Review registration flow; consider stronger KYC enforcement',
      });
    }

    // Pattern 2: Circular transactions
    const circularRisk = users.filter(u => {
      const outgoing = amlDatabase.filter(a => a.fromUser === u.id && a.amount > 1000).length;
      const incoming = amlDatabase.filter(a => a.toUser === u.id && a.amount > 1000).length;
      return outgoing > 0 && incoming > 0 && outgoing === incoming;
    });
    if (circularRisk.length > 0) {
      patterns.push({
        id: 'circular-transactions',
        name: 'Circular Transaction Pattern',
        severity: 'critical',
        description: `${circularRisk.length} users with balanced send/receive patterns (possible layering)`,
        count: circularRisk.length,
        recommendation: 'Escalate to AML team for structured layering analysis',
      });
    }

    // Pattern 3: Structuring (multiple small transactions below threshold)
    const structuring = users.filter(u => {
      const txCount = amlDatabase.filter(a => (a.fromUser === u.id || a.toUser === u.id) && a.amount < 1000).length;
      const totalVolume = amlDatabase.filter(a => a.fromUser === u.id || a.toUser === u.id).reduce((sum, a) => sum + a.amount, 0);
      return txCount > 20 && totalVolume > 50000;
    });
    if (structuring.length > 0) {
      patterns.push({
        id: 'structuring-pattern',
        name: 'Structuring Pattern Detected',
        severity: 'critical',
        description: `${structuring.length} users with suspicious micro-transaction patterns`,
        count: structuring.length,
        recommendation: 'File SAR (Suspicious Activity Report) for structuring attempts',
      });
    }

    // Pattern 4: Geographic anomaly
    const geoAnomalies = users.filter(u => {
      const loginCountries = amlDatabase.filter(a => a.userId === u.id).map(a => a.country);
      return new Set(loginCountries).size > 5; // More than 5 countries
    });
    if (geoAnomalies.length > 10) {
      patterns.push({
        id: 'geo-anomaly',
        name: 'Geographic Anomaly',
        severity: 'high',
        description: `${geoAnomalies.length} users accessing from 5+ countries`,
        count: geoAnomalies.length,
        recommendation: 'Implement velocity checks and multi-factor auth for unusual locations',
      });
    }

    this.suspiciousPatterns = patterns;
    return patterns;
  }

  // Identify high-risk users requiring immediate attention
  identifyHighRiskUsers(users, amlData) {
    const highRiskUsers = users
      .map(user => {
        const userAml = amlData.find(a => a.userId === user.id);
        return this.analyzeUserRisk(user, userAml);
      })
      .filter(analysis => analysis.overallRiskScore >= 60)
      .sort((a, b) => b.overallRiskScore - a.overallRiskScore)
      .slice(0, 50); // Top 50

    this.highRiskUsers = highRiskUsers;
    return highRiskUsers;
  }

  // Generate AI-powered recommendations
  generateRecommendations(analysis) {
    const recs = [];

    analysis.forEach(userRisk => {
      // KYC-based recommendations
      const kycRisks = userRisk.risks.filter(r => r.type === 'kyc');
      if (kycRisks.length > 0) {
        recs.push({
          userId: userRisk.userId,
          priority: kycRisks.some(r => r.severity === 'critical') ? 'critical' : 'high',
          type: 'kyc-enforcement',
          action: 'REQUIRE_KYC_COMPLETION',
          message: 'Enforce KYC completion before further activity',
          impact: 'Prevents account activation; reduces regulatory risk',
        });
      }

      // AML-based recommendations
      if (userRisk.scoreBreakdown.aml > 70) {
        recs.push({
          userId: userRisk.userId,
          priority: 'critical',
          type: 'aml-review',
          action: 'ESCALATE_TO_AML_TEAM',
          message: 'Send to AML team for enhanced due diligence',
          impact: 'Potential SAR filing; blocks high-risk transactions',
        });
      }

      // Transaction limit recommendations
      if (userRisk.scoreBreakdown.frequency > 60) {
        recs.push({
          userId: userRisk.userId,
          priority: 'high',
          type: 'transaction-limit',
          action: 'REDUCE_TRANSACTION_LIMIT',
          message: 'Lower transaction limits due to frequency risk',
          impact: 'Reduces exposure; enables continued monitoring',
        });
      }

      // Account freeze recommendation
      if (userRisk.overallRiskScore >= 85) {
        recs.push({
          userId: userRisk.userId,
          priority: 'critical',
          type: 'account-freeze',
          action: 'FREEZE_ACCOUNT',
          message: 'Freeze account pending compliance review',
          impact: 'Prevents further risk exposure; allows investigation',
        });
      }
    });

    this.recommendations = recs;
    return recs;
  }

  // Get compliance intelligence report
  getComplianceIntelligence() {
    return {
      timestamp: new Date(),
      highRiskUsers: this.highRiskUsers,
      suspiciousPatterns: this.suspiciousPatterns,
      recommendations: this.recommendations,
      summary: {
        criticalRiskUsers: this.highRiskUsers.filter(u => u.riskLevel === 'critical').length,
        highRiskUsers: this.highRiskUsers.filter(u => u.riskLevel === 'high').length,
        patternsDetected: this.suspiciousPatterns.length,
        recommendedActions: this.recommendations.filter(r => r.priority === 'critical').length,
      },
    };
  }

  // Perform full compliance analysis
  async performFullAnalysis(users, amlDatabase) {
    this.detectSuspiciousPatterns(users, amlDatabase);
    this.identifyHighRiskUsers(users, amlDatabase);
    this.generateRecommendations(this.highRiskUsers);
    this.lastUpdate = new Date();

    return this.getComplianceIntelligence();
  }

  // Get action recommendations for War Room
  getWarRoomAlerts() {
    return {
      critical: this.recommendations.filter(r => r.priority === 'critical'),
      high: this.recommendations.filter(r => r.priority === 'high'),
      patterns: this.suspiciousPatterns.filter(p => p.severity === 'critical'),
    };
  }

  // Get insights for Auto Mode decision engine
  getAutoModeInsights() {
    return {
      shouldAutoFreeze: this.highRiskUsers.filter(u => u.overallRiskScore >= 85),
      shouldReduceLimits: this.highRiskUsers.filter(u => u.scoreBreakdown.frequency > 60),
      shouldEscalate: this.highRiskUsers.filter(u => u.scoreBreakdown.aml > 70),
      detectedPatterns: this.suspiciousPatterns,
    };
  }

  // AI brain compliance scoring
  getAIBrainInsights() {
    const totalRisk = this.highRiskUsers.reduce((sum, u) => sum + u.overallRiskScore, 0) / Math.max(1, this.highRiskUsers.length);

    return {
      averageRiskScore: Math.round(totalRisk),
      riskTrend: totalRisk > 50 ? 'increasing' : 'stable',
      keyFindings: [
        `${this.highRiskUsers.length} high-risk users identified`,
        `${this.suspiciousPatterns.length} suspicious patterns detected`,
        `${this.recommendations.filter(r => r.priority === 'critical').length} critical actions recommended`,
      ],
      automationRecommendations: this.getAutoModeInsights(),
      lastAnalysisTime: this.lastUpdate,
    };
  }
}

// Singleton instance
let complianceAIInstance = null;

const complianceAI = {
  getInstance: () => {
    if (!complianceAIInstance) {
      complianceAIInstance = new ComplianceAI();
    }
    return complianceAIInstance;
  },

  analyze: async (users, amlDatabase) => {
    const instance = complianceAI.getInstance();
    return instance.performFullAnalysis(users, amlDatabase);
  },

  getIntelligence: () => {
    const instance = complianceAI.getInstance();
    return instance.getComplianceIntelligence();
  },

  getWarRoomAlerts: () => {
    const instance = complianceAI.getInstance();
    return instance.getWarRoomAlerts();
  },

  getAutoModeInsights: () => {
    const instance = complianceAI.getInstance();
    return instance.getAutoModeInsights();
  },

  getAIBrainInsights: () => {
    const instance = complianceAI.getInstance();
    return instance.getAIBrainInsights();
  },
};

export default complianceAI;