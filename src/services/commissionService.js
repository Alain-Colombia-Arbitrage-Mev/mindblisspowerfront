import { base44 } from '@/api/base44Client';

/**
 * Production-grade commission engine
 * Handles base, binary, network, and direct bonuses
 * All calculations tracked in ledger
 */

export async function calculateMonthlyCommissions(userId, period, tenantId = 'default') {
  try {
    // Fetch user and membership
    const users = await base44.entities.User.filter({ id: userId, tenant_id: tenantId }, '-created_date', 1);
    if (!users || users.length === 0) return { error: 'User not found' };
    
    const user = users[0];
    const memberships = await base44.entities.Membership.filter(
      { user_id: userId, status: 'active', tenant_id: tenantId },
      '-created_date',
      1
    );
    
    if (!memberships || memberships.length === 0) {
      return { success: true, commissions: [], total: 0, message: 'No active membership' };
    }

    const membership = memberships[0];
    const monthlyAmount = membership.amount / 12; // Annualized into monthly

    const commissions = [];

    // 1. BASE COMMISSION (1% monthly of investment)
    const baseCommission = monthlyAmount * 0.01;
    if (baseCommission > 0) {
      const baseEntry = await base44.entities.Commission.create({
        user_id: userId,
        type: 'base',
        amount: baseCommission,
        currency: 'USD',
        period,
        status: 'pending',
        source_user_id: userId,
        tenant_id: tenantId,
        calculation_details: JSON.stringify({
          formula: 'investment / 12 * 0.01',
          investment: membership.amount,
        }),
      });
      commissions.push(baseEntry);
    }

    // 2. BINARY BONUS (10% of minimum side)
    const binaryBonus = await calculateBinaryBonus(userId, period, tenantId);
    if (binaryBonus.amount > 0) {
      const binaryEntry = await base44.entities.Commission.create({
        user_id: userId,
        type: 'binary',
        amount: binaryBonus.amount,
        currency: 'USD',
        period,
        status: 'pending',
        source_user_id: userId,
        tenant_id: tenantId,
        calculation_details: JSON.stringify(binaryBonus.details),
      });
      commissions.push(binaryEntry);
    }

    // 3. NETWORK BONUS (2% of total network investment)
    const networkBonus = await calculateNetworkBonus(userId, period, tenantId);
    if (networkBonus.amount > 0) {
      const networkEntry = await base44.entities.Commission.create({
        user_id: userId,
        type: 'network',
        amount: networkBonus.amount,
        currency: 'USD',
        period,
        status: 'pending',
        source_user_id: userId,
        tenant_id: tenantId,
        calculation_details: JSON.stringify(networkBonus.details),
      });
      commissions.push(networkEntry);
    }

    // 4. DIRECT BONUS ($50 per direct referral)
    const directBonus = await calculateDirectBonus(userId, period, tenantId);
    if (directBonus.amount > 0) {
      const directEntry = await base44.entities.Commission.create({
        user_id: userId,
        type: 'direct',
        amount: directBonus.amount,
        currency: 'USD',
        period,
        status: 'pending',
        source_user_id: userId,
        tenant_id: tenantId,
        calculation_details: JSON.stringify(directBonus.details),
      });
      commissions.push(directEntry);
    }

    const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);

    return {
      success: true,
      commissions,
      total: totalCommission,
      period,
      breakdown: {
        base: baseCommission,
        binary: binaryBonus.amount,
        network: networkBonus.amount,
        direct: directBonus.amount,
      },
    };
  } catch (error) {
    return { error: error.message, code: 'CALCULATION_ERROR' };
  }
}

async function calculateBinaryBonus(userId, period, tenantId) {
  try {
    // Get network node
    const nodes = await base44.entities.NetworkNode.filter(
      { user_id: userId, tenant_id: tenantId },
      '-created_date',
      1
    );
    
    if (!nodes || nodes.length === 0) {
      return { amount: 0, details: { message: 'Not in network tree' } };
    }

    const node = nodes[0];

    // Recursively get left and right side investments
    const leftInvestment = await getSubtreeInvestment(node.left_child_id, tenantId);
    const rightInvestment = await getSubtreeInvestment(node.right_child_id, tenantId);
    const minSide = Math.min(leftInvestment, rightInvestment);
    const bonus = minSide * 0.10; // 10% of minimum

    return {
      amount: bonus,
      details: {
        formula: 'min(left, right) * 0.10',
        left: leftInvestment,
        right: rightInvestment,
        minSide,
      },
    };
  } catch (error) {
    return { amount: 0, details: { error: error.message } };
  }
}

