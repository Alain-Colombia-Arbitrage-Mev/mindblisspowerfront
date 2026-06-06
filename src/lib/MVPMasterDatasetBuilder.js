/**
 * MVP MASTER DATASET BUILDER
 * Creates foundational relational dataset for entire Vicion MVP
 * Single master account (E. Corona) → Roberto Díaz + network → full member records
 */

const SPANISH_NAMES = [
  'Carlos López', 'María García', 'Juan Rodríguez', 'Ana Martínez', 'José Pérez',
  'Elena Sánchez', 'Miguel Fernández', 'Rosa González', 'Fernando Torres', 'Isabel Ramirez',
  'Diego Morales', 'Catalina Silva', 'Andrés Ruiz', 'Valentina Cruz', 'Roberto Díaz',
  'Silvia Moreno', 'Manuel Herrera', 'Gabriela Vargas', 'Pedro Castillo', 'Lucia Rojas',
  'Antonio Medina', 'Camila Flores', 'Sergio Mendoza', 'Daniela Romero', 'Alejandro Gutierrez',
  'Paula Navarro', 'Guillermo Ortiz', 'Mariana Vidal', 'Javier Acosta', 'Sofia Dominguez',
];

const COUNTRIES = ['CO', 'MX', 'BR', 'AR', 'ES', 'CL', 'PE', 'VE'];
const CITIES = {
  CO: ['Bogotá', 'Medellín', 'Cali'], MX: ['México DF', 'Guadalajara', 'Monterrey'],
  BR: ['São Paulo', 'Rio de Janeiro', 'Salvador'], AR: ['Buenos Aires', 'Córdoba'],
  ES: ['Madrid', 'Barcelona'], CL: ['Santiago'], PE: ['Lima'], VE: ['Caracas'],
};

const PLANS = { Start: 500, Growth: 1000, Advance: 2500, Pro_5k: 5000, Pro_10k: 10000, Elite: 25000 };
const PLAN_DISTRIBUTION = ['Start', 'Start', 'Growth', 'Growth', 'Advance', 'Pro_5k', 'Elite'];
const CONTRACT_TERMS = ['short_term', 'mid_term', 'long_term'];
const BEHAVIOR_MODELS = ['new', 'stable', 'growing', 'reinvesting', 'late_payer', 'inactive', 'high_value'];

class MVPMasterDatasetBuilder {
  constructor() {
    this.members = [];
    this.masterAccount = null;
    this.robertoDiaz = null;
    this.memberIndex = 0;
  }

  generateEmail(name) {
    const [first, last] = name.toLowerCase().split(' ');
    return `${first}.${last}@vicion.app`;
  }

