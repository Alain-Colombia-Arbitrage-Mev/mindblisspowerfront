/**
 * BINARY INSERTION ENGINE
 * Phases 1–10: Safe, progressive binary network insertion
 *
 * RULES:
 * - Never bulk insert
 * - Never modify the root (corona@vicion.com / master-root-001)
 * - BFS to find next available slot
 * - Small delay between insertions
 * - Full data integrity checks
 * - Recalculate after every insertion
 */

import platformDataCore from './platformDataCore';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ROOT_ID = 'master-root-001';
const INSERT_DELAY_MS = 120; // small delay between queued insertions
const MAX_RETRY = 3;

// ─── PHASE 3 — BREADTH-FIRST SEARCH for next available slot ─────────────────
function bfsNextSlot(sponsorId) {
  const visited = new Set();
  const queue = [sponsorId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = platformDataCore.network_nodes.find(n => n.user_id === currentId);
    if (!node) continue;

    // Find children of this node
    const children = platformDataCore.network_nodes.filter(n => n.upline_id === currentId);
    const leftChild  = children.find(n => n.binary_side === 'left');
    const rightChild = children.find(n => n.binary_side === 'right');

    if (!leftChild)  return { parentId: currentId, side: 'left' };
    if (!rightChild) return { parentId: currentId, side: 'right' };

    // Both slots filled — push children for next BFS level
    if (leftChild)  queue.push(leftChild.user_id);
    if (rightChild) queue.push(rightChild.user_id);
  }

  return null; // tree is full (should not happen in practice)
}

// ─── PHASE 6 — DATA INTEGRITY CHECKS ────────────────────────────────────────
function integrityCheck(userId) {
  // No duplicate user_id in network_nodes
  const existing = platformDataCore.network_nodes.filter(n => n.user_id === userId);
  if (existing.length > 0) {
    throw new Error(`DUPLICATE_NODE: user_id ${userId} already exists in network`);
  }

  // User must exist in users list
  const user = platformDataCore.getUserById(userId);
  if (!user) {
    throw new Error(`ORPHAN_NODE: user_id ${userId} not found in users list`);
  }
}

// ─── PHASE 7 — ROOT PROTECTION ───────────────────────────────────────────────
function assertNotRoot(userId) {
  if (userId === ROOT_ID) {
    throw new Error('ROOT_PROTECTED: Cannot modify Embajador Corona root node');
  }
}

// ─── PHASE 9 — RECALCULATE TOTALS after insertion ────────────────────────────
function recalculateTotals(rootId) {
  const calc = (nodeId) => {
    const children = platformDataCore.network_nodes.filter(n => n.upline_id === nodeId);
    let left = 0, right = 0;
    children.forEach(child => {
      const memberships = platformDataCore.getMembershipsForUser(child.user_id);
      const investment = memberships.reduce((s, m) => s + (m.amount || 0), 0);
      const childCalc = calc(child.user_id);
      if (child.binary_side === 'left') {
        left += investment + childCalc.left + childCalc.right;
      } else {
        right += investment + childCalc.left + childCalc.right;
      }
    });
    return { left, right, total: left + right };
  };

  const result = calc(rootId);

  // Update leader profile if present
  const leader = platformDataCore.leaders.find(l => l.id === rootId);
  if (leader) {
    const members = platformDataCore.getDescendantsForLeader(rootId);
    leader.total_descendants = members.length;
    leader.network_investment = result.total;
    const directChildren = platformDataCore.network_nodes.filter(n => n.upline_id === rootId);
    leader.left_count  = directChildren.filter(n => n.binary_side === 'left').length;
    leader.right_count = directChildren.filter(n => n.binary_side === 'right').length;
  }

  return result;
}

