/**
 * UNIFIED DATA ENGINE — SINGLE SOURCE OF TRUTH
 * Generates coherent, relational data for entire platform
 */

import investmentLogic, { INVESTMENT_PLANS } from './InvestmentLogic';
import behaviorAnalyzer from './BehaviorAnalyzer';
import networkAnalyzer from './NetworkAnalyzer';
import alertEngine from './AlertEngine';
import patternDetector from './PatternDetector';
import DataIntegrityModel from './DataIntegrityModel';
import NetworkValidator from './NetworkValidator';
import seedUnifiedDataEngine from './SeedUnifiedDataEngine';
import UnifiedAggregationEngine from './UnifiedAggregationEngine';
import DataValidationLayer from './DataValidationLayer';
import RenderLockingSystem from './RenderLockingSystem';

class UnifiedDataEngine {
  constructor() {
    this.users = [];
    this.payments = [];
    this.alerts = [];
    this.history = [];
    this.investments = [];
    this.behaviors = {};
    this.networkStats = {};
    this.patterns = {};
    this.integrityModel = new DataIntegrityModel();
    this.validator = new NetworkValidator(this.integrityModel);
    this.dataValidator = new DataValidationLayer(this.integrityModel);
    this.renderLock = new RenderLockingSystem(this.dataValidator);
    // UNIFIED AGGREGATION ENGINE — SINGLE SOURCE OF TRUTH FOR ALL DATA
    this.aggregationEngine = new UnifiedAggregationEngine(this.integrityModel);
    this.initialize();
  }

  initialize() {
    // Seed with foundational dataset
    seedUnifiedDataEngine(this);
    
    // NORMALIZE ROLES: Convert all 'leader' to 'lider' for consistency
    this.integrityModel.users.forEach(user => {
      if (user.role === 'leader') user.role = 'lider';
    });
    
    // ENFORCE GLOBAL DATA CONSISTENCY
    const globalValidation = this.aggregationEngine.validateGlobal();
    if (!globalValidation.valid) {
      console.warn('⚠️  CONSISTENCY VIOLATIONS DETECTED:');
      globalValidation.violations.forEach(v => {
        console.warn(`   ${v.leader_name}: ${v.violations.map(x => x.message).join(', ')}`);
      });
    }
  }

  initializeLegacy() {
    // Generate master user: Roberto Díaz
    this.masterUser = this.createUser({
      id: 'user-001',
      name: 'Roberto Díaz',
      email: 'roberto@mindblisspower.com',
      phone: '+57 300 123 4567',
      country: 'CO',
      role: 'leader',
      rank: 'Platino',
      status: 'activo',
      totalInvestment: 45500,
      monthlyIncome: 8190,
      upline: null,
      referrer: null,
    });

    this.users.push(this.masterUser);

    // Generate binary network under Roberto
    this.generateBinaryNetwork(this.masterUser, 0, {
      left: 0,
      right: 0,
      leftTarget: 87,
      rightTarget: 158,
    });

    // Generate payments for all users
    this.generatePayments();

    // Generate alerts
    this.generateAlerts();

    // Generate history
    this.generateHistory();
  }

  createUser(data) {
    const baseData = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      country: data.country,
      role: data.role || 'inversor',
      rank: data.rank || 'Bronce',
      status: data.status || 'activo',
      totalInvestment: data.totalInvestment || Math.floor(Math.random() * 50000) + 5000,
      monthlyIncome: data.monthlyIncome || 0,
      upline: data.upline,
      referrer: data.referrer,
      leftSide: data.leftSide || [],
      rightSide: data.rightSide || [],
      directReferrals: data.directReferrals || [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      activeMembers: 0,
      inactiveMembers: 0,
    };

    // Calculate network size and income
    baseData.activeMembers = this.countActiveMembers(baseData);
    baseData.monthlyIncome = this.calculateIncome(baseData);

    return baseData;
  }

