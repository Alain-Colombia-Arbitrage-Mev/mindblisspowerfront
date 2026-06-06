// Legal Framework Layer - Simulated contracts, agreements, and legal documentation
// Admin-only, non-binding simulation environment

class LegalFramework {
  constructor() {
    this.contracts = [];
    this.agreements = [];
    this.signatures = [];
    this.auditLog = [];
    this.documentTemplates = this.initializeTemplates();
  }

  initializeTemplates() {
    return {
      participant_agreement: {
        title: 'Participant Service Agreement',
        sections: ['Terms of Service', 'Risk Disclosure', 'Compliance Obligations', 'Limitation of Liability'],
        version: '2.1',
        effectiveDate: new Date('2026-01-01'),
      },
      leader_agreement: {
        title: 'Leader Leadership Agreement',
        sections: ['Leadership Responsibilities', 'Compensation Terms', 'Code of Conduct', 'Termination Clauses'],
        version: '1.5',
        effectiveDate: new Date('2026-02-15'),
      },
      investment_agreement: {
        title: 'Investment Plan Agreement',
        sections: ['Investment Terms', 'Return Structure', 'Risk Statement', 'Lock-up Period', 'Withdrawal Terms'],
        version: '3.0',
        effectiveDate: new Date('2026-03-01'),
      },
      admin_action_log: {
        title: 'Administrative Action Record',
        sections: ['Action Type', 'Justification', 'Authority Level', 'Timestamp', 'Witness'],
        version: '1.0',
        effectiveDate: new Date('2026-01-01'),
      },
    };
  }

  // Generate contract for participant
  generateParticipantContract(participant) {
    const contractId = `PART-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const contract = {
      id: contractId,
      type: 'participant_agreement',
      participant: {
        id: participant.id,
        name: participant.name,
        email: participant.email,
        joinDate: new Date(),
      },
      content: this.generateContractContent('participant_agreement'),
      status: 'pending_signature',
      generatedDate: new Date(),
      effectiveDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      version: this.documentTemplates.participant_agreement.version,
      terms: {
        acceptsTermsOfService: false,
        acceptsRiskDisclosure: false,
        acceptsComplianceObligation: false,
      },
    };

    this.contracts.push(contract);
    this.logAudit('contract_generated', contractId, `Participant contract generated for ${participant.name}`);
    return contract;
  }

  // Generate contract for leader
  generateLeaderContract(leader) {
    const contractId = `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const contract = {
      id: contractId,
      type: 'leader_agreement',
      leader: {
        id: leader.id,
        name: leader.name,
        email: leader.email,
        countryCode: leader.countryCode,
        appointmentDate: new Date(),
      },
      content: this.generateContractContent('leader_agreement'),
      status: 'pending_signature',
      generatedDate: new Date(),
      effectiveDate: new Date(),
      expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
      version: this.documentTemplates.leader_agreement.version,
      terms: {
        acceptsResponsibilities: false,
        acceptsCompensationTerms: false,
        acceptsCodeOfConduct: false,
        acceptsTerminationClauses: false,
      },
      compensationTerms: {
        baseCycle: 'monthly',
        matchRate: 0.1,
        minDirectReferrals: 1,
      },
    };

    this.contracts.push(contract);
    this.logAudit('contract_generated', contractId, `Leader contract generated for ${leader.name}`);
    return contract;
  }

  // Generate contract for investment plan
  generateInvestmentContract(investment) {
    const contractId = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const contract = {
      id: contractId,
      type: 'investment_agreement',
      investment: {
        id: investment.id,
        participantId: investment.participantId,
        planName: investment.planName,
        amount: investment.amount,
        currency: investment.currency || 'USD',
        investmentDate: new Date(),
      },
      content: this.generateContractContent('investment_agreement'),
      status: 'pending_signature',
      generatedDate: new Date(),
      effectiveDate: new Date(),
      expiryDate: new Date(Date.now() + investment.lockupPeriod || 365 * 24 * 60 * 60 * 1000),
      version: this.documentTemplates.investment_agreement.version,
      terms: {
        acceptsTerms: false,
        acceptsRiskStatement: false,
        acceptsLockupPeriod: false,
        acceptsWithdrawalTerms: false,
      },
      riskFactors: ['Market Risk', 'Liquidity Risk', 'Operational Risk', 'Regulatory Risk'],
    };

    this.contracts.push(contract);
    this.logAudit('contract_generated', contractId, `Investment contract generated for amount ${investment.amount}`);
    return contract;
  }

