/**
 * BATCH MEMBER ENRICHMENT SYSTEM
 * Progressively enriches 183-member network in controlled batches of 25 members
 * Single-threaded, safe persistence, no render blocking
 */

const countries = ['Colombia', 'México', 'España', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'Venezuela', 'Brasil', 'Portugal'];
const ranks = ['Principiante', 'Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Diamante Azul', 'Diamante Negro', 'E. Corona'];

class BatchMemberEnricher {
  constructor(platformDataCore) {
    this.core = platformDataCore;
    this.batchSize = 25;
    this.currentBatch = 0;
    this.enrichmentStats = {
      totalProcessed: 0,
      totalMembers: 0,
      enrichedCount: 0,
      withEmail: 0,
      withPhone: 0,
      withUpline: 0,
      averageInvestment: 0,
      batches: [],
    };
  }

  // Generate realistic email from name
  generateEmail(name, index) {
    if (name && name.includes('Miembro')) {
      return `miembro-${String(index).padStart(4, '0')}@vicion.com`;
    }
    const parts = name.toLowerCase().split(' ').filter(p => p.length > 0);
    const email = parts.slice(0, 2).join('.') + `@vicion.com`;
    return email;
  }

  // Generate country-specific phone
  generatePhone(country, index) {
    const countryPrefixes = {
      'Colombia': '+57',
      'México': '+52',
      'España': '+34',
      'Argentina': '+54',
      'Chile': '+56',
      'Perú': '+51',
      'Ecuador': '+593',
      'Venezuela': '+58',
      'Brasil': '+55',
      'Portugal': '+351',
    };
    const prefix = countryPrefixes[country] || '+57';
    const number = String(300000000 + Math.floor(Math.random() * 100000000)).slice(0, 9);
    return `${prefix}${number}`;
  }

  // Assign rank based on investment and descendants
  assignRank(investment, descendantCount) {
    if (investment >= 25000 && descendantCount >= 50) return 'E. Corona';
    if (investment >= 20000 && descendantCount >= 40) return 'Diamante Negro';
    if (investment >= 15000 && descendantCount >= 30) return 'Diamante Azul';
    if (investment >= 10000 && descendantCount >= 20) return 'Diamante';
    if (investment >= 8000 && descendantCount >= 10) return 'Platino';
    if (investment >= 5000 && descendantCount >= 5) return 'Oro';
    if (investment >= 2500) return 'Plata';
    if (investment >= 1000) return 'Bronce';
    return 'Principiante';
  }

  // Weight-based investment distribution
  assignInvestment() {
    const rand = Math.random();
    if (rand < 0.02) return 25000;  // 2% elite
    if (rand < 0.08) return 15000;  // 6% high
    if (rand < 0.20) return 10000;  // 12% premium
    if (rand < 0.65) return 5000;   // 45% core base
    if (rand < 0.85) return 2500;   // 20% moderate
    return 1000;                     // 15% entry
  }

  // Enrich single member
  enrichMember(member, index) {
    if (!member) return null;

    const country = member.country || countries[Math.floor(Math.random() * countries.length)];
    const investment = member.investment || this.assignInvestment();
    const status = member.status || (Math.random() > 0.2 ? 'activo' : 'inactivo');
    
    // Count descendants for rank assignment
    const descendants = this.core.getDescendantsForLeader(member.id || `member-${String(index).padStart(4, '0')}`);
    const descendantCount = descendants.length;
    
    // Ensure upline exists
    const uplineId = member.upline_id || (index > 0 ? 'master-root-001' : null);
    
    return {
      ...member,
      full_name: member.name || member.full_name || `Miembro ${index}`,
      email: member.email || this.generateEmail(member.name || member.full_name, index),
      phone: member.phone || this.generatePhone(country, index),
      country: country,
      rank: this.assignRank(investment, descendantCount),
      membership_plan: member.plan || ['Básico', 'Profesional', 'Premium'][Math.floor(Math.random() * 3)],
      investment_amount: investment,
      status: status,
      last_activity: member.last_activity || new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      upline_id: uplineId,
      binary_side: member.binary_side || (Math.random() > 0.5 ? 'left' : 'right'),
      generation_depth: member.generation || Math.floor(Math.random() * 8) + 1,
      direct_referral: member.direct_referral || Math.floor(Math.random() * 15),
      activity_level: member.activity_level || Math.floor(Math.random() * 100),
    };
  }