  generateBinaryNetwork(parent, depth, targets) {
    if (depth > 6) return; // Max depth
    if (targets.left >= targets.leftTarget && targets.right >= targets.rightTarget) return;

    // Add to left side
    if (targets.left < targets.leftTarget) {
      const investmentAmount = this.getRealisticInvestment();
      const leftUser = this.createUser({
        id: `user-${Math.random().toString(36).substr(2, 9)}`,
        name: this.generateName(),
        email: `user-${Math.random().toString(36).substr(2, 5)}@mindblisspower.com`,
        phone: this.generatePhone(),
        country: this.randomCountry(),
        role: depth <= 2 ? 'leader' : 'inversor',
        rank: this.randomRank(),
        status: Math.random() > 0.1 ? 'activo' : 'pendiente',
        totalInvestment: investmentAmount,
        upline: parent.id,
        referrer: parent.id,
        leftSide: [],
        rightSide: [],
        directReferrals: [],
      });
      
      // Create investment
      const inv = investmentLogic.createInvestment(leftUser.id, investmentAmount);
      if (inv) this.investments.push(inv);

      parent.leftSide.push(leftUser.id);
      parent.directReferrals.push(leftUser.id);
      this.users.push(leftUser);
      targets.left++;

      // Recursively build deeper levels
      this.generateBinaryNetwork(leftUser, depth + 1, targets);
    }

    // Add to right side
    if (targets.right < targets.rightTarget) {
      const investmentAmount = this.getRealisticInvestment();
      const rightUser = this.createUser({
        id: `user-${Math.random().toString(36).substr(2, 9)}`,
        name: this.generateName(),
        email: `user-${Math.random().toString(36).substr(2, 5)}@mindblisspower.com`,
        phone: this.generatePhone(),
        country: this.randomCountry(),
        role: depth <= 2 ? 'leader' : 'inversor',
        rank: this.randomRank(),
        status: Math.random() > 0.1 ? 'activo' : 'pendiente',
        totalInvestment: investmentAmount,
        upline: parent.id,
        referrer: parent.id,
        leftSide: [],
        rightSide: [],
        directReferrals: [],
      });
      
      // Create investment
      const inv = investmentLogic.createInvestment(rightUser.id, investmentAmount);
      if (inv) this.investments.push(inv);

      parent.rightSide.push(rightUser.id);
      parent.directReferrals.push(rightUser.id);
      this.users.push(rightUser);
      targets.right++;

      // Recursively build deeper levels
      this.generateBinaryNetwork(rightUser, depth + 1, targets);
    }
  }

  // Analyze and consolidate all data
  /**
   * GET SAFE RENDER VALUES FOR CARDS
   * Enforces data-first rendering: no zero placeholders if source exists
   */
  // VALIDATION: Block impossible states
  validateRenderState(leaderId) {
    const profile = this.aggregationEngine.getLeaderProfile(leaderId);
    if (!profile) return { valid: false, reason: 'NO_PROFILE' };
    
    // Block: members > 0 but investment = 0
    if (profile.total_descendants > 0 && profile.network_investment === 0) {
      console.warn(`⚠️  BLOCK: ${profile.name} has ${profile.total_descendants} members but $0 investment`);
      return { valid: false, reason: 'MEMBERS_NO_INVESTMENT' };
    }
    
    // Block: members > 0 but left = 0 and right = 0
    if (profile.total_descendants > 0 && profile.left_count === 0 && profile.right_count === 0) {
      console.warn(`⚠️  BLOCK: ${profile.name} has ${profile.total_descendants} members but 0 on both sides`);
      return { valid: false, reason: 'MEMBERS_NO_SIDES' };
    }
    
    return { valid: true, profile };
  }

  getSafeLeaderMetrics(leaderId) {
    return this.renderLock.getSafeLeaderCardValues(leaderId, this.integrityModel);
  }

  getSafeFinancialMetrics(paymentRecords) {
    return this.renderLock.getSafeFinancialValues(paymentRecords, paymentRecords?.length || 0);
  }

  validateLeaderRendering(leaderId) {
    return this.dataValidator.validateLeader(leaderId);
  }

  // Get derived values for a leader
  getLeaderMetrics(leaderId) {
    return this.validator.getSafeLeaderSummary(leaderId);
  }

  // Get full DNA for a user — NOW USES UNIFIED AGGREGATION ENGINE
  getUserDNA(userId) {
    const profile = this.aggregationEngine.getLeaderProfile(userId);
    if (!profile) return this.integrityModel.getUserDNA(userId);
    return profile;
  }

  consolidateData() {
    // Analyze behavior for each user
    this.users.forEach(user => {
      const userPayments = this.payments.filter(p => p.userId === user.id);
      const userInvestments = this.investments.filter(inv => inv.userId === user.id);
      const userHistory = this.history.filter(h => h.userId === user.id);

      this.behaviors[user.id] = behaviorAnalyzer.analyzeUser(
        user,
        userInvestments,
        userPayments,
        userHistory
      );

      // Generate user-level alerts
      const userAlerts = alertEngine.generateAlertsForUser(
        user.id,
        user,
        this.investments,
        this.payments,
        this.behaviors[user.id],
        null
      );
      this.alerts.push(...userAlerts);
    });

    // Analyze network for leaders
    this.users.filter(u => u.role === 'leader').forEach(leader => {
      const stats = networkAnalyzer.analyzeNetwork(
        leader,
        this.users,
        this.investments,
        this.payments
      );
      this.networkStats[leader.id] = stats;

      // Generate network-level alerts
      const networkAlerts = alertEngine.generateNetworkAlerts(leader.id, stats);
      this.alerts.push(...networkAlerts);
    });

    // Detect all patterns
    this.patterns = patternDetector.detectAllPatterns(
      this.users,
      this.investments,
      this.payments,
      this.history
    );
  }

  getRealisticInvestment() {
    const plans = Object.values(INVESTMENT_PLANS);
    const plan = plans[Math.floor(Math.random() * plans.length)];
    return plan.min + Math.floor(Math.random() * (plan.max - plan.min));
  }

