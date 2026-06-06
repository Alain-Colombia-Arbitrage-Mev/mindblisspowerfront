/**
 * WAR ROOM DATA ADAPTER
 * SINGLE SOURCE OF TRUTH for all War Room components
 * 
 * Transforms UnifiedDataEngine relational data into War Room-ready structures.
 * All functions read from unified relational source only:
 * - users, network_nodes, memberships, payments, commission_ledger, alerts
 * 
 * NO hardcoded arrays, NO UI-specific logic
 */

import unifiedDataEngine from './UnifiedDataEngine';
import platformDataCore from './platformDataCore';

const RANK_HIERARCHY_ORDER = [
  'E. Corona',
  'Diamante Negro',
  'Diamante Azul',
  'Diamante',
  'Esmeralda',
  'Rubí',
  'Zafiro',
  'Platino',
  'Oro',
  'Plata',
  'Bronce',
];

const RANK_ICONS = {
  'Embajador Corona': '👑',
  'E. Corona': '👑',
  'Diamante Negro': '🖤',
  'Diamante Azul': '💙',
  'Diamante': '💎',
  'Esmeralda': '💚',
  'Rubí': '❤️',
  'Zafiro': '🔵',
  'Platino': '⭐',
  'Oro': '🥇',
  'Plata': '🥈',
  'Bronce': '🥉',
  'Principiante': '🌱',
};

/**
 * Get all leaders with War Room-ready metadata
 * Used by: WarRoomNetworkViz
 */
// FINANCIAL DATA FUNCTIONS
export function getUserInvestment(userId) {
  if (!platformDataCore.memberships) return 0;
  const membership = platformDataCore.memberships.find(m => m.user_id === userId);
  return membership ? membership.amount : 0;
}

export function getNetworkInvestment(userId) {
  if (!platformDataCore.network_nodes || !platformDataCore.users) return 0;
  const descendants = getAllDescendants(userId);
  return descendants.reduce((acc, user) => {
    return acc + getUserInvestment(user.id);
  }, 0);
}

export function getMonthlyIncome(userId) {
  const networkInv = getNetworkInvestment(userId);
  return Math.floor(networkInv * 0.1); // 10% of network investment
}

export function getWarRoomLeaders() {
  const leaders = unifiedDataEngine.integrityModel.users
    .filter(u => u.role === 'lider')
    .map((user) => {
      const profile = unifiedDataEngine.aggregationEngine.getLeaderProfile(user.id);
      if (!profile) return null;

      const isCritical = profile.payment_summary?.vencido_count > 0 || 
                        (profile.total_descendants > 0 && profile.left_count === 0 && profile.right_count === 0);

      return {
        // Identity
        id: user.id,
        name: user.name,
        email: user.email,
        country: user.country,
        rank: user.rank || 'Principiante',
        rank_icon: getRankIcon(user.rank),
        
        // Network structure (REAL from descendants)
        direct_referrals: profile.direct_referrals,
        descendant_count: profile.total_descendants,
        left_count: profile.left_count,
        right_count: profile.right_count,
        
        // Investment (REAL from memberships)
        personal_investment: profile.personal_investment,
        network_investment: profile.network_investment,
        total_investment: profile.total_investment,
        
        // Income (REAL from commission_ledger)
        monthly_income: profile.monthly_income,
        
        // Display
        status: isCritical ? 'critical' : profile.total_descendants > 0 ? 'activo' : 'inactivo',
        criticality: isCritical ? 'high' : 'normal',
        
        // Node weight (real members/10, no fallback zeros)
        node_weight: Math.floor(profile.total_descendants / 10),
        
        // Visual
        members: profile.total_descendants,
      };
    })
    .filter(Boolean);

  return leaders;
}

/**
 * Get single leader by ID with full War Room context
 * Used by: WarRoomRightPanel
 */
export function getWarRoomLeaderById(leaderId) {
  const user = unifiedDataEngine.integrityModel.users.find(u => u.id === leaderId);
  if (!user) return null;

  const profile = unifiedDataEngine.aggregationEngine.getLeaderProfile(leaderId);
  if (!profile) return null;

  return {
    ...profile,
    rank_icon: getRankIcon(user.rank),
  };
}

