/**
 * FOUNDATIONAL MEMBER DATASET GENERATION
 * Creates 182 real fictional member records with complete coherent structure
 * NO placeholders, NO zeros, NO disconnected fields
 */

import { VALID_PLANS, DURATION_TYPES, USER_LIFECYCLE_STATES, PAYMENT_STATES } from './DataIntegrityModel';

const SPANISH_NAMES = [
  'Carlos López', 'María García', 'Juan Rodríguez', 'Ana Martínez', 'José Pérez',
  'Elena Sánchez', 'Miguel Fernández', 'Rosa González', 'Fernando Torres', 'Isabel Ramirez',
  'Diego Morales', 'Catalina Silva', 'Andrés Ruiz', 'Valentina Cruz', 'Roberto Díaz',
  'Silvia Moreno', 'Manuel Herrera', 'Gabriela Vargas', 'Pedro Castillo', 'Lucia Rojas',
  'Antonio Medina', 'Camila Flores', 'Sergio Mendoza', 'Daniela Romero', 'Alejandro Gutierrez',
  'Paula Navarro', 'Guillermo Ortiz', 'Mariana Vidal', 'Javier Acosta', 'Sofia Dominguez',
  'Enrique Molina', 'Patricia Luna', 'Hector Ramos', 'Veronica Campos', 'Luis Varela',
  'Adriana Parra', 'Ricardo Vega', 'Beatriz Corrales', 'Felipe Santos', 'Francisca Duran',
];

const COUNTRIES = ['CO', 'MX', 'BR', 'AR', 'ES', 'CL', 'PE', 'VE'];
const CITIES = {
  CO: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena'],
  MX: ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Cancún', 'Playa del Carmen'],
  BR: ['São Paulo', 'Rio de Janeiro', 'Salvador', 'Fortaleza', 'Brasília'],
  AR: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'],
  CL: ['Santiago', 'Valparaíso', 'Concepción', 'Valdivia', 'Punta Arenas'],
  PE: ['Lima', 'Arequipa', 'Trujillo', 'Cusco', 'Piura'],
  VE: ['Caracas', 'Valencia', 'Maracaibo', 'Barquisimeto', 'Ciudad Guayana'],
};

const PAYMENT_METHODS = ['transferencia', 'tarjeta', 'efectivo'];
const DOCUMENT_TYPES = ['cedula', 'pasaporte', 'ruc'];

class FoundationalMemberDataset {
  constructor() {
    this.members = [];
    this.directReferrals = [];
    this.memberMap = new Map();
  }

  generateRealisticEmail(name, country) {
    const [first, last] = name.toLowerCase().split(' ');
    const domains = ['gmail.com', 'outlook.com', 'vicion.app', 'hotmail.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${first}.${last}@${domain}`;
  }

  generateRealisticPhone(country) {
    const countryCode = {
      CO: '+57',
      MX: '+52',
      BR: '+55',
      AR: '+54',
      ES: '+34',
      CL: '+56',
      PE: '+51',
      VE: '+58',
    }[country];
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 9000000) + 1000000;
    return `${countryCode}-${areaCode}-${number}`;
  }

  generateDocumentNumber() {
    return Math.floor(Math.random() * 900000000) + 10000000;
  }

  createMember(index, country, role = 'inversor', parentId = null, side = null, depth = 0) {
    const nameIndex = index % SPANISH_NAMES.length;
    const name = `${SPANISH_NAMES[nameIndex]} ${String(index).padStart(3, '0')}`;
    const email = this.generateRealisticEmail(name, country);
    const phone = this.generateRealisticPhone(country);
    const city = CITIES[country][Math.floor(Math.random() * CITIES[country].length)];

    // Random but valid plan
    const planNames = Object.keys(VALID_PLANS);
    const planName = planNames[Math.floor(Math.random() * planNames.length)];
    const planValue = VALID_PLANS[planName];

    // Registration dates (scattered over last 6 months)
    const regDate = new Date();
    regDate.setDate(regDate.getDate() - Math.floor(Math.random() * 180));
    const regTime = `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;

    // Onboarding status
    const onboardingStatus = Math.random() > 0.05 ? 'completado' : 'pendiente';
    const documentStatus = Math.random() > 0.08 ? 'verificado' : 'pendiente';
    const documentType = DOCUMENT_TYPES[Math.floor(Math.random() * DOCUMENT_TYPES.length)];
    const documentNumber = this.generateDocumentNumber();

    // Payment info
    const paymentDate = new Date(regDate);
    paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 10));
    const paymentTime = `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
    
    const paymentStatuses = ['activo', 'activo', 'activo', 'pendiente', 'vencido'];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];

    // Renewal dates
    const renewalDate = new Date(paymentDate);
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    // Activity and risk
    const activityLevel = Math.random() > 0.2 ? 'alto' : 'bajo';
    const riskLevel = paymentStatus === 'vencido' ? 'alto' : 'bajo';
    const latePaymentCount = paymentStatus === 'vencido' ? Math.floor(Math.random() * 3) + 1 : 0;