  // Process single batch
  processBatch(batchNumber) {
    const startIdx = batchNumber * this.batchSize;
    const endIdx = Math.min(startIdx + this.batchSize, this.core.users.length);
    
    if (startIdx >= this.core.users.length) {
      return { success: false, message: 'All batches completed' };
    }

    const batchMembers = this.core.users.slice(startIdx, endIdx);
    const enrichedBatch = batchMembers.map((member, relativeIdx) => 
      this.enrichMember(member, startIdx + relativeIdx)
    ).filter(m => m !== null);

    // Update core with enriched members
    enrichedBatch.forEach((enriched, relativeIdx) => {
      this.core.users[startIdx + relativeIdx] = enriched;
    });

    // Calculate batch stats
    const batchStats = this.calculateBatchStats(enrichedBatch);
    this.enrichmentStats.batches.push({
      batchNumber,
      processed: enrichedBatch.length,
      stats: batchStats,
      timestamp: new Date().toISOString(),
    });

    this.enrichmentStats.totalProcessed += enrichedBatch.length;
    this.enrichmentStats.enrichedCount = this.core.users.filter(u => u.email && u.phone && u.upline_id).length;
    this.enrichmentStats.withEmail = this.core.users.filter(u => u.email).length;
    this.enrichmentStats.withPhone = this.core.users.filter(u => u.phone).length;
    this.enrichmentStats.withUpline = this.core.users.filter(u => u.upline_id).length;

    // Calculate average investment
    const investments = this.core.users
      .filter(u => u.investment_amount)
      .map(u => u.investment_amount);
    this.enrichmentStats.averageInvestment = investments.length > 0 
      ? (investments.reduce((a, b) => a + b, 0) / investments.length).toFixed(2)
      : 0;

    this.enrichmentStats.totalMembers = this.core.users.length;

    return {
      success: true,
      batchNumber,
      processed: enrichedBatch.length,
      stats: batchStats,
      overallStats: this.enrichmentStats,
    };
  }

  // Calculate stats for batch
  calculateBatchStats(members) {
    return {
      count: members.length,
      withEmail: members.filter(m => m.email).length,
      withPhone: members.filter(m => m.phone).length,
      withUpline: members.filter(m => m.upline_id).length,
      avgInvestment: (members.reduce((sum, m) => sum + (m.investment_amount || 0), 0) / members.length).toFixed(2),
      rankDistribution: this.getRankDistribution(members),
    };
  }

  // Get rank distribution for batch
  getRankDistribution(members) {
    const dist = {};
    members.forEach(m => {
      dist[m.rank] = (dist[m.rank] || 0) + 1;
    });
    return dist;
  }

  // Run all batches sequentially
  async runAllBatches() {
    const results = [];
    const totalBatches = Math.ceil(this.core.users.length / this.batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const result = this.processBatch(i);
      if (result.success) {
        results.push(result);
        // Simulate async processing
        await new Promise(r => setTimeout(r, 100));
      } else {
        break;
      }
    }

    return {
      totalBatches,
      processedBatches: results.length,
      finalStats: this.enrichmentStats,
      results,
    };
  }

  // Get current enrichment status
  getStatus() {
    return {
      totalMembers: this.core.users.length,
      enrichedMembers: this.enrichmentStats.enrichedCount,
      remainingMembers: this.core.users.length - this.enrichmentStats.enrichedCount,
      percentComplete: ((this.enrichmentStats.enrichedCount / this.core.users.length) * 100).toFixed(1),
      averageInvestment: this.enrichmentStats.averageInvestment,
      withEmail: this.enrichmentStats.withEmail,
      withPhone: this.enrichmentStats.withPhone,
      withUpline: this.enrichmentStats.withUpline,
      batches: this.enrichmentStats.batches,
    };
  }
}

export default BatchMemberEnricher;