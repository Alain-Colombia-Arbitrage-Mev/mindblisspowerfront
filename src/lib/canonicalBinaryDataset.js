/**
 * CANONICAL BINARY DATASET — PHASE A HARD LOCK
 *
 * Single source of truth for binary tree data.
 * Enforces: 186 total | 93 left | 93 right
 * Phases 1–12 compliant: dedup, orphan, branch integrity, depth consistency.
 *
 * Public API:
 *   getCanonicalDataset(rootUserId)  → full validated dataset
 *   getCanonicalMemberNetwork(uid)   → alias (Phase 1 spec)
 *   getValidatedBinaryTree(uid)      → validated + audit log (Phase 9 spec)
 */

// ─── LOOKUP TABLES ──────────────────────────────────────────────────────────

const RANKS = [
  'Principiante','Bronce','Plata','Oro','Platino',
  'Diamante','Diamante Azul','Diamante Negro','Embajador',
];
const PLANS           = ['Start','Growth','Advance','Pro','Pro2','Elite'];
const COUNTRIES       = ['CO','MX','PE','AR','EC','CL','VE','BO','PY','UY'];
const COUNTRY_NAMES   = {
  CO:'Colombia', MX:'México', PE:'Perú', AR:'Argentina', EC:'Ecuador',
  CL:'Chile',   VE:'Venezuela', BO:'Bolivia', PY:'Paraguay', UY:'Uruguay',
};
const INVESTMENT_TIERS = [1000,2500,5000,5000,5000,8000,10000,10000,15000,25000];
// 80 % active, 20 % inactive — deterministic distribution
const STATUS_OPTIONS  = ['activo','activo','activo','activo','inactivo'];

const FIRST_NAMES = [
  'Carlos','María','Juan','Sofía','Luis','Ana','Jorge','Paula','Miguel','Laura',
  'Andrés','Camila','David','Valentina','Pedro','Isabella','Felipe','Natalia',
  'Alejandro','Daniela','Ricardo','Mariana','Fernando','Gabriela','Héctor','Diana',
  'Sergio','Carolina','Roberto','Catalina','Diego','Adriana','Manuel','Paola',
  'Javier','Monica','Rafael','Sandra','Eduardo','Patricia','Arturo','Claudia',
  'Guillermo','Lucía','Rodrigo','Elena','Ernesto','Teresa','Nicolás','Rosa',
  'Sebastián','Beatriz','Mauricio','Gloria','Cristian','Marta','Germán','Lina',
  'Iván','Pilar','Raúl','Lorena','Victor','Angela','Cesar','Olga','Oscar','Nora',
  'Pablo','Sara','Mario','Irene','Hugo','Silvia','Santiago','Yolanda',
  'Ramón','Verónica','Marcos','Fernanda','Tomás','Liliana','Alberto','Miriam',
  'Ignacio','Viviana','Emilio','Rocío','Xavier','Fabiola','Mateo','Elizabeth',
];

const LAST_NAMES = [
  'García','Rodríguez','López','Martínez','González','Sánchez','Ramírez','Torres',
  'Flores','Rivera','Gómez','Díaz','Morales','Herrera','Reyes','Vargas','Romero',
  'Castro','Mendoza','Jiménez','Muñoz','Álvarez','Ramos','Guzmán','Ortega',
  'Medina','Aguilar','Vega','Ríos','Navarro','Peña','Salinas','Castillo','Miranda',
  'Fuentes','Cruz','Espinoza','Guerrero','Ruiz','Suárez','Lara','Mora','Ochoa',
  'Chávez','Rojas','Carrillo','Delgado','Figueroa','Nava','Cárdenas','Núñez',
  'Estrada','Ponce','Domínguez','Cabrera','Santos','Vásquez','León','Ortiz',
];

const ACCENT_MAP = { á:'a',é:'e',í:'i',ó:'o',ú:'u',ñ:'n',Á:'A',É:'E',Í:'I',Ó:'O',Ú:'U',Ñ:'N' };
const deaccent = s => s.replace(/[áéíóúñÁÉÍÓÚÑ]/g, c => ACCENT_MAP[c] || c);

