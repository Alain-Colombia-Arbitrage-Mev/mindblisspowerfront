/**
 * BINARY TREE BUILDER ENGINE — PHASE B
 *
 * Consumes: getValidatedBinaryTree(rootUserId)
 * Produces: a fully linked recursive tree structure rooted at the given user.
 *
 * Each tree node shape (Phase 3):
 * {
 *   user_id, full_name, binary_side, generation_depth,
 *   left_child,      ← TreeNode | null
 *   right_child,     ← TreeNode | null
 *   children_array,  ← [left_child, right_child].filter(Boolean)
 *   ...member fields (email, rank, status, investment_amount, …)
 * }
 *
 * Public API:
 *   buildBinaryTree(rootUserId, rootMemberData)
 *     → { treeRoot, isValid, log, stats }
 *
 *   getBinaryTree(rootUserId, rootMemberData)
 *     → cached result of buildBinaryTree
 */

import { getValidatedBinaryTree } from './canonicalBinaryDataset.js';

// ─── PHASE B TREE NODE FACTORY ───────────────────────────────────────────────

/**
 * Wraps a raw member object into a tree node (Phase 3).
 * left_child / right_child / children_array are set AFTER construction
 * during the linking pass (Phase 6).
 */
function makeTreeNode(member) {
  return {
    // Phase 3 — required structural fields
    user_id:          member.user_id,
    full_name:        member.full_name,
    binary_side:      member.binary_side,
    generation_depth: member.generation_depth,
    left_child:       null,   // Phase 9 default
    right_child:      null,   // Phase 9 default
    children_array:   [],     // Phase 6 — populated after linking

    // Passthrough member data (needed by renderer/drawer)
    name:              member.full_name,
    email:             member.email,
    phone:             member.phone,
    country:           member.country,
    country_name:      member.country_name,
    rank:              member.rank,
    membership_plan:   member.membership_plan,
    investment_amount: member.investment_amount,
    amount:            member.investment_amount,
    status:            member.status,
    activity_level:    member.activity_level,
    join_date:         member.join_date,
    upline_id:         member.upline_id,
    _local_side:       member._local_side,
  };
}

// ─── CORE BUILDER ────────────────────────────────────────────────────────────

/**
 * Phase 8 — BFS-based tree construction.
 *
 * Strategy:
 *   1. Convert every validated flat member into a TreeNode.
 *   2. Create a virtual root TreeNode for the logged-in user.
 *   3. BFS from root: for each node, find its children in the dataset
 *      and attach them as left_child / right_child per _local_side.
 *   4. Populate children_array = [left_child, right_child].filter(Boolean)
 *
 * This guarantees:
 *   - Phase 7: depth ordering (BFS is inherently level-order)
 *   - Phase 5: left/right subtrees never cross
 *   - Phase 10: each user_id appears exactly once (tracked via seenSet)
 *   - Phase 9: missing children stay null — no fake nodes
 */
