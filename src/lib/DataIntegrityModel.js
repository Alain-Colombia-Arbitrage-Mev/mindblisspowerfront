/**
 * DATA INTEGRITY MODEL — STRICT RELATIONAL SCHEMA
 * Every visible value is mathematically derived from linked records
 * NO random placeholders, NO contradictions, NO disconnected fields
 */

export const INTEGRITY_RULES = {
  RULE_1: 'Every active participant must own a valid membership plan',
  RULE_2: 'Every network member must belong to exactly one binary side (left/right)',
  RULE_3: 'direct_referrals <= total_network_members',
  RULE_4: 'deep_generation = total_network_members',
  RULE_5: 'left_count + right_count = deep_generation',
  RULE_6: 'If members > 0, then left_count + right_count > 0',
  RULE_7: 'If personal_membership exists, personal_investment > 0',
  RULE_8: 'If network_members > 0, network_investment > 0',
  RULE_9: 'monthly_income derived from commission_ledger, not random',
  RULE_10: 'If commission_events exist this month, monthly_income > 0',
};

export const VALID_PLANS = {
  Start: 500,
  Growth: 1000,
  Advance: 2500,
  Pro_5k: 5000,
  Pro_10k: 10000,
  Elite: 25000,
};

export const VALID_PLAN_VALUES = Object.values(VALID_PLANS);

export const DURATION_TYPES = {
  short: 30,    // days
  medium: 60,
  long: 90,
};

export const USER_LIFECYCLE_STATES = [
  'new',
  'active',
  'renewing',
  'pending',
  'expired',
  'reinvested',
];

export const PAYMENT_STATES = [
  'completado',
  'pendiente',
  'vencido',
];

export const MEMBER_STATUSES = [
  'activo',
  'pasivo',
  'pendiente',
  'vencido',
  'inactivo',
];

// RELATIONAL SCHEMA
class DataIntegrityModel {
  constructor() {
    // Core entities
    this.users = [];                    // {id, name, email, country, role, rank, status, ...}
    this.memberships = [];              // {id, user_id, plan_name, plan_value, status, start_date, end_date, ...}
    this.network_nodes = [];            // {id, user_id, upline_id, side, depth, status}
    this.binary_placement = [];         // {id, user_id, parent_id, side, position}
    this.commission_ledger = [];        // {id, leader_id, source_member_id, event_type, amount, date, ...}
    this.payments = [];                 // {id, user_id, membership_id, amount, date, status}
    this.activity_log = [];             // {id, user_id, action, timestamp}
    this.alerts = [];                   // {id, user_id, severity, message, created_at}
  }

  // ─── USER CREATION ───
  createUser(data) {
    const user = {
      id: data.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      country: data.country || 'CO',
      role: data.role || 'inversor',         // inversor, líder, admin
      rank: data.rank || 'Principiante',
      status: data.status || 'activo',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    };
    this.users.push(user);
    return user;
  }

  // ─── MEMBERSHIP CREATION ───
  createMembership(userId, planName, durationDays = 60) {
    const planValue = VALID_PLANS[planName];
    if (!planValue) throw new Error(`Invalid plan: ${planName}`);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const membership = {
      id: `mem-${userId}-${Date.now()}`,
      user_id: userId,
      plan_name: planName,
      plan_value: planValue,
      status: 'activo',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      duration_days: durationDays,
      is_reinvestment: false,
      payment_status: 'completado',
      created_at: startDate.toISOString(),
    };
    this.memberships.push(membership);
    return membership;
  }

  // ─── NETWORK NODE CREATION ───
  createNetworkNode(userId, uplineId, side, depth = 0) {
    if (!['left', 'right'].includes(side)) {
      throw new Error(`Invalid side: ${side}. Must be 'left' or 'right'`);
    }

    const node = {
      id: `node-${userId}-${Date.now()}`,
      user_id: userId,
      upline_id: uplineId,
      side: side,           // left or right
      depth: depth,
      status: 'activo',
      created_at: new Date().toISOString(),
    };
    this.network_nodes.push(node);
    return node;
  }

  // ─── COMMISSION EVENT CREATION ───
  createCommissionEvent(leaderId, sourceMemberId, sourcePlanValue, eventType) {
    const commissionRates = {
      direct_referral_bonus: 0.15,      // 15% of plan value
      binary_bonus: 0.10,
      leadership_bonus: 0.05,
      renewal_bonus: 0.08,
    };

    const rate = commissionRates[eventType] || 0.10;
    const amount = Math.round(sourcePlanValue * rate);

    const event = {
      id: `comm-${leaderId}-${Date.now()}`,
      leader_id: leaderId,
      source_member_id: sourceMemberId,
      source_plan_value: sourcePlanValue,
      event_type: eventType,
      event_amount: amount,
      event_date: new Date().toISOString(),
      status: 'completado',
    };
    this.commission_ledger.push(event);
    return event;
  }