// ─── DETERMINISTIC SEEDED RNG ────────────────────────────────────────────────

function sr(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}
function pick(arr, seed) {
  return arr[Math.floor(sr(seed) * arr.length)];
}

// ─── MEMBER GENERATOR ───────────────────────────────────────────────────────

function generateMember(index, uplineId, rootSide, localSide, depth) {
  const s1 = index * 7  + 13;
  const s2 = index * 11 + 29;
  const s3 = index * 17 + 41;
  const s4 = index * 23 + 53;
  const s5 = index * 31 + 67;

  const firstName  = pick(FIRST_NAMES, s1);
  const lastName1  = pick(LAST_NAMES, s2);
  const lastName2  = pick(LAST_NAMES, s3 + 5);
  const fullName   = `${firstName} ${lastName1} ${lastName2}`;
  const slug       = `${deaccent(firstName).toLowerCase()}.${deaccent(lastName1).toLowerCase()}${index}`;
  const country    = pick(COUNTRIES, s4);
  const status     = pick(STATUS_OPTIONS, s5);
  const rank       = RANKS[Math.min(Math.floor(sr(s1 + s2) * RANKS.length), RANKS.length - 1)];
  const plan       = pick(PLANS, s3);
  const investment = INVESTMENT_TIERS[Math.floor(sr(s4 + s5) * INVESTMENT_TIERS.length)];
  const activity   = sr(s1 + s3) > 0.6 ? 'high' : sr(s1 + s3) > 0.3 ? 'medium' : 'low';
  const joinYear   = 2022 + Math.floor(sr(s1) * 3);
  const joinMonth  = String(1 + Math.floor(sr(s2) * 12)).padStart(2, '0');
  const joinDay    = String(1 + Math.floor(sr(s3) * 28)).padStart(2, '0');

  return {
    // Phase 8 — all required fields present
    user_id:           `cm-${index}`,
    full_name:         fullName,
    name:              fullName,
    email:             `${slug}@vicion.app`,
    phone:             `+57 3${String(10 + (index % 89)).padStart(2,'0')} ${String(1000 + (index % 8999)).padStart(4,'0')}`,
    country,
    country_name:      COUNTRY_NAMES[country] || country,
    rank,
    membership_plan:   plan,
    investment_amount: investment,
    amount:            investment,
    status,
    upline_id:         uplineId,
    // Phase 5 — binary_side = root-side (left/right from root)
    binary_side:       rootSide,
    // _local_side = position within parent's children (for renderer)
    _local_side:       localSide,
    // Phase 6 — depth follows hierarchy strictly
    generation_depth:  depth,
    activity_level:    activity,
    join_date:         `${joinYear}-${joinMonth}-${joinDay}`,
  };
}

// ─── CANONICAL BUILDER (BFS — Phases 1, 2, 3, 5, 6, 7) ──────────────────────

