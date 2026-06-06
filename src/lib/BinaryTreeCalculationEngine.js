/**
 * BINARY TREE CALCULATION ENGINE
 * Recursive binary tree sum calculations with no duplication
 * 
 * CRITICAL: All calculations are recursive and deduplicated
 * left_total = sum of all descendants on left branch
 * right_total = sum of all descendants on right branch
 * network_total = left_total + right_total (does not include root)
 */

class BinaryTreeCalculationEngine {
  /**
   * Get all descendants on a specific branch (left or right)
   * Returns array of member IDs to avoid duplication
   */
  static getBranchDescendants(rootMemberId, side, networkNodes, visitedSet = new Set()) {
    if (!rootMemberId || !side || !Array.isArray(networkNodes)) {
      return [];
    }

    const descendants = [];
    const toVisit = networkNodes.filter(
      node => node.upline_id === rootMemberId && node.binary_side === side
    );

    toVisit.forEach(node => {
      if (!visitedSet.has(node.user_id)) {
        visitedSet.add(node.user_id);
        descendants.push(node.user_id);

        // Recursively get descendants of this node
        const leftDescendants = this.getBranchDescendants(
          node.user_id,
          'left',
          networkNodes,
          visitedSet
        );
        const rightDescendants = this.getBranchDescendants(
          node.user_id,
          'right',
          networkNodes,
          visitedSet
        );

        descendants.push(...leftDescendants, ...rightDescendants);
      }
    });

    return descendants;
  }

  /**
   * Calculate total investment for a branch (recursive, no duplication)
   */
  static calculateBranchTotal(rootMemberId, side, networkNodes, members) {
    const branchMemberIds = this.getBranchDescendants(rootMemberId, side, networkNodes);

    let total = 0;
    branchMemberIds.forEach(memberId => {
      const member = members.find(m => m.user_id === memberId || m.id === memberId);
      if (member && member.investment_amount) {
        total += member.investment_amount;
      }
    });

    return total;
  }

  /**
   * Get complete binary tree metrics for a leader
   */
  static calculateBinaryMetrics(rootMemberId, networkNodes, members) {
    if (!rootMemberId || !Array.isArray(networkNodes) || !Array.isArray(members)) {
      return {
        leftTotal: 0,
        rightTotal: 0,
        networkTotal: 0,
        leftCount: 0,
        rightCount: 0,
        totalMembers: 0,
        balance: 0,
        isBalanced: true,
      };
    }

    // Get branch descendants
    const leftDescendants = this.getBranchDescendants(rootMemberId, 'left', networkNodes);
    const rightDescendants = this.getBranchDescendants(rootMemberId, 'right', networkNodes);

    // Calculate totals
    let leftTotal = 0;
    let rightTotal = 0;

    // Sum left branch
    leftDescendants.forEach(memberId => {
      const member = members.find(m => m.user_id === memberId || m.id === memberId);
      if (member && member.investment_amount) {
        leftTotal += member.investment_amount;
      }
    });

    // Sum right branch
    rightDescendants.forEach(memberId => {
      const member = members.find(m => m.user_id === memberId || m.id === memberId);
      if (member && member.investment_amount) {
        rightTotal += member.investment_amount;
      }
    });

    const networkTotal = leftTotal + rightTotal;
    const totalMembers = leftDescendants.length + rightDescendants.length;
    const minSide = Math.min(leftTotal, rightTotal);
    const maxSide = Math.max(leftTotal, rightTotal);
    const balance = maxSide > 0 ? ((maxSide - minSide) / maxSide * 100).toFixed(1) : 0;
    const isBalanced = balance < 20; // Less than 20% difference = balanced

    return {
      leftTotal,
      rightTotal,
      networkTotal,
      leftCount: leftDescendants.length,
      rightCount: rightDescendants.length,
      totalMembers,
      balance: parseFloat(balance),
      isBalanced,
      minSide,
      maxSide,
      averageInvestment: totalMembers > 0 ? Math.round(networkTotal / totalMembers) : 0,
    };
  }

  /**
   * Get direct children for a member
   */
  static getDirectChildren(rootMemberId, networkNodes) {
    if (!rootMemberId || !Array.isArray(networkNodes)) return [];

    return networkNodes.filter(node => node.upline_id === rootMemberId);
  }

  /**
   * Get generation depth for a member in the tree
   */
  static getGenerationDepth(memberId, networkNodes) {
    if (!memberId || !Array.isArray(networkNodes)) return 0;

    let depth = 0;
    let currentMemberId = memberId;

    const visited = new Set();

    while (currentMemberId && !visited.has(currentMemberId)) {
      visited.add(currentMemberId);
      const node = networkNodes.find(n => n.user_id === currentMemberId);

      if (!node || !node.upline_id) break;

      currentMemberId = node.upline_id;
      depth++;
    }

    return depth;
  }

  /**
   * Check if two members are in the same branch
   */
  static areMembersInSameBranch(member1Id, member2Id, networkNodes) {
    if (!member1Id || !member2Id || !Array.isArray(networkNodes)) return false;

    const node1 = networkNodes.find(n => n.user_id === member1Id);
    const node2 = networkNodes.find(n => n.user_id === member2Id);

    if (!node1 || !node2) return false;

    // Get root for both
    let root1 = member1Id;
    let root2 = member2Id;
    let visited1 = new Set([member1Id]);
    let visited2 = new Set([member2Id]);

    while (true) {
      const parent1 = networkNodes.find(n => n.user_id === root1);
      if (!parent1 || !parent1.upline_id || visited1.has(parent1.upline_id)) break;
      visited1.add(parent1.upline_id);
      root1 = parent1.upline_id;
    }

    while (true) {
      const parent2 = networkNodes.find(n => n.user_id === root2);
      if (!parent2 || !parent2.upline_id || visited2.has(parent2.upline_id)) break;
      visited2.add(parent2.upline_id);
      root2 = parent2.upline_id;
    }

    return root1 === root2;
  }

  /**
   * Validate binary tree integrity
   */
  static validateBinaryIntegrity(networkNodes) {
    const errors = [];

    if (!Array.isArray(networkNodes)) {
      return { valid: false, errors: ['Network nodes is not an array'] };
    }

    const memberIds = new Set();

    networkNodes.forEach((node, idx) => {
      if (!node.user_id) {
        errors.push(`Node ${idx}: missing user_id`);
      } else {
        memberIds.add(node.user_id);
      }

      if (node.upline_id && !networkNodes.some(n => n.user_id === node.upline_id)) {
        errors.push(`Node ${node.user_id}: upline_id ${node.upline_id} not found`);
      }

      if (!['left', 'right'].includes(node.binary_side)) {
        errors.push(`Node ${node.user_id}: invalid binary_side ${node.binary_side}`);
      }

      // Check for circular references
      let current = node.user_id;
      const visited = new Set([current]);
      while (current) {
        const parent = networkNodes.find(n => n.user_id === current);
        if (!parent || !parent.upline_id) break;
        current = parent.upline_id;
        if (visited.has(current)) {
          errors.push(`Node ${node.user_id}: circular reference detected`);
          break;
        }
        visited.add(current);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      totalNodes: networkNodes.length,
      uniqueMembers: memberIds.size,
    };
  }
}

export default BinaryTreeCalculationEngine;