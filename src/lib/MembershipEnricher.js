/**
 * MEMBERSHIP ENRICHER
 * Adds complete economic profile to every user
 * Plan assignments, contract terms, renewal states, behavior patterns
 * Ensures mathematical coherence for later aggregation
 */

const PLANS = {
  Start: 500,
  Growth: 1000,
  Advance: 2500,
  Pro: 5000,
  Pro2: 10000,
  Elite: 25000,
};

const PLAN_DISTRIBUTION = [
  ...Array(50).fill('Start'),
  ...Array(50).fill('Growth'),
  ...Array(40).fill('Advance'),
  ...Array(30).fill('Pro'),
  ...Array(10).fill('Pro2'),
  ...Array(2).fill('Elite'),
];

const CONTRACT_TERMS = {
  corto: { days: 30, label: 'Corto Plazo (30 días)' },
  medio: { days: 90, label: 'Medio Plazo (90 días)' },
  largo: { days: 365, label: 'Largo Plazo (365 días)' },
};

const RENEWAL_STATES = ['nuevo', 'activo', 'por_vencer', 'vencido', 'reinvertido'];
const BEHAVIOR_PATTERNS = ['estable', 'creciente', 'moroso', 'pasivo', 'activo', 'alto_valor', 'en_riesgo'];

class MembershipEnricher {
  constructor(members) {
    this.members = members;
  }