// ─── PHASE 4+5+10 — CORE INSERTION (with delay + retry) ─────────────────────
async function insertOneMember({ userId, sponsorId, investment = 1000, name, email, phone, country = 'CO' }, attempt = 1) {
  return new Promise(async (resolve, reject) => {
    // PHASE 5 — delay to prevent overload
    await new Promise(r => setTimeout(r, INSERT_DELAY_MS * attempt));

    try {
      // PHASE 7 — root protection
      assertNotRoot(userId);

      // PHASE 6 — integrity checks
      integrityCheck(userId);

      // Resolve effective sponsor (default to root if sponsor not given)
      const effectiveSponsor = sponsorId || ROOT_ID;

      // PHASE 2 — find slot: direct children first, then BFS
      const slot = bfsNextSlot(effectiveSponsor);
      if (!slot) {
        throw new Error(`NO_SLOT: Could not find insertion slot under ${effectiveSponsor}`);
      }

      // Calculate depth
      const parentNode = platformDataCore.network_nodes.find(n => n.user_id === slot.parentId);
      const depth = parentNode ? (parentNode.depth || 0) + 1 : 1;

      // Register user if not already in users list
      if (!platformDataCore.getUserById(userId)) {
        platformDataCore.users.push({
          id: userId,
          name: name || `Member ${userId}`,
          email: email || `${userId}@vicion.app`,
          phone: phone || '+00 000 000 0000',
          country,
          role: 'inversor',
          rank: 'Principiante',
          rank_icon: '🌱',
          status: 'activo',
          created_at: new Date().toISOString(),
        });
      }

      // Register membership
      const existingMembership = platformDataCore.memberships.find(m => m.user_id === userId);
      if (!existingMembership) {
        platformDataCore.memberships.push({
          id: `membership-${userId}`,
          user_id: userId,
          plan: 'Basic',
          amount: investment,
          status: 'activo',
          activation_date: new Date().toISOString(),
          expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Insert network node
      const newNode = {
        id: `node-${userId}`,
        user_id: userId,
        upline_id: slot.parentId,
        binary_side: slot.side,
        depth,
        investment,
        status: 'activo',
        created_at: new Date().toISOString(),
      };
      platformDataCore.network_nodes.push(newNode);

      // PHASE 9 — recalculate from sponsor up to root
      recalculateTotals(effectiveSponsor);
      recalculateTotals(ROOT_ID);

      // Apply ranks
      platformDataCore.applyCalculatedRanks();

      // Activity log
      platformDataCore.activity_log.push({
        id: `ins-${userId}-${Date.now()}`,
        type: 'network_insertion',
        description: `${name || userId} inserted under ${slot.parentId} (${slot.side}) at depth ${depth}`,
        timestamp: new Date().toISOString(),
      });

      resolve({ success: true, userId, parentId: slot.parentId, side: slot.side, depth });
    } catch (err) {
      // PHASE 10 — failsafe retry
      if (attempt < MAX_RETRY) {
        console.warn(`[BinaryInsertionEngine] Retry ${attempt}/${MAX_RETRY} for ${userId}: ${err.message}`);
        resolve(await insertOneMember({ userId, sponsorId, investment, name, email, phone, country }, attempt + 1));
      } else {
        console.error(`[BinaryInsertionEngine] FAILED after ${MAX_RETRY} attempts for ${userId}: ${err.message}`);
        reject({ success: false, userId, error: err.message });
      }
    }
  });
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Insert a single member into the binary network.
 * @param {Object} memberData - { userId, sponsorId, investment, name, email, phone, country }
 * @returns {Promise<{ success, userId, parentId, side, depth }>}
 */
export async function insertMember(memberData) {
  return insertOneMember(memberData);
}

/**
 * Insert multiple members ONE BY ONE with controlled delay.
 * Reports progress via onProgress(result, index, total).
 * @param {Array} members - array of member data objects
 * @param {Function} onProgress - optional progress callback
 * @returns {Promise<Array>} - array of results
 */
export async function insertMembersSequentially(members, onProgress) {
  const results = [];
  for (let i = 0; i < members.length; i++) {
    const result = await insertOneMember(members[i]).catch(err => err);
    results.push(result);
    if (onProgress) onProgress(result, i, members.length);
    // PHASE 5 — inter-insertion delay
    await new Promise(r => setTimeout(r, INSERT_DELAY_MS));
  }
  return results;
}

/**
 * Get the next available slot for a sponsor (read-only, no insertion).
 */
export function getNextAvailableSlot(sponsorId) {
  return bfsNextSlot(sponsorId || ROOT_ID);
}

/**
 * Validate network integrity (no orphans, no duplicates).
 * Returns { valid: boolean, issues: string[] }
 */
export function validateNetworkIntegrity() {
  const issues = [];
  const nodeIds = new Set();

  platformDataCore.network_nodes.forEach(node => {
    // Duplicate check
    if (nodeIds.has(node.user_id)) {
      issues.push(`DUPLICATE: ${node.user_id}`);
    }
    nodeIds.add(node.user_id);

    // Orphan check (upline must exist, except root)
    if (node.upline_id && node.user_id !== ROOT_ID) {
      const uplineExists = platformDataCore.network_nodes.some(n => n.user_id === node.upline_id);
      if (!uplineExists) {
        issues.push(`ORPHAN: ${node.user_id} has missing upline ${node.upline_id}`);
      }
    }

    // User must exist
    if (!platformDataCore.getUserById(node.user_id)) {
      issues.push(`MISSING_USER: node ${node.user_id} has no user record`);
    }
  });

  return { valid: issues.length === 0, issues };
}

/**
 * Recalculate full network from root (call after any external change).
 */
export function recalculateFromRoot() {
  return recalculateTotals(ROOT_ID);
}

export default {
  insertMember,
  insertMembersSequentially,
  getNextAvailableSlot,
  validateNetworkIntegrity,
  recalculateFromRoot,
};