function constructTree(rootUserId, rootMemberData, dataset) {
  const nodeRegistry = new Map();  // user_id → TreeNode (Phase 10: uniqueness)
  const errors       = [];

  // ── Step 1: materialise all flat members as TreeNodes ──────────────────────
  for (const m of dataset.members) {
    if (nodeRegistry.has(m.user_id)) {
      errors.push(`DUPLICATE in tree construction: ${m.user_id}`);
      continue;  // Phase 10: skip duplicates
    }
    nodeRegistry.set(m.user_id, makeTreeNode(m));
  }

  // ── Step 2: virtual root (current user — generation_depth 0) ──────────────
  const rootNode = {
    user_id:          rootUserId,
    full_name:        rootMemberData.full_name || rootMemberData.name || 'Embajador Corona',
    binary_side:      'root',
    generation_depth: 0,
    left_child:       null,
    right_child:      null,
    children_array:   [],
    name:             rootMemberData.full_name || rootMemberData.name || 'Embajador Corona',
    email:            rootMemberData.email || '',
    phone:            rootMemberData.phone || '',
    country:          rootMemberData.country || 'CO',
    country_name:     rootMemberData.country_name || 'Colombia',
    rank:             rootMemberData.rank || 'Embajador',
    membership_plan:  rootMemberData.membership_plan || 'Elite',
    investment_amount:rootMemberData.investment_amount || rootMemberData.investment || 25000,
    amount:           rootMemberData.investment_amount || rootMemberData.investment || 25000,
    status:           rootMemberData.status || 'activo',
    activity_level:   'high',
    join_date:        rootMemberData.join_date || '2022-01-01',
    upline_id:        null,
    _local_side:      'root',
  };

  // ── Step 3: BFS linking pass (Phases 6, 7, 8) ─────────────────────────────
  const queue  = [rootNode];
  const linked = new Set([rootUserId]);  // Phase 10: track visited nodes

  while (queue.length > 0) {
    const current = queue.shift();

    // Get children from the dataset's childMap
    const rawChildren = dataset.getChildren(current.user_id);

    for (const child of rawChildren) {
      // Phase 10: skip if already linked into tree
      if (linked.has(child.user_id)) {
        errors.push(`ALREADY LINKED: ${child.user_id} attempted second attachment under ${current.user_id}`);
        continue;
      }

      const childNode = nodeRegistry.get(child.user_id);
      if (!childNode) {
        errors.push(`REGISTRY MISS: ${child.user_id} not found in nodeRegistry`);
        continue;
      }

      // Phase 5 + 6: attach by _local_side (left/right within this parent)
      const side = child._local_side;
      if (side === 'left') {
        if (current.left_child !== null) {
          errors.push(`LEFT SLOT COLLISION on ${current.user_id} — attempted to attach ${child.user_id}`);
        } else {
          current.left_child = childNode;
        }
      } else if (side === 'right') {
        if (current.right_child !== null) {
          errors.push(`RIGHT SLOT COLLISION on ${current.user_id} — attempted to attach ${child.user_id}`);
        } else {
          current.right_child = childNode;
        }
      } else {
        // Fallback: depth-1 root children use binary_side directly
        if (child.binary_side === 'left' && current.left_child === null) {
          current.left_child = childNode;
        } else if (child.binary_side === 'right' && current.right_child === null) {
          current.right_child = childNode;
        }
      }

      linked.add(child.user_id);
      queue.push(childNode);
    }

    // Phase 6 — populate children_array after both slots resolved
    current.children_array = [current.left_child, current.right_child].filter(Boolean);
  }

  return { rootNode, nodeRegistry, linked, errors };
}

// ─── TREE VALIDATOR (Phase 12) ───────────────────────────────────────────────

function validateTree(rootNode, expectedLeftCount, expectedRightCount, nodeRegistry, linked) {
  const errors = [];

  // Phase 12 — root exists
  if (!rootNode) {
    errors.push('TREE ROOT is null');
    return { treeIsValid: false, errors };
  }

  // Phase 12 — count left/right subtrees via BFS
  let leftCount  = 0;
  let rightCount = 0;
  const seen     = new Set();
  const q        = [rootNode];

  while (q.length > 0) {
    const node = q.shift();
    if (seen.has(node.user_id)) {
      errors.push(`CYCLE/DUPLICATE in tree BFS: ${node.user_id}`);
      continue;
    }
    seen.add(node.user_id);

    if (node.binary_side === 'left')  leftCount++;
    if (node.binary_side === 'right') rightCount++;

    if (node.left_child)  q.push(node.left_child);
    if (node.right_child) q.push(node.right_child);

    // Phase 12 — children_array consistency
    const expectedCA = [node.left_child, node.right_child].filter(Boolean);
    if (node.children_array.length !== expectedCA.length) {
      errors.push(`CHILDREN_ARRAY mismatch on ${node.user_id}: got ${node.children_array.length}, expected ${expectedCA.length}`);
    }
  }

  // Phase 12 — left/right counts
  if (leftCount !== expectedLeftCount) {
    errors.push(`TREE LEFT COUNT: expected ${expectedLeftCount}, got ${leftCount}`);
  }
  if (rightCount !== expectedRightCount) {
    errors.push(`TREE RIGHT COUNT: expected ${expectedRightCount}, got ${rightCount}`);
  }

  // Phase 12 — no orphans (every member must be in the traversed set)
  for (const [uid] of nodeRegistry) {
    if (!seen.has(uid)) {
      errors.push(`ORPHAN in tree: ${uid} was built but never linked`);
    }
  }

  const treeIsValid = errors.length === 0;
  return { treeIsValid, errors, leftCount, rightCount };
}