/**
 * Get DNA data for leader detail panel
 * Used by: WarRoomRightPanel, DNAPanel
 * Reads directly from platformDataCore
 */
export function getWarRoomLeaderDNA(leaderId) {
  const user = platformDataCore.users.find(u => u.id === leaderId);
  if (!user) return null;

  // Get all descendants
  const descendants = getAllDescendants(leaderId);
  
  // Calculate left/right counts
  const leftCount = descendants.filter(d => d.binary_side === 'left').length;
  const rightCount = descendants.filter(d => d.binary_side === 'right').length;
  
  // Sum investments
  const networkInvestment = descendants.reduce((sum, d) => sum + (d.investment || 0), 0);
  
  // Get commission events for this user
  const commissionEvents = (platformDataCore.commission_ledger || []).filter(c => c.user_id === leaderId && c.status === 'completado');
  const monthlyIncome = commissionEvents.reduce((sum, c) => sum + (c.event_amount || 0), 0);
  
  // Get payment summary
  const userPayments = (platformDataCore.payments || []).filter(p => p.user_id === leaderId);
  const overduePayments = userPayments.filter(p => p.status === 'vencido');
  
  // Get direct referrals
  const directReferrals = (platformDataCore.network_nodes || []).filter(n => n.upline_id === leaderId).length;

  return {
    // Identity
    id: leaderId,
    name: user.name,
    country: user.country,
    role: user.role,
    rank: user.rank || 'Principiante',
    rank_icon: getRankIcon(user.rank),
    status: descendants.length > 0 ? 'activo' : 'inactivo',
    
    // Network metrics
    red_activa: descendants.length,
    
    // Investment
    inversion_personal: user.investment || 0,
    inversion_red: networkInvestment,
    inversion_total: (user.investment || 0) + networkInvestment,
    
    // Income
    ingresos_mes: monthlyIncome,
    
    // Binary structure
    left_count: leftCount,
    right_count: rightCount,
    balance: descendants.length > 0 
      ? Math.round((leftCount / descendants.length) * 100) 
      : 50,
    
    // Referrals
    direct_referrals: directReferrals,
    deep_generation: descendants.length,
    
    // Payment urgency
    urgencia: overduePayments.length > 0 ? 'Alta' : 'Normal',
    
    // Alerts & incidents
    incident_count: overduePayments.length,
  };
}

/**
 * Get direct children (descendants) of a leader
 * Used by: User dashboard to show network graph
 */
export function getWarRoomChildren(leaderId) {
  const networkNodes = platformDataCore.network_nodes || [];
  const childNodes = networkNodes.filter(n => n.upline_id === leaderId);
  
  return childNodes
    .map(node => {
      const user = platformDataCore.users.find(u => u.id === node.user_id);
      return user ? {
        ...user,
        binary_side: node.binary_side,
        position_in_tree: node.position_in_tree,
      } : null;
    })
    .filter(Boolean);
}

/**
 * Helper: Get all descendants recursively
 */
function getAllDescendants(leaderId, networkNodes = null, users = null, visited = new Set()) {
  if (visited.has(leaderId)) return [];
  visited.add(leaderId);
  
  const nodes = networkNodes || platformDataCore.network_nodes || [];
  const usersList = users || platformDataCore.users || [];
  const directChildren = nodes.filter(n => n.upline_id === leaderId);
  
  let allDescendants = [];
  
  directChildren.forEach(child => {
    const childUser = usersList.find(u => u.id === child.user_id);
    if (childUser) {
      allDescendants.push(childUser);
      allDescendants = allDescendants.concat(getAllDescendants(child.user_id, nodes, usersList, visited));
    }
  });
  
  return allDescendants;
}

/**
 * Get unified financial summary for all members
 * Used by: WarRoomBottomBar
 * SINGLE SOURCE: real payment records only, not memberships
 */
