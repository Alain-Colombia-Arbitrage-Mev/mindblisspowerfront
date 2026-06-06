/**
 * NETWORK EXPANSION INTELLIGENCE ENGINE
 * Analyzes binary network balance and generates actionable recommendations.
 */

import platformDataCore from './platformDataCore';

const ROOT_ID = 'master-root-001';

/**
 * Count members on each side (BFS from userId's direct L/R children)
 */
function countSideMembers(userId) {
  const nodes = platformDataCore.network_nodes;

  const directChildren = nodes.filter(n => n.upline_id === userId);
  const leftRoot  = directChildren.find(n => n.binary_side === 'left');
  const rightRoot = directChildren.find(n => n.binary_side === 'right');

  function countDescendants(nodeId) {
    if (!nodeId) return 0;
    const children = nodes.filter(n => n.upline_id === nodeId);
    return children.reduce((sum, c) => sum + 1 + countDescendants(c.user_id), 0);
  }

  const leftCount  = leftRoot  ? 1 + countDescendants(leftRoot.user_id)  : 0;
  const rightCount = rightRoot ? 1 + countDescendants(rightRoot.user_id) : 0;

  return { leftCount, rightCount, leftRoot, rightRoot };
}

/**
 * Determine balance status based on counts
 */
function getBalanceStatus(leftCount, rightCount) {
  const total = leftCount + rightCount;
  if (total === 0) return 'empty';
  const diff = Math.abs(leftCount - rightCount);
  const ratio = diff / Math.max(total, 1);
  if (ratio < 0.1) return 'balanced';
  if (ratio < 0.3) return 'moderate';
  return 'heavy';
}

/**
 * BFS: find up to N empty slots under a given sponsor
 */
function findEmptySlots(sponsorId, max = 6) {
  const nodes = platformDataCore.network_nodes;
  const slots = [];
  const visited = new Set();
  const queue = [sponsorId];

  while (queue.length > 0 && slots.length < max) {
    const currentId = queue.shift();
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const children = nodes.filter(n => n.upline_id === currentId);
    const leftChild  = children.find(n => n.binary_side === 'left');
    const rightChild = children.find(n => n.binary_side === 'right');

    if (!leftChild)  slots.push({ parentId: currentId, side: 'left',  parentName: getNodeName(currentId) });
    else             queue.push(leftChild.user_id);

    if (!rightChild && slots.length < max) slots.push({ parentId: currentId, side: 'right', parentName: getNodeName(currentId) });
    else if (rightChild) queue.push(rightChild.user_id);
  }

  return slots;
}

function getNodeName(userId) {
  const user = platformDataCore.getUserById(userId);
  return user?.name?.split(' ')[0] || userId;
}

/**
 * Generate human-readable recommendations
 */
function generateRecommendations(leftCount, rightCount, status, weakSide) {
  const recs = [];

  if (status === 'empty') {
    recs.push({ priority: 'critical', icon: '🚀', title: 'Inicia tu red', desc: 'Invita a tu primer contacto para comenzar tu estructura binaria.' });
    return recs;
  }

  if (status === 'balanced') {
    recs.push({ priority: 'success', icon: '✅', title: 'Red balanceada', desc: 'Tu estructura está equilibrada. Continúa creciendo en ambos lados.' });
    recs.push({ priority: 'info', icon: '📈', title: 'Expande en profundidad', desc: 'Activa niveles inferiores para generar más ciclos binarios.' });
    return recs;
  }

  const strongSide = weakSide === 'left' ? 'derecho' : 'izquierdo';
  const weakLabel  = weakSide === 'left' ? 'izquierdo' : 'derecho';
  const diff = Math.abs(leftCount - rightCount);

  if (status === 'moderate') {
    recs.push({ priority: 'warning', icon: '⚠️', title: `Leve desbalance en lado ${weakLabel}`, desc: `Diferencia de ${diff} miembros. Enfoca nuevas invitaciones al lado ${weakLabel}.` });
  } else {
    recs.push({ priority: 'danger', icon: '🔴', title: `Desbalance crítico — lado ${weakLabel}`, desc: `Tu lado ${strongSide} tiene ${diff} miembros más. Actúa ya para no perder ciclos.` });
  }

  recs.push({ priority: 'action', icon: '👥', title: `Invita al lado ${weakLabel}`, desc: 'Comparte tu enlace de referido y especifica el lado donde deben registrarse.' });
  recs.push({ priority: 'info', icon: '🌱', title: 'Activa niveles inferiores', desc: 'Contacta miembros inactivos para reactivar la cadena de crecimiento.' });

  return recs;
}

/**
 * MAIN: analyze expansion for a user
 */
export function analyzeExpansion(userId) {
  const { leftCount, rightCount, leftRoot, rightRoot } = countSideMembers(userId || ROOT_ID);
  const status    = getBalanceStatus(leftCount, rightCount);
  const weakSide  = leftCount <= rightCount ? 'left' : 'right';
  const diff      = Math.abs(leftCount - rightCount);
  const total     = leftCount + rightCount;
  const balancePct = total > 0 ? Math.round(Math.min(leftCount, rightCount) / Math.max(leftCount, rightCount, 1) * 100) : 0;

  // Find empty slots — prioritize weak side
  const weakSponsor = weakSide === 'left' ? (leftRoot?.user_id || userId) : (rightRoot?.user_id || userId);
  const prioritySlots = findEmptySlots(weakSponsor, 3);
  const allSlots      = findEmptySlots(userId, 6);

  const recommendations = generateRecommendations(leftCount, rightCount, status, weakSide);

  // Status config
  const statusConfig = {
    empty:    { color: '#6b7280', label: 'Sin red',          icon: '○' },
    balanced: { color: '#10b981', label: 'Balanceada',       icon: '✓' },
    moderate: { color: '#fb923c', label: 'Leve desbalance',  icon: '⚠' },
    heavy:    { color: '#ef4444', label: 'Desbalance crítico', icon: '●' },
  }[status];

  return {
    leftCount, rightCount, total,
    diff, balancePct, weakSide, status,
    statusConfig, recommendations,
    prioritySlots, allSlots,
    leftRoot, rightRoot,
  };
}

export default { analyzeExpansion };