async function calculateNetworkBonus(userId, period, tenantId) {
  try {
    // Get all descendants
    const nodes = await base44.entities.NetworkNode.filter(
      { tenant_id: tenantId },
      '-created_date',
      1000
    );

    if (!nodes) return { amount: 0, details: {} };

    // Build tree and get all descendants of userId
    const descendants = getDescendants(userId, nodes);
    
    // Sum investment from all descendants
    let totalNetworkInvestment = 0;
    for (const descendant of descendants) {
      const memberships = await base44.entities.Membership.filter(
        { user_id: descendant, status: 'active', tenant_id: tenantId },
        '-created_date',
        1
      );
      if (memberships && memberships.length > 0) {
        totalNetworkInvestment += memberships[0].amount;
      }
    }

    const bonus = totalNetworkInvestment * 0.02; // 2% of total network

    return {
      amount: bonus,
      details: {
        formula: 'total_network_investment * 0.02',
        networkInvestment: totalNetworkInvestment,
        descendants: descendants.length,
      },
    };
  } catch (error) {
    return { amount: 0, details: { error: error.message } };
  }
}

async function calculateDirectBonus(userId, period, tenantId) {
  try {
    // Count direct referrals
    const directs = await base44.entities.NetworkNode.filter(
      { upline_id: userId, tenant_id: tenantId },
      '-created_date',
      1000
    );

    const directCount = directs ? directs.length : 0;
    const bonus = directCount * 50; // $50 per direct

    return {
      amount: bonus,
      details: {
        formula: 'direct_count * 50',
        directCount,
      },
    };
  } catch (error) {
    return { amount: 0, details: { error: error.message } };
  }
}

/**
 * Helper: Recursively get subtree investment
 */
async function getSubtreeInvestment(userId, tenantId) {
  if (!userId) return 0;

  // Get membership
  const memberships = await base44.entities.Membership.filter(
    { user_id: userId, status: 'active', tenant_id: tenantId },
    '-created_date',
    1
  );

  let total = 0;
  if (memberships && memberships.length > 0) {
    total = memberships[0].amount;
  }

  // Get children and recurse
  const nodes = await base44.entities.NetworkNode.filter(
    { upline_id: userId, tenant_id: tenantId },
    '-created_date',
    2
  );

  if (nodes) {
    for (const node of nodes) {
      total += await getSubtreeInvestment(node.user_id, tenantId);
    }
  }

  return total;
}

/**
 * Helper: Get all descendants
 */
function getDescendants(userId, allNodes) {
  const descendants = [];
  const visited = new Set();

  function traverse(currentUserId) {
    if (visited.has(currentUserId)) return;
    visited.add(currentUserId);

    const children = allNodes.filter(n => n.upline_id === currentUserId);
    for (const child of children) {
      descendants.push(child.user_id);
      traverse(child.user_id);
    }
  }

  traverse(userId);
  return descendants;
}

/**
 * Approve pending commissions and post to ledger
 */
export async function approvePendingCommissions(userId, period, tenantId = 'default') {
  try {
    const commissions = await base44.entities.Commission.filter(
      { user_id: userId, period, status: 'pending', tenant_id: tenantId },
      '-created_date',
      1000
    );

    if (!commissions || commissions.length === 0) {
      return { success: true, approved: 0, message: 'No pending commissions' };
    }

    let totalApproved = 0;
    const approvedIds = [];

    for (const commission of commissions) {
      // Update commission status
      await base44.entities.Commission.update(commission.id, {
        status: 'approved',
      });

      // Create ledger entry
      const ledger = await base44.entities.Ledger.create({
        user_id: userId,
        type: 'credit',
        category: 'commission',
        amount: commission.amount,
        currency: 'USD',
        reference_id: commission.id,
        reference_type: 'commission',
        description: `Commission - ${commission.type} (${period})`,
        tenant_id: tenantId,
      });

      // Link commission to ledger
      await base44.entities.Commission.update(commission.id, {
        ledger_entry_id: ledger.id,
      });

      totalApproved += commission.amount;
      approvedIds.push(commission.id);
    }

    return {
      success: true,
      approved: commissions.length,
      totalAmount: totalApproved,
      approvedIds,
    };
  } catch (error) {
    return { error: error.message, code: 'APPROVAL_ERROR' };
  }
}