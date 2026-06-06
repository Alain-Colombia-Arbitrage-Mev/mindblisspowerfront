/**
 * NETWORK VALIDATOR — ZERO GUARD & INTEGRITY ENFORCEMENT
 * Prevents contradictory states, validates before rendering
 */

class NetworkValidator {
  constructor(integrityModel) {
    this.model = integrityModel;
  }

  // Validate a user's complete state
  validateUser(userId) {
    const dna = this.model.getUserDNA(userId);
    if (!dna) return { valid: false, errors: ['User not found'] };

    const errors = [];

    // RULE 6: If members > 0, then binary structure must be non-zero
    if (dna.total_network_members > 0) {
      if (dna.left_count === 0 && dna.right_count === 0) {
        errors.push(`RULE_6: Network members=${dna.total_network_members} but left=0, right=0`);
      }
      if (dna.left_count + dna.right_count !== dna.total_network_members) {
        errors.push(`RULE_5: left(${dna.left_count}) + right(${dna.right_count}) !== total(${dna.total_network_members})`);
      }
    }

    // RULE_7: If personal_memberships exist, personal_investment > 0
    if (dna.personal_memberships.length > 0 && dna.personal_investment === 0) {
      errors.push(`RULE_7: Has ${dna.personal_memberships.length} memberships but personal_investment=0`);
    }

    // RULE_8: If network_members > 0, network_investment > 0
    if (dna.total_network_members > 0 && dna.network_investment === 0) {
      errors.push(`RULE_8: Has ${dna.total_network_members} network members but network_investment=0`);
    }

    // RULE_3: direct_referrals <= total_network_members
    if (dna.direct_referrals > dna.total_network_members) {
      errors.push(`RULE_3: direct_referrals(${dna.direct_referrals}) > total_members(${dna.total_network_members})`);
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      dna: dna,
    };
  }

  // Validate network integrity
  validateNetwork(leaderId) {
    const leader = this.model.users.find(u => u.id === leaderId);
    if (!leader) return { valid: false, errors: ['Leader not found'] };

    const validation = this.validateUser(leaderId);
    return validation;
  }

  // Safe getter for summary values
  getSafeLeaderSummary(leaderId) {
    const validation = this.validateNetwork(leaderId);
    
    if (!validation.valid) {
      console.warn(`Network integrity issues for ${leaderId}:`, validation.errors);
    }

    const dna = validation.dna;

    return {
      // Only render non-zero if derived from real data
      totalMembers: dna.total_network_members,
      directReferrals: dna.direct_referrals,
      leftCount: dna.left_count,
      rightCount: dna.right_count,
      personalInvestment: dna.personal_investment,
      networkInvestment: dna.network_investment,
      leftInvestment: dna.left_investment,
      rightInvestment: dna.right_investment,
      totalInvestment: dna.total_investment,
      monthlyIncome: dna.monthly_income,
      balance: dna.balance,
      
      // Validation status
      isValid: validation.valid,
      validationErrors: validation.errors,
    };
  }

  // Force consistency check — repair or warn
  enforceIntegrity(leaderId) {
    const validation = this.validateNetwork(leaderId);
    
    if (!validation.valid) {
      const warnings = validation.errors.map(e => `⚠️ ${e}`);
      console.warn(`Integrity violations for leader ${leaderId}:`, warnings);
      
      // Return safe zero state if validation fails
      return {
        totalMembers: 0,
        directReferrals: 0,
        leftCount: 0,
        rightCount: 0,
        personalInvestment: validation.dna.personal_investment,
        networkInvestment: 0,
        leftInvestment: 0,
        rightInvestment: 0,
        totalInvestment: validation.dna.personal_investment,
        monthlyIncome: 0,
        balance: 50,
        isValid: false,
      };
    }

    return this.getSafeLeaderSummary(leaderId);
  }
}

export default NetworkValidator;