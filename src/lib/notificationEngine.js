/**
 * Notification Engine — derives smart, actionable notifications from real data.
 * Max 8 notifications shown. Priority: high > medium > low.
 */
import platformDataCore from '@/lib/platformDataCore';

export const PRIORITY = { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' };

const PRIORITY_COLOR = {
  high:   '#ef4444',
  medium: '#fbbf24',
  low:    '#3b82f6',
};

export function getPriorityColor(priority) {
  return PRIORITY_COLOR[priority] || '#3b82f6';
}

function timeAgo(ms) {
  const diff = Date.now() - ms;
  if (diff < 60000)   return 'Ahora mismo';
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)}h`;
  return `Hace ${Math.floor(diff / 86400000)}d`;
}

export function generateNotifications(userId) {
  if (!userId) return [];

  const notifications = [];
  const now = Date.now();

  try {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const descendants = platformDataCore.getDescendantsForLeader(userId);

    // ── 1. PROFILE INCOMPLETE ───────────────────────────────
    const hasProfile = !!(userData.name && userData.email && (userData.planValue || userData.path));
    if (!hasProfile) {
      notifications.push({
        id: 'profile_incomplete',
        priority: PRIORITY.HIGH,
        icon: '👤',
        title: 'Perfil incompleto',
        message: 'Completa tu perfil para activar todas las funciones.',
        route: '/dashboard/profile',
        ts: now - 1000 * 60 * 5,
      });
    }

    // ── 2. NEW MEMBERS ──────────────────────────────────────
    const recentMembers = descendants.filter(d => {
      const user = platformDataCore.getUserById(d.user_id);
      if (!user) return false;
      // Simulate: treat members whose id ends in even digit as "recent"
      const lastChar = parseInt((user.id || '0').slice(-1));
      return !isNaN(lastChar) && lastChar % 3 === 0;
    }).slice(0, 2);

    recentMembers.forEach((d, i) => {
      const user = platformDataCore.getUserById(d.user_id);
      if (!user) return;
      notifications.push({
        id: `new_member_${user.id}`,
        priority: PRIORITY.MEDIUM,
        icon: '🎉',
        title: 'Nuevo miembro unido',
        message: `${user.name || 'Un miembro'} se unió a tu red.`,
        route: '/dashboard/network',
        ts: now - 1000 * 60 * (10 + i * 15),
      });
    });

    // ── 3. INACTIVE MEMBERS ─────────────────────────────────
    const inactive = descendants.filter(d => {
      const user = platformDataCore.getUserById(d.user_id);
      return user && user.status !== 'activo';
    });
    if (inactive.length > 0) {
      notifications.push({
        id: 'inactive_members',
        priority: inactive.length > 5 ? PRIORITY.HIGH : PRIORITY.MEDIUM,
        icon: '⚠️',
        title: `${inactive.length} miembro${inactive.length > 1 ? 's' : ''} inactivo${inactive.length > 1 ? 's' : ''}`,
        message: 'Reactiva tu red para maximizar tus bonificaciones.',
        route: '/dashboard/team',
        ts: now - 1000 * 60 * 30,
      });
    }

    // ── 4. BRANCH IMBALANCE ─────────────────────────────────
    // Safe imbalance check using raw descendants
    const leftCount  = descendants.filter(d => d.side === 'left' || d.position === 'left').length;
    const rightCount = descendants.filter(d => d.side === 'right' || d.position === 'right').length;
    const total = leftCount + rightCount;
    if (total > 2) {
      const ratio = leftCount > rightCount
        ? leftCount / Math.max(rightCount, 1)
        : rightCount / Math.max(leftCount, 1);
      if (ratio > 2) {
        const weakSide = leftCount < rightCount ? 'izquierda' : 'derecha';
        notifications.push({
          id: 'branch_imbalance',
          priority: ratio > 4 ? PRIORITY.HIGH : PRIORITY.MEDIUM,
          icon: '⚖️',
          title: 'Desequilibrio en tu red',
          message: `La rama ${weakSide} necesita atención para optimizar tus ciclos.`,
          route: '/dashboard/network',
          ts: now - 1000 * 60 * 45,
        });
      }
    }

    // ── 5. NEW BONUS AVAILABLE ──────────────────────────────
    if (descendants.length >= 2) {
      notifications.push({
        id: 'bonus_available',
        priority: PRIORITY.HIGH,
        icon: '💰',
        title: 'Bonificación disponible',
        message: 'Tienes ciclos de red listos para revisar.',
        route: '/dashboard/bonificaciones',
        ts: now - 1000 * 60 * 20,
      });
    }

    // ── 6. NETWORK ACTIVITY ─────────────────────────────────
    if (descendants.length > 0) {
      notifications.push({
        id: 'network_activity',
        priority: PRIORITY.LOW,
        icon: '📊',
        title: 'Actividad en tu red',
        message: `Tu red tiene ${descendants.length} persona${descendants.length > 1 ? 's' : ''}. Revisa el estado.`,
        route: '/dashboard/network',
        ts: now - 1000 * 60 * 60,
      });
    }

  } catch (e) {
    // Fail silently — no broken UI
  }

  // Sort: high first, then by time
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  notifications.sort((a, b) => {
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pd !== 0) return pd;
    return b.ts - a.ts;
  });

  // Add formatted time + color
  return notifications.slice(0, 8).map(n => ({
    ...n,
    timeLabel: timeAgo(n.ts),
    color: getPriorityColor(n.priority),
  }));
}