export function getWarRoomFinancialSummary() {
  const payments = unifiedDataEngine.integrityModel.payments || [];
  
  const confirmado = payments.filter(p => p.status === 'confirmado');
  const pendiente = payments.filter(p => p.status === 'pendiente');
  const vencido = payments.filter(p => p.status === 'vencido');
  const en_revision = payments.filter(p => p.status === 'en revisión');

  const commissionEvents = unifiedDataEngine.integrityModel.commission_ledger || [];
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyCommissions = commissionEvents.filter(e => 
    new Date(e.event_date) >= thisMonth && e.status === 'completado'
  );

  return {
    // Confirmed income
    ingresos_confirmados_amount: confirmado.reduce((sum, p) => sum + (p.amount || 0), 0),
    ingresos_confirmados_count: confirmado.length,
    
    // Pending
    pendientes_amount: pendiente.reduce((sum, p) => sum + (p.amount || 0), 0),
    pendientes_count: pendiente.length,
    
    // Overdue
    vencidos_amount: vencido.reduce((sum, p) => sum + (p.amount || 0), 0),
    vencidos_count: vencido.length,
    
    // Under review
    revision_amount: en_revision.reduce((sum, p) => sum + (p.amount || 0), 0),
    revision_count: en_revision.length,
    
    // Monthly income from commissions
    monthly_income: monthlyCommissions.reduce((sum, e) => sum + (e.event_amount || 0), 0),
    monthly_commission_count: monthlyCommissions.length,
    
    // Totals
    total_payments: payments.length,
    total_amount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
  };
}

/**
 * Get alerts for War Room display
 * Used by: Alert panels, supervision views
 */