  /**
   * EXECUTE: Enrich all members with complete economic profiles
   */
  execute() {
    console.log('\n💰 MEMBERSHIP ENRICHMENT: Adding economic profiles to 182 users...\n');

    // Shuffle plan distribution
    const planDistribution = this.shuffleArray([...PLAN_DISTRIBUTION]);

    this.members.forEach((member, idx) => {
      // PLAN ASSIGNMENT
      const planName = planDistribution[idx % planDistribution.length];
      const planValue = PLANS[planName];

      member.plan_name = planName;
      member.plan_value = planValue;
      member.investment_amount = planValue;

      // CONTRACT TERM ASSIGNMENT (weighted toward longer terms for stability)
      const termRand = Math.random();
      let contractTerm;
      if (termRand < 0.3) {
        contractTerm = 'corto';
      } else if (termRand < 0.6) {
        contractTerm = 'medio';
      } else {
        contractTerm = 'largo';
      }

      member.contract_term = contractTerm;
      member.contract_label = CONTRACT_TERMS[contractTerm].label;

      // DATES
      const now = new Date();
      const startDate = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000);
      const startTime = `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;

      member.start_date = startDate.toISOString().split('T')[0];
      member.start_time = startTime;

      const expiryDate = new Date(startDate.getTime() + CONTRACT_TERMS[contractTerm].days * 24 * 60 * 60 * 1000);
      member.expiry_date = expiryDate.toISOString().split('T')[0];
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      // RENEWAL STATUS
      let renewalStatus;
      if (daysUntilExpiry > 30) {
        renewalStatus = Math.random() > 0.7 ? 'nuevo' : 'activo';
      } else if (daysUntilExpiry > 0) {
        renewalStatus = 'por_vencer';
      } else {
        renewalStatus = Math.random() > 0.5 ? 'vencido' : 'reinvertido';
      }

      member.renewal_status = renewalStatus;

      // PAYMENT STATUS
      const paymentStatusMap = {
        nuevo: 'pendiente',
        activo: Math.random() > 0.85 ? 'pendiente' : 'pagado',
        por_vencer: Math.random() > 0.6 ? 'pagado' : 'pendiente',
        vencido: Math.random() > 0.3 ? 'vencido' : 'pendiente',
        reinvertido: 'pagado',
      };

      member.payment_status = paymentStatusMap[renewalStatus];

      // REINVESTMENT FLAG
      member.reinvestment_flag = renewalStatus === 'reinvertido' || Math.random() > 0.7;
      member.reinvertio = member.reinvestment_flag ? 'sí' : 'no';

      // LATE PAYMENT COUNT
      member.late_payment_count = member.payment_status === 'vencido' ? Math.floor(Math.random() * 3) + 1 : 0;

      // ACTIVITY PATTERN
      const activityMap = {
        nuevo: 'iniciando',
        activo: 'regular',
        por_vencer: 'regular',
        vencido: 'bajo',
        reinvertido: 'alto',
      };

      member.activity_pattern = activityMap[renewalStatus];

      // BEHAVIOR PATTERN (more sophisticated assignment)
      let behaviorPattern;
      if (member.payment_status === 'vencido') {
        behaviorPattern = Math.random() > 0.5 ? 'moroso' : 'en_riesgo';
      } else if (member.reinvestment_flag && Math.random() > 0.3) {
        behaviorPattern = Math.random() > 0.5 ? 'creciente' : 'alto_valor';
      } else if (member.activity_pattern === 'bajo') {
        behaviorPattern = 'pasivo';
      } else {
        behaviorPattern = BEHAVIOR_PATTERNS[Math.floor(Math.random() * BEHAVIOR_PATTERNS.length)];
      }

      member.behavior_pattern = behaviorPattern;

      // RISK CLASSIFICATION
      const riskFactors = [
        member.payment_status === 'vencido' ? 1 : 0,
        member.late_payment_count > 0 ? 1 : 0,
        member.activity_pattern === 'bajo' ? 1 : 0,
      ].reduce((a, b) => a + b, 0);

      member.risk_level = riskFactors >= 2 ? 'alto' : riskFactors === 1 ? 'medio' : 'bajo';
      member.risk_pattern = member.behavior_pattern === 'moroso' ? 'moroso' : member.behavior_pattern === 'en_riesgo' ? 'vigilancia' : 'verde';
    });

    const stats = this.validateEnrichment();
    console.log(`📊 MEMBERSHIP ENRICHMENT VALIDATION:`);
    console.log(`   Users enriched: ${stats.totalEnriched}`);
    console.log(`   All have plans: ${stats.allHavePlans ? '✅ YES' : '❌ NO'}`);
    console.log(`   All have investments: ${stats.allHaveInvestments ? '✅ YES' : '❌ NO'}`);
    console.log(`   All have contract terms: ${stats.allHaveTerms ? '✅ YES' : '❌ NO'}`);
    console.log(`   All have expiry dates: ${stats.allHaveExpiry ? '✅ YES' : '❌ NO'}`);
    console.log(`   All have renewal status: ${stats.allHaveRenewal ? '✅ YES' : '❌ NO'}`);
    console.log(`   All have behavior patterns: ${stats.allHaveBehavior ? '✅ YES' : '❌ NO'}`);
    console.log(`\n   Plan distribution:`);
    Object.entries(stats.planDistribution).forEach(([plan, count]) => {
      console.log(`     ${plan}: ${count} users`);
    });
    console.log(`\n   Behavior distribution:`);
    Object.entries(stats.behaviorDistribution).forEach(([behavior, count]) => {
      console.log(`     ${behavior}: ${count} users`);
    });
    console.log();

    return {
      members: this.members,
      stats,
    };
  }

  /**
   * Validate enrichment completeness
   */
  validateEnrichment() {
    const planCounts = {};
    const behaviorCounts = {};
    let allHavePlans = true;
    let allHaveInvestments = true;
    let allHaveTerms = true;
    let allHaveExpiry = true;
    let allHaveRenewal = true;
    let allHaveBehavior = true;

    this.members.forEach(member => {
      if (!member.plan_name || !PLANS[member.plan_name]) allHavePlans = false;
      if (!member.investment_amount || member.investment_amount === 0) allHaveInvestments = false;
      if (!member.contract_term) allHaveTerms = false;
      if (!member.expiry_date) allHaveExpiry = false;
      if (!member.renewal_status) allHaveRenewal = false;
      if (!member.behavior_pattern) allHaveBehavior = false;

      planCounts[member.plan_name] = (planCounts[member.plan_name] || 0) + 1;
      behaviorCounts[member.behavior_pattern] = (behaviorCounts[member.behavior_pattern] || 0) + 1;
    });

    return {
      totalEnriched: this.members.length,
      allHavePlans,
      allHaveInvestments,
      allHaveTerms,
      allHaveExpiry,
      allHaveRenewal,
      allHaveBehavior,
      planDistribution: planCounts,
      behaviorDistribution: behaviorCounts,
    };
  }

  /**
   * Fisher-Yates shuffle
   */
  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

export default MembershipEnricher;