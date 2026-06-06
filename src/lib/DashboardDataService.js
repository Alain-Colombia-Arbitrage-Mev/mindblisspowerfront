/**
 * DASHBOARD DATA SERVICE
 * Single source of truth for user and admin dashboards
 * Both read from same relational model, no duplication
 */

import unifiedDataEngine from './UnifiedDataEngine';

class DashboardDataService {
  /**
   * Get user profile with all derived metrics — USES UNIFIED AGGREGATION ENGINE
   * Used by both user dashboard and admin detail panels
   */
  getUserProfile(userId) {
    const profile = unifiedDataEngine.aggregationEngine.getLeaderProfile(userId);
    if (!profile) return null;
    const dna = profile;

    return {
      // Identity
      id: dna.id,
      full_name: dna.name,
      email: dna.email,
      country: dna.country,
      role: dna.role,
      rank: dna.rank,
      status: dna.status,

      // Personal investments
      personal_investment: dna.personal_investment,
      personal_plan: dna.personal_memberships?.[0]?.plan_name || 'Sin Plan',
      personal_memberships: dna.personal_memberships,

      // Network (binary structure)
      network_investment: dna.network_investment,
      total_network_members: dna.total_network_members,
      deep_generation: dna.deep_generation,
      direct_referrals: dna.direct_referrals,
      left_count: dna.left_count,
      right_count: dna.right_count,
      left_investment: dna.left_investment,
      right_investment: dna.right_investment,
      balance: dna.balance,

      // Financial
      monthly_income: dna.monthly_income,
      total_investment: dna.total_investment,

      // Metadata
      createdAt: dna.createdAt,
      lastActivity: dna.lastActivity,
    };
  }

  /**
   * Get master account profile (for top showcase)
   */
  getMasterProfile() {
    const masterUser = unifiedDataEngine.integrityModel.users.find(u => u.role === 'leader' && !u.upline_id);
    if (!masterUser) return null;
    return this.getUserProfile(masterUser.id);
  }

  /**
   * Get all leader profiles for admin supervision
   */
  getAllLeaders() {
    const leaders = unifiedDataEngine.integrityModel.users.filter(u => u.role === 'leader');
    return leaders.map(leader => this.getUserProfile(leader.id)).filter(Boolean);
  }

  /**
   * Get network members under a leader
   */
  getLeaderNetwork(leaderId) {
    const nodes = unifiedDataEngine.integrityModel.network_nodes.filter(
      n => n.upline_id === leaderId && n.status === 'activo'
    );
    return nodes.map(node => {
      const user = unifiedDataEngine.integrityModel.users.find(u => u.id === node.user_id);
      return user ? { ...user, binary_side: node.side, generation_depth: node.depth } : null;
    }).filter(Boolean);
  }

  /**
   * Get payment records for a user — FROM INTEGRITY MODEL
   */
  getUserPayments(userId) {
    return unifiedDataEngine.integrityModel.payments?.filter(p => p.user_id === userId) || [];
  }

  /**
   * Get financial summary for a user — LIVE FROM PAYMENTS TABLE
   */
  getUserFinancialSummary(userId) {
    const payments = this.getUserPayments(userId);
    
    const confirmed = payments.filter(p => p.status === 'completado');
    const pending = payments.filter(p => p.status === 'pendiente');
    const overdue = payments.filter(p => p.status === 'vencido');
    const review = payments.filter(p => p.status === 'en_revision');

    return {
      ingresos_confirmados: confirmed.reduce((sum, p) => sum + p.amount, 0),
      pendientes: pending.reduce((sum, p) => sum + p.amount, 0),
      vencidos: overdue.reduce((sum, p) => sum + p.amount, 0),
      en_revision: review.reduce((sum, p) => sum + p.amount, 0),
      pending_count: pending.length,
      overdue_count: overdue.length,
      review_count: review.length,
      total_records: payments.length,
    };
  }

  /**
   * Get member DNA for detail panels (shared by user and admin) — UNIFIED AGGREGATION
   */
  getMemberDNA(userId) {
    return unifiedDataEngine.aggregationEngine.getLeaderProfile(userId);
  }

  /**
   * Get commission events for a leader (monthly income source)
   */
  getLeaderCommissions(leaderId) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return unifiedDataEngine.integrityModel.commission_ledger.filter(e =>
      e.leader_id === leaderId &&
      new Date(e.event_date) >= thisMonth &&
      e.status === 'completado'
    );
  }

  /**
   * Get alerts for a user (admin supervision)
   */
  getUserAlerts(userId) {
    return unifiedDataEngine.integrityModel.alerts?.filter(a => a.user_id === userId) || [];
  }

  /**
   * Validate data consistency using unified aggregation engine
   */
  validateSync() {
    return unifiedDataEngine.aggregationEngine.validateGlobal();
  }
}

const dashboardDataService = new DashboardDataService();
export default dashboardDataService;