  // ─── COMPUTED AGGREGATIONS ───

  getUserPersonalInvestment(userId) {
    const memberships = this.memberships.filter(m => m.user_id === userId && m.status === 'activo');
    return memberships.reduce((sum, m) => sum + m.plan_value, 0);
  }

  getNetworkMembers(leaderId) {
    // RECURSIVE: Get all descendants, not just immediate children
    const direct = this.network_nodes.filter(node => node.upline_id === leaderId && node.status === 'activo');
    let allDescendants = [...direct];
    
    direct.forEach(member => {
      const subDescendants = this.getNetworkMembers(member.user_id);
      allDescendants = allDescendants.concat(subDescendants);
    });
    
    return allDescendants;
  }

  getNetworkInvestment(leaderId) {
    const members = this.getNetworkMembers(leaderId);
    let total = 0;
    members.forEach(member => {
      const memberMemberships = this.memberships.filter(m => m.user_id === member.user_id && m.status === 'activo');
      total += memberMemberships.reduce((sum, m) => sum + m.plan_value, 0);
    });
    return total;
  }

  getBinarySideInvestment(leaderId, side) {
    const members = this.network_nodes.filter(node => node.upline_id === leaderId && node.side === side && node.status === 'activo');
    let total = 0;
    members.forEach(member => {
      const memberMemberships = this.memberships.filter(m => m.user_id === member.user_id && m.status === 'activo');
      total += memberMemberships.reduce((sum, m) => sum + m.plan_value, 0);
    });
    return total;
  }

  getDirectReferrals(leaderId) {
    // Direct referrals are immediate children (depth === 1 from root)
    return this.network_nodes.filter(node => node.upline_id === leaderId);
  }

  getDeepGeneration(leaderId) {
    // RECURSIVE: All descendants at any depth
    return this.getNetworkMembers(leaderId).length;
  }

  getSideCounts(leaderId) {
    const nodes = this.getNetworkMembers(leaderId);
    return {
      left: nodes.filter(n => n.side === 'left').length,
      right: nodes.filter(n => n.side === 'right').length,
      total: nodes.length,
    };
  }

  getMonthlyIncome(leaderId) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const events = this.commission_ledger.filter(e => 
      e.leader_id === leaderId && 
      new Date(e.event_date) >= thisMonth &&
      e.status === 'completado'
    );
    
    return events.reduce((sum, e) => sum + e.event_amount, 0);
  }

  // ─── FULL DNA MODEL ───
  getUserDNA(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;

    const personalInvestment = this.getUserPersonalInvestment(userId);
    const isLeader = user.role === 'leader';
    const networkMembers = isLeader ? this.getNetworkMembers(userId) : [];
    const networkInvestment = isLeader ? this.getNetworkInvestment(userId) : 0;
    const sides = isLeader ? this.getSideCounts(userId) : { left: 0, right: 0, total: 0 };
    const leftInvestment = isLeader ? this.getBinarySideInvestment(userId, 'left') : 0;
    const rightInvestment = isLeader ? this.getBinarySideInvestment(userId, 'right') : 0;
    const monthlyIncome = isLeader ? this.getMonthlyIncome(userId) : 0;

    return {
      // Identity
      id: user.id,
      name: user.name,
      email: user.email,
      country: user.country,
      role: user.role,
      rank: user.rank,
      status: user.status,
      
      // Personal
      personal_investment: personalInvestment,
      personal_memberships: this.memberships.filter(m => m.user_id === userId),
      
      // Network (if leader)
      network_investment: networkInvestment,
      total_network_members: sides.total,
      direct_referrals: isLeader ? this.getDirectReferrals(userId).length : 0,
      deep_generation: sides.total,
      
      // Binary structure
      left_count: sides.left,
      right_count: sides.right,
      left_investment: leftInvestment,
      right_investment: rightInvestment,
      balance: sides.total > 0 ? Math.round((sides.left / sides.total) * 100) : 50,
      
      // Financial
      total_investment: personalInvestment + networkInvestment,
      monthly_income: monthlyIncome,
      
      // Metadata
      createdAt: user.createdAt,
      lastActivity: user.lastActivity,
    };
  }
}

export default DataIntegrityModel;