    const member = {
      id: `member-${index}-${country}-${Date.now()}`,
      index: index,
      fullName: name,
      email: email,
      phone: phone,
      country: country,
      city: city,
      role: role,
      status: Math.random() > 0.1 ? 'activo' : 'pendiente',
      
      // Plan and investment
      membershipPlan: planName,
      membershipValue: planValue,
      investmentAmount: planValue,
      
      // Dates
      registrationDate: regDate.toISOString(),
      registrationTime: regTime,
      
      // Onboarding
      onboardingStatus: onboardingStatus,
      documentType: documentType,
      documentNumber: String(documentNumber),
      documentStatus: documentStatus,
      termsAccepted: Math.random() > 0.02,
      
      // Payment
      paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
      paymentDate: paymentDate.toISOString(),
      paymentTime: paymentTime,
      paymentStatus: paymentStatus,
      renewalDate: renewalDate.toISOString(),
      expiryDate: new Date(renewalDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      latePaymentCount: latePaymentCount,
      lastPaymentDate: paymentDate.toISOString(),
      
      // Behavior
      activityLevel: activityLevel,
      riskLevel: riskLevel,
      reinvestmentFlag: Math.random() > 0.6,
      lifecycleState: 'active',
      
      // Network
      uplineId: parentId,
      referredBy: parentId,
      binarySide: side,
      generationDepth: depth,
      
      createdAt: regDate.toISOString(),
    };

    this.members.push(member);
    this.memberMap.set(member.id, member);
    return member;
  }

  buildBinaryNetwork(parentId, targetLeft, targetRight, currentDepth = 1, allMembers = []) {
    let leftCount = 0;
    let rightCount = 0;
    const newMembers = [];

    // Create left branch
    while (leftCount < targetLeft) {
      const index = this.members.length;
      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const subleaderRole = currentDepth <= 2 && Math.random() > 0.8 ? 'lider' : 'inversor';
      
      const member = this.createMember(
        index,
        country,
        subleaderRole,
        parentId,
        'left',
        currentDepth
      );
      newMembers.push(member);
      leftCount++;
    }

    // Create right branch
    while (rightCount < targetRight) {
      const index = this.members.length;
      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const subleaderRole = currentDepth <= 2 && Math.random() > 0.8 ? 'lider' : 'inversor';
      
      const member = this.createMember(
        index,
        country,
        subleaderRole,
        parentId,
        'right',
        currentDepth
      );
      newMembers.push(member);
      rightCount++;
    }

    return newMembers;
  }

  generateFoundationalDataset(totalMembers = 182) {
    console.log(`🔨 Generating ${totalMembers} member dataset...`);

    // Roberto Díaz is the master (created outside)
    const robertoId = 'roberto-diaz-master';

    // Distribution: 70 direct referrals, then 112 deeper members
    const DIRECT_REFERRAL_COUNT = 10;
    const DEEPER_COUNT = totalMembers - DIRECT_REFERRAL_COUNT;

    // First level: direct referrals under Roberto (5 left, 5 right)
    const directReferrals = this.buildBinaryNetwork(
      robertoId,
      Math.floor(DIRECT_REFERRAL_COUNT / 2),
      Math.ceil(DIRECT_REFERRAL_COUNT / 2),
      1
    );

    this.directReferrals = directReferrals;
    console.log(`✅ Created ${directReferrals.length} direct referrals`);

    // Build deeper structure: each direct referral gets sub-members
    const deeperNeeded = DEEPER_COUNT;
    const perDirectReferral = Math.floor(deeperNeeded / directReferrals.length);
    const remainder = deeperNeeded % directReferrals.length;

    directReferrals.forEach((dr, idx) => {
      const allocation = perDirectReferral + (idx < remainder ? 1 : 0);
      const leftAlloc = Math.floor(allocation / 2);
      const rightAlloc = allocation - leftAlloc;

      this.buildBinaryNetwork(dr.id, leftAlloc, rightAlloc, 2);
    });

    console.log(`✅ Total members created: ${this.members.length}`);
    console.log(`✅ Direct referrals: ${directReferrals.length}`);
    console.log(`✅ Left count: ${this.members.filter(m => m.binarySide === 'left').length}`);
    console.log(`✅ Right count: ${this.members.filter(m => m.binarySide === 'right').length}`);

    return {
      members: this.members,
      directReferrals: this.directReferrals,
      memberMap: this.memberMap,
      stats: {
        totalMembers: this.members.length,
        directReferralCount: this.directReferrals.length,
        leftCount: this.members.filter(m => m.binarySide === 'left').length,
        rightCount: this.members.filter(m => m.binarySide === 'right').length,
        totalInvestment: this.members.reduce((sum, m) => sum + m.investmentAmount, 0),
        activeMembers: this.members.filter(m => m.status === 'activo').length,
      },
    };
  }
}

export default FoundationalMemberDataset;