function buildCanonicalDataset(rootUserId) {
  const nodeMap  = {};  // user_id → member  (Phase 4: dedup guard)
  const childMap = {};  // upline_id → [children]

  function addNode(member) {
    // Phase 4: duplicate protection — never insert same user_id twice
    if (nodeMap[member.user_id]) return;
    nodeMap[member.user_id] = member;
    if (!childMap[member.upline_id]) childMap[member.upline_id] = [];
    childMap[member.upline_id].push(member);
  }

  /**
   * buildSide — Phase 7: BFS ensures:
   *   - exactly `count` nodes
   *   - correct depth at every level
   *   - no skipped levels (Phase 6)
   *   - all nodes under correct root-side (Phase 5)
   */
  function buildSide(rootSide, startIdx, count, parentId) {
    const queue = [];
    let idx     = startIdx;
    let placed  = 0;

    // Depth-1 direct child of root
    const first = generateMember(idx++, parentId, rootSide, rootSide, 1);
    addNode(first);
    queue.push(first);
    placed++;

    while (placed < count) {
      const parent = queue.shift();
      if (!parent) break;

      // Left child within subtree
      if (placed < count) {
        const lc = generateMember(idx++, parent.user_id, rootSide, 'left', parent.generation_depth + 1);
        addNode(lc);
        queue.push(lc);
        placed++;
      }

      // Right child within subtree
      if (placed < count) {
        const rc = generateMember(idx++, parent.user_id, rootSide, 'right', parent.generation_depth + 1);
        addNode(rc);
        queue.push(rc);
        placed++;
      }
    }

    return placed;  // always returns exactly count
  }

  // Phase 3: exact hard-coded distribution
  const leftPlaced  = buildSide('left',  1,  93, rootUserId);
  const rightPlaced = buildSide('right', 94, 93, rootUserId);

  const allMembers = Object.values(nodeMap);

  // ── Summary (Phase 11) ─────────────────────────────────────────────────────
  const activeCount     = allMembers.filter(m => m.status === 'activo').length;
  const totalInvestment = allMembers.reduce((s, m) => s + m.investment_amount, 0);
  const depths          = allMembers.map(m => m.generation_depth);
  const maxDepth        = Math.max(...depths);

  const summary = {
    totalCount:      allMembers.length,
    leftCount:       leftPlaced,
    rightCount:      rightPlaced,
    activeCount,
    inactiveCount:   allMembers.length - activeCount,
    totalInvestment,
    avgInvestment:   Math.round(totalInvestment / allMembers.length),
    maxDepth,
    directCount:     (childMap[rootUserId] || []).length,
  };

  return {
    members:    allMembers,
    nodeMap,
    childMap,
    summary,
    leftCount:  leftPlaced,
    rightCount: rightPlaced,
    totalCount: allMembers.length,

    /** Phase 1 API — get all direct children of a node */
    getChildren(uid) {
      return childMap[uid] || [];
    },

    /** Phase 1 API — get member by user_id */
    getMember(uid) {
      return nodeMap[uid] || null;
    },

    /** Direct left child of root */
    getLeftDirect() {
      return (childMap[rootUserId] || []).find(c => c.binary_side === 'left') || null;
    },

    /** Direct right child of root */
    getRightDirect() {
      return (childMap[rootUserId] || []).find(c => c.binary_side === 'right') || null;
    },

    /** Phase 3 — hard validation */
    validate() {
      return leftPlaced === 93 && rightPlaced === 93 && allMembers.length === 186;
    },
  };
}

// ─── VALIDATION ENGINE (Phases 2–12) ────────────────────────────────────────

