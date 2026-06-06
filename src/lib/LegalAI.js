// Legal AI - Analyze platform legal status and recommend actions

import DocumentManager from '@/lib/DocumentManager';
import LegalFramework from '@/lib/LegalFramework';
import DigitalSignatureSystem from '@/lib/DigitalSignatureSystem';

class LegalAI {
  constructor() {
    this.recommendations = [];
    this.risks = [];
    this.insights = [];
    this.analysisCache = null;
    this.lastAnalysis = null;
  }

  // Main analysis function
  analyzeCompleteStatus() {
    const timestamp = Date.now();
    if (this.lastAnalysis && timestamp - this.lastAnalysis < 30000) {
      return this.analysisCache;
    }

    const docManager = DocumentManager.getInstance();
    const legalFramework = LegalFramework.getInstance();
    const sigSystem = DigitalSignatureSystem.getInstance();

    this.recommendations = [];
    this.risks = [];
    this.insights = [];

    // Analyze documents
    this.analyzeDocuments(docManager);

    // Analyze contracts
    this.analyzeContracts(legalFramework);

    // Analyze signatures
    this.analyzeSignatures(sigSystem);

    // Cross-reference analysis
    this.performCrossReferenceAnalysis(docManager, legalFramework, sigSystem);

    const analysis = {
      timestamp: new Date(),
      totalRecommendations: this.recommendations.length,
      totalRisks: this.risks.length,
      totalInsights: this.insights.length,
      recommendations: this.recommendations,
      risks: this.risks,
      insights: this.insights,
      riskScore: this.calculateRiskScore(),
      complianceScore: this.calculateComplianceScore(),
      actionItems: this.prioritizeActions(),
    };

    this.analysisCache = analysis;
    this.lastAnalysis = timestamp;

    return analysis;
  }

  // Analyze documents
  analyzeDocuments(docManager) {
    const allDocs = docManager.getAll();

    // Detect unsigned documents
    const unsigned = allDocs.filter(d => d.status !== 'signed');
    if (unsigned.length > 0) {
      this.recommendations.push({
        id: `REC-UNSIGNED-${Date.now()}`,
        type: 'unsigned_documents',
        severity: 'high',
        title: `${unsigned.length} Unsigned Documents`,
        description: `${unsigned.length} document(s) require signature`,
        documents: unsigned.map(d => ({ id: d.id, title: d.title, type: d.type })),
        action: 'request_signature',
        actionLabel: 'Request Signatures',
        estimatedImpact: 'high',
        timeline: 'urgent',
      });
    }

    // Detect draft documents
    const drafts = allDocs.filter(d => d.status === 'draft');
    if (drafts.length > 0) {
      this.recommendations.push({
        id: `REC-DRAFTS-${Date.now()}`,
        type: 'draft_documents',
        severity: 'medium',
        title: `${drafts.length} Draft Documents`,
        description: `${drafts.length} document(s) are incomplete drafts`,
        documents: drafts.map(d => ({ id: d.id, title: d.title })),
        action: 'review_agreement',
        actionLabel: 'Review & Finalize',
        estimatedImpact: 'medium',
        timeline: 'this_week',
      });
    }

    // Detect missing documentation by category
    const categories = ['participation', 'investment', 'service', 'legal', 'compliance'];
    categories.forEach(cat => {
      const docsInCat = allDocs.filter(d => d.category === cat);
      if (docsInCat.length === 0) {
        this.recommendations.push({
          id: `REC-MISSING-${cat}-${Date.now()}`,
          type: 'missing_documentation',
          severity: 'medium',
          title: `Missing ${cat} Documentation`,
          description: `No ${cat} documents on file`,
          category: cat,
          action: 'generate_contract',
          actionLabel: 'Generate Documentation',
          estimatedImpact: 'medium',
          timeline: 'this_month',
        });
      }
    });

    // Check for expired documents
    const expired = allDocs.filter(d => d.expires_date && new Date(d.expires_date) < new Date());
    if (expired.length > 0) {
      this.risks.push({
        id: `RISK-EXPIRED-${Date.now()}`,
        type: 'expired_documents',
        severity: 'critical',
        title: `${expired.length} Expired Document(s)`,
        description: `${expired.length} document(s) have expired and need renewal`,
        documents: expired.map(d => ({ id: d.id, title: d.title, expiryDate: d.expires_date })),
        action: 'renew_contract',
        timeline: 'immediate',
      });
    }

    // Check for old documents needing review
    const old = allDocs.filter(d => {
      const createdDate = new Date(d.created_date);
      const monthsOld = (Date.now() - createdDate) / (1000 * 60 * 60 * 24 * 30);
      return monthsOld > 12;
    });
    if (old.length > 0) {
      this.insights.push({
        id: `INSIGHT-OLD-DOCS-${Date.now()}`,
        type: 'document_review_due',
        severity: 'low',
        title: `${old.length} Documents Due for Review`,
        description: `${old.length} document(s) are over 12 months old and should be reviewed`,
        count: old.length,
      });
    }
  }

