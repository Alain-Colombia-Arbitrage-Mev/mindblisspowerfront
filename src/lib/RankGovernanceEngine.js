/**
 * RANK GOVERNANCE ENGINE
 * Enforces strict hierarchy, rank ceilings, and data completeness
 * 
 * CRITICAL RULES:
 * 1. E. Corona is the absolute maximum rank
 * 2. Root leader is the only E. Corona by default
 * 3. No rank escalation beyond platform ceiling
 * 4. All members must have: name, email, phone and a positive investment
 */

const RANK_HIERARCHY = [
  'Principiante',
  'Bronce',
  'Plata',
  'Oro',
  'Platino',
  'Zafiro',
  'Rubí',
  'Esmeralda',
  'Diamante',
  'Diamante Azul',
  'Diamante Negro',
  'E. Corona', // ABSOLUTE MAX RANK
];

const APPROVED_PLANS = [500, 1000, 2500, 5000, 10000, 25000];

class RankGovernanceEngine {
  static getMemberId(member) {
    return member?.user_id || member?.id || null;
  }

  static getMemberName(member) {
    return member?.full_name || member?.name || '';
  }

  static getInvestmentAmount(member) {
    if (!member) return 0;

    const rawAmount =
      member.investment_amount ??
      member.investment ??
      member.amount ??
      member.membership_amount ??
      member.inversion_personal ??
      member.membership?.amount ??
      0;
    const amount = Number(rawAmount);

    return Number.isFinite(amount) && amount > 0 ? amount : 0;
  }

  /**
   * Validate if a member has complete data
   */
  static isDataComplete(member) {
    if (!member) return false;
    return !!(
      this.getMemberName(member) &&
      member.email &&
      member.phone &&
      this.getInvestmentAmount(member)
    );
  }

  /**
   * Get all invalid members (incomplete data)
   */
  static getInvalidMembers(members = []) {
    if (!Array.isArray(members)) return [];
    return members.filter(m => !this.isDataComplete(m));
  }

  /**
   * Enforce rank ceiling - no member above E. Corona
   */
  static enforceRankCeiling(rank, isRootLeader = false) {
    if (!rank) return 'Principiante';
    
    // Root leader can only be E. Corona
    if (isRootLeader) return 'E. Corona';
    
    // Check if rank is in approved list
    if (!RANK_HIERARCHY.includes(rank)) {
      return 'Principiante'; // Default to lowest rank if invalid
    }
    
    // Force downgrade if above E. Corona (shouldn't happen, but safety check)
    const rankIndex = RANK_HIERARCHY.indexOf(rank);
    const maxIndex = RANK_HIERARCHY.indexOf('E. Corona');
    
    if (rankIndex > maxIndex) {
      return 'Diamante Negro'; // Second-highest rank
    }
    
    return rank;
  }

  /**
   * Validate investment amount
   */
  static validateInvestment(amount) {
    const numericAmount = Number(amount);
    if (!numericAmount || !Number.isFinite(numericAmount)) return 0;
    // Investment must be one of approved plans
    const approved = APPROVED_PLANS.find(p => p === numericAmount);
    return approved || 0;
  }

  /**
   * Get rank index (position in hierarchy)
   */
  static getRankIndex(rank) {
    return RANK_HIERARCHY.indexOf(rank) || 0;
  }

  /**
   * Calculate average investment across network
   */
  static calculateAverageInvestment(members = []) {
    if (!Array.isArray(members) || members.length === 0) return 0;
    
    const validInvestments = members
      .map(m => this.getInvestmentAmount(m))
      .filter(amount => amount > 0);
    
    if (validInvestments.length === 0) return 0;
    
    const sum = validInvestments.reduce((a, b) => a + b, 0);
    return Math.round(sum / validInvestments.length);
  }

  /**
   * Check if average investment is in healthy range (3500-7000)
   */
  static isAverageInvestmentHealthy(average) {
    return average >= 3500 && average <= 7000;
  }

  /**
   * Validate entire network structure
   */
  static validateNetwork(members = [], rootMemberId = null) {
    const validation = {
      totalMembers: members.length || 0,
      validMembers: 0,
      invalidMembers: [],
      missingContactInfo: 0,
      averageInvestment: 0,
      highestRankDetected: null,
      highestRankHolder: null,
      rootLeaderValid: false,
      isHealthy: true,
      errors: [],
    };

    if (!Array.isArray(members) || members.length === 0) {
      validation.isHealthy = false;
      validation.errors.push('Network is empty');
      return validation;
    }

    // Validate each member
    members.forEach(member => {
      if (this.isDataComplete(member)) {
        validation.validMembers++;
      } else {
        validation.invalidMembers.push(this.getMemberId(member));
        validation.missingContactInfo++;
      }

      // Track highest rank
      if (member.rank && RANK_HIERARCHY.includes(member.rank)) {
        const rankIndex = RANK_HIERARCHY.indexOf(member.rank);
        if (!validation.highestRankDetected || rankIndex > RANK_HIERARCHY.indexOf(validation.highestRankDetected)) {
          validation.highestRankDetected = member.rank;
          validation.highestRankHolder = this.getMemberName(member) || this.getMemberId(member);
        }
      }
    });

    // Calculate average investment
    validation.averageInvestment = this.calculateAverageInvestment(members);

    // Check root leader rank
    if (rootMemberId) {
      const rootMember = members.find(m => this.getMemberId(m) === rootMemberId);
      if (rootMember && rootMember.rank === 'E. Corona') {
        validation.rootLeaderValid = true;
      } else {
        validation.errors.push('Root leader is not E. Corona');
        validation.isHealthy = false;
      }
    }

    // Check rank ceiling
    if (validation.highestRankDetected && validation.highestRankDetected !== 'E. Corona') {
      if (validation.highestRankHolder !== 'Root Leader') {
        validation.errors.push(`Rank ceiling breach: ${validation.highestRankHolder} has ${validation.highestRankDetected}`);
      }
    }

    // Check average investment health
    if (!this.isAverageInvestmentHealthy(validation.averageInvestment)) {
      validation.errors.push(
        `Average investment ${validation.averageInvestment} is outside healthy range (3500-7000)`
      );
    }

    // Overall health status
    if (validation.invalidMembers.length > (validation.totalMembers * 0.2)) {
      validation.isHealthy = false;
      validation.errors.push(`Too many invalid members: ${validation.invalidMembers.length}/${validation.totalMembers}`);
    }

    return validation;
  }

  /**
   * Get governance status color
   */
  static getStatusColor(validation) {
    if (validation.isHealthy && validation.validMembers >= validation.totalMembers * 0.9) {
      return '#10b981'; // Green
    }
    if (validation.errors.length === 0) {
      return '#fbbf24'; // Yellow - warning
    }
    return '#ef4444'; // Red - critical
  }
}

export default RankGovernanceEngine;