// ─── PHASE 13 FAILSAFE ───────────────────────────────────────────────────────

/**
 * Phase 13 — if tree validation fails, return a null root with error log.
 * Never pass a broken structure to the UI.
 */
function failsafeResult(errors, log) {
  return {
    treeRoot:  null,
    isValid:   false,
    log: {
      ...log,
      treeErrors: errors,
      verdict:    `✗ TREE BUILD FAILED — ${errors.length} error(s)`,
    },
    stats: null,
  };
}

// ─── SINGLETON CACHE ─────────────────────────────────────────────────────────

const _treeCache = {};

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

/**
 * buildBinaryTree(rootUserId, rootMemberData)
 *
 * Phases 1–13 compliant.
 * Returns:
 * {
 *   treeRoot,   ← fully linked recursive TreeNode | null (Phase 11)
 *   isValid,    ← boolean (Phase 12)
 *   log,        ← full audit trail
 *   stats: {
 *     totalNodes, leftCount, rightCount, maxDepth, activeCount
 *   }
 * }
 */
export function buildBinaryTree(rootUserId, rootMemberData = {}) {
  // Phase 1 — only source allowed
  const { dataset, isValid: dataIsValid, log } = getValidatedBinaryTree(rootUserId);

  // Phase 13 — data must be valid before tree construction
  if (!dataIsValid) {
    return failsafeResult([`Dataset validation failed: ${log.verdict}`], log);
  }

  // Phase 4 + 8 — construct tree via BFS
  const { rootNode, nodeRegistry, linked, errors: constructErrors } = constructTree(
    rootUserId,
    rootMemberData,
    dataset
  );

  // Phase 12 — validate the constructed tree
  const { treeIsValid, errors: validErrors, leftCount, rightCount } = validateTree(
    rootNode,
    dataset.leftCount,
    dataset.rightCount,
    nodeRegistry,
    linked
  );

  const allErrors = [...constructErrors, ...validErrors];

  // Phase 13 — failsafe if tree is broken
  if (!treeIsValid || allErrors.length > 0) {
    return failsafeResult(allErrors, log);
  }

  // Phase 11 — compute stats
  let maxDepth    = 0;
  let activeCount = 0;
  for (const [, node] of nodeRegistry) {
    if (node.generation_depth > maxDepth) maxDepth = node.generation_depth;
    if (node.status === 'activo') activeCount++;
  }

  return {
    treeRoot: rootNode,
    isValid:  true,
    log: {
      ...log,
      treeErrors:  [],
      leftCount,
      rightCount,
      verdict: `✓ Tree built: ${nodeRegistry.size + 1} nodes | ${leftCount}L | ${rightCount}R | 0 errors`,
    },
    stats: {
      totalNodes:  nodeRegistry.size + 1,  // +1 for root
      leftCount,
      rightCount,
      maxDepth,
      activeCount,
    },
  };
}

/**
 * getBinaryTree — cached wrapper for buildBinaryTree.
 * Use this in components to avoid rebuilding on every render.
 */
export function getBinaryTree(rootUserId, rootMemberData = {}) {
  if (!_treeCache[rootUserId]) {
    _treeCache[rootUserId] = buildBinaryTree(rootUserId, rootMemberData);
  }
  return _treeCache[rootUserId];
}

/**
 * clearTreeCache — call when dataset changes or user switches.
 */
export function clearTreeCache(rootUserId) {
  if (rootUserId) delete _treeCache[rootUserId];
  else Object.keys(_treeCache).forEach(k => delete _treeCache[k]);
}

export default buildBinaryTree;