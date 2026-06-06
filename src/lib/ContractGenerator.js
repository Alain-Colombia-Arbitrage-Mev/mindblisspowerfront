// Contract Generator - Automatically generate structured contracts from user activity

class ContractGenerator {
  constructor() {
    this.generatedContracts = [];
    this.contractTemplates = this.initializeTemplates();
  }

  initializeTemplates() {
    return {
      participation_agreement: {
        title: 'Participation Agreement',
        description: 'Agreement for participant enrollment',
        sections: ['Membership Terms', 'Rights & Obligations', 'Fee Structure', 'Termination'],
        defaultTerms: {
          membershipFee: true,
          monthlyMaintenance: false,
          earlyTerminationFee: true,
          autoRenewal: true,
        },
      },
      investment_agreement: {
        title: 'Investment Plan Agreement',
        description: 'Agreement for investment activation',
        sections: ['Investment Terms', 'Return Structure', 'Lock-up Period', 'Withdrawal Terms', 'Risk Disclosure'],
        defaultTerms: {
          lockupPeriod: true,
          returnStructure: true,
          riskAcknowledgment: true,
          autoCompound: false,
        },
      },
      leader_agreement: {
        title: 'Leadership Agreement',
        description: 'Agreement for leader appointment',
        sections: ['Leadership Duties', 'Compensation Terms', 'Performance Metrics', 'Code of Conduct', 'Termination'],
        defaultTerms: {
          leadershipResponsibilities: true,
          compensationStructure: true,
          performanceRequirements: true,
          codeOfConduct: true,
        },
      },
      service_agreement: {
        title: 'Service Agreement',
        description: 'Agreement for advisory or support services',
        sections: ['Service Scope', 'Fees', 'Term', 'Confidentiality', 'Liability'],
        defaultTerms: {
          serviceFee: true,
          serviceTerm: true,
          confidentiality: true,
          supportLevel: true,
        },
      },
    };
  }

  // Generate participation agreement
  generateParticipationAgreement(participantData) {
    const contractId = this.generateContractId('PA');
    const contract = {
      id: contractId,
      type: 'participation_agreement',
      status: 'generated',
      title: 'Participation Agreement',
      parties: [
        {
          type: 'participant',
          name: participantData.name,
          email: participantData.email,
          id: participantData.id,
        },
        {
          type: 'platform',
          name: 'VICION POWER',
          representative: 'Admin',
        },
      ],
      generatedDate: new Date(),
      effectiveDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      terms: {
        membershipFee: participantData.planFee || 0,
        monthlyMaintenance: participantData.planMaintenance || 0,
        enrollmentDate: new Date(),
        status: 'active',
      },
      conditions: [
        'Participant agrees to comply with all platform rules and regulations',
        'Participant acknowledges receipt of risk disclosure documents',
        'Participant accepts terms of service agreement',
        `Enrollment fee: ${participantData.planFee || 0} ${participantData.currency || 'USD'}`,
        'Automatic renewal unless canceled 30 days before expiry',
      ],
      amount: participantData.planFee || 0,
      currency: participantData.currency || 'USD',
      signatureStatus: 'pending',
      content: this.generateDocumentContent(
        'participation_agreement',
        participantData.name,
        participantData.planFee || 0
      ),
    };

    this.generatedContracts.push(contract);
    return contract;
  }

  // Generate investment agreement
  generateInvestmentAgreement(investmentData) {
    const contractId = this.generateContractId('IA');
    const lockupDays = investmentData.lockupPeriod || 90;
    const contract = {
      id: contractId,
      type: 'investment_agreement',
      status: 'generated',
      title: 'Investment Plan Agreement',
      parties: [
        {
          type: 'participant',
          name: investmentData.participantName,
          email: investmentData.participantEmail,
          id: investmentData.participantId,
        },
        {
          type: 'platform',
          name: 'VICION POWER',
          representative: 'Admin',
        },
      ],
      generatedDate: new Date(),
      effectiveDate: new Date(),
      lockupExpiryDate: new Date(Date.now() + lockupDays * 24 * 60 * 60 * 1000),
      terms: {
        investmentAmount: investmentData.amount,
        planName: investmentData.planName,
        investmentDate: new Date(),
        lockupPeriod: lockupDays,
        returnPercentage: investmentData.returnPercentage || 10,
        compoundFrequency: investmentData.compound ? 'monthly' : 'none',
      },
      conditions: [
        `Investment Amount: ${investmentData.amount} ${investmentData.currency || 'USD'}`,
        `Plan: ${investmentData.planName}`,
        `Lock-up Period: ${lockupDays} days from activation`,
        `Early withdrawal subject to ${investmentData.earlyWithdrawalPenalty || 5}% penalty`,
        'Investor acknowledges understanding of risk disclosure',
        'Returns are not guaranteed and subject to platform performance',
      ],
      amount: investmentData.amount,
      currency: investmentData.currency || 'USD',
      signatureStatus: 'pending',
      content: this.generateDocumentContent(
        'investment_agreement',
        investmentData.participantName,
        investmentData.amount
      ),
    };

    this.generatedContracts.push(contract);
    return contract;
  }