  // Simulate signature
  simulateSignature(contractId, signatory, role = 'participant') {
    const contract = this.contracts.find(c => c.id === contractId);
    if (!contract) return { success: false, message: 'Contract not found' };

    const signature = {
      id: `SIG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      contractId,
      signatory: {
        id: signatory.id,
        name: signatory.name,
        email: signatory.email,
        role,
      },
      timestamp: new Date(),
      ipAddress: this.generateFakeIP(),
      deviceFingerprint: this.generateDeviceFingerprint(),
      signatureHash: this.generateSignatureHash(contractId, signatory),
      legallySigned: true,
      termsAccepted: true,
    };

    this.signatures.push(signature);
    contract.status = 'signed';
    contract.signatureId = signature.id;
    contract.signedDate = new Date();

    // Accept all terms
    Object.keys(contract.terms).forEach(key => {
      contract.terms[key] = true;
    });

    this.logAudit('contract_signed', contractId, `Contract signed by ${signatory.name} (${role})`);
    return signature;
  }

  // Create agreement between parties
  createAgreement(type, parties, terms) {
    const agreementId = `AGR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const agreement = {
      id: agreementId,
      type,
      parties: parties.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        email: p.email,
        signedAt: null,
      })),
      terms,
      createdDate: new Date(),
      status: 'draft',
      signatories: [],
      auditTrail: [],
    };

    this.agreements.push(agreement);
    this.logAudit('agreement_created', agreementId, `Agreement created: ${type}`);
    return agreement;
  }

  // Sign agreement
  signAgreement(agreementId, signatoryId, signatoryName) {
    const agreement = this.agreements.find(a => a.id === agreementId);
    if (!agreement) return { success: false, message: 'Agreement not found' };

    const party = agreement.parties.find(p => p.id === signatoryId);
    if (!party) return { success: false, message: 'Signatory not found in agreement' };

    const signature = {
      signatoryId,
      timestamp: new Date(),
      hash: this.generateSignatureHash(agreementId, { id: signatoryId, name: signatoryName }),
    };

    party.signedAt = new Date();
    agreement.signatories.push(signature);
    agreement.auditTrail.push({
      event: 'signed',
      signatory: signatoryName,
      timestamp: new Date(),
    });

    // Check if all parties signed
    if (agreement.signatories.length === agreement.parties.length) {
      agreement.status = 'fully_executed';
      this.logAudit('agreement_executed', agreementId, 'Agreement fully executed by all parties');
    } else {
      this.logAudit('agreement_partially_signed', agreementId, `Agreement signed by ${signatoryName}`);
    }

    return signature;
  }

  // Log administrative action
  logAdminAction(action) {
    const actionId = `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const adminAction = {
      id: actionId,
      type: action.type,
      description: action.description,
      targetEntity: action.targetEntity,
      targetId: action.targetId,
      admin: action.admin,
      reason: action.reason,
      timestamp: new Date(),
      status: 'recorded',
      witnesses: action.witnesses || [],
      justification: action.justification,
    };

    this.logAudit('admin_action_logged', actionId, `Admin action: ${action.type}`);
    return adminAction;
  }

  // Get contract by ID
  getContract(contractId) {
    return this.contracts.find(c => c.id === contractId);
  }

  // Get all contracts for entity
  getContractsFor(entityType, entityId) {
    return this.contracts.filter(c => {
      if (entityType === 'participant') return c.participant?.id === entityId;
      if (entityType === 'leader') return c.leader?.id === entityId;
      if (entityType === 'investment') return c.investment?.id === entityId;
      return false;
    });
  }

  // Get pending signatures
  getPendingSignatures() {
    return this.contracts.filter(c => c.status === 'pending_signature');
  }

  // Get audit trail
  getAuditTrail(filters = {}) {
    let logs = this.auditLog;

    if (filters.entityId) {
      logs = logs.filter(l => l.entityId === filters.entityId);
    }

    if (filters.eventType) {
      logs = logs.filter(l => l.eventType === filters.eventType);
    }

    if (filters.startDate) {
      logs = logs.filter(l => l.timestamp >= filters.startDate);
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Generate legal document content
  generateContractContent(templateType) {
    const template = this.documentTemplates[templateType];
    if (!template) return '';

    return `
================================================================================
                            LEGAL AGREEMENT
================================================================================

Title: ${template.title}
Version: ${template.version}
Effective Date: ${template.effectiveDate.toISOString().split('T')[0]}

================================================================================
SECTIONS
================================================================================

${template.sections.map((section, idx) => `${idx + 1}. ${section}`).join('\n')}

================================================================================
TERMS AND CONDITIONS
================================================================================

This agreement constitutes a legally binding contract between the parties.
All terms and conditions outlined herein shall be binding upon signature.

Execution of this agreement indicates full acceptance of terms outlined herein.

================================================================================
COMPLIANCE & AUDIT
================================================================================

This document is subject to administrative oversight and audit.
All signatures and actions are recorded in the legal audit system.

Generated: ${new Date().toISOString()}
Document ID: ${`DOC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`}

================================================================================
    `;
  }

  // Private utilities
  logAudit(eventType, entityId, description) {
    this.auditLog.push({
      id: `AUDIT-${Date.now()}`,
      eventType,
      entityId,
      description,
      timestamp: new Date(),
      level: 'INFO',
    });
  }

  generateFakeIP() {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }

  generateDeviceFingerprint() {
    return `FP-${Math.random().toString(36).substr(2, 16).toUpperCase()}`;
  }

  generateSignatureHash(contractId, signatory) {
    return `HASH-${Math.random().toString(36).substr(2, 24).toUpperCase()}`;
  }

  // Get legal summary for dashboard
  getLegalSummary() {
    return {
      totalContracts: this.contracts.length,
      signedContracts: this.contracts.filter(c => c.status === 'signed').length,
      pendingSignatures: this.contracts.filter(c => c.status === 'pending_signature').length,
      activeAgreements: this.agreements.filter(a => a.status === 'fully_executed').length,
      auditLogCount: this.auditLog.length,
      recentActions: this.auditLog.slice(-10),
    };
  }
}

// Singleton
let legalFrameworkInstance = null;

const legalFramework = {
  getInstance: () => {
    if (!legalFrameworkInstance) {
      legalFrameworkInstance = new LegalFramework();
    }
    return legalFrameworkInstance;
  },

  generateParticipantContract: (participant) => legalFramework.getInstance().generateParticipantContract(participant),
  generateLeaderContract: (leader) => legalFramework.getInstance().generateLeaderContract(leader),
  generateInvestmentContract: (investment) => legalFramework.getInstance().generateInvestmentContract(investment),
  simulateSignature: (contractId, signatory, role) => legalFramework.getInstance().simulateSignature(contractId, signatory, role),
  createAgreement: (type, parties, terms) => legalFramework.getInstance().createAgreement(type, parties, terms),
  signAgreement: (agreementId, signatoryId, signatoryName) => legalFramework.getInstance().signAgreement(agreementId, signatoryId, signatoryName),
  logAdminAction: (action) => legalFramework.getInstance().logAdminAction(action),
  getContract: (contractId) => legalFramework.getInstance().getContract(contractId),
  getContractsFor: (entityType, entityId) => legalFramework.getInstance().getContractsFor(entityType, entityId),
  getPendingSignatures: () => legalFramework.getInstance().getPendingSignatures(),
  getAuditTrail: (filters) => legalFramework.getInstance().getAuditTrail(filters),
  getLegalSummary: () => legalFramework.getInstance().getLegalSummary(),
};

export default legalFramework;