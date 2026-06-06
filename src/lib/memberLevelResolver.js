/**
 * MEMBER LEVEL RESOLVER
 * Detects member type and enables correct experience
 * Independent from admin system
 */

import platformDataCore from './platformDataCore';

export function resolveMemberLevel(userId) {
  const user = platformDataCore.users.find(u => u.id === userId);
  if (!user) return null;

  const memberships = (platformDataCore.memberships || []).filter(m => m.user_id === userId);
  const networkNodes = (platformDataCore.network_nodes || []).filter(n => n.upline_id === userId);
  const descendants = getAllDescendants(userId);

  const hasPlan = memberships.length > 0;
  const hasNetwork = networkNodes.length > 0;
  const isRoot = userId === 'master-root-001';

  // Level A: Buyer only
  if (hasPlan && !hasNetwork && !isRoot) {
    return {
      level: 'A',
      name: 'Participante',
      description: 'Plan activo sin red',
      features: ['products', 'plan', 'benefits', 'onboarding', 'invite'],
      canViewNetwork: false,
      canViewBonuses: false,
      canViewRank: true,
    };
  }

  // Level B: Network starter
  if (hasPlan && hasNetwork && descendants.length < 10 && !isRoot) {
    return {
      level: 'B',
      name: 'Constructor',
      description: 'Red en crecimiento',
      features: ['network', 'referrals', 'products', 'bonuses', 'rank', 'activity'],
      canViewNetwork: true,
      canViewBonuses: true,
      canViewRank: true,
      isLeader: false,
    };
  }

  // Level C: Leader
  if (descendants.length >= 10 && descendants.length < 50 && !isRoot) {
    return {
      level: 'C',
      name: 'Líder',
      description: 'Red activa en desarrollo',
      features: ['network', 'referrals', 'products', 'bonuses', 'rank', 'activity', 'team'],
      canViewNetwork: true,
      canViewBonuses: true,
      canViewRank: true,
      isLeader: true,
      canAccessLeaderTools: true,
    };
  }

  // Level D: High-rank leader
  if (descendants.length >= 50 || isRoot) {
    return {
      level: 'D',
      name: 'Ejecutivo',
      description: 'Red expandida',
      features: ['network', 'referrals', 'products', 'bonuses', 'rank', 'activity', 'team', 'leadership', 'reporting'],
      canViewNetwork: true,
      canViewBonuses: true,
      canViewRank: true,
      isLeader: true,
      canAccessLeaderTools: true,
      canAccessExpanded: true,
    };
  }

  return {
    level: 'A',
    name: 'Participante',
    canViewNetwork: false,
    canViewBonuses: false,
  };
}

function getAllDescendants(userId, visited = new Set()) {
  if (visited.has(userId)) return [];
  visited.add(userId);

  const networkNodes = platformDataCore.network_nodes || [];
  const directChildren = networkNodes.filter(n => n.upline_id === userId);

  let allDescendants = [];

  directChildren.forEach(child => {
    const childUser = platformDataCore.users.find(u => u.id === child.user_id);
    if (childUser) {
      allDescendants.push(childUser);
      allDescendants = allDescendants.concat(getAllDescendants(child.user_id, visited));
    }
  });

  return allDescendants;
}

export default { resolveMemberLevel };