  generatePayments() {
    this.users.forEach((user, i) => {
      // Create 2-3 payments per user
      const paymentCount = Math.floor(Math.random() * 2) + 2;
      for (let j = 0; j < paymentCount; j++) {
        const amount = user.totalInvestment / 3;
        const days = Math.floor(Math.random() * 60);
        const status = days > 45 ? 'vencido' : days > 25 ? 'pendiente' : 'completado';

        this.payments.push({
          id: `payment-${user.id}-${j}`,
          userId: user.id,
          amount: amount,
          status: status,
          createdAt: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() + (30 - days) * 24 * 60 * 60 * 1000).toISOString(),
          description: `Pago cuota ${j + 1}`,
        });
      }
    });
  }

  generateAlerts() {
    this.users.forEach(user => {
      // Overdue payments
      const overduePayments = this.payments.filter(p => p.userId === user.id && p.status === 'vencido');
      if (overduePayments.length > 0) {
        this.alerts.push({
          id: `alert-${user.id}-payments`,
          userId: user.id,
          type: 'overdue_payment',
          severity: 'critical',
          message: `${overduePayments.length} pagos vencidos`,
          createdAt: new Date().toISOString(),
        });
      }

      // Inactive network
      if (user.inactiveMembers > user.activeMembers * 0.5) {
        this.alerts.push({
          id: `alert-${user.id}-inactive`,
          userId: user.id,
          type: 'inactive_network',
          severity: 'warning',
          message: `Red inactiva: ${user.inactiveMembers}/${user.activeMembers + user.inactiveMembers}`,
          createdAt: new Date().toISOString(),
        });
      }

      // Leader compliance
      if (user.role === 'leader' && Math.random() > 0.7) {
        this.alerts.push({
          id: `alert-${user.id}-compliance`,
          userId: user.id,
          type: 'compliance_violation',
          severity: 'high',
          message: 'Violación detectada en protocolo de comunicación',
          createdAt: new Date().toISOString(),
        });
      }
    });
  }

  generateHistory() {
    this.users.slice(0, 20).forEach(user => {
      for (let i = 0; i < 3; i++) {
        const types = ['payment', 'status_change', 'action', 'alert'];
        this.history.push({
          id: `history-${user.id}-${i}`,
          userId: user.id,
          type: types[Math.floor(Math.random() * types.length)],
          description: `Evento ${i + 1} para ${user.name}`,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    });
  }

  // GETTERS & QUERIES
  getUserById(id) {
    return this.users.find(u => u.id === id);
  }

  getNetwork(userId) {
    const user = this.getUserById(userId);
    return {
      user: user,
      leftSide: user.leftSide.map(id => this.getUserById(id)).filter(Boolean),
      rightSide: user.rightSide.map(id => this.getUserById(id)).filter(Boolean),
      directReferrals: user.directReferrals.map(id => this.getUserById(id)).filter(Boolean),
      allNetworkMembers: this.users.filter(u => u.upline === userId).length,
    };
  }

  getUserPayments(userId) {
    return this.payments.filter(p => p.userId === userId);
  }

  getUserAlerts(userId) {
    return this.alerts.filter(a => a.userId === userId);
  }

  getUserHistory(userId) {
    return this.history.filter(h => h.userId === userId);
  }

  getNetworkStats(userId) {
    const network = this.getNetwork(userId);
    const user = network.user;
    return {
      totalMembers: network.allNetworkMembers,
      leftMembers: network.leftSide.length,
      rightMembers: network.rightSide.length,
      directReferrals: network.directReferrals.length,
      activeMembers: this.countActiveMembers(user),
      totalIncome: user.monthlyIncome,
      pendingPayments: this.payments.filter(p => p.userId === user.id && p.status === 'pendiente').length,
      alertCount: this.getUserAlerts(user.id).length,
    };
  }

  // HELPERS
  countActiveMembers(user) {
    const allMembers = [user, ...this.users.filter(u => u.upline === user.id)];
    return allMembers.filter(u => u.status === 'activo').length;
  }

  calculateIncome(user) {
    if (user.role !== 'leader') return 0;
    const directIncome = user.directReferrals.length * 100;
    const networkIncome = this.users.filter(u => u.upline === user.id && u.status === 'activo').length * 25;
    return directIncome + networkIncome;
  }

  generateName() {
    const names = ['Carlos', 'María', 'Juan', 'Ana', 'Luis', 'Pedro', 'Miguel', 'Rosa', 'Diego', 'Patricia'];
    const surnames = ['López', 'García', 'Rodríguez', 'Martínez', 'Fernández', 'Gómez', 'Torres', 'Silva', 'Ramírez', 'Díaz'];
    return `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
  }

  generatePhone() {
    return `+57 ${Math.floor(Math.random() * 900) + 300} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}`;
  }

  randomCountry() {
    const countries = ['CO', 'BR', 'ES', 'MX', 'AR', 'PE', 'VE', 'EC', 'CL'];
    return countries[Math.floor(Math.random() * countries.length)];
  }

  randomRank() {
    const ranks = ['Bronce', 'Plata', 'Oro', 'Platino', 'Diamante'];
    return ranks[Math.floor(Math.random() * ranks.length)];
  }
}

// SINGLETON INSTANCE
const unifiedDataEngine = new UnifiedDataEngine();

export default unifiedDataEngine;