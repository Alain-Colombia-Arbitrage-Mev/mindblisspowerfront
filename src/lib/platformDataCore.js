/**
 * PLATFORM DATA CORE
 * Single canonical source of truth for all platform data
 * All components read from this core — no independent state
 */

class PlatformDataCore {
  constructor() {
    this.users = [];
    this.leaders = [];
    this.network_nodes = [];
    this.memberships = [];
    this.payments = [];
    this.commission_events = [];
    this.alerts = [];
    this.incidents = [];
    this.activity_log = [];
    this.messages = [];
    this.campaigns = [];
    this.unread_notifications = {};

    this.initialize();
  }

  initialize() {
    // PHASE 1: ROOT USER (ABSOLUTE PRIORITY)
    const masterUserId = 'master-root-001';
    const masterUser = {
      id: masterUserId,
      user_id: masterUserId,
      name: 'Embajador Corona',
      full_name: 'Embajador Corona',
      email: 'corona@vicion.com',
      phone: '+57 1 2345 6789',
      country: 'CO',
      role: 'user',
      rank: 'E. Corona',
      rank_icon: '👑',
      status: 'activo',
      investment: 25000,
      investment_amount: 25000,
      created_at: new Date().toISOString(),
    };
    this.users.push(masterUser);

    // MASTER MEMBERSHIP
    const masterMembershipId = 'membership-master-001';
    const masterMembership = {
      id: masterMembershipId,
      user_id: masterUserId,
      plan: 'Elite',
      amount: 25000,
      status: 'activo',
      activation_date: new Date().toISOString(),
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
    this.memberships.push(masterMembership);

    // PHASE 2: NETWORK ROOT (NO NULL UPLINE)
    const masterNetworkNode = {
      id: `node-${masterUserId}`,
      user_id: masterUserId,
      upline_id: null,
      binary_side: 'root',
      depth: 0,
      status: 'activo',
      created_at: new Date().toISOString(),
    };
    this.network_nodes.push(masterNetworkNode);

    // MASTER LEADER PROFILE
    const masterLeader = {
      id: masterUserId,
      name: masterUser.name,
      rank: 'E. Corona',
      rank_icon: '👑',
      country: 'CO',
      status: 'activo',
      red_activa: 0,
      inversion_personal: 25000,
      network_investment: 25000,
      ingresos_mes: 0,
      left_count: 0,
      right_count: 0,
      direct_referrals: 0,
      total_descendants: 0,
      urgencia: 'Normal',
    };
    this.leaders.push(masterLeader);

    // BUILD TIER-2 LEADERS UNDER MASTER (EXPANDED)
     const tier2Leaders = [
       { rank: 'Diamante Negro', name: 'Roberto Díaz Ejecutivo', investment: 25000, country: 'CO', descendants: 18 },
       { rank: 'Diamante Azul', name: 'María González Líder', investment: 15000, country: 'CO', descendants: 14 },
       { rank: 'Diamante', name: 'Carlos Martínez Coordinador', investment: 10000, country: 'CO', descendants: 12 },
       { rank: 'Platino', name: 'Sofía López Gerente', investment: 10000, country: 'MX', descendants: 11 },
       { rank: 'Diamante', name: 'Juan Rodríguez Especialista', investment: 10000, country: 'PE', descendants: 9 },
       { rank: 'Platino', name: 'Andrea Silva Coach', investment: 8000, country: 'AR', descendants: 8 },
       { rank: 'Oro', name: 'Fernando Castro Promotor', investment: 5000, country: 'EC', descendants: 7 },
       { rank: 'Oro', name: 'Lucia Moreno Embajadora', investment: 5000, country: 'CL', descendants: 6 },
     ];

    let nodeId = 1;
    tier2Leaders.forEach((leaderData, idx) => {
      const userId = `user-tier2-${idx}`;
      const binarySide = idx < 2 ? 'left' : 'right';

      // Create user
      const user = {
        id: userId,
        name: leaderData.name,
        email: `${leaderData.name.toLowerCase().replace(/ /g, '.')}@vicion.app`,
        phone: `+57 ${300 + idx} ${1000 + idx} ${5000 + idx * 100}`,
        country: leaderData.country,
        role: 'lider',
        rank: leaderData.rank,
        rank_icon: this.getRankIcon(leaderData.rank),
        status: 'activo',
        created_at: new Date().toISOString(),
      };
      this.users.push(user);

      // Create membership
      const membership = {
        id: `membership-${userId}`,
        user_id: userId,
        plan: this.getMembershipPlan(leaderData.rank),
        amount: leaderData.investment,
        status: 'activo',
        activation_date: new Date().toISOString(),
        expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };
      this.memberships.push(membership);

      // PHASE 3: FORCE ALL TOP LEVEL TO ROOT
      const networkNode = {
        id: `node-${userId}`,
        user_id: userId,
        upline_id: masterUserId,
        binary_side: binarySide,
        depth: 1,
        status: 'activo',
        investment: leaderData.investment,
        binary_side: binarySide,
        created_at: new Date().toISOString(),
      };
      this.network_nodes.push(networkNode);

      // Create leader profile
      const leader = {
        id: userId,
        name: leaderData.name,
        rank: leaderData.rank,
        rank_icon: this.getRankIcon(leaderData.rank),
        country: leaderData.country,
        status: 'activo',
        red_activa: leaderData.descendants,
        inversion_personal: leaderData.investment,
        network_investment: leaderData.investment,
        ingresos_mes: Math.floor(leaderData.investment * 0.08),
        left_count: leaderData.descendants > 0 ? Math.floor(leaderData.descendants / 2) : 0,
        right_count: leaderData.descendants > 0 ? Math.ceil(leaderData.descendants / 2) : 0,
        direct_referrals: leaderData.descendants,
        total_descendants: leaderData.descendants,
        urgencia: 'Normal',
      };
      this.leaders.push(leader);

      // Create payment records
      const paymentDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      this.payments.push({
        id: `payment-${userId}-001`,
        user_id: userId,
        membership_id: `membership-${userId}`,
        amount: leaderData.investment,
        status: 'completado',
        payment_date: paymentDate.toISOString(),
        due_date: new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: paymentDate.toISOString(),
      });

      // Create descendants under this leader with controlled investment distribution
      for (let d = 0; d < leaderData.descendants; d++) {
        const descendantUserId = `user-descendant-${nodeId}`;
        const descendantRank = d % 3 === 0 ? 'Oro' : d % 3 === 1 ? 'Plata' : 'Bronce';

        const descendantUser = {
          id: descendantUserId,
          name: `${leaderData.name.split(' ')[0]} Descendant ${d + 1}`,
          email: `descendant-${nodeId}@vicion.app`,
          phone: `+57 ${310 + nodeId} ${2000 + nodeId} ${6000 + nodeId * 50}`,
          country: leaderData.country,
          role: 'inversor',
          rank: descendantRank,
          rank_icon: this.getRankIcon(descendantRank),
          status: 'activo',
          created_at: new Date().toISOString(),
        };
        this.users.push(descendantUser);

        const descendantInvestment = this.getDeterministicInvestment(nodeId);

        // Create membership
        this.memberships.push({
          id: `membership-${descendantUserId}`,
          user_id: descendantUserId,
          plan: this.getMembershipPlan(descendantRank),
          amount: descendantInvestment,
          status: 'activo',
          activation_date: new Date().toISOString(),
          expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });

        // PHASE 3: DESCENDANTS INHERIT PARENT LINK
        this.network_nodes.push({
          id: `node-${descendantUserId}`,
          user_id: descendantUserId,
          upline_id: userId,
          binary_side: d % 2 === 0 ? 'left' : 'right',
          depth: 2,
          investment: descendantInvestment,
          status: 'activo',
          created_at: new Date().toISOString(),
        });

        // Create payment
        this.payments.push({
          id: `payment-${descendantUserId}-001`,
          user_id: descendantUserId,
          membership_id: `membership-${descendantUserId}`,
          amount: descendantInvestment,
          status: 'completado',
          payment_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        });

        nodeId++;
      }

      // Update master leader totals
      masterLeader.total_descendants += leaderData.descendants;
      masterLeader.left_count += idx < 2 ? (leaderData.descendants + 1) : 0;
      masterLeader.right_count += idx >= 2 ? (leaderData.descendants + 1) : 0;
      masterLeader.network_investment += leaderData.investment + leaderData.descendants * 3500;
    });

    // PHASE 3: APPLY CALCULATED RANKS
    this.applyCalculatedRanks();

    // PHASE 9: VALIDATE INVESTMENT DISTRIBUTION
    const investmentDistribution = this.validateInvestmentDistribution();
    console.log('═══════════════════════════════════════════════════════════');
    console.log('INVESTMENT DISTRIBUTION VALIDATION');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total Members: ${investmentDistribution.totalMembers}`);
    console.log(`Total Investment: $${investmentDistribution.totalInvestment.toLocaleString()}`);
    console.log(`Average Investment: $${investmentDistribution.averageInvestment.toFixed(2)}`);
    console.log(`Target Range: $3500 - $7000`);
    console.log(`Status: ${investmentDistribution.isInRange ? '✓ VALID' : '✗ OUT OF RANGE'}`);
    console.log('\nDistribution by Plan:');
    Object.entries(investmentDistribution.countByPlan).forEach(([plan, count]) => {
      const sum = investmentDistribution.sumByPlan[plan];
      console.log(`  $${plan}: ${count} users | Total: $${sum.toLocaleString()}`);
    });
    console.log('═══════════════════════════════════════════════════════════\n');

    // Create activity log entry
    this.activity_log.push({
      id: 'activity-001',
      type: 'system_initialization',
      description: `Platform data core initialized with ${investmentDistribution.totalMembers} members, avg investment $${investmentDistribution.averageInvestment.toFixed(2)}`,
      timestamp: new Date().toISOString(),
    });
  }

  getRankIcon(rank) {
    const rankIcons = {
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

  getRankColor(rank) {
    const colors = {
      'E. Corona': '#FFD700',
      'Embajador': '#FF6B6B',
      'Diamante Azul': '#60A5FA',
      'Diamante Negro': '#1F2937',
      'Diamante': '#A855F7',
      'Platino': '#FCD34D',
      'Oro': '#F59E0B',
      'Plata': '#D1D5DB',
      'Bronce': '#D97706',
      'Principiante': '#9CA3AF',
    };
    return colors[rank] || '#9CA3AF';
  }

  getMembershipPlan(rank) {
    const planMap = {
      'E. Corona': 'Elite',
      'Diamante Negro': 'Premium',
      'Diamante Azul': 'Premium',
      'Diamante': 'Standard',
      'Platino': 'Standard',
      'Oro': 'Basic',
      'Plata': 'Basic',
      'Bronce': 'Basic',
    };
    return planMap[rank] || 'Basic';
  }

  getDeterministicInvestment(index) {
    const weightedPlans = [
      25000,
      15000,
      10000, 10000, 10000,
      5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000,
      2500, 2500, 2500, 2500, 2500,
      1000, 1000, 1000,
    ];

    return weightedPlans[(index - 1) % weightedPlans.length];
  }

  // Query methods
  getUserById(userId) {
    return this.users.find(u => u.id === userId);
  }

  getLeaderById(leaderId) {
    return this.leaders.find(l => l.id === leaderId);
  }

  getNetworkNodesByUplineId(uplineId) {
    return this.network_nodes.filter(n => n.upline_id === uplineId);
  }

  getDescendantsForLeader(leaderId) {
    const directChildren = this.network_nodes.filter(n => n.upline_id === leaderId);
    const allDescendants = [...directChildren];
    
    directChildren.forEach(child => {
      allDescendants.push(...this.getDescendantsForLeader(child.user_id));
    });
    
    return allDescendants;
  }

  getPaymentsForUser(userId) {
    return this.payments.filter(p => p.user_id === userId);
  }

  getMembershipsForUser(userId) {
    return this.memberships.filter(m => m.user_id === userId);
  }

  // Get master account
  getMasterAccount() {
    return this.users.find(u => u.role === 'admin' && u.rank === 'E. Corona');
  }

  // PHASE 2-3: RANK CALCULATION FROM REAL DATA
  calculateRankFromData(userId) {
    if (userId === 'master-root-001') {
      return 'E. Corona';
    }

    const personalInvestment = this.memberships
      .filter(m => m.user_id === userId)
      .reduce((sum, m) => sum + m.amount, 0);

    const descendants = this.network_nodes.filter(n => n.upline_id === userId);
    const networkSize = descendants.length + descendants.reduce((sum, n) => {
      const childDescendants = this.network_nodes.filter(d => d.upline_id === n.user_id);
      return sum + childDescendants.length;
    }, 0);

    // PHASE 2: RANK CONDITIONS
    if (personalInvestment >= 25000 && networkSize >= 180) {
      return 'E. Corona';
    } else if (personalInvestment >= 25000 && networkSize >= 150) {
      return 'Embajador';
    } else if (personalInvestment >= 20000 && networkSize >= 120) {
      return 'Diamante Azul';
    } else if (personalInvestment >= 15000 && networkSize >= 80) {
      return 'Diamante Negro';
    } else if (personalInvestment >= 10000 && networkSize >= 40) {
      return 'Platino';
    } else if (personalInvestment >= 5000 && networkSize >= 15) {
      return 'Oro';
    } else if (personalInvestment >= 2500 && networkSize >= 5) {
      return 'Plata';
    } else if (personalInvestment >= 1000 && networkSize >= 2) {
      return 'Bronce';
    } else {
      return 'Principiante';
    }
  }

  // PHASE 3: APPLY CALCULATED RANKS TO ALL USERS
  applyCalculatedRanks() {
    this.users.forEach(user => {
      const calculatedRank = this.calculateRankFromData(user.id);
      user.rank = calculatedRank;
      user.rank_icon = this.getRankIcon(calculatedRank);
    });
  }

  // PHASE 9: INVESTMENT VALIDATION
  validateInvestmentDistribution() {
    // Get all membership amounts
    const investments = this.memberships.map(m => m.amount);
    
    const totalInvestment = investments.reduce((sum, inv) => sum + inv, 0);
    const totalMembers = investments.length;
    const averageInvestment = totalInvestment / totalMembers;
    
    // Group by plan value
    const countByPlan = {};
    const sumByPlan = {};
    
    this.memberships.forEach(m => {
      const plan = m.amount;
      countByPlan[plan] = (countByPlan[plan] || 0) + 1;
      sumByPlan[plan] = (sumByPlan[plan] || 0) + m.amount;
    });
    
    return {
      totalMembers,
      totalInvestment,
      averageInvestment,
      isInRange: averageInvestment >= 3500 && averageInvestment <= 7000,
      countByPlan,
      sumByPlan,
    };
  }
}

// SINGLETON INSTANCE — One canonical data core
const platformDataCore = new PlatformDataCore();

export default platformDataCore;