  // Generate leader agreement
  generateLeaderAgreement(leaderData) {
    const contractId = this.generateContractId('LA');
    const contract = {
      id: contractId,
      type: 'leader_agreement',
      status: 'generated',
      title: 'Leadership Agreement',
      parties: [
        {
          type: 'leader',
          name: leaderData.name,
          email: leaderData.email,
          id: leaderData.id,
          country: leaderData.countryCode,
        },
        {
          type: 'platform',
          name: 'VICION POWER',
          representative: 'Admin',
        },
      ],
      generatedDate: new Date(),
      effectiveDate: new Date(),
      expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
      terms: {
        leadershipTitle: leaderData.leadershipTitle || 'Country Leader',
        country: leaderData.countryCode,
        appointmentDate: new Date(),
        compensationStructure: leaderData.compensationStructure || {
          baseBonus: '10% of team volume',
          cycleFrequency: 'monthly',
          minQualification: '1 direct referral',
        },
        expectations: {
          minTeamSize: leaderData.minTeamSize || 10,
          monthlyActivity: leaderData.monthlyActivity || 'required',
          complianceRequirements: 'strict',
        },
      },
      conditions: [
        `Position: ${leaderData.leadershipTitle || 'Country Leader'}`,
        `Country: ${leaderData.countryCode}`,
        'Leader agrees to maintain platform code of conduct',
        'Leader must complete mandatory training program',
        'Leader is responsible for team compliance in jurisdiction',
        'Performance-based compensation subject to KPIs',
        'Agreement terminable by either party with 30 days notice',
      ],
      amount: 0, // Will be calculated based on performance
      currency: 'USD',
      signatureStatus: 'pending',
      content: this.generateDocumentContent(
        'leader_agreement',
        leaderData.name,
        0
      ),
    };

    this.generatedContracts.push(contract);
    return contract;
  }

  // Generate service agreement
  generateServiceAgreement(serviceData) {
    const contractId = this.generateContractId('SA');
    const contract = {
      id: contractId,
      type: 'service_agreement',
      status: 'generated',
      title: 'Service Agreement',
      parties: [
        {
          type: 'client',
          name: serviceData.clientName,
          email: serviceData.clientEmail,
          id: serviceData.clientId,
        },
        {
          type: 'service_provider',
          name: serviceData.providerName,
          email: serviceData.providerEmail,
          id: serviceData.providerId,
          title: serviceData.providerTitle || 'Advisor',
        },
      ],
      generatedDate: new Date(),
      effectiveDate: new Date(),
      termLength: serviceData.termLength || 12,
      terms: {
        serviceType: serviceData.serviceType,
        serviceFee: serviceData.serviceFee,
        billingCycle: serviceData.billingCycle || 'monthly',
        supportLevel: serviceData.supportLevel || 'standard',
        responseTime: serviceData.responseTime || '24 hours',
      },
      conditions: [
        `Service: ${serviceData.serviceType}`,
        `Fee: ${serviceData.serviceFee} ${serviceData.currency || 'USD'} per ${serviceData.billingCycle || 'month'}`,
        `Provider: ${serviceData.providerName} (${serviceData.providerTitle || 'Advisor'})`,
        `Support Level: ${serviceData.supportLevel || 'standard'}`,
        'Client agrees to confidentiality of provided information',
        'Service provider maintains professional standards',
        'Either party may terminate with 30 days written notice',
      ],
      amount: serviceData.serviceFee,
      currency: serviceData.currency || 'USD',
      signatureStatus: 'pending',
      content: this.generateDocumentContent(
        'service_agreement',
        serviceData.clientName,
        serviceData.serviceFee
      ),
    };

    this.generatedContracts.push(contract);
    return contract;
  }

  // Bulk generate contracts from activity
  generateFromActivity(activityData) {
    const generatedContracts = [];

    // If participant activation, generate participation agreement
    if (activityData.type === 'participant_enrollment') {
      const contract = this.generateParticipationAgreement({
        id: activityData.userId,
        name: activityData.userName,
        email: activityData.userEmail,
        planFee: activityData.planFee,
        planMaintenance: activityData.planMaintenance,
        currency: activityData.currency,
      });
      generatedContracts.push(contract);
    }

    // If investment, generate investment agreement
    if (activityData.type === 'investment_activation') {
      const contract = this.generateInvestmentAgreement({
        participantId: activityData.userId,
        participantName: activityData.userName,
        participantEmail: activityData.userEmail,
        planName: activityData.planName,
        amount: activityData.investmentAmount,
        currency: activityData.currency,
        lockupPeriod: activityData.lockupPeriod,
        returnPercentage: activityData.returnPercentage,
      });
      generatedContracts.push(contract);
    }

    // If leader assignment, generate leader agreement
    if (activityData.type === 'leader_appointment') {
      const contract = this.generateLeaderAgreement({
        id: activityData.leaderId,
        name: activityData.leaderName,
        email: activityData.leaderEmail,
        countryCode: activityData.countryCode,
        leadershipTitle: activityData.leadershipTitle,
        compensationStructure: activityData.compensationStructure,
      });
      generatedContracts.push(contract);
    }

    // If advisor assignment, generate service agreement
    if (activityData.type === 'advisor_assignment') {
      const contract = this.generateServiceAgreement({
        clientId: activityData.clientId,
        clientName: activityData.clientName,
        clientEmail: activityData.clientEmail,
        providerId: activityData.advisorId,
        providerName: activityData.advisorName,
        providerEmail: activityData.advisorEmail,
        providerTitle: 'Advisor',
        serviceType: activityData.serviceType || 'Financial Advisory',
        serviceFee: activityData.serviceFee || 0,
        supportLevel: activityData.supportLevel || 'standard',
      });
      generatedContracts.push(contract);
    }

    return generatedContracts;
  }