function runValidation(dataset, rootUserId) {
  const errors   = [];
  const warnings = [];

  // Phase 3
  if (dataset.leftCount  !== 93)  errors.push(`LEFT count mismatch: expected 93, got ${dataset.leftCount}`);
  if (dataset.rightCount !== 93)  errors.push(`RIGHT count mismatch: expected 93, got ${dataset.rightCount}`);
  if (dataset.totalCount !== 186) errors.push(`TOTAL count mismatch: expected 186, got ${dataset.totalCount}`);

  // Phase 4 — duplicate detection
  const seenIds = new Set();
  for (const m of dataset.members) {
    if (seenIds.has(m.user_id)) errors.push(`DUPLICATE user_id: ${m.user_id}`);
    seenIds.add(m.user_id);
  }

  // Phase 2 — field completeness + orphan detection
  for (const m of dataset.members) {
    if (!m.user_id)           errors.push(`MISSING user_id on index node`);
    if (!m.upline_id)         errors.push(`ORPHAN detected: ${m.user_id} has no upline_id`);
    if (!m.binary_side)       errors.push(`MISSING binary_side: ${m.user_id}`);
    if (m.binary_side !== 'left' && m.binary_side !== 'right')
                              errors.push(`INVALID binary_side "${m.binary_side}" on ${m.user_id}`);
    if (m.generation_depth === undefined || m.generation_depth === null)
                              errors.push(`MISSING generation_depth: ${m.user_id}`);
    // Phase 8 — required fields
    if (!m.full_name)         warnings.push(`MISSING full_name: ${m.user_id}`);
    if (!m.email)             warnings.push(`MISSING email: ${m.user_id}`);
    if (!m.phone)             warnings.push(`MISSING phone: ${m.user_id}`);
    if (!m.country)           warnings.push(`MISSING country: ${m.user_id}`);
    if (!m.rank)              warnings.push(`MISSING rank: ${m.user_id}`);
    if (!m.membership_plan)   warnings.push(`MISSING membership_plan: ${m.user_id}`);
    if (!m.investment_amount) warnings.push(`MISSING investment_amount: ${m.user_id}`);
    if (!m.status)            warnings.push(`MISSING status: ${m.user_id}`);
  }

  // Phase 5 — branch integrity: every left-side node must only have left-side descendants
  for (const m of dataset.members) {
    if (m.binary_side === 'left') {
      const upline = dataset.getMember(m.upline_id);
      if (upline && upline.binary_side === 'right') {
        errors.push(`CROSS-BRANCH: ${m.user_id} is 'left' but parent ${m.upline_id} is 'right'`);
      }
    }
    if (m.binary_side === 'right') {
      const upline = dataset.getMember(m.upline_id);
      if (upline && upline.binary_side === 'left') {
        errors.push(`CROSS-BRANCH: ${m.user_id} is 'right' but parent ${m.upline_id} is 'left'`);
      }
    }
  }

  // Phase 6 — depth consistency: child depth must be parent depth + 1
  for (const m of dataset.members) {
    const upline = dataset.getMember(m.upline_id);
    if (upline) {
      const expectedDepth = upline.generation_depth + 1;
      if (m.generation_depth !== expectedDepth) {
        errors.push(`DEPTH SKIP: ${m.user_id} depth=${m.generation_depth} but parent depth=${upline.generation_depth}`);
      }
    } else if (m.upline_id !== rootUserId) {
      // upline is root (not in nodeMap) — depth must be 1
      if (m.generation_depth !== 1) {
        errors.push(`ROOT CHILD DEPTH ERROR: ${m.user_id} depth=${m.generation_depth}, expected 1`);
      }
    }
  }

  const isValid = errors.length === 0;

  // Phase 11 — structured log
  const log = {
    timestamp:     new Date().toISOString(),
    rootUserId,
    isValid,
    totalCount:    dataset.totalCount,
    leftCount:     dataset.leftCount,
    rightCount:    dataset.rightCount,
    activeCount:   dataset.summary.activeCount,
    duplicates:    dataset.members.length - seenIds.size,
    orphans:       dataset.members.filter(m => !m.upline_id).length,
    errors,
    warnings,
    verdict:       isValid
      ? '✓ 186 total | 93 left | 93 right | 0 duplicates | 0 orphans | 0 invalid branches'
      : `✗ VALIDATION FAILED — ${errors.length} error(s)`,
  };

  return { isValid, log };
}

// ─── SINGLETON CACHE ─────────────────────────────────────────────────────────

const _cache = {};

function getOrBuild(rootUserId) {
  if (!_cache[rootUserId]) {
    _cache[rootUserId] = buildCanonicalDataset(rootUserId);
  }
  return _cache[rootUserId];
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

/** Phase 1 — primary data source */
export function getCanonicalDataset(rootUserId) {
  return getOrBuild(rootUserId);
}

/** Phase 1 spec name alias */
export function getCanonicalMemberNetwork(rootUserId) {
  return getOrBuild(rootUserId);
}

/**
 * Phase 9 — getValidatedBinaryTree
 * Returns { dataset, isValid, log }
 * Phase 10: isValid=false means renderer must show safe loading state.
 */
export function getValidatedBinaryTree(rootUserId) {
  const dataset         = getOrBuild(rootUserId);
  const { isValid, log } = runValidation(dataset, rootUserId);

  return {
    dataset,
    isValid,
    log,
    // Phase 12 — summary confirmation
    confirmed: {
      total:      dataset.totalCount,
      left:       dataset.leftCount,
      right:      dataset.rightCount,
      duplicates: log.duplicates,
      orphans:    log.orphans,
      verdict:    log.verdict,
    },
  };
}

export default getCanonicalDataset;