  // Analyze contracts
  analyzeContracts(legalFramework) {
    const contracts = legalFramework.getAll();

    // Detect unsigned contracts
    const unsigned = contracts.filter(c => c.status !== 'signed');
    if (unsigned.length > 0) {
      this.recommendations.push({
        id: `REC-UNSIGNED-CONTRACTS-${Date.now()}`,
        type: 'unsigned_contracts',
        severity: 'high',
        title: `${unsigned.length} Unsigned Contract(s)`,
        description: `${unsigned.length} contract(s) pending signature`,
        contracts: unsigned.map(c => ({ id: c.id, type: c.type })),
        action: 'request_signature',
        actionLabel: 'Send for Signature',
        estimatedImpact: 'high',
        timeline: 'urgent',
      });
    }

    // Detect pending approval contracts
    const pending = contracts.filter(c => c.status === 'pending_signature');
    if (pending.length > 0) {
      this.insights.push({
        id: `INSIGHT-PENDING-${Date.now()}`,
        type: 'pending_contracts',
        severity: 'medium',
        title: `${pending.length} Contract(s) Awaiting Approval`,
        description: `Contracts in approval workflow`,
        count: pending.length,
      });
    }

    // Check for contracts missing standard terms
    const incomplete = contracts.filter(c => Object.keys(c.terms || {}).length < 5);
    if (incomplete.length > 0) {
      this.recommendations.push({
        id: `REC-INCOMPLETE-TERMS-${Date.now()}`,
        type: 'incomplete_contract_terms',
        severity: 'medium',
        title: `${incomplete.length} Contract(s) with Incomplete Terms`,
        description: `Contracts missing standard legal terms`,
        contracts: incomplete.map(c => ({ id: c.id, termsCount: Object.keys(c.terms || {}).length })),
        action: 'review_agreement',
        actionLabel: 'Complete Terms',
        estimatedImpact: 'medium',
      });
    }
  }

  // Analyze signatures
  analyzeSignatures(sigSystem) {
    const stats = sigSystem.getStats();

    // Check acceptance rate
    if (stats.totalSigned < stats.totalGenerated * 0.5) {
      this.risks.push({
        id: `RISK-LOW-ACCEPTANCE-${Date.now()}`,
        type: 'low_signature_acceptance',
        severity: 'high',
        title: 'Low Signature Acceptance Rate',
        description: `Only ${Math.round((stats.totalSigned / stats.totalGenerated) * 100)}% of documents have been signed`,
        signedCount: stats.totalSigned,
        totalCount: stats.totalGenerated,
        action: 'request_signature',
        timeline: 'this_week',
      });
    }

    // Check for pending signatures older than 7 days
    const oldPending = sigSystem.getPendingSignatures().filter(sig => {
      const createdDate = new Date(sig.created_date);
      const daysOld = (Date.now() - createdDate) / (1000 * 60 * 60 * 24);
      return daysOld > 7;
    });
    if (oldPending.length > 0) {
      this.recommendations.push({
        id: `REC-STALE-SIGS-${Date.now()}`,
        type: 'stale_signatures',
        severity: 'medium',
        title: `${oldPending.length} Pending Signature(s) Over 7 Days Old`,
        description: `Follow up on outstanding signature requests`,
        count: oldPending.length,
        action: 'request_signature',
        actionLabel: 'Send Reminders',
        timeline: 'this_week',
      });
    }
  }

  // Cross-reference analysis
  performCrossReferenceAnalysis(docManager, legalFramework, sigSystem) {
    const docs = docManager.getAll();
    const contracts = legalFramework.getAll();

    // Check for linked documents without contracts
    const docWithoutContract = docs.filter(d => !d.contract_id);
    if (docWithoutContract.length > 0) {
      this.insights.push({
        id: `INSIGHT-UNLINKED-${Date.now()}`,
        type: 'unlinked_documents',
        severity: 'low',
        title: `${docWithoutContract.length} Document(s) Without Contract Link`,
        description: 'Some documents are not linked to contracts for traceability',
        count: docWithoutContract.length,
      });
    }

    // Check for contracts without associated documents
    const contractWithoutDoc = contracts.filter(c => !docs.find(d => d.contract_id === c.id));
    if (contractWithoutDoc.length > 0) {
      this.recommendations.push({
        id: `REC-MISSING-DOC-${Date.now()}`,
        type: 'missing_contract_documents',
        severity: 'medium',
        title: `${contractWithoutDoc.length} Contract(s) Without Associated Document(s)`,
        description: 'Generate or link documents to contracts for completeness',
        contracts: contractWithoutDoc.map(c => ({ id: c.id, type: c.type })),
        action: 'generate_contract',
        actionLabel: 'Create Documents',
        timeline: 'this_week',
      });
    }
  }

