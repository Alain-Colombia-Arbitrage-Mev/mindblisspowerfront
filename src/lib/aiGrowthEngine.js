/**
 * AI GROWTH RECOMMENDATION ENGINE
 * Analyzes network data and generates prioritized, actionable recommendations.
 * Read-only — never mutates any data.
 */

import platformDataCore from './platformDataCore';

// ─── PRIORITY CONFIG ────────────────────────────────────────────────────────
const PRIORITY = {
  high:   { label: 'Alta',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   dot: '#ef4444' },
  medium: { label: 'Media', color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.25)',  dot: '#fb923c' },
  low:    { label: 'Baja',  color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)',   dot: '#3b82f6' },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getSideMembers(userId) {
  const nodes = platformDataCore.network_nodes;
  const direct = nodes.filter(n => n.upline_id === userId);
  const leftRoot  = direct.find(n => n.binary_side === 'left');
  const rightRoot = direct.find(n => n.binary_side === 'right');

  function count(id) {
    if (!id) return 0;
    const kids = nodes.filter(n => n.upline_id === id);
    return kids.reduce((s, k) => s + 1 + count(k.user_id), 0);
  }

  const leftCount  = leftRoot  ? 1 + count(leftRoot.user_id)  : 0;
  const rightCount = rightRoot ? 1 + count(rightRoot.user_id) : 0;
  return { leftCount, rightCount, leftRoot, rightRoot };
}

function getInactiveNodes(userId) {
  const descendants = platformDataCore.getDescendantsForLeader(userId);
  return descendants.filter(d => {
    const user = platformDataCore.getUserById(d.user_id);
    return user?.status !== 'activo';
  });
}

function getEmptySlots(userId, max = 4) {
  const nodes = platformDataCore.network_nodes;
  const slots = [];
  const visited = new Set();
  const queue = [userId];

  while (queue.length && slots.length < max) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    const kids = nodes.filter(n => n.upline_id === cur);
    const left  = kids.find(n => n.binary_side === 'left');
    const right = kids.find(n => n.binary_side === 'right');
    const parentName = platformDataCore.getUserById(cur)?.name?.split(' ')[0] || 'tu red';
    if (!left)  slots.push({ parentId: cur, side: 'left',  parentName });
    else        queue.push(left.user_id);
    if (!right && slots.length < max) slots.push({ parentId: cur, side: 'right', parentName });
    else if (right) queue.push(right.user_id);
  }
  return slots;
}

function getMaxDepth(userId) {
  const nodes = platformDataCore.network_nodes;
  function depth(id) {
    const kids = nodes.filter(n => n.upline_id === id);
    if (!kids.length) return 0;
    return 1 + Math.max(...kids.map(k => depth(k.user_id)));
  }
  return depth(userId);
}

// ─── MAIN ANALYSIS ───────────────────────────────────────────────────────────
export function analyzeGrowth(userId) {
  if (!userId) return { recommendations: [], snapshot: {} };

  const { leftCount, rightCount } = getSideMembers(userId);
  const total    = leftCount + rightCount;
  const diff     = Math.abs(leftCount - rightCount);
  const weakSide = leftCount <= rightCount ? 'left' : 'right';
  const weakLabel = weakSide === 'left' ? 'izquierdo' : 'derecho';
  const imbalanceRatio = total > 0 ? diff / total : 0;

  const inactiveNodes  = getInactiveNodes(userId);
  const emptySlots     = getEmptySlots(userId, 4);
  const networkDepth   = getMaxDepth(userId);
  const descendants    = platformDataCore.getDescendantsForLeader(userId);
  const totalMembers   = descendants.length;
  const activeMembers  = totalMembers - inactiveNodes.length;
  const activityRate   = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;

  // ── GENERATE RECOMMENDATIONS ──────────────────────────────────────────────
  const recs = [];

  // 1. Balance imbalance
  if (imbalanceRatio > 0.4) {
    recs.push({
      id: 'balance-critical',
      priority: 'high',
      icon: '⚖️',
      title: `Equilibra tu estructura`,
      detail: `Tu lado ${weakLabel} tiene ${diff} miembros menos. Cada ciclo perdido = ingresos no generados.`,
      action: 'Expandir',
      actionRoute: '/dashboard/network',
      tag: 'Crítico',
      side: weakSide,
    });
  } else if (imbalanceRatio > 0.15) {
    recs.push({
      id: 'balance-moderate',
      priority: 'medium',
      icon: '📊',
      title: `Refuerza lado ${weakLabel}`,
      detail: `Diferencia de ${diff} miembros. Invita 1–2 personas al lado ${weakLabel} para mejorar tus ciclos.`,
      action: 'Invitar',
      actionRoute: '/dashboard/communications',
      tag: 'Recomendado',
      side: weakSide,
    });
  }

  // 2. Inactive members
  if (inactiveNodes.length > 0) {
    const pct = Math.round((inactiveNodes.length / Math.max(totalMembers, 1)) * 100);
    recs.push({
      id: 'inactive',
      priority: inactiveNodes.length > 5 ? 'high' : 'medium',
      icon: '💤',
      title: `Activa ${inactiveNodes.length} miembro${inactiveNodes.length !== 1 ? 's' : ''} inactivo${inactiveNodes.length !== 1 ? 's' : ''}`,
      detail: `${pct}% de tu red está inactiva. Reactivar estos nodos puede multiplicar tu volumen de red.`,
      action: 'Contactar',
      actionRoute: '/dashboard/team',
      tag: inactiveNodes.length > 5 ? 'Urgente' : 'Importante',
    });
  }

  // 3. Empty slots / depth expansion
  if (emptySlots.length > 0) {
    recs.push({
      id: 'empty-slots',
      priority: total < 5 ? 'high' : 'low',
      icon: '🌱',
      title: `Invita en nivel inferior`,
      detail: `Hay ${emptySlots.length} posiciones libres en tu estructura. Llenarlas activa nuevos ciclos binarios.`,
      action: 'Invitar',
      actionRoute: '/dashboard/communications',
      tag: 'Crecimiento',
      slots: emptySlots.slice(0, 2),
    });
  }

  // 4. Depth growth
  if (networkDepth < 3 && totalMembers > 2) {
    recs.push({
      id: 'depth',
      priority: 'medium',
      icon: '📈',
      title: `Expande en profundidad`,
      detail: `Tu red tiene solo ${networkDepth} nivel${networkDepth !== 1 ? 'es' : ''}. Activar niveles más profundos genera más ciclos.`,
      action: 'Expandir',
      actionRoute: '/dashboard/network',
      tag: 'Potencial',
    });
  }

  // 5. Good standing
  if (activityRate >= 90 && imbalanceRatio < 0.15) {
    recs.push({
      id: 'maintain',
      priority: 'low',
      icon: '✅',
      title: `Red en excelente forma`,
      detail: `${activityRate}% de actividad y estructura balanceada. Continúa invitando para maximizar ingresos.`,
      action: 'Expandir',
      actionRoute: '/dashboard/network',
      tag: 'Óptimo',
    });
  }

  // Sort by priority weight
  const weight = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => weight[a.priority] - weight[b.priority]);

  const snapshot = {
    totalMembers, activeMembers, activityRate,
    leftCount, rightCount, diff, imbalanceRatio,
    inactiveCount: inactiveNodes.length,
    emptySlots: emptySlots.length,
    networkDepth,
    weakSide,
  };

  return { recommendations: recs.slice(0, 5), snapshot, PRIORITY };
}

export { PRIORITY };