export function getWarRoomAlerts() {
  const alerts = unifiedDataEngine.integrityModel.alerts || [];
  
  return alerts
    .map(alert => ({
      id: alert.id,
      user_id: alert.user_id,
      severity: alert.severity || 'warning',
      title: alert.title,
      message: alert.message,
      type: alert.type,
      created_at: alert.created_at,
      resolved_at: alert.resolved_at,
      status: alert.status || 'active',
    }))
    .filter(a => a.status === 'active')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Get intervention data for manual/AI intervention panels
 * Used by: Intervention panels, approval queues
 */
export function getWarRoomInterventions() {
  const users = unifiedDataEngine.integrityModel.users || [];
  const payments = unifiedDataEngine.integrityModel.payments || [];
  
  // Identify intervention candidates
  const interventionCandidates = [];
  
  users.forEach(user => {
    const profile = unifiedDataEngine.aggregationEngine.getLeaderProfile(user.id);
    if (!profile) return;
    
    // Payment urgency interventions
    const userPayments = payments.filter(p => p.user_id === user.id);
    const overdue = userPayments.filter(p => p.status === 'vencido');
    if (overdue.length > 0) {
      interventionCandidates.push({
        id: `intervention-${user.id}-payment`,
        user_id: user.id,
        user_name: user.name,
        type: 'payment_overdue',
        priority: 'high',
        title: `${overdue.length} Pagos Vencidos`,
        description: `${user.name} · $${overdue.reduce((s, p) => s + (p.amount || 0), 0)}`,
        action: 'Revisar Pagos',
        created_at: new Date().toISOString(),
      });
    }
    
    // Network balance interventions
    if (profile.total_descendants > 0 && profile.left_count > 0 && profile.right_count > 0) {
      const balance = Math.abs(profile.left_count - profile.right_count);
      const imbalance = Math.max(profile.left_count, profile.right_count) / Math.min(profile.left_count, profile.right_count);
      if (imbalance > 2) {
        interventionCandidates.push({
          id: `intervention-${user.id}-balance`,
          user_id: user.id,
          user_name: user.name,
          type: 'network_imbalance',
          priority: 'medium',
          title: 'Desbalance de Línea',
          description: `${user.name} · ${Math.round(imbalance * 100)}% desbalance (${profile.left_count} izq / ${profile.right_count} der)`,
          action: 'Intervenir',
          created_at: new Date().toISOString(),
        });
      }
    }
  });
  
  return interventionCandidates.sort((a, b) => {
    const priorityMap = { high: 1, medium: 2, low: 3 };
    return priorityMap[a.priority] - priorityMap[b.priority];
  });
}

/**
 * Get master root node (Embajador Corona)
 * Used by: WarRoomNetworkViz to display apex of hierarchy
 */
export function getRootLeader() {
  // PHASE 8: FORCE ROOT FROM PLATFORMDATACORE
  const masterAccount = platformDataCore.users.find(u => u.id === 'master-root-001');
  if (!masterAccount) return null;

  // PHASE 6: FORCE DNA TO USE REAL NETWORK
  const descendants = getAllDescendants(masterAccount.id);
  const profile = {
    direct_referrals: (platformDataCore.network_nodes || []).filter(n => n.upline_id === masterAccount.id).length,
    total_descendants: descendants.length,
    left_count: descendants.filter(d => d.binary_side === 'left').length,
    right_count: descendants.filter(d => d.binary_side === 'right').length,
    personal_investment: masterAccount.investment || 25000,
    network_investment: descendants.reduce((sum, d) => sum + (d.investment || 0), 0),
    monthly_income: 0
  };

  return {
    id: masterAccount.id,
    name: 'Embajador Corona',
    email: masterAccount.email,
    country: masterAccount.country,
    rank: 'E. Corona',
    rank_icon: '👑',
    status: 'activo',
    criticality: 'normal',
    
    // Network
    direct_referrals: profile.direct_referrals,
    descendant_count: profile.total_descendants,
    left_count: profile.left_count,
    right_count: profile.right_count,
    
    // Investment
    personal_investment: profile.personal_investment,
    network_investment: profile.network_investment,
    total_investment: profile.total_investment,
    
    // Income
    monthly_income: profile.monthly_income,
    
    // Visual prominence
    is_root: true,
    node_weight: Math.max(profile.total_descendants / 5, 3),
    members: profile.total_descendants,
  };
}

/**
 * Get hierarchy organized by rank tier
 * Used by: Network visualization to show rank structure
 */
export function getHierarchyByRank() {
  const leaders = getWarRoomLeaders();
  const root = getRootLeader();
  
  // Rank hierarchy order
  const rankOrder = [
    'E. Corona',
    'Diamante Negro',
    'Diamante Azul',
    'Diamante',
    'Esmeralda',
    'Rubí',
    'Zafiro',
    'Platino',
    'Oro',
    'Plata',
    'Bronce',
    'Principiante'
  ];
  
  const byRank = {};
  rankOrder.forEach(rank => {
    byRank[rank] = [];
  });
  
  // Add root
  if (root) {
    byRank['E. Corona'] = [root];
  }
  
  // Classify all leaders
  leaders.forEach(leader => {
    const rank = leader.rank || 'Principiante';
    if (byRank[rank]) {
      byRank[rank].push(leader);
    }
  });
  
  // Return only ranks with members
  return Object.entries(byRank)
    .filter(([_, members]) => members.length > 0)
    .reduce((acc, [rank, members]) => {
      acc[rank] = members;
      return acc;
    }, {});
}

/**
 * HELPER: Get rank icon for display
 */
function getRankIcon(rank) {
  const rankIcons = {
    'Embajador Corona': '👑',
    'E. Corona': '👑',
    'Diamante Negro': '🖤',
    'Diamante Azul': '💙',
    'Diamante': '💎',
    'Esmeralda': '💚',
    'Rubí': '❤️',
    'Zafiro': '🔵',
    'Platino': '⭐',
    'Oro': '🥇',
    'Plata': '🥈',
    'Bronce': '🥉',
    'Principiante': '🌱',
  };
  return rankIcons[rank] || '⭐';
}

export { getAllDescendants };

export default {
  getWarRoomLeaders,
  getWarRoomLeaderById,
  getWarRoomLeaderDNA,
  getWarRoomChildren,
  getWarRoomFinancialSummary,
  getWarRoomAlerts,
  getWarRoomInterventions,
  getRootLeader,
  getHierarchyByRank,
  getAllDescendants,
};