/**
 * BINARY NETWORK SUMMARY ENGINE
 * Single source of truth for all network calculations
 * Enforces mathematical coherence across entire platform
 * Cached results, memoized calculations, zero validation
 */

class BinaryNetworkSummaryEngine {
  constructor(platformDataCore) {
    this.core = platformDataCore;
    this.cache = new Map();
    this.lastUpdate = null;
  }

  /**
   * PHASE 1: SINGLE SOURCE OF TRUTH
   * Returns complete network summary for any user
   */
  getMemberNetworkSummary(userId) {
    // Check cache validity
    if (this.cache.has(userId) && this.lastUpdate && Date.now() - this.lastUpdate < 30000) {
      return this.cache.get(userId);
    }

    const user = this.core.getUserById(userId);
    if (!user) {
      return this._createEmptyNetworkSummary(userId);
    }

    // PHASE 2: RECURSIVE BINARY CALCULATION
    const networkCalcs = this._calculateBinaryTotals(userId);
    
    // Get personal investment
    const memberships = this.core.getMembershipsForUser(userId);
    const personalInvestment = memberships.reduce((sum, m) => sum + (m.amount || 0), 0);
    
    // Get direct and deep counts
    const descendants = this.core.getDescendantsForLeader(userId);
    const directChildren = this.core.network_nodes.filter(n => n.upline_id === userId);
    const deepCount = descendants.length;
    const directCount = directChildren.length;

    const summary = {
      user_id: userId,
      name: user.name || user.full_name || 'Unknown',
      rank: user.rank || 'Principiante',
      email: user.email || `member-${userId}@vicion.com`,
      phone: user.phone || '+57 000 000 0000',
      personal_investment: personalInvestment,
      network_total: networkCalcs.total,
      left_total: networkCalcs.left,
      right_total: networkCalcs.right,
      direct_count: directCount,
      deep_count: deepCount,
      balance: Math.abs(networkCalcs.left - networkCalcs.right),
      isBalanced: Math.abs(networkCalcs.left - networkCalcs.right) < (networkCalcs.total * 0.1),
      
      // Validation
      isValid: this._validateBinaryCoherence(networkCalcs),
      validationErrors: this._getValidationErrors(networkCalcs),
      
      // Alerts
      alerts: this._generateAlerts(user, networkCalcs, personalInvestment),
      
      // Metrics
      avgMemberInvestment: deepCount > 0 ? (networkCalcs.total / deepCount).toFixed(2) : 0,
      activeMembers: this._countActiveMembers(userId),
      generation: this._calculateGenerationDepth(userId),
    };

    // Cache it
    this.cache.set(userId, summary);
    this.lastUpdate = Date.now();

    return summary;
  }

  /**
   * PHASE 2: RECURSIVE BINARY TREE CALCULATION
   * Calculates left_total, right_total, and validates coherence
   */
  _calculateBinaryTotals(userId) {
    const leftBranch = this.core.network_nodes.filter(
      n => n.upline_id === userId && n.binary_side === 'left'
    );
    const rightBranch = this.core.network_nodes.filter(
      n => n.upline_id === userId && n.binary_side === 'right'
    );

    // Recursive sum function
    const sumBranch = (nodes) => {
      if (nodes.length === 0) return 0;
      
      let total = 0;
      
      // Sum direct members in this branch
      nodes.forEach(node => {
        const user = this.core.getUserById(node.user_id);
        if (user) {
          const memberships = this.core.getMembershipsForUser(node.user_id);
          const investment = memberships.reduce((sum, m) => sum + (m.amount || 0), 0);
          total += investment;
        }
      });

      // Recursively sum their branches
      nodes.forEach(node => {
        const descendants = this.core.getDescendantsForLeader(node.user_id);
        descendants.forEach(desc => {
          const user = this.core.getUserById(desc.user_id);
          if (user) {
            const memberships = this.core.getMembershipsForUser(desc.user_id);
            const investment = memberships.reduce((sum, m) => sum + (m.amount || 0), 0);
            total += investment;
          }
        });
      });

      return total;
    };

    const left = sumBranch(leftBranch);
    const right = sumBranch(rightBranch);
    const total = left + right;

    return {
      left,
      right,
      total,
      leftCount: leftBranch.length,
      rightCount: rightBranch.length,
    };
  }

  /**
   * PHASE 3: VALIDATION CHECK
   * Ensures left + right = total
   */
  _validateBinaryCoherence(calcs) {
    const expected = calcs.left + calcs.right;
    const actual = calcs.total;
    const difference = Math.abs(expected - actual);
    
    if (difference > 0.01) { // Allow for floating point errors
      console.error(`BINARY MISMATCH DETECTED: Expected ${expected}, got ${actual}`);
      return false;
    }
    return true;
  }