  // Update contract status
  updateContractStatus(contractId, newStatus) {
    const contract = this.generatedContracts.find(c => c.id === contractId);
    if (!contract) return null;

    contract.status = newStatus;
    if (newStatus === 'signed') {
      contract.signatureStatus = 'signed';
      contract.signedDate = new Date();
    }

    return contract;
  }

  // Get contracts by user
  getContractsByUser(userId) {
    return this.generatedContracts.filter(c =>
      c.parties.some(p => p.id === userId)
    );
  }

  // Get contracts by type
  getContractsByType(type) {
    return this.generatedContracts.filter(c => c.type === type);
  }

  // Get pending signatures
  getPendingSignatures() {
    return this.generatedContracts.filter(c => c.signatureStatus === 'pending');
  }

  // Get contract summary
  getContractSummary() {
    return {
      total: this.generatedContracts.length,
      byType: {
        participation: this.getContractsByType('participation_agreement').length,
        investment: this.getContractsByType('investment_agreement').length,
        leader: this.getContractsByType('leader_agreement').length,
        service: this.getContractsByType('service_agreement').length,
      },
      byStatus: {
        draft: this.generatedContracts.filter(c => c.status === 'draft').length,
        generated: this.generatedContracts.filter(c => c.status === 'generated').length,
        sent: this.generatedContracts.filter(c => c.status === 'sent').length,
        signed: this.generatedContracts.filter(c => c.status === 'signed').length,
      },
      pendingSignatures: this.getPendingSignatures().length,
    };
  }

  // Private utilities
  generateContractId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  generateDocumentContent(templateType, partyName, amount) {
    const templateLabels = {
      participation_agreement: 'PARTICIPATION AGREEMENT',
      investment_agreement: 'INVESTMENT PLAN AGREEMENT',
      leader_agreement: 'LEADERSHIP AGREEMENT',
      service_agreement: 'SERVICE AGREEMENT',
    };

    return `
================================================================================
                        ${templateLabels[templateType]}
================================================================================

GENERATED FOR: ${partyName}
${amount > 0 ? `AMOUNT: ${amount} USD\n` : ''}
DATE: ${new Date().toISOString().split('T')[0]}

================================================================================
PARTIES INVOLVED
================================================================================

1. Individual: ${partyName}
2. Platform: VICION POWER

================================================================================
TERMS & CONDITIONS
================================================================================

This document outlines the complete terms and conditions of the agreement
entered into between the parties listed above. All conditions are binding
upon signature and must be accepted in full.

================================================================================
STATUS & EXECUTION
================================================================================

Document Status: GENERATED
Signature Status: PENDING
Contract ID: AUTO-GENERATED

This is a formal legal document requiring authorized signatures.

================================================================================
    `;
  }
}

// Singleton instance
let contractGeneratorInstance = null;

const contractGenerator = {
  getInstance: () => {
    if (!contractGeneratorInstance) {
      contractGeneratorInstance = new ContractGenerator();
    }
    return contractGeneratorInstance;
  },

  generateParticipationAgreement: (data) => contractGenerator.getInstance().generateParticipationAgreement(data),
  generateInvestmentAgreement: (data) => contractGenerator.getInstance().generateInvestmentAgreement(data),
  generateLeaderAgreement: (data) => contractGenerator.getInstance().generateLeaderAgreement(data),
  generateServiceAgreement: (data) => contractGenerator.getInstance().generateServiceAgreement(data),
  generateFromActivity: (data) => contractGenerator.getInstance().generateFromActivity(data),
  updateContractStatus: (contractId, status) => contractGenerator.getInstance().updateContractStatus(contractId, status),
  getContractsByUser: (userId) => contractGenerator.getInstance().getContractsByUser(userId),
  getContractsByType: (type) => contractGenerator.getInstance().getContractsByType(type),
  getPendingSignatures: () => contractGenerator.getInstance().getPendingSignatures(),
  getContractSummary: () => contractGenerator.getInstance().getContractSummary(),
  getAllContracts: () => contractGenerator.getInstance().generatedContracts,
};

export default contractGenerator;