  // Calculate risk score (0-100)
  calculateRiskScore() {
    let score = 0;

    // Critical risks
    const critical = this.risks.filter(r => r.severity === 'critical');
    score += critical.length * 25;

    // High severity risks
    const high = this.risks.filter(r => r.severity === 'high');
    score += high.length * 15;

    // High severity recommendations (overdue items)
    const overdue = this.recommendations.filter(r => r.severity === 'high' && r.timeline === 'urgent');
    score += overdue.length * 10;

    // Cap at 100
    return Math.min(100, score);
  }

  // Calculate compliance score (0-100)
  calculateComplianceScore() {
    const docManager = DocumentManager.getInstance();
    const legalFramework = LegalFramework.getInstance();
    const sigSystem = DigitalSignatureSystem.getInstance();

    const docs = docManager.getAll();
    const contracts = legalFramework.getAll();
    const stats = sigSystem.getStats();

    let score = 100;

    // Deduct for unsigned documents
    const unsignedDocs = docs.filter(d => d.status !== 'signed');
    score -= (unsignedDocs.length / Math.max(1, docs.length)) * 25;

    // Deduct for unsigned contracts
    const unsignedContracts = contracts.filter(c => c.status !== 'signed');
    score -= (unsignedContracts.length / Math.max(1, contracts.length)) * 25;

    // Deduct for incomplete signatures
    const acceptanceRate = stats.totalGenerated > 0 ? stats.totalSigned / stats.totalGenerated : 0;
    score -= (1 - acceptanceRate) * 20;

    // Deduct for expired documents
    const expired = docs.filter(d => d.expires_date && new Date(d.expires_date) < new Date());
    score -= (expired.length / Math.max(1, docs.length)) * 15;

    // Deduct for missing categories
    const categories = ['participation', 'investment', 'service', 'legal', 'compliance'];
    const missingCategories = categories.filter(cat => !docs.find(d => d.category === cat));
    score -= (missingCategories.length / categories.length) * 15;

    return Math.max(0, Math.round(score));
  }

  // Prioritize actions
  prioritizeActions() {
    const actions = [];

    // Group recommendations by action type
    const grouped = {};
    this.recommendations.forEach(rec => {
      if (!grouped[rec.action]) {
        grouped[rec.action] = [];
      }
      grouped[rec.action].push(rec);
    });

    // Create prioritized actions
    Object.entries(grouped).forEach(([action, recs]) => {
      const priority = this.getActionPriority(action, recs);
      actions.push({
        action,
        count: recs.length,
        priority,
        recommendations: recs,
        estimate: `${recs.length} item(s)`,
      });
    });

    return actions.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // Get action priority
  getActionPriority(action, recommendations) {
    const hasUrgent = recommendations.some(r => r.timeline === 'urgent');
    const hasHigh = recommendations.some(r => r.severity === 'high');

    if (hasUrgent) return 'urgent';
    if (hasHigh) return 'high';
    return 'medium';
  }

  // Get recommendations by type
  getRecommendationsByType(type) {
    return this.recommendations.filter(r => r.type === type);
  }

  // Get recommended actions
  getRecommendedActions() {
    return this.prioritizeActions();
  }

  // Get risk summary
  getRiskSummary() {
    return {
      critical: this.risks.filter(r => r.severity === 'critical').length,
      high: this.risks.filter(r => r.severity === 'high').length,
      medium: this.risks.filter(r => r.severity === 'medium').length,
      low: this.risks.filter(r => r.severity === 'low').length,
      total: this.risks.length,
    };
  }

  // Get compliance insights
  getInsights() {
    return this.insights;
  }

  // Generate AI summary
  generateSummary() {
    const riskScore = this.calculateRiskScore();
    const complianceScore = this.calculateComplianceScore();

    let summary = '';

    if (riskScore > 70) {
      summary = `⚠️ HIGH RISK: Your legal framework has ${this.risks.length} identified risks. Immediate attention required.`;
    } else if (riskScore > 40) {
      summary = `⚡ MODERATE RISK: ${this.recommendations.length} action items need attention to improve compliance.`;
    } else {
      summary = `✅ LOW RISK: Your legal documentation is mostly compliant with ${this.recommendations.length} optimization opportunities.`;
    }

    return {
      summary,
      riskScore,
      complianceScore,
      recommendationCount: this.recommendations.length,
      riskCount: this.risks.length,
    };
  }
}

// Singleton
let legalAIInstance = null;

const LegalAI_Singleton = {
  getInstance: () => {
    if (!legalAIInstance) {
      legalAIInstance = new LegalAI();
    }
    return legalAIInstance;
  },
};

export default LegalAI_Singleton;