  generatePhone(country) {
    const codes = { CO: '+57', MX: '+52', BR: '+55', AR: '+54', ES: '+34', CL: '+56', PE: '+51', VE: '+58' };
    const code = codes[country] || '+57';
    return `${code}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  getRandomPlan() {
    return PLAN_DISTRIBUTION[Math.floor(Math.random() * PLAN_DISTRIBUTION.length)];
  }

  getRandomRank() {
    const ranks = ['Principiante', 'Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Diamante Azul', 'Diamante Negro'];
    return ranks[Math.floor(Math.random() * ranks.length)];
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

  createMember(fullName, country, uplineId, binarySide, generationDepth, role = 'inversor', isLeader = false) {
    const planName = this.getRandomPlan();
    const planValue = PLANS[planName];
    const regDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    const paymentStatuses = ['activo', 'activo', 'activo', 'pendiente', 'vencido'];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    const behaviorModel = BEHAVIOR_MODELS[Math.floor(Math.random() * BEHAVIOR_MODELS.length)];
    const riskLevel = paymentStatus === 'vencido' ? 'alto' : 'bajo';
    const activityLevel = behaviorModel === 'inactive' ? 'bajo' : 'alto';

    // Ensure country is valid, fallback to CO if not
    const validCountry = CITIES[country] ? country : 'CO';
    const citiesList = CITIES[validCountry] || CITIES['CO'];

    const rank = role === 'lider' ? ['Platino', 'Diamante', 'Diamante Azul'][Math.floor(Math.random() * 3)] : this.getRandomRank();
    const member = {
      id: `member-${this.memberIndex++}-${Date.now()}`,
      full_name: fullName,
      email: this.generateEmail(fullName),
      phone: this.generatePhone(validCountry),
      country: validCountry,
      city: citiesList[Math.floor(Math.random() * citiesList.length)],
      role: role,
      rank: rank,
      rank_icon: this.getRankIcon(rank),
      status: Math.random() > 0.1 ? 'activo' : 'pendiente',
      membership_plan: planName,
      membership_value: planValue,
      investment_amount: planValue,
      registration_date: regDate.toISOString().split('T')[0],
      registration_time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      contract_term_preference: CONTRACT_TERMS[Math.floor(Math.random() * CONTRACT_TERMS.length)],
      renewal_behavior: Math.random() > 0.3 ? 'automatic' : 'manual',
      reinvestment_flag: Math.random() > 0.4,
      payment_status: paymentStatus,
      last_payment_date: regDate.toISOString().split('T')[0],
      next_due_date: new Date(regDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      onboarding_status: Math.random() > 0.05 ? 'completado' : 'pendiente',
      document_type: ['cedula', 'pasaporte', 'ruc'][Math.floor(Math.random() * 3)],
      document_number_simulated: Math.floor(Math.random() * 900000000) + 10000000,
      documentation_status: Math.random() > 0.08 ? 'verified' : 'pending',
      upline_id: uplineId,
      referred_by_id: uplineId,
      binary_side: binarySide,
      generation_depth: generationDepth,
      risk_level: riskLevel,
      activity_level: activityLevel,
      behavior_model: behaviorModel,
      contract_term: CONTRACT_TERMS[Math.floor(Math.random() * CONTRACT_TERMS.length)],
      renewal_status: Math.random() > 0.1 ? 'activo' : 'pendiente',
    };

    this.members.push(member);
    return member;
  }

  buildNetwork() {
    console.log('🏗️ Building MVP Master Dataset with 183 users (1 master + 182 children)...\n');

    // MASTER ACCOUNT: VISIBLE ROOT
    this.masterAccount = {
      id: 'master-cuenta-mvp-principal',
      full_name: 'Cuenta MVP Principal',
      display_name: 'E. Corona',
      email: 'master@vicion.app',
      phone: '+57-301-1000000',
      country: 'CO',
      city: 'Bogotá',
      role: 'Líder Principal',
      rank: 'E. Corona',
      rank_icon: '👑',
      status: 'Activo',
      binary_position: 'root',
      membership_plan: 'Elite',
      membership_value: 25000,
      personal_investment: 25000,
      registration_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      registration_time: '09:30',
      onboarding_status: 'completado',
      documentation_status: 'verified',
      document_type: 'cedula',
      document_number_simulated: 1000000000,
      payment_status: 'activo',
      last_payment_date: new Date().toISOString().split('T')[0],
      next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      renewal_status: 'activo',
      reinvestment_flag: true,
      contract_term_preference: 'long_term',
      risk_level: 'bajo',
      activity_level: 'alto',
      behavior_model: 'stable',
    };

    console.log(`✅ Master Account: ${this.masterAccount.full_name} (${this.masterAccount.rank})\n`);

    // LEVEL 1: Two main branches under master
    const leftBranchLeader = this.createMember(
      'Carlos Mendoza López',
      'CO',
      this.masterAccount.id,
      'left',
      1,
      'lider',
      true
    );

    const rightBranchLeader = this.createMember(
      'María Elena Rodríguez',
      'MX',
      this.masterAccount.id,
      'right',
      1,
      'lider',
      true
    );

    // LEVEL 2: Major leaders including Roberto Díaz
    this.robertoDiaz = this.createMember(
      'Roberto Díaz',
      'CO',
      leftBranchLeader.id,
      'left',
      2,
      'lider',
      true
    );

    const level2Leaders = [
      this.robertoDiaz,
      this.createMember('Juan Torres', 'BR', leftBranchLeader.id, 'right', 2, 'lider', true),
      this.createMember('Ana López', 'AR', rightBranchLeader.id, 'left', 2, 'lider', true),
      this.createMember('Miguel Silva', 'ES', rightBranchLeader.id, 'right', 2, 'lider', true),
    ];

    console.log(`✅ Level 2 (Major Leaders):`);
    level2Leaders.forEach((leader, i) => {
      console.log(`   ${i + 1}. ${leader.full_name} (${leader.country})`);
    });
    console.log();

    // LEVEL 3: Subleaders
    const level3Leaders = [];
    level2Leaders.forEach((leader) => {
      const leftSub = this.createMember(
        SPANISH_NAMES[Math.floor(Math.random() * SPANISH_NAMES.length)],
        COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
        leader.id,
        'left',
        3,
        Math.random() > 0.7 ? 'lider' : 'inversor'
      );
      const rightSub = this.createMember(
        SPANISH_NAMES[Math.floor(Math.random() * SPANISH_NAMES.length)],
        COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
        leader.id,
        'right',
        3,
        Math.random() > 0.7 ? 'lider' : 'inversor'
      );
      level3Leaders.push(leftSub, rightSub);
    });

    console.log(`✅ Level 3 (Subleaders): ${level3Leaders.length} created\n`);

    // LEVEL 4-5: Regular members
    level3Leaders.forEach((leader) => {
      const memberCount = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < memberCount; i++) {
        this.createMember(
          SPANISH_NAMES[Math.floor(Math.random() * SPANISH_NAMES.length)],
          COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
          leader.id,
          Math.random() > 0.5 ? 'left' : 'right',
          4 + Math.floor(Math.random() * 2)
        );
      }
    });

    // Roberto Díaz special team
    for (let i = 0; i < 8; i++) {
      this.createMember(
        SPANISH_NAMES[Math.floor(Math.random() * SPANISH_NAMES.length)],
        ['CO', 'VE', 'EC'][Math.floor(Math.random() * 3)],
        this.robertoDiaz.id,
        Math.random() > 0.5 ? 'left' : 'right',
        3,
        Math.random() > 0.8 ? 'lider' : 'inversor'
      );
    }

    // Fill to exactly 182 total members
    const currentTotal = this.members.length;
    const needed = 182 - currentTotal;

    for (let i = 0; i < needed; i++) {
      const randomLeader = level2Leaders[Math.floor(Math.random() * level2Leaders.length)];
      const randomSubleader = level3Leaders[Math.floor(Math.random() * level3Leaders.length)];
      const parentLeader = Math.random() > 0.5 ? randomLeader : randomSubleader;

      this.createMember(
        SPANISH_NAMES[Math.floor(Math.random() * SPANISH_NAMES.length)],
        COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
        parentLeader.id,
        Math.random() > 0.5 ? 'left' : 'right',
        Math.floor(Math.random() * 3) + 3,
        Math.random() > 0.85 ? 'lider' : 'inversor'
      );
    }

    console.log(`📊 FINAL DATASET SUMMARY:`);
    console.log(`   Total Members: ${this.members.length}`);
    console.log(`   GRAND TOTAL (Master + Members): ${1 + this.members.length}`);
    console.log(`   Total Network Value: $${this.members.reduce((s, m) => s + m.investment_amount, 0) + this.masterAccount.personal_investment}\n`);

    const allUsersValid = this.members.every(m => m.membership_plan && m.investment_amount > 0 && m.onboarding_status);
    console.log(`✅ VALIDATION: ${allUsersValid ? 'ALL 182 members have complete fields' : 'MISSING FIELDS'}\n`);

    return {
      masterAccount: this.masterAccount,
      robertoDiaz: this.robertoDiaz,
      members: this.members,
      stats: {
        totalMembers: this.members.length,
        totalInvestment: this.members.reduce((s, m) => s + m.investment_amount, 0) + this.masterAccount.personal_investment,
        planDistribution: this.getPlanStats(),
      },
    };
  }

  getPlanStats() {
    const stats = {};
    this.members.forEach(m => {
      stats[m.membership_plan] = (stats[m.membership_plan] || 0) + 1;
    });
    return stats;
  }
}

export default MVPMasterDatasetBuilder;