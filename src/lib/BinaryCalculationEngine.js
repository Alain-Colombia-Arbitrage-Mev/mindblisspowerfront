/**
 * BINARY CALCULATION ENGINE
 * Strict mathematical calculations for network investments
 * NO approximation, NO duplication, NO missing nodes
 */

import platformDataCore from './platformDataCore';

// ═══════════════════════════════════════════════════════════
// PHASE 1: BASE INVESTMENT
// ═══════════════════════════════════════════════════════════

export function getUserInvestment(userId) {
  const membership = platformDataCore.memberships.find(m => m.user_id === userId);
  return membership ? membership.amount : 0;
}

// ═══════════════════════════════════════════════════════════
// PHASE 2: RECURSIVE DESCENDANTS WITH DEDUPLICATION
// ═══════════════════════════════════════════════════════════

export function getAllDescendants(userId) {
  const seen = new Set();
  const result = [];

  function traverse(id) {
    // Prevent circular references
    if (seen.has(id)) return;
    seen.add(id);

    // Get direct children from network_nodes
    const children = platformDataCore.network_nodes.filter(n => n.upline_id === id);

    children.forEach(child => {
      const childUser = platformDataCore.users.find(u => u.id === child.user_id);
      
      if (childUser && !seen.has(child.user_id)) {
        result.push(childUser);
        seen.add(child.user_id);
        traverse(child.user_id);
      }
    });
  }

  traverse(userId);
  return result;
}

// ═══════════════════════════════════════════════════════════
// PHASE 3: TOTAL NETWORK INVESTMENT (USER + ALL DESCENDANTS)
// ═══════════════════════════════════════════════════════════

export function getTotalNetworkInvestment(userId) {
  // Personal investment
  const personal = getUserInvestment(userId);

  // Descendants investment
  const descendants = getAllDescendants(userId);
  const descendantsSum = descendants.reduce((sum, user) => {
    return sum + getUserInvestment(user.id);
  }, 0);

  return personal + descendantsSum;
}

// ═══════════════════════════════════════════════════════════
// PHASE 4: LEFT SIDE INVESTMENT
// ═══════════════════════════════════════════════════════════

export function getLeftInvestment(userId) {
  // Find left child node
  const leftNode = platformDataCore.network_nodes.find(
    n => n.upline_id === userId && n.binary_side === 'left'
  );

  if (!leftNode) return 0;

  // Get left child user
  const leftUser = platformDataCore.users.find(u => u.id === leftNode.user_id);
  if (!leftUser) return 0;

  // Get left child personal + all descendants under left branch
  const leftPersonal = getUserInvestment(leftNode.user_id);
  const leftDescendants = getAllDescendants(leftNode.user_id);
  const descendantsSum = leftDescendants.reduce((sum, user) => {
    return sum + getUserInvestment(user.id);
  }, 0);

  return leftPersonal + descendantsSum;
}

// ═══════════════════════════════════════════════════════════
// PHASE 5: RIGHT SIDE INVESTMENT
// ═══════════════════════════════════════════════════════════

export function getRightInvestment(userId) {
  // Find right child node
  const rightNode = platformDataCore.network_nodes.find(
    n => n.upline_id === userId && n.binary_side === 'right'
  );

  if (!rightNode) return 0;

  // Get right child user
  const rightUser = platformDataCore.users.find(u => u.id === rightNode.user_id);
  if (!rightUser) return 0;

  // Get right child personal + all descendants under right branch
  const rightPersonal = getUserInvestment(rightNode.user_id);
  const rightDescendants = getAllDescendants(rightNode.user_id);
  const descendantsSum = rightDescendants.reduce((sum, user) => {
    return sum + getUserInvestment(user.id);
  }, 0);

  return rightPersonal + descendantsSum;
}

// ═══════════════════════════════════════════════════════════
// PHASE 6: VALIDATION - MANDATORY CONSISTENCY CHECK
// ═══════════════════════════════════════════════════════════

export function validateBinaryCalculation(userId) {
  const total = getTotalNetworkInvestment(userId);
  const left = getLeftInvestment(userId);
  const right = getRightInvestment(userId);
  const sum = left + right;

  // Allow tolerance of 0 cents (exact match required)
  const tolerance = 0.01;
  const mismatch = Math.abs(total - sum);

  const isValid = mismatch < tolerance;

  return {
    isValid,
    total,
    left,
    right,
    sum,
    mismatch,
    error: !isValid ? `BINARY CALCULATION MISMATCH: total=${total}, left+right=${sum}, diff=${mismatch}` : null,
  };
}

// ═══════════════════════════════════════════════════════════
// PHASE 7: DEBUG OUTPUT
// ═══════════════════════════════════════════════════════════

export function getBinaryCalculationDebug(userId) {
  const descendants = getAllDescendants(userId);
  const validation = validateBinaryCalculation(userId);

  return {
    userId,
    personalInvestment: getUserInvestment(userId),
    descendantCount: descendants.length,
    total: validation.total,
    left: validation.left,
    right: validation.right,
    sum: validation.sum,
    mismatch: validation.mismatch,
    isValid: validation.isValid,
    error: validation.error,
  };
}

export default {
  getUserInvestment,
  getAllDescendants,
  getTotalNetworkInvestment,
  getLeftInvestment,
  getRightInvestment,
  validateBinaryCalculation,
  getBinaryCalculationDebug,
};