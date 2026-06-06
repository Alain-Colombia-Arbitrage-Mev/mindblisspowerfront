import { getWarRoomLeaderDNA, getWarRoomChildren, getAllDescendants } from '@/lib/warRoomDataAdapter';
import platformDataCore from '@/lib/platformDataCore';

/**
 * CANONICAL MEMBER NETWORK SUMMARY
 * Single source of truth for member network detection
 * Used by: MemberHome, MemberNetwork, and all related components
 */
export function getMemberNetworkSummary(userId) {
  if (!userId) return null;

  // Get real data from adapters
  const dna = getWarRoomLeaderDNA(userId);
  const children = getWarRoomChildren(userId);
  const networkNodes = platformDataCore.network_nodes || [];
  const users = platformDataCore.users || [];
  
  // Calculate descendants
  const descendants = getAllDescendants(userId, networkNodes, users);
  
  // Count left/right
  const leftCount = descendants.filter(d => {
    const node = networkNodes.find(n => n.user_id === d.id && n.upline_id === userId);
    return node?.leg === 'left';
  }).length;
  
  const rightCount = descendants.filter(d => {
    const node = networkNodes.find(n => n.user_id === d.id && n.upline_id === userId);
    return node?.leg === 'right';
  }).length;

  return {
    user_id: userId,
    red_activa: dna?.red_activa || 0,
    direct_children_count: children.length,
    descendants_count: descendants.length,
    left_count: leftCount,
    right_count: rightCount,
    direct_referrals: children.length,
    deep_generation: descendants.length,
    personal_investment: dna?.inversion_personal || 0,
    network_investment: dna?.inversion_red || 0,
    monthly_income: dna?.ingresos_mes || 0,
    
    // Derived: canonical network detection
    has_network: (dna?.red_activa || 0) > 0 || children.length > 0 || descendants.length > 0,
    has_direct_children: children.length > 0,
    has_descendants: descendants.length > 0,
  };
}

export default { getMemberNetworkSummary };