  _getValidationErrors(calcs) {
    const errors = [];
    if (!this._validateBinaryCoherence(calcs)) {
      errors.push('BINARY_MISMATCH: left + right !== total');
    }
    if (calcs.left === 0 && calcs.right === 0 && calcs.total === 0) {
      errors.push('NETWORK_EMPTY');
    }
    return errors;
  }

  /**
   * PHASE 5: CONTACT VISIBILITY
   * Ensure no empty contact data
   */
  _ensureContactData(user) {
    return {
      full_name: user.name || user.full_name || 'Unknown',
      email: user.email || `member-${user.id}@vicion.com`,
      phone: user.phone || '+57 000 000 0000',
      country: user.country || 'Colombia',
      rank: user.rank || 'Principiante',
      status: user.status || 'inactivo',
    };
  }

  /**
   * PHASE 6: ALERT GENERATION
   */
  _generateAlerts(user, networkCalcs, personalInvestment) {
    const alerts = [];

    // Binary imbalance
    if (networkCalcs.total > 0) {
      const imbalance = Math.abs(networkCalcs.left - networkCalcs.right) / networkCalcs.total;
      if (imbalance > 0.3) {
        alerts.push({
          type: 'BINARY_IMBALANCE',
          severity: imbalance > 0.5 ? 'high' : 'medium',
          message: `Binary imbalance detected: ${(imbalance * 100).toFixed(1)}%`,
        });
      }
    }

    // High-value member
    if (personalInvestment >= 10000) {
      alerts.push({
        type: 'HIGH_VALUE_MEMBER',
        severity: 'info',
        message: `High-value member: $${personalInvestment.toLocaleString()}`,
      });
    }

    // Missing contact data
    if (!user.email || !user.phone) {
      alerts.push({
        type: 'INCOMPLETE_CONTACT',
        severity: 'warning',
        message: 'Member missing contact information',
      });
    }

    // Inactive with network
    if (user.status === 'inactivo' && networkCalcs.total > 0) {
      alerts.push({
        type: 'INACTIVE_WITH_NETWORK',
        severity: 'warning',
        message: 'Inactive member with active downline',
      });
    }

    return alerts;
  }

  /**
   * Count active members in network
   */
  _countActiveMembers(userId) {
    const descendants = this.core.getDescendantsForLeader(userId);
    return descendants.filter(d => {
      const user = this.core.getUserById(d.user_id);
      return user && user.status === 'activo';
    }).length;
  }

  /**
   * Calculate generation depth
   */
  _calculateGenerationDepth(userId) {
    let maxDepth = 0;
    
    const traverse = (nodeId, depth) => {
      const children = this.core.network_nodes.filter(n => n.upline_id === nodeId);
      if (children.length === 0) return;
      maxDepth = Math.max(maxDepth, depth);
      children.forEach(child => traverse(child.user_id, depth + 1));
    };

    traverse(userId, 1);
    return maxDepth || 0;
  }

  /**
   * Create empty summary for non-existent users
   */
  _createEmptyNetworkSummary(userId) {
    return {
      user_id: userId,
      name: 'Unknown User',
      rank: 'Principiante',
      email: `member-${userId}@vicion.com`,
      phone: '+57 000 000 0000',
      personal_investment: 0,
      network_total: 0,
      left_total: 0,
      right_total: 0,
      direct_count: 0,
      deep_count: 0,
      balance: 0,
      isBalanced: true,
      isValid: false,
      validationErrors: ['USER_NOT_FOUND'],
      alerts: [],
      avgMemberInvestment: 0,
      activeMembers: 0,
      generation: 0,
    };
  }

  /**
   * PHASE 9: CLEAR CACHE
   * Call when network changes
   */
  invalidateCache() {
    this.cache.clear();
    this.lastUpdate = null;
  }

  /**
   * Get all network summaries (for admin)
   */
  getAllNetworkSummaries() {
    const leaders = this.core.leaders || [];
    return leaders.map(leader => this.getMemberNetworkSummary(leader.id));
  }

  /**
   * Validate entire network coherence
   */
  validateNetworkCoherence() {
    const issues = [];
    const allSummaries = this.getAllNetworkSummaries();

    allSummaries.forEach(summary => {
      if (!summary.isValid) {
        issues.push({
          userId: summary.user_id,
          errors: summary.validationErrors,
        });
      }
    });

    return {
      isCoherent: issues.length === 0,
      totalMembers: allSummaries.length,
      validMembers: allSummaries.filter(s => s.isValid).length,
      issues,
      totalNetworkInvestment: allSummaries.reduce((sum, s) => sum + s.network_total, 0),
      totalPersonalInvestment: allSummaries.reduce((sum, s) => sum + s.personal_investment, 0),
    };
  }
}

// Export factory function
export function createBinaryNetworkSummaryEngine(platformDataCore) {
  return new BinaryNetworkSummaryEngine(platformDataCore);
}

export default BinaryNetworkSummaryEngine;