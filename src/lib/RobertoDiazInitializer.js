/**
 * ROBERTO DÍAZ COHERENT INITIALIZATION
 * Creates master leader with valid personal plan and real network
 * All derived values computed from linked structure
 */

import DataIntegrityModel, { VALID_PLANS, DURATION_TYPES } from './DataIntegrityModel';
import NetworkValidator from './NetworkValidator';

export function initializeRobertoDiaz() {
  const model = new DataIntegrityModel();
  const validator = new NetworkValidator(model);

  // ─── CREATE ROBERTO DÍAZ ───
  const roberto = model.createUser({
    id: 'roberto-diaz-master',
    name: 'Roberto Díaz',
    email: 'roberto@vicion.co',
    phone: '+57-300-1234567',
    country: 'CO',
    role: 'leader',
    rank: 'Platino',
    status: 'activo',
  });

  // Roberto's personal membership (Elite plan)
  const robertoMembership = model.createMembership(
    roberto.id,
    'Elite',
    DURATION_TYPES.long
  );

  // Create commission for Roberto's initial membership
  model.createCommissionEvent(
    roberto.id,
    roberto.id,
    VALID_PLANS.Elite,
    'direct_referral_bonus'
  );

  // ─── BUILD NETWORK UNDER ROBERTO ───
  // Target: 245 total descendants (87 left, 158 right)
  const LEFT_TARGET = 87;
  const RIGHT_TARGET = 158;

  const networkMemberIds = [];
  const allMemberships = [];

  // Left side: 87 members
  for (let i = 0; i < LEFT_TARGET; i++) {
    const member = model.createUser({
      name: `Miembro_L${i + 1}`,
      email: `member-l${i + 1}@vicion.co`,
      country: ['CO', 'MX', 'BR', 'AR', 'ES'][Math.floor(Math.random() * 5)],
      role: Math.random() > 0.85 ? 'leader' : 'inversor',
      status: Math.random() > 0.1 ? 'activo' : 'pendiente',
    });

    // Create network node
    const depth = Math.floor(Math.random() * 5) + 1;
    model.createNetworkNode(member.id, roberto.id, 'left', depth);
    networkMemberIds.push(member.id);

    // Assign valid plan
    const planNames = Object.keys(VALID_PLANS);
    const planName = planNames[Math.floor(Math.random() * planNames.length)];
    const membership = model.createMembership(member.id, planName, DURATION_TYPES.medium);
    allMemberships.push(membership);

    // Create commission event for Roberto
    model.createCommissionEvent(
      roberto.id,
      member.id,
      VALID_PLANS[planName],
      'binary_bonus'
    );
  }

  // Right side: 158 members
  for (let i = 0; i < RIGHT_TARGET; i++) {
    const member = model.createUser({
      name: `Miembro_R${i + 1}`,
      email: `member-r${i + 1}@vicion.co`,
      country: ['CO', 'MX', 'BR', 'AR', 'ES'][Math.floor(Math.random() * 5)],
      role: Math.random() > 0.85 ? 'leader' : 'inversor',
      status: Math.random() > 0.1 ? 'activo' : 'pendiente',
    });

    // Create network node
    const depth = Math.floor(Math.random() * 5) + 1;
    model.createNetworkNode(member.id, roberto.id, 'right', depth);
    networkMemberIds.push(member.id);

    // Assign valid plan
    const planNames = Object.keys(VALID_PLANS);
    const planName = planNames[Math.floor(Math.random() * planNames.length)];
    const membership = model.createMembership(member.id, planName, DURATION_TYPES.medium);
    allMemberships.push(membership);

    // Create commission event for Roberto
    model.createCommissionEvent(
      roberto.id,
      member.id,
      VALID_PLANS[planName],
      'binary_bonus'
    );
  }

  // Validate Roberto's data
  const validation = validator.validateNetwork(roberto.id);
  
  console.log(`✅ Roberto Díaz Network Initialized:`);
  console.log(`   Total Members: ${validation.dna.total_network_members}`);
  console.log(`   Left: ${validation.dna.left_count}, Right: ${validation.dna.right_count}`);
  console.log(`   Personal Investment: $${validation.dna.personal_investment}`);
  console.log(`   Network Investment: $${validation.dna.network_investment}`);
  console.log(`   Monthly Income: $${validation.dna.monthly_income}`);
  console.log(`   Valid: ${validation.valid}`);

  return {
    model,
    validator,
    roberto,
    validation,
  };
}

export default initializeRobertoDiaz;